# Diagrama 2 — Workflow de Busca de Imóveis

> Fontes: `frontend/src/services/imoveis.ts`, `frontend/src/ui.ts`, `firestore.indexes.json`
> Firestore: coleção `imoveis` (query com `where`, `in`, `array-contains`, `orderBy`, `limit`)

## Sequência

```mermaid
sequenceDiagram
  autonumber
  actor U as Usuário (autenticado)
  participant UI as ui.ts (dashboard)
  participant S as services/imoveis.ts
  participant F as Firestore

  U->>UI: Ajusta filtros (finalidade, tipo, bairro, valor, chips)
  U->>UI: Clique em "Buscar"
  UI->>S: buscarImoveis(db, estadoFiltros)
  S->>S: construirQuery(filtros)
  %% Condições montadas dinamicamente
  Note over S: finalidade='aluguel' → where('finalidade','in',['aluguel','ambos'])
  Note over S: tipo='Casa' → where('tipo','==',tipo)
  Note over S: bairro → where('bairro','==',bairro)
  Note over S: caracteristicas[0] → where('caracteristicas','array-contains',c)
  Note over S: orderBy('criado_em','desc') + limit(100)
  S->>F: getDocs(query)
  F-->>S: snapshot
  S->>S: Filtro em memória (todas as características + valorMaximo)
  S-->>UI: Imovel[]
  UI->>UI: renderCards + contagem
  UI->>U: Cards com botão "Copiar resumo"
```

## Fluxo de decisão

```mermaid
flowchart TD
  A[renderDashboard] --> B[Estado inicial: finalidade='ambos', caracteristicas=[]]
  B --> C[Clique em Buscar]
  C --> D{Ler inputs do DOM}
  D --> E[montar estadoFiltros]
  E --> F[buscarImoveis]
  F --> G[construirQuery: condicoes dinâmicas]
  G --> H[getDocs + orderBy criado_em desc + limit 100]
  H --> I[para cada doc]
  I --> J{todas características presentes?}
  J -->|não| K[descarta]
  J -->|sim| L{valorMaximo definido?}
  L -->|sim| M{valor do imóvel > valorMaximo?}
  M -->|sim| K
  M -->|não| N[adiciona ao resultado]
  L -->|não| N
  K --> I
  N --> I
  I --> O[renderCards]
  O --> P{Botão copiar resumo?}
  P -->|individual| Q[window.copiarUm(id) → clipboard]
  P -->|global| R[copiarResumo() → primeiro resultado → clipboard]
  Q --> S[toast: Resumo copiado]
  R --> S
```

## Mapa para testes

| # | Cenário | Resultado esperado |
|---|---------|--------------------|
| B1 | Buscar sem filtros | Até 100 imóveis mais recentes |
| B2 | Finalidade aluguel | Só `finalidade in [aluguel, ambos]` |
| B3 | Tipo = Casa | Só documentos com `tipo == 'Casa'` |
| B4 | Característica única (energia solar) | Query usa `array-contains` no Firestore |
| B5 | Duas+ características | Query usa só a 1ª; as demais filtradas em memória |
| B6 | valorMaximo = 3000 (aluguel) | Imóveis com `valor_aluguel > 3000` descartados |
| B7 | Copiar resumo (individual) | Texto formatado no clipboard + toast |
| B8 | Copiar resumo (global) | Resumo do primeiro resultado |
| B9 | Nenhum resultado | Mensagem "Nenhum imóvel encontrado com esses filtros." |
| B10 | Erro de query/índice | Mensagem de erro no `#cards` (não quebra a página) |

## Observações de arquitetura

- **Índices compostos** (`firestore.indexes.json`): `tipo+criado_em`, `bairro+criado_em`,
  `finalidade+criado_em`, `finalidade+tipo+criado_em`, `bairro+tipo+criado_em`, `caracteristicas+criado_em`.
- **Limitação conhecida:** múltiplos `array-contains` exigiriam índice composto por combinação;
  o MVP resolve a 1ª característica na query e o restante em memória (`imoveis.ts:buscarImoveis`).
