# ImobIA — Documentação de Operação

> **Guia prático de como rodar, monitorar e operar a plataforma (custo zero).**

---

## 1. Arquitetura de execução

| Componente | Onde roda | Quando |
|------------|-----------|--------|
| Frontend (PWA) | Firebase Hosting (sempre no ar) | 24/7, gratuito |
| Banco (Firestore) | Firebase (nuvem) | 24/7, free tier |
| Auth + Storage + Analytics | Firebase (nuvem) | 24/7, free tier |
| Backend Python | **Sua máquina (local)** | Sob demanda |

> O backend **nunca** roda em servidor pago. Tudo o que envolve IA (Groq), scraping
> e webhooks é executado localmente quando você precisar.

---

## 2. Rotinas diárias / frequentes

### 2.1 Popular ou atualizar a base

```bash
cd backend
python seed.py              # grava 8 imóveis de exemplo
python seed.py --limpar     # apaga os atuais e regrava
```

### 2.2 Ingestão de um imóvel (CLI)

```bash
# Texto livre
python ingest.py --entrada "Casa com energia solar no centro, aluguel 2500"

# Link de anúncio
python ingest.py --link "https://exemplo.com/imovel/123"

# Áudio transcrito
python ingest.py --audio caminho/audio.mp3
```

> Requer `GROQ_API_KEY` em `backend/.env`.

### 2.3 Servidor HTTP / webhook (quando precisar)

```bash
python server.py
# GET  /health        → verifica se está no ar
# POST /ingestir      → { "texto" | "url" | "audio" }
# POST /whatsapp      → webhook estilo Twilio
```

Variáveis úteis:

| Env | Default | Descrição |
|-----|---------|-----------|
| `API_TOKENS` | `dev-token` | Tokens Bearer separados por vírgula |
| `INGESTIR_LIMITE` | `30 per minute` | Rate limit do `/ingestir` |
| `WHATSAPP_LIMITE` | `60 per minute` | Rate limit do `/whatsapp` |
| `RATE_LIMIT_STORAGE` | `memory://` | Redis em multi-instância |

### 2.4 Backup dos dados

```bash
cd backend
python backup.py                        # imoveis + leads + usuarios → backups/
python backup.py --colecoes imoveis     # só uma coleção
python backup.py --pasta D:\meus-backups
```

Recomendação: rodar **1x por semana** e manter os últimos 4 arquivos.

---

## 3. Deploy

```bash
# Frontend + regras (Firestore e Storage)
firebase login
firebase deploy

# Ou via CI (GitHub Actions) — automático no push para main
```

Para deploys parciais:
```bash
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only storage
```

---

## 4. Testes

```bash
# Backend (pytest)
cd backend && python -m pytest tests/ -v

# Regras do Firestore (emulador — requer JDK 21)
# Windows: ajustar JAVA_HOME para o JDK 21
cd tests/rules && npm install
firebase emulators:exec --only firestore "node tests/rules/test-rules.mjs"

# E2E (Playwright) — contra produção
cd frontend
$env:E2E_BASE_URL="https://imobia.web.app"
npx playwright test
```

---

## 5. Monitoramento (custo zero)

| O que | Onde | Como |
|-------|------|------|
| Uso do Firestore (reads/writes/storage) | Console Firebase → Firestore → Uso | Verificar limites free tier |
| Uso do Storage | Console Firebase → Storage → Uso | Verificar limite 5 GiB |
| Erros de autenticação | Console Firebase → Authentication → Uso | Picos de login |
| Custo financeiro | Cloud Console → Billing → Budgets | Orçamento US$ 1/mês com alertas 50/90/100% |
| Erros no frontend | Console Firebase → Analytics | Eventos e erros |
| Logs do backend | Terminal (local) | `logging` estruturado |

---

## 6. Escalabilidade (sem sair do free tier)

A plataforma foi desenhada para escalar dentro dos limites gratuitos:

1. **Firestore**: até 1 GiB, 50k reads/dia, 20k writes/dia. Para acervos maiores,
   a paginação (`Carregar mais`) já evita leituras excessivas.
2. **Storage**: até 5 GiB de fotos. Comprimir/redimensionar imagens antes do upload.
3. **Analytics**: eventos agregados por tipo (`busca`, `copiar_resumo`, `lead_enviado`,
   `foto_upload`, `galeria_aberta`).

Quando crescer além do free tier (não agora), as opções são: Cloud Functions (ingestão
serverless) ou subir o `server.py` em Cloud Run — mas isso só após o Go-Live validado.

---

## 7. Troubleshooting

| Sintoma | Provável causa | Solução |
|---------|----------------|---------|
| Busca retorna erro de índice | Índice composto não criado | Aceitar sugestão no console ou `firebase deploy` |
| `GROQ_API_KEY` ausente | `.env` não configurado | `cp .env.example .env` e preencher |
| `serviceAccount.json` ausente | Chave de serviço não baixada | `gcloud iam service-accounts keys create ...` |
| Upload de foto falha | Não é admin ou arquivo > 5 MB | Verificar papel e tamanho |
| Webhook WhatsApp não responde | `server.py` não está rodando | Iniciar `python server.py` (ou túnel local) |
| Emulador não sobe | Java < 21 | Instalar JDK 21 (Temurin) |
