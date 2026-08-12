# Diagrama 1 — Workflow de Autenticação

> Fontes: `frontend/src/main.ts`, `frontend/src/ui.ts`, `frontend/src/landing.ts`
> Firebase: Authentication (e-mail/senha), Firestore (coleção `usuarios`)

## Sequência (primeiro acesso — usuário novo)

```mermaid
sequenceDiagram
  autonumber
  actor U as Usuário
  participant LP as landing.ts (#/)
  participant M as main.ts (roteador)
  participant UI as ui.ts (login)
  participant A as firebase/auth
  participant F as Firestore

  U->>LP: Acessa https://imobia.web.app/
  LP->>M: Clique em "Acessar plataforma" → irParaApp()
  M->>M: hash = '#/app' + renderApp()
  M->>UI: renderLogin() (não autenticado)

  alt Usuário novo (cadastro)
    U->>UI: Preenche e-mail/senha → "Criar conta"
    UI->>A: criarConta(email, senha) → createUserWithEmailAndPassword
    A-->>UI: auth/weak-password | auth/email-already-in-use
    UI->>U: exibirErro(mensagem traduzida) [se erro]
  end

  U->>UI: Preenche e-mail/senha → submit
  UI->>A: entrarComEmail(email, senha) → signInWithEmailAndPassword
  A-->>UI: auth/invalid-credential | auth/user-not-found
  UI->>U: exibirErro(mensagem traduzida) [se erro]
  A-->>M: onAuthStateChanged → autenticado = true
  M->>M: renderApp() → hash '#/app' → renderDashboard()
  M->>F: executa busca inicial (buscarImoveis)
  U->>M: "Sair" → sair() → signOut + hash '#/'
  M->>LP: renderLanding()
```

## Decisão de rota (state)

```mermaid
stateDiagram-v2
  [*] --> Landing
  Landing --> Login: irParaApp() → hash '#/app' (não autenticado)
  Login --> Dashboard: onAuthStateChanged (autenticado)
  Landing --> Dashboard: hash '#/app' (sessão já ativa)
  Dashboard --> Landing: sair() → hash '#/'
  Dashboard --> Landing: hashchange para '#/'
  Login --> Login: erro (mensagem amigável)
```

## Fluxo de decisão (flowchart)

```mermaid
flowchart TD
  A[Acessa imobia.web.app] --> B{hash atual?}
  B -->|'#/app'| C{autenticado?}
  B -->|outra| L[renderLanding]
  C -->|sim| D[renderDashboard]
  C -->|não| E[renderLogin]
  E --> F{submit?}
  F -->|entrar| G[signInWithEmailAndPassword]
  F -->|criar conta| H[createUserWithEmailAndPassword]
  G --> I{onAuthStateChanged}
  H --> I
  I -->|usuario| D
  I -->|null| E
  D --> J[Buscar imóveis e renderizar cards]
  D -->|sair| K[signOut + hash '#/']
  K --> L
```

## Mapa para testes

| # | Cenário | Resultado esperado |
|---|---------|--------------------|
| A1 | Login com e-mail/senha válidos | Dashboard renderizado |
| A2 | Login com senha errada | `E-mail ou senha incorretos.` no `#login-erro` |
| A3 | Cadastro com e-mail já usado | `Este e-mail já está cadastrado.` |
| A4 | Cadastro com senha < 6 | `A senha deve ter pelo menos 6 caracteres.` |
| A5 | Sessão ativa + abrir `#/app` direto | Dashboard (sem passar pelo login) |
| A6 | Sair | Volta para a landing (`#/`) |
