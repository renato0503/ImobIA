# ImobIA — Documento de Contexto (Bíblia do Produto)

> **Status:** v0.1 (MVP em produção)
> **URL:** https://imobia.web.app
> **Repositório:** https://github.com/renato0503/ImobIA
> **Estratégia de custo:** 100% free tier (custo zero)

---

## 1. Visão Geral e História

### Como nasceu

O ImobIA nasceu da constatação de que o mercado imobiliário sofre com a **fragmentação da informação** e a **ineficiência na busca**. Corretores e clientes perdem horas navegando em dezenas de sites, cada um com seus próprios filtros, padrões e cadastros.

O segundo gatilho foi o **processo de captação**. Cadastrar um imóvel manualmente — digitando características, valores e contatos em planilhas ou sistemas burocráticos — é lento, repetitivo e propenso a erros.

### Propósito maior

Criar um **agregador imobiliário centralizado e inteligente** que:

1. Capture dados de múltiplas fontes (links de anúncios, textos e áudios enviados pelo celular, scrapers).
2. Estruture esses dados em um **formato padronizado** usando IA.
3. Permita **buscas granulares e precisas em frações de segundo**, indo além de "Bairro e Valor".

---

## 2. O Problema e a Solução

### A dor

| Dor | Impacto |
|-----|---------|
| Fragmentação dos anúncios em vários portais | Corretores e clientes navegam em dezenas de sites |
| Filtros limitados (só bairro + valor) | Impossível filtrar por "energia solar" ou "quintal" |
| Data entry manual | Cadastro lento, burocrático e com erros |
| Busca cruzada inexistente | Ex: "Casa + Aluguel + Energia Solar + até R$ 3.000" exige trabalho manual |

### A solução

1. **Filtros cruzados ricos** — busca por combinação de finalidade, tipo, bairro, valor máximo e características ("diferenciais").
2. **Entrada de dados automatizada por IA** — o usuário envia um texto livre ou um link de anúncio pelo celular; a IA (Groq) interpreta, estrutura em JSON e salva no banco automaticamente.
3. **Banco centralizado** — todo o acervo vive no Firestore, consultável em tempo real.

### O diferencial

- **Velocidade e riqueza dos filtros** sobre os portais tradicionais.
- **Automação total da captação** (elimina o data entry manual).
- **Resposta pronta para WhatsApp** — o resumo do imóvel é copiado com um clique.

---

## 3. Arquitetura do Sistema

### Visão macro

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│         FRONTEND            │        │          BACKEND            │
│  PWA (Vite + TypeScript)    │        │  Python 3.12 (local/nuvem)  │
│  • Filtros granulares       │        │  • Ingestão via Groq (IA)   │
│  • Cards de resultados      │        │  • Normalização em JSON     │
│  • Copiar resumo WhatsApp   │        │  • Persistência Firestore   │
│  • Login Google             │        │  • Seed / Admin / Scraping  │
└──────────────┬──────────────┘        └──────────────┬──────────────┘
               │ Firebase SDK (Auth + Firestore)      │ firebase-admin
               └───────────────┬──────────────────────┘
                               ▼
                ┌─────────────────────────────┐
                │        FIREBASE            │
                │  • Firestore (NoSQL)       │
                │  • Authentication (Google) │
                │  • Hosting (SSL + PWA)     │
                └─────────────────────────────┘
```

### Stack

| Camada | Tecnologia | Papel |
|--------|-----------|-------|
| Frontend | Vite 5 + TypeScript + HTML/CSS | UI responsiva, PWA instalável |
| Banco | Firestore (NoSQL) | Coleção `imoveis` + coleção `usuarios` (papéis) |
| Autenticação | Firebase Auth (Google) | Proteção de acesso |
| Hospedagem | Firebase Hosting | Distribuição global com SSL e service worker |
| Ingestão IA | Python + Groq (`llama-3.3-70b-versatile`) | Texto/áudio solto → JSON estruturado |
| SDK de dados | `firebase-admin` (Python) | Escrita programática no Firestore |
| Scraping | BeautifulSoup/Selenium (planejado) | Captura de portais externos |

### Modelo de dados (coleção `imoveis`)

```json
{
  "tipo": "Casa",
  "finalidade": "ambos",
  "bairro": "Centro",
  "cidade": "São Paulo",
  "valor_venda": 450000,
  "valor_aluguel": 2500,
  "caracteristicas": ["3 quartos", "energia solar", "quintal"],
  "contato_nome": "João Corretor",
  "contato_telefone": "(11) 99999-9999",
  "descricao": "Casa espaçosa com energia solar.",
  "fotos": [],
  "criado_em": 1735000000000
}
```

### Modelo de dados (coleção `usuarios`)

```json
{
  "role": "admin | owner | leitor",
  "email": "gestor.renatorosa@gmail.com",
  "criado_em": 1735000000000
}
```

> O ID do documento é o **UID do usuário** no Firebase Auth.

### Regras de segurança

- **Leitura:** qualquer usuário autenticado.
- **Escrita em `imoveis`:** somente `admin`/`owner`.
- **Escrita em `usuarios`:** owner pode criar; apenas admin/owner pode editar.
- **Owner raiz (bootstrap):** UID `ef6Nu3M7FMRjaSmmTSvGlfOOiQI3`.

---

## 4. Principais Funcionalidades (Core Features)

### Busca avançada (frontend)
- Filtros combináveis: **finalidade**, **tipo de imóvel**, **bairro**, **valor máximo**, **características**.
- Chips de diferenciais (energia solar, quintal, piscina, garagem, 3 quartos, etc.).
- Consulta direta ao Firestore com `array-contains` para características e `in` para finalidade.
- Filtragem em memória para múltiplas características e valor máximo.

### Renderização de resultados
- Cards com foto, valor formatado, tags de características, contato e descrição.
- Responsivo (CSS Grid) — mobile e desktop.

### Resumo para WhatsApp
- Botão "Copiar resumo" gera texto formatado do imóvel.
- Opção individual por card (`.copy-one`).

### Autenticação
- Login com Google via Firebase Auth.
- Tela de login separada para usuários não autenticados.

### Ingestão por IA (backend)
- `ingest.py`: recebe texto livre, link ou arquivo e estrutura via Groq.
- `estrutura.py`: normaliza tipo, finalidade, valores e características em JSON padronizado.
- `firestore_repo.py`: persistência programática via `firebase-admin`.

### Operações auxiliares
- `seed.py`: popula o banco com imóveis de exemplo.
- `add_admin.py`: promove usuário a admin/owner.

---

## 5. Público-Alvo e Casos de Uso

### Quem utiliza

| Perfil | Necessidade |
|--------|-------------|
| **Corretores de imóveis** | Cadastrar imóveis rapidamente e achar oportunidades para clientes |
| **Gestores/imobiliárias** | Ter um acervo centralizado e pesquisável |
| **Compradores e inquilinos** | Encontrar imóveis com filtros específicos |
| **Assistentes de captação** | Alimentar a base via WhatsApp ou scraping |

### Casos de uso práticos

**Caso 1 — Cliente pede algo específico (Corretor)**
> O cliente pede uma "casa com energia solar para alugar até R$ 3.000". O corretor abre o ImobIA, marca `Finalidade: Aluguel`, `Tipo: Casa`, `Valor máx: 3000` e o chip `energia solar`. Os cards aparecem em segundos; ele copia o resumo e envia no WhatsApp.

**Caso 2 — Captação rápida (Assistente)**
> Na rua, o assistente vê uma placa de "Casa à venda, 4 quartos, piscina". Ele envia esse texto livre (ou um áudio transcrito) para a ingestão. A IA do Groq estrutura e salva no Firestore — sem digitar formulário.

**Caso 3 — Alimentação via link (Corretor)**
> Um anúncio de outro portal é enviado por link. O backend estrutura os dados do link e injeta no acervo com o mesmo padrão.

**Caso 4 — Automação noturna (Futuro)**
> Um scraper roda de madrugada em sites-alvo, extrai novos anúncios, limpa com pandas e sincroniza no Firestore.

---

## 6. Estratégia de Custo Zero (Free Tier)

> **Decisão do produto:** o ImobIA deve operar **100% dentro dos tiers gratuitos**.
> Nada de serviços pagos ou servidores sempre-on.

### Como o custo se mantém zero

| Camada | Recurso | Free tier | Como usamos |
|--------|---------|-----------|-------------|
| Frontend | Firebase Hosting | Gratuito (storage + banda) | Build estático do Vite, PWA, SSL |
| Banco | Firestore | 1 GiB, 50k reads/dia, 20k writes/dia | Coleções `imoveis`, `usuarios`, `leads` |
| Auth | Firebase Authentication | Gratuito (e-mail/senha) | Login/cadastro por e-mail e senha |
| Storage | Cloud Storage | 5 GiB, 1M ops/dia | Fotos dos imóveis |
| Analytics | Firebase Analytics | Gratuito | Eventos de busca e leads |
| Ingestão IA | Groq (external) | Tiers gratuitos próprios da API | Estruturação de texto/áudio |
| Backend | Python (local/CLI) | Sem infra | `ingest.py`/`server.py` rodam sob demanda |

### Regras para permanecer custo zero

1. **Backend nunca roda em servidor pago.** Ingestão, scraping e webhook WhatsApp executam
   localmente/sob demanda (`python server.py` / `python ingest.py`). Nada de Cloud Run/Functions.
2. **Groq** é a única dependência externa paga; usar somente o tier gratuito da API.
3. **Orçamento de proteção:** foi criado um orçamento de **US$ 1/mês** no Google Cloud
   (projeto `imobia-65bda`) com alertas em 50%, 90% e 100% — qualquer gasto além do free tier
   dispara notificação.
4. **Sem APIs/features que exijam Blaze além do necessário** (ex: Cloud Functions, Vertex, etc.).
5. **Alertas de quota** (Console Firebase → Uso) monitoram Firestore/Storage antes de atingir limites.

> O plano da conta é **Blaze**, mas o Blaze só cobra *além* do free tier. Enquanto o uso
> permanecer dentro das cotas acima, o custo é **R$ 0**.
