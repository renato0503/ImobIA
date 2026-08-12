# Diagrama 4 — Modelo de Dados (Firestore)

> Fontes: `frontend/src/types.ts`, `backend/estrutura.py` (SCHEMA), `firestore.rules`,
> `backend/add_admin.py` (coleção `usuarios`), `backend/seed.py`

```mermaid
erDiagram
  IMOVEIS {
    string id PK "doc id gerado pelo Firestore"
    string tipo "Casa, Apartamento, Kitnet..."
    string finalidade "venda | aluguel | ambos"
    string bairro "default 'Outros'"
    string cidade "nullable"
    number valor_venda "nullable"
    number valor_aluguel "nullable"
    array caracteristicas "array-contains (busca)"
    string contato_nome "nullable"
    string contato_telefone "nullable"
    string descricao "nullable"
    array fotos "URLs; vazio por enquanto"
    number criado_em "timestamp ms"
  }

  USUARIOS {
    string id PK "UID do Firebase Auth"
    string role "admin | owner | leitor"
    string email "nullable (preenchido via add_admin)"
    number criado_em "timestamp"
  }

  LEADS {
    string id PK "doc id gerado"
    string nome "obrigatório, > 0"
    string email "obrigatório, deve conter @"
    string telefone "opcional"
    number criado_em "timestamp"
  }
```

## Regras de segurança (resumo — `firestore.rules`)

```mermaid
flowchart LR
  subgraph leitura
    A["match /imoveis/**"] -->|"allow read"| A1["autenticado()"]
    B["match /usuarios/**"] -->|"allow read"| B1["autenticado()"]
  end
  subgraph escrita
    C["imoveis create/update/delete"] -->|"allow"| C1["ehAdmin()"]
    D["usuarios create"] -->|"allow"| D1["request.auth.uid == uid OU ehAdmin()"]
    E["usuarios update/delete"] -->|"allow"| E1["ehAdmin()"]
  end
```

## Funções auxiliares (Firestore rules)

```mermaid
flowchart TD
  A[ownerUid] --> A1["return 'ef6Nu3M7FMRjaSmmTSvGlfOOiQI3'"]
  B[autenticado] --> B1["return request.auth != null"]
  C[ehAdmin] --> C1{"request.auth.uid == ownerUid()"}
  C1 -->|sim| C2["true"]
  C1 -->|não| C3["get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.role in ['admin','owner']"]
```

## Mapa para testes

| # | Cenário | Resultado esperado |
|---|---------|--------------------|
| D1 | Usuário não autenticado lê `imoveis` | Negado |
| D2 | Usuário autenticado (`leitor`) lê `imoveis` | Permitido |
| D3 | `leitor` tenta criar/editar imóvel | Negado |
| D4 | `owner`/`admin` cria imóvel | Permitido |
| D5 | Usuário cria doc em `usuarios/{seuUID}` | Permitido |
| D6 | Usuário cria doc em `usuarios/{UID de outro}` | Negado |
| D7 | Owner raiz (`ef6Nu3M7...`) tem acesso admin | Permitido mesmo sem doc em `usuarios` |
| D8 | Editar doc de outro usuário | Negado (só `ehAdmin()`) |
| L1 | Anônimo cria lead válido (nome+email) | Permitido |
| L2 | Lead com email inválido (sem `@`) | Negado |
| L3 | Anônimo lê coleção `leads` | Negado |
| L4 | Admin lê `leads` | Permitido |

## Notas de modelagem

- `caracteristicas` é um **array** → permite `array-contains` na query de busca.
- `finalidade` é **string** → busca por `in` (`['venda','ambos']` ou `['aluguel','ambos']`).
- O ID de `usuarios` é o **UID** do Firebase Auth (add_admin usa `document(uid).set(merge=True)`).
- `criado_em` em milissegundos para casar frontend (`types.ts`) e backend (`firestore_repo.py`).
- `fotos` é um **array de URLs** (Storage). As regras de `storage.rules` espelham os papéis:
  leitura autenticada; escrita admin/owner; tamanho máx 5 MB; `image/*`.

## Cloud Storage (fotos)

```mermaid
flowchart LR
  subgraph storage["storage.rules — imoveis/{imovelId}/{arquivo}"]
    R1["read: autenticado()"] --> R2["allow"]
    W1["write: ehAdmin() e size < 5MB e image/*"] --> W2["allow"]
    R3["demais"] --> R4["deny"]
  end
```
