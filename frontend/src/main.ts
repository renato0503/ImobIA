import './style.css';
import './firebase';
import { auth } from './firebase';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { renderApp, setAutenticado } from './ui';

onAuthStateChanged(auth, (usuario) => {
  setAutenticado(!!usuario);
  renderApp();
});

const provider = new GoogleAuthProvider();

export async function entrarGoogle() {
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    console.error('Falha ao autenticar:', err);
  }
  renderApp();
}

export async function sairGoogle() {
  await signOut(auth);
  renderApp();
}
