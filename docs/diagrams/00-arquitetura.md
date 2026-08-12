# Diagrama 0 — Arquitetura Macro (C4 Context)

> Fonte: `firebase.json`, `frontend/src/firebase.ts`, `backend/config.py`, `backend/firestore_repo.py`

```mermaid
C4Context
  title ImobIA — Visão de Contexto (v0.1 / MVP)
  Person(corretor, "Corretor / Imobiliária", "Cadastra imóveis, atende pedidos dos clientes, envia resumos no WhatsApp")
  Person(cliente, "Cliente final", "Busca imóveis com filtros específicos")

  System(imobia, "ImobIA (PWA)", "Frontend Vite+TS servido por Firebase Hosting. Landing page pública + app com login e busca granular.")

  System_Ext(groq, "Groq API", "llama-3.3-70b-versatile — estrutura texto/áudio solto em JSON (ingestão via backend)")
  System_Ext(firebase, "Firebase", "Firestore (dados), Authentication (e-mail/senha), Hosting (estático + SSL)")
  System_Ext(whatsapp, "WhatsApp", "🚧 Envio manual de resumos (copy). Bot de ingestão é futuro")

  Rel(cliente, imobia, "Navega na landing e usa a busca", "HTTPS")
  Rel(corretor, imobia, "Busca imóveis e copia resumo", "HTTPS")

  Rel(imobia, firebase, "Auth + Firestore (SDK web)", "HTTPS")
  Rel(imobia, whatsapp, "Copiar resumo → WhatsApp", "clipboard")

  %% Backend (execução local/CLI por enquanto)
  System_Ext(python, "Backend Python 3.12", "ingest.py / seed.py / add_admin.py via firebase-admin")
  Rel(corretor, python, "🚧 Roda ingestão por CLI", "CLI")
  Rel(python, groq, "Estruturação via Groq", "HTTP/JSON")
  Rel(python, firebase, "Escrita programática (firebase-admin)", "HTTPS")

  UpdateRelStyle(corretor, imobia, $offsetY="-20")
  UpdateRelStyle(cliente, imobia, $offsetY="-40")
```

## Limites de confiança

```mermaid
C4Boundary
  title Limites de confiança do ImobIA
  Boundary(frontend, "FRONTEND — público", "Firebase Hosting, PWA, SPA com roteamento hash (#/ e #/app)") {
    System(landing, "landing.ts", "Página pública de marketing (sem auth)")
    System(app, "ui.ts + main.ts", "Login/cadastro (e-mail/senha) e dashboard de busca")
  }

  Boundary(backend, "BACKEND — privado (CLI local)", "Python 3.12, firebase-admin") {
    System(ingest, "ingest.py", "Recebe --entrada / --arquivo / --link")
    System(estrutura, "estrutura.py", "Prompt Groq + normalização JSON")
    System(repo, "firestore_repo.py", "salvar_imovel / listar_imoveis")
  }

  Boundary(firebase, "FIREBASE — nuvem", "Regras + índices em firestore.rules / firestore.indexes.json") {
    System(fstore, "Firestore", "coleção imoveis + coleção usuarios")
    System(fauth, "Authentication", "E-mail e senha")
  }
```

## Notas

- A landing (`#/`) e o app (`#/app`) são o **mesmo bundle**; a rota é decidida por `window.location.hash` em `main.ts`.
- O backend hoje executa **localmente via CLI** — ainda não há endpoint HTTP/Cloud Function (marcado como futuro no backlog).
- Regras de segurança: leitura autenticada; escrita apenas `admin`/`owner` (`firestore.rules`).
