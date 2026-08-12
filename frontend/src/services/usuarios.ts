import { doc, getDoc, Firestore } from 'firebase/firestore';
import { auth } from '../firebase';

export type Papel = 'admin' | 'owner' | 'leitor';

export const OWNER_UID = 'ef6Nu3M7FMRjaSmmTSvGlfOOiQI3';

/**
 * Verifica se o usuário autenticado é admin/owner.
 * Owner raiz (bootstrap) é admin por definição; demais usuários dependem do
 * documento em usuarios/{uid}.role.
 */
export async function ehAdmin(db: Firestore): Promise<boolean> {
  const uid = auth.currentUser?.uid;
  if (!uid) return false;

  if (uid === OWNER_UID) return true;

  try {
    const snap = await getDoc(doc(db, 'usuarios', uid));
    const role = snap.exists() ? (snap.data() as { role?: Papel }).role : undefined;
    return role === 'admin' || role === 'owner';
  } catch (err) {
    console.warn('Não foi possível verificar papel:', err);
    return false;
  }
}
