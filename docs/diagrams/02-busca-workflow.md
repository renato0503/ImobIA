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

  U->>UI: Ajusta filtros (finalidade, tipo, bairro, faixa de valor, ordenação, chips)
  U->>UI: Clique em "Buscar"
  UI->>S: buscarImoveis(db, estadoFiltros)
  S->>S: construirQuery(filtros)
  %% Condições montadas dinamicamente
  Note over S: finalidade='aluguel' → where('finalidade','in',['aluguel','ambos'])
  Note over S: tipo='Casa' → where('tipo','==',tipo)
  Note over S: bairro → where('bairro','==',bairro)
  Note over S: cada característica → where('tem_<slug>','==',true) [campos booleanos]
  Note over S: orderBy('criado_em','desc') + limit(PAGINA_PADRAO=50)
  S->>F: getDocs(query)
  F-->>S: snapshot
  S->>S: Filtro em memória (todas características + valorMinimo/valorMaximo)
  S->>S: ordenar() → recentes | menor-preco | maior-preco
  S-->>UI: Imovel[] (com valor_efetivo)
  UI->>UI: renderCards + contagem
  UI->>U: Cards com botão "Copiar resumo" + "Carregar mais"
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
  G --> H[getDocs + orderBy criado_em desc + limit PAGINA_PADRAO]
  H --> I[para cada doc]
  I --> J{todas características presentes?}
  J -->|não| K[descarta]
  J -->|sim| L1{valorMinimo? e valor < mín?}
  L1 -->|sim| K
  L1 -->|não| L2{valorMaximo? e valor > máx?}
  L2 -->|sim| K
  L2 -->|não| N[adiciona com valor_efetivo]
  K --> I
  N --> I
  I --> O1[ordenar: recentes | menor-preco | maior-preco]
  O1 --> O2[renderCards]
  O2 --> P{Botão copiar resumo?}
  P -->|individual| Q[window.copiarUm(id) → clipboard]
  P -->|global| R[copiarResumo() → primeiro resultado → clipboard]
  Q --> S[toast: Resumo copiado]
  R --> S
  O2 --> T{imóveis >= limite?}
  T -->|sim| U[Mostra "Carregar mais" → limite += PAGINA_PADRAO]
```

## Mapa para testes

| # | Cenário | Resultado esperado |
|---|---------|--------------------|
| B1 | Buscar sem filtros | Até `PAGINA_PADRAO` (50) imóveis mais recentes |
| B2 | Finalidade aluguel | Só `finalidade in [aluguel, ambos]` |
| B3 | Tipo = Casa | Só documentos com `tipo == 'Casa'` |
| B4 | Característica única (energia solar) | Query usa `array-contains` no Firestore |
| B5 | Duas+ características | Query usa só a 1ª; as demais filtradas em memória |
| B6 | valorMaximo = 3000 (aluguel) | Imóveis com `valor_aluguel > 3000` descartados |
| B6b | valorMinimo = 2000 | Imóveis com valor efetivo < 2000 descartados |
| B6c | Ordenação "menor-preco" | Lista ordenada crescente por `valor_efetivo` |
| B6d | Ordenação "maior-preco" | Lista ordenada decrescente por `valor_efetivo` |
| B6e | "Carregar mais" | `limite` incrementado em 50; cards adicionados via insertAdjacentHTML |
| B7 | Copiar resumo (individual) | Texto formatado no clipboard + toast |
| B8 | Copiar resumo (global) | Resumo do primeiro resultado |
| B9 | Nenhum resultado | Mensagem "Nenhum imóvel encontrado com esses filtros." |
| B10 | Erro de query/índice | Mensagem de erro no `#cards` (não quebra a página) |
| B11 | Autocomplete de bairro | `<datalist>` populado por `listarBairros()` |

## Observações de arquitetura

- **Índices compostos** (`firestore.indexes.json`): `tipo+criado_em`, `bairro+criado_em`,
  `finalidade+criado_em`, `finalidade+tipo+criado_em`, `bairro+tipo+criado_em`, `caracteristicas+criado_em`.
- **Múltiplas características:** cada característica é gravada como booleano `tem_<slug>`
  (ex: `tem_energia_solar: true`) pelo backend (`estrutura.py`). A query usa vários
  `where('tem_X','==',true)` de forma nativa; se o índice faltar ou houver imóveis antigos,
  o frontend cai para `array-contains` (1ª característica) + filtro em memória
  (`imoveis.ts:filtrarEmMemoria`).
- **Ordenação em memória:** como a query já vem por `criado_em`, a reordenação por valor é feita
  no cliente (`imoveis.ts:ordenar`) com `valor_efetivo` preenchido na busca.
- **Paginação via limite:** incrementa `estadoFiltros.limite`; sem cursor (`startAfter`) por enquanto.
