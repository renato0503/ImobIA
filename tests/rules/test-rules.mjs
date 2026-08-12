import { readFile } from 'node:fs/promises';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { setDoc, getDoc, getDocs, collection, query, doc } from 'firebase/firestore';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RULES_PATH = path.resolve(__dirname, '..', '..', 'firestore.rules');
const PROJECT_ID = 'imobia-65bda';

const OWNER_UID = 'ef6Nu3M7FMRjaSmmTSvGlfOOiQI3';
const LEITOR_UID = 'usuario-leitor-123';
const OUTRO_UID = 'outro-usuario-456';

let testEnv;

async function iniciar() {
  const rules = await readFile(RULES_PATH, 'utf8');
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules },
  });
}

async function criarAdmin() {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'usuarios/' + OWNER_UID), {
      role: 'admin',
      email: 'gestor.renatorosa@gmail.com',
    });
  });
}

function uid(userUid) {
  return testEnv.authenticatedContext(userUid, {
    email: `${userUid}@test.com`,
  });
}

const ok = (nome) => console.log('  OK   -', nome);
const falhou = (nome) => console.log('  FALHOU -', nome);

let total = 0;
let passou = 0;

async function testar(nome, fn) {
  total++;
  try {
    await fn();
    ok(nome);
    passou++;
  } catch (err) {
    falhou(nome);
    console.error('        ', err.message);
  }
}

async function main() {
  await iniciar();
  await criarAdmin();

  console.log('\n== Leitura ==');
  await testar('D1: não autenticado NÃO lê imoveis', async () => {
    const anon = testEnv.unauthenticatedContext();
    await assertFails(getDocs(query(collection(anon.firestore(), 'imoveis'))));
  });
  await testar('D2: leitor autenticado lê imoveis', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'imoveis/casa-1'), {
        tipo: 'Casa', bairro: 'Centro', finalidade: 'ambos', caracteristicas: [], criado_em: 1,
      });
    });
    const ctx = uid(LEITOR_UID);
    await assertSucceeds(getDocs(query(collection(ctx.firestore(), 'imoveis'))));
  });

  console.log('\n== Escrita em imoveis ==');
  await testar('D3: leitor NÃO cria imovel', async () => {
    const ctx = uid(LEITOR_UID);
    await assertFails(setDoc(doc(ctx.firestore(), 'imoveis/leitor-tenta'), {
      tipo: 'Casa', bairro: 'X', finalidade: 'venda', caracteristicas: [], criado_em: 1,
    }));
  });
  await testar('D4: admin cria imovel', async () => {
    const ctx = uid(OWNER_UID);
    await assertSucceeds(setDoc(doc(ctx.firestore(), 'imoveis/admin-cria'), {
      tipo: 'Casa', bairro: 'Centro', finalidade: 'venda', caracteristicas: ['piscina'], criado_em: 2,
    }));
  });

  console.log('\n== usuarios ==');
  await testar('D5: usuário cria doc em usuarios/{seuUID}', async () => {
    const ctx = uid(LEITOR_UID);
    await assertSucceeds(setDoc(doc(ctx.firestore(), 'usuarios/' + LEITOR_UID), {
      role: 'leitor', email: 'leitor@test.com',
    }));
  });
  await testar('D6: usuário NÃO cria doc em usuarios/{UID de outro}', async () => {
    const ctx = uid(LEITOR_UID);
    await assertFails(setDoc(doc(ctx.firestore(), 'usuarios/' + OUTRO_UID), {
      role: 'admin', email: 'outro@test.com',
    }));
  });
  await testar('D7: owner raiz tem acesso admin', async () => {
    const ctx = uid(OWNER_UID);
    await assertSucceeds(setDoc(doc(ctx.firestore(), 'imoveis/owner-raiz'), {
      tipo: 'Kitnet', bairro: 'Centro', finalidade: 'aluguel', caracteristicas: [], criado_em: 3,
    }));
  });

  console.log('\n== leads ==');
  await testar('L1: anônimo cria lead válido', async () => {
    const anon = testEnv.unauthenticatedContext();
    await assertSucceeds(setDoc(doc(anon.firestore(), 'leads/lead-1'), {
      nome: 'Maria', email: 'maria@test.com', telefone: '11999999999', criado_em: 1,
    }));
  });
  await testar('L2: lead sem email válido NÃO cria', async () => {
    const anon = testEnv.unauthenticatedContext();
    await assertFails(setDoc(doc(anon.firestore(), 'leads/lead-2'), {
      nome: 'João', email: 'sem-arroba', criado_em: 1,
    }));
  });
  await testar('L3: anônimo NÃO lê leads', async () => {
    const anon = testEnv.unauthenticatedContext();
    await assertFails(getDoc(doc(anon.firestore(), 'leads/lead-1')));
  });
  await testar('L4: admin lê leads', async () => {
    const ctx = uid(OWNER_UID);
    await assertSucceeds(getDoc(doc(ctx.firestore(), 'leads/lead-1')));
  });

  await testEnv.cleanup();

  console.log(`\nResultado: ${passou}/${total} testes passaram`);
  if (passou < total) process.exit(1);
}

main().catch((err) => {
  console.error('Falha ao iniciar testes:', err);
  process.exit(1);
});
