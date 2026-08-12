# ImobIA — Workflows & Arquitetura (Diagramas)

> **Propósito:** estudo recorrente dos workflows da plataforma, mapeando fluxos reais do código
> para embasar testes. Os diagramas usam **Mermaid.js** e renderizam nativamente no GitHub e VS Code.
>
> **Regra de fidelidade:** os nomes de arquivos, funções e campos abaixo refletem o código real do
> repositório. Nada aqui é inventado — quando um fluxo for planejado (não implementado), está marcado com `🚧`.

## Índice

| # | Diagrama | Arquivo | Workflow / Domínio |
|---|----------|---------|--------------------|
| 0 | Arquitetura macro (C4) | `00-arquitetura.md` | Visão de sistema e limites |
| 1 | Autenticação | `01-auth-workflow.md` | Landing → login/cadastro → dashboard |
| 2 | Busca de imóveis | `02-busca-workflow.md` | Filtros → query Firestore → cards |
| 3 | Ingestão por IA | `03-ingestao-workflow.md` | Texto/link → Groq → normalização → Firestore |
| 4 | Modelo de dados | `04-dados-er.md` | Coleções `imoveis` e `usuarios` |
| 5 | Matriz de testes | `05-matriz-testes.md` | Cenários por workflow (recorrente) |

## Como usar

- **Leitura rápida:** abra o diagrama correspondente ao fluxo que quer entender/testar.
- **Testes:** consulte `05-matriz-testes.md` para converter cada workflow em cenários de teste
  (unitário, E2E e manual).
- **Recorrência:** este estudo é **permanente** — a cada nova feature, um novo fluxo é adicionado aqui
  antes de qualquer teste. Ao final de cada sprint, revisar e atualizar os diagramas.
