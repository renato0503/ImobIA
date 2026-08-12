# ImobIA — Diário de Bordo Técnico e Roteiro de Entregas

> **Última atualização:** Ago/2026
> **Branch ativa:** `main` (produção)
> **Ambientes:** Produção → https://imobia.web.app

Este documento é o diário de bordo do desenvolvimento do ImobIA, do zero ao Go-Live. Registra o roadmap macro, o histórico de sprints concluídas, a sprint atual e o backlog até a entrega final.

---

## 1. Roadmap Macro

| Fase | Escopo | Período | Critério de saída |
|------|--------|---------|-------------------|
| **Fase 0 — Fundação** | Repositório, stack, config Firebase, CI da base | Concluída | Repo público com MIT; projeto `imobia-65bda` criado |
| **Fase 1 — MVP** | PWA de busca + ingestão por IA + deploy | Concluída | App no ar com filtros granulares e captação via Groq |
| **Fase 2 — Consolidação** | Papéis, segurança, landing page, mapeamento de workflows | **Em andamento** | Base alimentada, presença pública, fluxos documentados e testados |
| **Fase 3 — Go-Live** | Hardening, automação de testes, métricas, CI/CD, docs finais | Futura | Plataforma estável para usuários externos |

---

## 2. Histórico de Sprints (O que já foi feito)

### Sprint 0 — Fundação e Scaffolding
- **Entrega:** commit `37e3322` (Initial commit) + estrutura do monorepo.
- **Decisões de arquitetura:**
  - Monorepo com duas pastas: `frontend/` (PWA) e `backend/` (Python).
  - **Frontend:** Vite 5 + TypeScript puro (sem framework), visando leveza e alinhamento com a stack planejada.
  - **Banco:** Firestore NoSQL como fonte única de verdade.
  - **IA:** Groq (`llama-3.3-70b-versatile`) como provedor de estruturação (substitui Gemini do plano inicial).
- **Configurações:**
  - `firebase.json` — hosting apontando para `frontend/dist` com rewrite SPA.
  - `firestore.rules` — leitura para autenticados, escrita para autenticados (v1).
  - `firestore.indexes.json` — índices compostos para as queries de busca.

### Sprint 1 — MVP Funcional (Frontend + Backend + Deploy)
- **Entrega:** commit `f8f95ab`.
- **Frontend (PWA):**
  - `src/services/imoveis.ts` — camada de busca com `where`/`in`/`array-contains` + filtragem em memória para múltiplas características e valor máximo.
  - `src/ui.ts` — renderização de filtros (finalidade, tipo, bairro, valor, chips de características), cards responsivos, botão "Copiar resumo".
  - `src/firebase.ts` — inicialização do SDK (credenciais embutidas na v1, movidas para `.env` na Sprint 2).
  - `src/main.ts` — fluxo de autenticação Google + controle de tela login/dashboard.
  - PWA via `vite-plugin-pwa` (service worker + manifest + ícones 192/512).
- **Backend (Python 3.12):**
  - `estrutura.py` — prompt de extração para o Groq com `response_format=json_object` + normalizadores de `tipo`, `finalidade`, `valor` e `caracteristicas`.
  - `ingest.py` — CLI para entrada de texto/arquivo/link.
  - `firestore_repo.py` — persistência via `firebase-admin` com `criado_em` em ms.
  - `seed.py` — dados de exemplo (4 imóveis) para testes iniciais.
- **Deploy:** primeiro `firebase deploy` concluído — Hosting + Firestore (rules e índices) no ar.

### Sprint 2 — Segurança e Papéis
- **Entrega:** commit `1a7dce2`.
- **Correção de vazamento:** alerta do GitHub sobre a `apiKey` resolvido movendo todas as credenciais do Firebase para `frontend/.env` (gitignored) com `.env.example` versionado.
- **Regras de segurança (v2):**
  - Coleção `usuarios` criada para gestão de papéis (`admin`, `owner`, `leitor`).
  - Owner raiz (bootstrap): UID `ef6Nu3M7FMRjaSmmTSvGlfOOiQI3`.
  - Escrita em `imoveis` restrita a `ehAdmin()`.
  - Criação de usuário próprio permitida; edição só por admin/owner.
- **Script `add_admin.py`:** promove usuário a admin/owner na coleção `usuarios`.

### Sprint 3 — Landing Page (Presença Pública)
- **Objetivo:** apresentar a plataforma a clientes finais e corretores parceiros de forma honesta, deixando claras as funcionalidades já disponíveis e as que ainda estão em desenvolvimento.
- **Roteamento hash-based (`#/` e `#/app`):**
  - `main.ts` passou a ser o roteador da aplicação: `/` → landing, `/app` → login/dashboard.
  - `onAuthStateChanged` + `hashchange` orquestram a renderização.
- **`landing.ts` (novo módulo):** landing page profissional com:
  - Header sticky com navegação por âncoras e CTA "Acessar plataforma".
  - Hero com proposta de valor focada na busca granular (ex: "casa com energia solar e quintal").
  - Seções "Para quem é", "Como funciona" (3 passos), "Para corretores parceiros" e "Em desenvolvimento".
  - Transparência: seção explícita separando o que já funciona do que está em desenvolvimento (WhatsApp, scraping, fotos, área do corretor).
- **Estilos:** bloco `LANDING PAGE` no `style.css` (grid, cards, hero com gradiente, responsivo).
- **Sem invenção de funcionalidades:** toda a copy reflete o que o produto realmente entrega hoje (filtros combinados, resumo para WhatsApp, login/cadastro por e-mail e senha, PWA).

### Sprint 4 — Mapeamento de Workflows (Diagramas Mermaid)
- **Objetivo:** estudo recorrente do sistema para entender e mapear os fluxos reais antes de qualquer teste. Todo fluxo de código vira um diagrama Mermaid fiável (nomes reais de funções, arquivos e campos).
- **Artefatos criados em `docs/diagrams/`:**
  - `README.md` — índice e regras de uso (estudo recorrente).
  - `00-arquitetura.md` — C4Context + limites de confiança (frontend/backend/Firebase).
  - `01-auth-workflow.md` — sequência landing → login/cadastro → dashboard; state + flowchart; cenários A1–A6.
  - `02-busca-workflow.md` — construção dinâmica da query (`where`/`in`/`array-contains`/`orderBy`/`limit`), filtro em memória, copiar resumo; cenários B1–B10.
  - `03-ingestao-workflow.md` — CLI → Groq (`json_object`) → `_normalizar` → `firebase-admin` → Firestore; cenários C1–C8.
  - `04-dados-er.md` — `erDiagram` de `imoveis`/`usuarios` + regras de segurança; cenários D1–D8.
  - `05-matriz-testes.md` — matriz viva por workflow, com status de automação.
- **Fidelidade ao código:** `main.ts`, `ui.ts`, `landing.ts`, `services/imoveis.ts`, `estrutura.py`, `firestore_repo.py`, `ingest.py`, `firestore.rules`.
- **Regra de recorrência:** a cada nova feature, um novo diagrama é adicionado antes de qualquer teste; ao final de cada sprint, os diagramas são revisados.

### Sprint 5 — Testes por Workflow (Recorrente)
- **Objetivo:** converter os workflows mapeados em cenários de teste executáveis, começando pelos de maior risco.
- **Frontend (unidade/estado):**
  - Testar a construção da query em `services/imoveis.ts` (combinações de filtros).
  - Testar o filtro em memória (múltiplas características + `valorMaximo`).
- **Backend (unitários, pytest):**
  - `test_estrutura.py` — normalizadores (`_normalizar_valor`, `_normalizar_finalidade`, `_normalizar_tipo`, `_normalizar_caracteristicas`, bairro default, campos ausentes).
  - `test_firestore_repo.py` — (mock) `salvar_imovel` grava `criado_em`; erro sem `serviceAccount.json`.
- **Regras (emulador Firestore):**
  - Negativas de escrita por `leitor`; criação de `usuarios/{seuUID}` permitida; acesso owner raiz.
- **E2E (Playwright):** landing → criar conta → login → buscar → copiar resumo → logout.
- **Manuais:** validação em https://imobia.web.app (login/cadastro), PWA offline, ingestão CLI real.

### Sprint 6 — Implantação do Backlog (Backend)
- **Testes unitários (pytest):** `tests/test_estrutura.py` (normalizadores, R$, acentos, bairro default, campos ausentes), `tests/test_firestore_repo.py` (mock de `salvar_imovel`, `criado_em`, erro sem serviceAccount) e `tests/test_captura.py` (extração com requests/BS4 mockados). **41 testes passando.**
- **Ingestão por link real:** novo `backend/captura.py` — baixa a URL com `requests` + `BeautifulSoup`, extrai título/OG/descrição/parágrafos. `ingest.py --link` agora usa esse conteúdo em vez de só mandar a URL crua.
- **Transcrição de áudio:** `estrutura.transcrever_audio()` via API Groq (`whisper-large-v3`), com `--audio` no CLI.
- **Endpoint HTTP (Flask):** `backend/server.py` com `GET /health` e `POST /ingestir` (aceita `texto`/`url`/`audio`), token opcional via `API_TOKENS` (modo dev default).
- **Scraper extensível:** `backend/scraper.py` com registry de adapters por site, detecção de duplicados (bairro+tipo+valores) e `--dry-run`. Adapter de exemplo presente; adapters reais ficam para a definição de sites-alvo.
- **Logs estruturados:** `logging` configurado em `ingest.py`, `server.py`, `scraper.py`, `captura.py` e `estrutura.py`.
- **Correção:** `_normalizar_tipo` agora prioriza tipos multi-palavra e ignora acentos (`unicodedata`) — "casa em condomínio" casa corretamente.

### Sprint 7 — Implantação do Backlog (Frontend de Busca)
- **Faixa de valor:** filtros `Valor mínimo` e `Valor máximo` (antes só máximo).
- **Ordenação:** `Mais recentes`, `Menor valor`, `Maior valor` (em memória, com `valor_efetivo` no tipo).
- **Paginação:** botão "Carregar mais" incrementa o `limit` (`PAGINA_PADRAO = 50`) com `insertAdjacentHTML`.
- **Autocomplete de bairros:** `listarBairros()` consulta o acervo e popula o `<datalist>` do campo bairro.
- **Refatoração de `services/imoveis.ts`:** tipos de filtro estendidos, `QueryConstraint` tipado, função `ordenar()`.
- **TypeScript estrito** validado via `tsc` no build.

### Sprint 8 — Landing (SEO, Leads e Analytics)
- **SEO:** Open Graph + Twitter Card + `canonical` + `theme-color` no `index.html`; `sitemap.xml` em `public/`.
- **Captura de leads:** seção "Quer ser um corretor parceiro?" com formulário (nome, e-mail, WhatsApp) gravando na coleção `leads` via `services/leads.ts`.
- **Regras de `leads`:** novo `match /leads/{leadId}` — `create` público com validação de campos (nome>0, email com `@`, chaves restritas); leitura/escrita de edição apenas `ehAdmin()`. Validado no emulador.
- **Firebase Analytics:** inicialização condicional (`isSupported()`), eventos `busca` e `copiar_resumo` no app e `lead_enviado` na landing.
- **Code-splitting:** chunk manual do Firebase (`manualChunks`) reduzindo o bundle principal para ~57 kB.

### Sprint 9 — CI/CD (GitHub Actions)
- **`.github/workflows/ci.yml`:**
  - Job `backend-test`: instala `requirements.txt` e roda `pytest tests/`.
  - Job `frontend-build`: `npm ci` + build com secrets do Firebase → artefato `frontend-dist`.
  - Job `deploy` (push em `main`): usa `FirebaseExtended/action-hosting-deploy` para deploy em `live`.
  - Deploy requer secrets: `FIREBASE_SERVICE_ACCOUNT` + variáveis `VITE_FIREBASE_*`.

### Sprint 10 — Validação das Regras no Emulador
- **`tests/rules/`** (Node + `@firebase/rules-unit-testing`):
  - Subprojeto próprio com `package.json` (script `npm test`).
  - `test-rules.mjs` cobre D1–D7 (leitura/escrita de `imoveis` e `usuarios`, owner raiz) e L1–L4 (`leads`).
  - Execução: `firebase emulators:exec --only firestore "npm test"` — **11/11 testes passando**.
- **Requisito local:** JDK 21+ (firebase-tools 15) — instalado via winget (`Temurin 21`).

### Sprint 11 — Operacionalização e E2E
- **Service account:** chave criada via `gcloud iam service-accounts keys create` para
  `firebase-adminsdk-fbsvc@imobia-65bda.iam.gserviceaccount.com` → `backend/serviceAccount.json` (gitignored).
- **Base populada:** `python seed.py` gravou 4 imóveis de exemplo na coleção `imoveis`.
- **Admin criado:** `python add_admin.py --uid ef6Nu3M7FMRjaSmmTSvGlfOOiQI3 --email gestor.renatorosa@gmail.com --role owner`.
- **Secrets do GitHub Actions:** `FIREBASE_SERVICE_ACCOUNT`, `VITE_FIREBASE_*`, `E2E_EMAIL` e `E2E_SENHA` configurados via `gh secret set`.
- **Playwright E2E (`frontend/tests/e2e/`):**
  - `criar-usuario-teste.mjs` — cria conta via REST API do Firebase Auth (usado para o usuário `e2e.teste@imobia.app`).
  - `fluxo-completo.spec.ts` — 7 cenários (A1–A6, B2, B2b, B7) contra produção.
  - `playwright.config.ts` com permissão de clipboard; **7/7 passando**.
- **CI:** novo job `e2e` no `.github/workflows/ci.yml` (Playwright contra produção antes do deploy);
  deploy agora depende de pytest + build + e2e.

### Sprint 12 — Rate Limiting, Payload, Fotos e WhatsApp
- **Rate limiting (`server.py`):** `flask-limiter` com limites configuráveis por env
  (`INGESTIR_LIMITE="30 per minute"`, `WHATSAPP_LIMITE="60 per minute"`); storage em memória por padrão
  (Redis configurável via `RATE_LIMIT_STORAGE`).
- **Validação de payload (`validacao.py`):**
  - `validar_texto` — obrigatório, não vazio, máx 6000 caracteres.
  - `validar_url` — apenas http/https com domínio.
  - `validar_audio` — extensões suportadas (mp3/m4a/wav/ogg/opus).
  - `validar_payload` — aceita apenas um de `texto`/`url`/`audio`.
  - Aplicada em `POST /ingestir`.
- **Correção:** bug no parse de `API_TOKENS` (iterava a string caractere a caractere; adicionado `.split(",")`).
- **Endpoint `/whatsapp` (webhook estilo Twilio):** aceita `form-urlencoded` ou JSON com
  `From/Body/NumMedia/MediaUrl0/MediaContentType0`; texto → ingestão direta; áudio → baixa `MediaUrl`,
  transcreve via Groq e ingere; imagem → resposta orientando a enviar texto/áudio. Respostas em TwiML.
- **Cloud Storage:**
  - `storage.rules` — leitura autenticada; escrita admin/owner (mesma lógica de papéis), tamanho máx 5 MB,
    contentType `image/*`. Deployado.
  - `firebase.json` inclui `storage.rules`.
- **Upload de fotos (frontend):**
  - `services/fotos.ts` — `enviarFoto` (valida tipo/tamanho, faz upload e retorna URL) e `removerFoto`.
  - `services/usuarios.ts` — `ehAdmin()` (owner raiz + doc `usuarios/{uid}.role`).
  - Cards mostram contagem de fotos e, para admins, botão "Adicionar foto" (upload → atualiza array `fotos`).
  - Badge "Admin" no topbar quando aplicável.
- **Testes:** +30 cenários (`test_validacao.py` e `test_server.py` com Flask test client + mocks) → **71 passando**.

### Sprint 13 — Busca Nativa, Galeria, Backup e Operação
- **Múltiplas características na query nativa:**
  - `estrutura.py` agora deriva campos booleanos `tem_<slug>` por característica
    (`_adicionar_booleanos_caracteristicas` + `slug_de_caracteristica`).
  - `imoveis.ts` (frontend) monta query com múltiplos `where('tem_<slug>', '==', true)`;
    fallback automático em memória caso a query nativa falhe (imóveis antigos/índice ausente).
- **Galeria de fotos:** clicar na foto do card abre um modal com navegação
  (setas + teclado ←/→, Esc fecha), contador `n / total`. Evento `galeria_aberta` no Analytics.
- **Dados de exemplo enriquecidos:** `seed.py` agora passa por `_normalizar` (gera `tem_*`)
  e grava **8 imóveis** com fotos Unsplash, contatos e descrições. Suporte a `--limpar`.
- **Backup:** `backup.py` exporta `imoveis`, `leads`, `usuarios` para JSON local
  (carimbo de data/hora); `backups/` ignorado pelo git.
- **Landing:** seção "Já disponível" atualizada (fotos/galeria, captação por texto/link/áudio);
  "Em desenvolvimento" enxugada (WhatsApp automático, scraping, painel do corretor).
- **Documentação de operação:** `docs/operacao.md` — rotinas, deploy, testes, monitoramento,
  escalabilidade e troubleshooting.

---

## 3. Sprint Atual (Consolidação — etapa final)

> **Caráter recorrente:** o estudo de workflows (Sprint 4) e a execução de testes por workflow (Sprint 5)
> se repetem a cada sprint, mantendo `docs/diagrams/` sempre alinhado ao código.

### Já concluído nesta fase

- ✅ Testes unitários do backend (pytest) — **71 passando**.
- ✅ Regras do Firestore validadas no emulador (rules-unit-testing) — **11 passando**.
- ✅ Ingestão por link, áudio e endpoint HTTP; scraper com detecção de duplicados.
- ✅ Busca com faixa de valor, ordenação, paginação e autocomplete de bairros.
- ✅ Landing com SEO, leads e Analytics; CI/CD no GitHub Actions.
- ✅ Base populada (seed com 4 imóveis), admin criado como `owner`.
- ✅ **Playwright E2E — 7 cenários passando contra produção** (landing, login, senha errada, busca com filtro, copiar resumo, sair).
- ✅ Secrets do GitHub Actions configurados (service account + VITE_FIREBASE_* + credenciais E2E).
- ✅ **Índices compostos ativados no console** — os 6 índices de `firestore.indexes.json` estão `Ativado`; busca com filtro validada no E2E (B2b).
- ✅ **Rate limiting e validação de payload** em `POST /ingestir` (`validacao.py` + `flask-limiter`).
- ✅ **Upload de fotos** — Storage habilitado + `storage.rules` + botão admin nos cards.
- ✅ **Webhook WhatsApp** (`POST /whatsapp`) — texto/áudio → ingestão, resposta TwiML.

### Em andamento / faltando

1. **Configuração real do WhatsApp** (Twilio/Meta) apontando para o webhook — **o backend roda localmente
   (custo zero)**, então o webhook só funciona enquanto o `server.py` estiver em execução.
2. **Galeria de fotos** (navegação entre fotos no card).

> **Decisão de produto (ADR):** o backend NÃO será publicado em Cloud Run/Functions. Tudo permanece
> no free tier (ver `context.md` §6). O webhook WhatsApp pode ser usado via túnel local ou agendador
> em máquina própria, sem infra paga.

### Desafios técnicos em aberto

| Desafio | Impacto | Status |
|---------|---------|--------|
| Queries com múltiplos `array-contains` | Exigem índice composto + filtro em memória | Contornado (usa 1 característica na query) |
| Webhook WhatsApp depende do `server.py` local | Só responde enquanto o backend está de pé | Decisão: manter local (custo zero) |
| Galeria de fotos (navegação) | Só exibe a primeira foto + contagem | Backlog |

---

## 4. Backlog e Próximos Passos (até o Go-Live)

### 4.1 Bloqueios críticos (desbloquear primeiro)
- [x] Gerar chave privada no Firebase Console e salvar em `backend/serviceAccount.json`. *(feito via `gcloud iam service-accounts keys create`)*
- [x] Executar `python seed.py` para popular a coleção `imoveis`. *(4 imóveis de exemplo gravados)*
- [x] Criar documento do admin na coleção `usuarios` (`python add_admin.py --uid ef6Nu3M7FMRjaSmmTSvGlfOOiQI3 --email gestor.renatorosa@gmail.com`). *(criado como `owner`)*
- [x] Validar busca real no console e criar índices compostos pendentes. *(6 índices ativados; busca com filtro validada no E2E)*

### 4.2 Ingestão por IA (Fase 2)
- [x] **Webhook WhatsApp** (`POST /whatsapp` estilo Twilio) — texto/áudio → ingestão + resposta TwiML. *(roda local, custo zero — publicar em nuvem foi descartado por decisão de produto)*
- [x] **Transcrição de áudio:** `estrutura.transcrever_audio()` via Groq (`whisper-large-v3`) + `ingest.py --audio`.
- [x] **Ingestão por link real:** `captura.py` baixa a URL e extrai título/OG/descrição/parágrafos.
- [x] Endpoint HTTP (`server.py` — Flask) com `GET /health` e `POST /ingestir` (texto/url/audio).

### 4.3 Busca e Frontend
- [x] Autocomplete de bairros a partir dos dados reais do banco (popula `<datalist>`).
- [x] Suporte a múltiplas características na query nativa (campos booleanos `tem_*` + fallback em memória).
- [x] Filtrar por faixa de valor (mín/máx) e ordenação.
- [x] Upload de fotos via Firebase Storage + renderização nos cards (contagem + botão admin).
- [x] Paginação/`load more` para acervos grandes.

### 4.3.1 Landing Page (Marketing)
- [ ] Adicionar seção de depoimentos/parceiros quando houver usuários reais.
- [ ] Preencher a seção "Já disponível" conforme novas features saírem (ex: fotos, WhatsApp).
- [x] SEO: Open Graph tags + `sitemap.xml` para indexação do Google.
- [x] Captura de leads (formulário de contato para corretores interessados) — coleção `leads`.
- [ ] Ajustar copy da landing quando a integração WhatsApp estiver pronta.

### 4.4 Scraping (Fase 3)
- [ ] Estudo de sites-alvo e políticas de uso.
- [x] `scraper.py` com BeautifulSoup + registry de adapters + `--dry-run` (adapters reais pendentes).
- [x] Pipeline com detecção de duplicados (bairro+tipo+valores) — agendamento noturno pendente.

### 4.5 Segurança e Qualidade
- [x] Auditoria das regras do Firestore (testes no emulador: `tests/rules/`) — 11/11 passando.
- [x] Rate limiting (`flask-limiter`) e validação de payload (`validacao.py`) na ingestão.
- [x] Testes unitários do `estrutura.py` (casos de R$, acentos, variações de texto) — 71 testes no total.
- [x] Testes E2E do fluxo de busca (Playwright) — 7 cenários contra produção.

### 4.5.1 Automação de testes (decorrente da Sprint 5)
- [x] Setup de `pytest` no backend (`backend/tests/` + `pytest.ini`).
- [x] `test_estrutura.py` — normalizadores + bairro default + campos ausentes.
- [x] `test_firestore_repo.py` — mock de `salvar_imovel` (`criado_em`) e erro sem serviceAccount.
- [x] Setup do emulador Firestore (Firebase CLI) para testar `firestore.rules` (`tests/rules/`).
- [x] Playwright: fluxo landing → cadastro → login → busca → copiar resumo → logout.
- [x] CI/CD: rodar pytest + build + Playwright no GitHub Actions.
- [ ] Manter `docs/diagrams/05-matriz-testes.md` atualizado a cada sprint.

### 4.6 Operações e Observabilidade
- [x] Analytics no frontend (eventos `busca`, `copiar_resumo`, `lead_enviado`, `foto_upload`, `galeria_aberta`).
- [x] Logs estruturados no backend (`logging` em ingest/server/scraper/captura/estrutura).
- [x] CI/CD: build do frontend + `firebase deploy` via GitHub Actions.
- [x] Backup periódico do Firestore (`backup.py` — JSON local, sem custo).

### 4.7 Go-Live
- [ ] Validação com usuários reais (corretores) em ambiente controlado.
- [x] Plano de dados de exemplo (8 imóveis com fotos Unsplash, contatos e descrições).
- [x] Documentação de operação (`docs/operacao.md`).
- [ ] Release notes e comunicação da Fase 3.

---

## 5. Decisões Técnicas Registradas (ADR leve)

| # | Decisão | Motivo |
|---|---------|--------|
| 1 | TypeScript puro + Vite (sem React) | Leveza, simplicidade, alinhamento ao escopo |
| 2 | Groq como provedor de IA | Custo-benefício e velocidade para extração estruturada |
| 3 | Firestore com `array-contains` + filtro em memória | Evitar explosão de índices compostos no MVP |
| 4 | Credenciais via `.env` (gitignored) | Evitar alertas de segredo; API key é pública por design |
| 5 | Papéis via coleção `usuarios` + owner raiz hardcoded | Bootstrap seguro de administração |
| 6 | Landing page integrada ao SPA com roteamento hash | Uma única build/deploy; sem custo extra de rota no hosting |
| 7 | Workflows documentados em Mermaid (`docs/diagrams/`) | Diagramas versionáveis e renderizados nativamente no GitHub/VS Code |
| 8 | Estudo de workflows recorrente e anterior aos testes | Garante fidelidade entre código, documentação e cenários de teste |
| 9 | Filtro em memória para múltiplas características e faixa de valor | Evita explosão de índices compostos no MVP |
| 10 | Ingestão por link/áudio reutilizando `requests`+`BeautifulSoup` e Groq | Uma única stack de captura → mesma normalização JSON |
| 11 | `leads` com `create` público validado por campos | Captação na landing sem login, sem expor dados |
| 12 | Testes de regras via emulador (`tests/rules/`) | Valida `firestore.rules` sem tocar produção |
| 13 | Webhook WhatsApp estilo Twilio (`POST /whatsapp`) | Compatível com provedores (Twilio/Meta) sem acoplar SDK |
| 14 | Storage com regras espelhando papéis do Firestore | Consistência de autorização entre banco e arquivos |
| 15 | **Backend 100% local (sem Cloud Run/Functions)** | Custo zero; ingestão/scraping sob demanda |

---

## 6. Comandos úteis

```bash
# Frontend
cd frontend
npm install
cp .env.example .env   # preencher credenciais
npm run dev            # dev server
npm run build          # produção (gera dist/)

# Deploy
firebase login
firebase deploy        # hosting + firestore (rules e índices)

# Testes
cd backend && python -m pytest tests/ -v            # unitários (34)
cd tests/rules && npm install                        # uma vez
# (com JAVA_HOME apontando para JDK 21)
firebase emulators:exec --only firestore "node tests/rules/test-rules.mjs"

# Backend
cd backend
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # preencher GROQ_API_KEY
python seed.py         # popular base
python ingest.py --entrada "Casa com energia solar no centro, aluguel 2500"
python ingest.py --link "https://exemplo.com/imovel/123"
python ingest.py --audio caminho/audio.mp3
python server.py       # endpoints: GET /health, POST /ingestir, POST /whatsapp
python scraper.py --site exemplo --dry-run
python add_admin.py --uid <UID> --email <email> [--role admin|owner|leitor]

# Variáveis úteis do server (env):
#   API_TOKENS="token1,token2"       # tokens Bearer (default: dev-token)
#   INGESTIR_LIMITE="30 per minute"  # rate limit do /ingestir
#   WHATSAPP_LIMITE="60 per minute"  # rate limit do /whatsapp
#   RATE_LIMIT_STORAGE="memory://"   # ou "redis://localhost:6379"
```

## 7. Estudo de workflows (recorrente)

Quando uma feature nova for desenvolvida ou um bug for investigado:

1. **Mapear:** criar/atualizar o diagrama em `docs/diagrams/NN-*.md` com Mermaid (fiel ao código real).
2. **Testar:** adicionar os cenários à `docs/diagrams/05-matriz-testes.md`.
3. **Executar:** rodar unitários (pytest), regras (emulador) e E2E (Playwright).
4. **Revisar:** conferir nomes reais de funções/endpoints; marcar fluxos futuros com `🚧`.

