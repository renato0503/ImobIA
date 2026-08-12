# ImobIA

Agregador imobiliário centralizado e inteligente. Captura dados de múltiplas fontes (links de anúncios, áudios do WhatsApp, scraping), estrutura com IA em JSON e permite buscas granulares em frações de segundo.

## Stack

- **Frontend (PWA):** Vite + TypeScript + HTML/CSS, hospedado no Firebase Hosting.
- **Backend (dados):** Firebase Firestore + Firebase Authentication.
- **Ingestão por IA:** Python + API Groq (estrutura texto/áudio solto em JSON e salva no Firestore).
- **Automação:** scripts Python de scraping (planejado).

## Estrutura

```
ImobIA/
├── frontend/            # PWA Vite + TS
│   ├── src/
│   │   ├── firebase.ts  # configuração do Firebase
│   │   ├── services/    # queries do Firestore
│   │   └── ui.ts        # renderização de filtros + cards
│   └── public/          # logos, ícones do PWA
├── backend/             # Python: ingestão via Groq + Firestore
├── scripts/             # utilitários (ex: gerar ícones a partir das logos)
├── firebase.json        # hosting + firestore + storage
├── firestore.rules      # regras de segurança
├── storage.rules        # regras do Cloud Storage
└── firestore.indexes.json
```

## Logos e ícones

As logos ficam na raiz (`logosimbolo.png` = símbolo, `logoletras.png` = letreiro) e os ícones
são gerados em `frontend/public/`. Para regenerar após trocar as logos:

```bash
python scripts/gerar_icones.py
npm run build   # no frontend
firebase deploy --only hosting
```

## Modelo de dados (Firestore: coleção `imoveis`)

```json
{
  "tipo": "Casa",
  "finalidade": "ambos",
  "bairro": "Centro",
  "valor_venda": 450000,
  "valor_aluguel": 2500,
  "caracteristicas": ["3 quartos", "energia solar", "quintal"],
  "contato_nome": "João Corretor",
  "contato_telefone": "(11) 99999-9999",
  "criado_em": 1735000000000
}
```

## Como rodar o frontend

```bash
cd frontend
cp .env.example .env   # preencha com as credenciais do seu projeto Firebase
npm install
npm run dev
```

> As credenciais do Firebase ficam em `frontend/.env` (não versionado). A `apiKey` do Firebase é pública por design (proteção real vem das regras do Firestore), mas o GitHub a detecta como segredo, então ela não fica no repositório.

Para build de produção:

```bash
npm run build
```

## Como rodar o backend (ingestão via Groq)

```bash
cd backend
pip install -r requirements.txt
export GROQ_API_KEY="sua-chave"
python ingest.py --entrada "Casa com energia solar e quintal no centro para alugar por 2500"
```

Envie um texto livre ou um link de anúncio. A IA (Groq) estrutura os dados e salva no Firestore.

Para rodar como servidor (formato indicado para integração futura com um bot/WhatsApp):

```bash
python server.py
```

## Deploy Firebase

```bash
# na raiz do repositório
firebase login
firebase deploy
```

### Setup inicial (uma vez, no Console Firebase)

1. **Authentication**: em *Authentication > Sign-in method*, ative o provedor **Google**.
2. **Firestore**: crie a coleção `imoveis` (pode ficar vazia).
3. **Índices compostos**: as regras de busca usam `array-contains` + `orderBy`. O `firebase deploy` envia os índices declarados em `firestore.indexes.json`, mas se o console pedir índices adicionais ao rodar a primeira busca, aceite a sugestão automática.
4. **Conta de serviço (backend Python)**: em *Configurações do projeto > Contas de serviço > Gerar nova chave privada*, baixe o JSON para `backend/serviceAccount.json`.

### Backend

```bash
cd backend
python -m venv .venv && .venv\Scripts\activate   # (Windows)
pip install -r requirements.txt
# configure backend/.env (veja .env.example)
python seed.py     # popula com imóveis de exemplo
python ingest.py --entrada "Casa com energia solar e quintal no centro, aluguel 2500"
```

## Regras de segurança

Apenas usuários autenticados podem ler/escrever na coleção `imoveis` (ver `firestore.rules`). Ajuste conforme a necessidade de permissões mais granulares.
