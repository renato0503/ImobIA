import { collection, addDoc, Firestore } from 'firebase/firestore';

export interface Lead {
  nome: string;
  email: string;
  telefone?: string;
  criado_em: number;
}

const COLECAO = 'leads';

export async function salvarLead(
  db: Firestore,
  lead: Omit<Lead, 'criado_em'>
): Promise<void> {
  await addDoc(collection(db, COLECAO), {
    ...lead,
    criado_em: Date.now(),
  });
}
