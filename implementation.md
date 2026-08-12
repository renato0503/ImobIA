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

---

## 3. Sprint Atual (Mapeamento de Workflows + Testes)

> **Caráter recorrente:** o estudo de workflows (Sprint 4) e a execução de testes por workflow (Sprint 5)
> se repetem a cada sprint, mantendo `docs/diagrams/` sempre alinhado ao código.

### O que está sendo construído

1. **Documentação viva de workflows (`docs/diagrams/`):**
   - Arquitetura (C4), autenticação, busca, ingestão e modelo de dados já mapeados em Mermaid.
   - Matriz de testes por workflow (`05-matriz-testes.md`) como checklist recorrente.

2. **Execução de testes (Fase 2):**
   - Unitários do backend (`estrutura.py`/`firestore_repo.py`) — iniciar com pytest.
   - E2E do fluxo de busca e autenticação (Playwright).
   - Regras do Firestore validadas no emulador.

3. **Operacionalização do backend de ingestão:**
   - O módulo de normalização (`estrutura.py`) está validado localmente (tipos, finalidade, valores R$, características em minúsculo).
   - A escrita no Firestore depende da **chave de serviço** (`backend/serviceAccount.json`), ainda não configurada no ambiente.

4. **Gestão de papéis e base inicial:**
   - Regras de papel deployadas; falta criar o documento do admin na coleção `usuarios` (via `add_admin.py` ou manual no console) e popular a base com o `seed.py`.

### Desafios técnicos em aberto

| Desafio | Impacto | Status |
|---------|---------|--------|
| `serviceAccount.json` não disponível | Backend não grava no Firestore | Bloqueia seed/ingest e testes de integração |
| Coleção `imoveis` vazia | Frontend não exibe resultados | Bloqueia validação ponta a ponta |
| Índices adicionais exigidos pelo Firestore | Buscas combinadas podem falhar no console | Verificar ao rodar a 1ª busca |
| Queries com múltiplos `array-contains` | Exigem índice composto + filtro em memória | Contornado (usa 1 característica na query) |
| Automação de testes (pytest/Playwright) não iniciada | Falta base para regressão contínua | Em planejamento (Sprint 5) |

---

## 4. Backlog e Próximos Passos (até o Go-Live)

### 4.1 Bloqueios críticos (desbloquear primeiro)
- [ ] Gerar chave privada no Firebase Console e salvar em `backend/serviceAccount.json`.
- [ ] Executar `python seed.py` para popular a coleção `imoveis`.
- [ ] Criar documento do admin na coleção `usuarios` (`python add_admin.py --uid ef6Nu3M7FMRjaSmmTSvGlfOOiQI3 --email gestor.renatorosa@gmail.com`).
- [ ] Validar busca real no console e criar índices compostos pendentes.

### 4.2 Ingestão por IA (Fase 2)
- [ ] **Integração WhatsApp (Twilio/Cloud Functions):** receber mensagem de áudio/texto e disparar a ingestão.
- [ ] **Transcrição de áudio:** integrar Whisper (ou API da Groq) antes da estruturação.
- [ ] **Ingestão por link real:** baixar conteúdo da URL (ex: `requests` + parser) antes de mandar ao Groq.
- [ ] Endpoint HTTP (ex: Cloud Run/Cloud Functions) para o `ingest.py`, evitando execução só via CLI.

### 4.3 Busca e Frontend
- [ ] Autocomplete de bairros a partir dos dados reais do banco (popula `<datalist>`).
- [ ] Suporte a múltiplas características na query nativa (revisar índices).
- [ ] Filtrar por faixa de valor (mín/máx) e ordenação.
- [ ] Upload de fotos via Firebase Storage + renderização nos cards.
- [ ] Paginação/`load more` para acervos grandes.

### 4.3.1 Landing Page (Marketing)
- [ ] Adicionar seção de depoimentos/parceiros quando houver usuários reais.
- [ ] Preencher a seção "Já disponível" conforme novas features saírem (ex: fotos, WhatsApp).
- [ ] SEO: Open Graph tags + `sitemap.xml` para indexação do Google.
- [ ] Captura de leads (formulário de contato para corretores interessados).
- [ ] Ajustar copy da landing quando a integração WhatsApp estiver pronta.

### 4.4 Scraping (Fase 3)
- [ ] Estudo de sites-alvo e políticas de uso.
- [ ] `scraper.py` com BeautifulSoup/Selenium + limpeza com pandas.
- [ ] Pipeline agendado (madrugada) com detecção de duplicados.

### 4.5 Segurança e Qualidade
- [ ] Auditoria final das regras do Firestore (testar tentativas de escrita por `leitor`).
- [ ] Rate limiting e validação de payload na ingestão.
- [ ] Testes unitários do `estrutura.py` (casos de R$, acentos, variações de texto).
- [ ] Testes E2E do fluxo de busca (Playwright).

### 4.5.1 Automação de testes (decorrente da Sprint 5)
- [ ] Setup de `pytest` no backend (`backend/tests/`).
- [ ] `test_estrutura.py` — normalizadores + bairro default + campos ausentes.
- [ ] `test_firestore_repo.py` — mock de `salvar_imovel` (`criado_em`) e erro sem serviceAccount.
- [ ] Setup do emulador Firestore (Firebase CLI) para testar `firestore.rules`.
- [ ] Playwright: fluxo landing → cadastro → login → busca → copiar resumo → logout.
- [ ] CI/CD: rodar pytest + build + Playwright no GitHub Actions.
- [ ] Manter `docs/diagrams/05-matriz-testes.md` atualizado a cada sprint.

### 4.6 Operações e Observabilidade
- [ ] Analytics no frontend (page views, buscas realizadas).
- [ ] Logs estruturados no backend (ingestão: sucesso/falha por fonte).
- [ ] CI/CD: build do frontend + `firebase deploy` via GitHub Actions.
- [ ] Backup periódico do Firestore (exportação programada).

### 4.7 Go-Live
- [ ] Validação com usuários reais (corretores) em ambiente controlado.
- [ ] Plano de dados de exemplo (fotos reais, contatos, descrições).
- [ ] Documentação de operação (como rodar, monitorar, escalar).
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

# Backend
cd backend
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # preencher GROQ_API_KEY
python seed.py         # popular base
python ingest.py --entrada "Casa com energia solar no centro, aluguel 2500"
python add_admin.py --uid <UID> --email <email> [--role admin|owner|leitor]
```

## 7. Estudo de workflows (recorrente)

Quando uma feature nova for desenvolvida ou um bug for investigado:

1. **Mapear:** criar/atualizar o diagrama em `docs/diagrams/NN-*.md` com Mermaid (fiel ao código real).
2. **Testar:** adicionar os cenários à `docs/diagrams/05-matriz-testes.md`.
3. **Executar:** rodar unitários (pytest), regras (emulador) e E2E (Playwright).
4. **Revisar:** conferir nomes reais de funções/endpoints; marcar fluxos futuros com `🚧`.

