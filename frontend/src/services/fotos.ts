import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  FirebaseStorage,
} from 'firebase/storage';

const MAX_TAMANHO = 5 * 1024 * 1024; // 5 MB

export class ErroFoto extends Error {}

/**
 * Envia uma imagem para imoveis/{imovelId}/{nomeArquivo} e retorna a URL pública.
 * O Storage garante que apenas admin/owner possa gravar (storage.rules).
 */
export async function enviarFoto(
  storage: FirebaseStorage,
  imovelId: string,
  arquivo: File
): Promise<string> {
  if (!arquivo.type.startsWith('image/')) {
    throw new ErroFoto('O arquivo precisa ser uma imagem.');
  }
  if (arquivo.size > MAX_TAMANHO) {
    throw new ErroFoto('A imagem não pode passar de 5 MB.');
  }

  const nome = `${Date.now()}_${arquivo.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const caminho = `imoveis/${imovelId}/${nome}`;
  const storageRef = ref(storage, caminho);

  await uploadBytes(storageRef, arquivo, {
    contentType: arquivo.type,
  });
  return getDownloadURL(storageRef);
}

export async function removerFoto(
  storage: FirebaseStorage,
  url: string
): Promise<void> {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (err) {
    console.warn('Não foi possível remover a foto do Storage:', err);
  }
}
