# Diagrama 3 — Workflow de Ingestão por IA (Groq)

> Fontes: `backend/ingest.py`, `backend/estrutura.py`, `backend/firestore_repo.py`, `backend/config.py`
> Serviços: Groq API (`llama-3.3-70b-versatile`), Firestore (coleção `imoveis`)

## Sequência (CLI)

```mermaid
sequenceDiagram
  autonumber
  actor U as Usuário (admin/owner)
  participant CLI as ingest.py
  participant E as estrutura.py
  participant G as Groq API
  participant R as firestore_repo.py
  participant F as Firestore

  U->>CLI: python ingest.py --entrada|--arquivo|--link
  CLI->>E: estruturar_imovel(texto)
  E->>E: Verifica GROQ_API_KEY (config.py)
  alt GROQ_API_KEY ausente
    E-->>CLI: RuntimeError (encerra)
  end
  E->>G: chat.completions.create(model=GROQ_MODEL, temperature=0.1, response_format=json_object)
  G-->>E: message.content (JSON)
  E->>E: json.loads + _normalizar(dados)
  Note over E: _normalizar_tipo → TIPOS_VALIDOS
  Note over E: _normalizar_finalidade → venda|aluguel|ambos
  Note over E: _normalizar_valor → float (R$ 2.500,00 → 2500.0)
  Note over E: _normalizar_caracteristicas → minúsculo
  E-->>CLI: dict estruturado
  CLI->>CLI: imprime campos (log)
  CLI->>R: salvar_imovel(dados)
  R->>R: _inicializar() → credentials.Certificate(serviceAccount.json)
  alt serviceAccount.json ausente
    R-->>CLI: FileNotFoundError (encerra)
  end
  R->>R: registro['criado_em'] = time.time()*1000
  R->>F: db.collection('imoveis').add(registro)
  F-->>R: doc id
  R-->>CLI: imovel_id
  CLI-->>U: "Salvo no Firestore! Documento id: <id>"
```

## Fluxo de decisão (ingestão)

```mermaid
flowchart TD
  A[ingest.py] --> B{Tipo de entrada?}
  B -->|--entrada| C[texto = args.entrada]
  B -->|--arquivo| D[ler arquivo .txt utf-8]
  B -->|--link| E[texto = 'Anúncio ... ' + args.link]
  C --> F{texto vazio?}
  D --> F
  E --> F
  F -->|sim| Z[exit 1 com erro]
  F -->|não| G[estruturar_imovel]
  G --> H{GROQ_API_KEY set?}
  H -->|não| Z
  H -->|sim| I[Groq chat.completions]
  I --> J[conteudo = message.content]
  J --> K[json.loads]
  K --> L[_normalizar]
  L --> M[salvar_imovel]
  M --> N{serviceAccount.json existe?}
  N -->|não| Z
  N -->|sim| O[firestore .add]
  O --> P[print doc id]
```

## Mapa para testes

| # | Cenário | Resultado esperado |
|---|---------|--------------------|
| C1 | `--entrada` com texto rico | JSON estruturado com todos os campos preenchidos |
| C2 | `--entrada` "Casa com energia solar e quintal no centro para alugar por 2500" | `tipo=Casa`, `finalidade=aluguel`, `valor_aluguel=2500.0`, características `[energia solar, quintal]` |
| C3 | Valor "R$ 2.500,00" | `_normalizar_valor` → `2500.0` |
| C4 | Sem `GROQ_API_KEY` | `RuntimeError` e encerramento |
| C5 | Sem `serviceAccount.json` | `FileNotFoundError` e encerramento |
| C6 | `--link` | Texto com a URL (conteúdo da página ainda não é baixado 🚧) |
| C7 | Bairro ausente no texto | Default `"Outros"` |
| C8 | `--arquivo` inexistente | Falha de abertura de arquivo |

## Dependências externas (validadas por `pip install -r requirements.txt`)

- `groq==0.10.0`, `firebase-admin==6.5.0`, `python-dotenv==1.0.1`, `requests==2.32.3`

## Notas

- A ingestão via **link real** (baixar conteúdo da página) e via **WhatsApp** são backlog (Fase 2).
- O fluxo usa `response_format=json_object` para forçar saída estruturada do Groq.
- `_normalizar` garante campos obrigatórios e tipos corretos antes de persistir.
