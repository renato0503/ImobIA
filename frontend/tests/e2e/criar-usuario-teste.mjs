// Cria um usuário de teste no Firebase Auth via REST API.
// Uso: node tests/e2e/criar-usuario-teste.mjs <email> <senha>
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = readFileSync(path.resolve(__dirname, '../../.env'), 'utf8');

const get = (chave) => {
  const linha = env.split('\n').find((l) => l.startsWith(`${chave}=`));
  return linha ? linha.slice(chave.length + 1).trim() : '';
};

const apiKey = get('VITE_FIREBASE_API_KEY');
if (!apiKey) {
  console.error('VITE_FIREBASE_API_KEY não encontrada em frontend/.env');
  process.exit(1);
}

const email = process.argv[2];
const senha = process.argv[3];
if (!email || !senha) {
  console.error('Uso: node criar-usuario-teste.mjs <email> <senha>');
  process.exit(1);
}

const resposta = await fetch(
  `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: senha, returnSecureToken: true }),
  }
);

const dados = await resposta.json();
if (dados.error) {
  console.error('Erro ao criar usuário:', dados.error.message);
  process.exit(1);
}

console.log(`Usuário criado: ${email} (uid: ${dados.localId})`);
