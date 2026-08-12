import './style.css';
import './firebase';
import { auth } from './firebase';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { renderApp, setAutenticado } from './ui';

onAuthStateChanged(auth, (usuario) => {
  setAutenticado(!!usuario);
  renderApp();
});

export async function entrarComEmail(email: string, senha: string): Promise<string | null> {
  try {
    await signInWithEmailAndPassword(auth, email, senha);
    return null;
  } catch (err: any) {
    return mensagemDeErro(err);
  }
}

export async function criarConta(email: string, senha: string): Promise<string | null> {
  try {
    await createUserWithEmailAndPassword(auth, email, senha);
    return null;
  } catch (err: any) {
    return mensagemDeErro(err);
  }
}

export async function sair() {
  await signOut(auth);
  renderApp();
}

function mensagemDeErro(err: any): string {
  const codigo: string = err?.code ?? '';
  const mapa: Record<string, string> = {
    'auth/invalid-email': 'E-mail inválido.',
    'auth/user-not-found': 'Usuário não encontrado.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
    'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
    'auth/missing-password': 'Informe a senha.',
  };
  return mapa[codigo] ?? 'Falha na autenticação. Tente novamente.';
}
