import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Firestore,
  QueryConstraint,
} from 'firebase/firestore';
import type { Imovel, Finalidade } from '../types';

export type Ordenacao = 'recentes' | 'menor-preco' | 'maior-preco';

export interface BuscaFiltros {
  finalidade?: Finalidade;
  tipo?: string;
  bairro?: string;
  valorMinimo?: number;
  valorMaximo?: number;
  caracteristicas: string[];
  ordenacao?: Ordenacao;
  limite?: number;
}

const COLEÇÃO = 'imoveis';
export const PAGINA_PADRAO = 50;

function valorDoImovel(im: Imovel, finalidade: Finalidade | undefined): number | null {
  const f = finalidade ?? im.finalidade;
  if (f === 'venda') return im.valor_venda ?? null;
  if (f === 'aluguel') return im.valor_aluguel ?? null;
  return im.valor_venda ?? im.valor_aluguel ?? null;
}

function construirQuery(db: Firestore, filtros: BuscaFiltros): QueryConstraint[] {
  const condicoes: QueryConstraint[] = [];

  // 'finalidade' é uma string: 'venda' | 'aluguel' | 'ambos'.
  // Busca de venda deve incluir também propriedades "ambos".
  if (filtros.finalidade && filtros.finalidade !== 'ambos') {
    if (filtros.finalidade === 'venda') {
      condicoes.push(where('finalidade', 'in', ['venda', 'ambos']));
    } else if (filtros.finalidade === 'aluguel') {
      condicoes.push(where('finalidade', 'in', ['aluguel', 'ambos']));
    }
  }

  if (filtros.tipo) {
    condicoes.push(where('tipo', '==', filtros.tipo));
  }

  if (filtros.bairro) {
    condicoes.push(where('bairro', '==', filtros.bairro));
  }

  // Uma única característica é usada na query via array-contains.
  // As demais são filtradas em memória para evitar índices compostos excessivos.
  const charFiltro = filtros.caracteristicas[0];
  if (charFiltro) {
    condicoes.push(
      where('caracteristicas', 'array-contains', charFiltro.toLowerCase())
    );
  }

  condicoes.push(orderBy('criado_em', 'desc'));
  condicoes.push(limit(filtros.limite ?? PAGINA_PADRAO));

  return condicoes;
}

/**
 * Busca imóveis aplicando os filtros. A query no Firestore usa apenas parte
 * dos filtros; o restante (múltiplas características, faixa de valor) é
 * resolvido em memória. A ordenação também é feita em memória para garantir
 * consistência entre critérios.
 */
export async function buscarImoveis(
  db: Firestore,
  filtros: BuscaFiltros
): Promise<Imovel[]> {
  const condicoes = construirQuery(db, filtros);
  const snapshot = await getDocs(query(collection(db, COLEÇÃO), ...condicoes));
  const imoveis: Imovel[] = [];

  snapshot.forEach((doc) => {
    const data = doc.data() as Omit<Imovel, 'id'>;

    const temTodasCaracteristicas = filtros.caracteristicas.every((c) =>
      (data.caracteristicas ?? []).some((x: string) =>
        x.toLowerCase().includes(c.toLowerCase())
      )
    );
    if (!temTodasCaracteristicas) return;

    const valor = valorDoImovel({ ...data, id: doc.id }, filtros.finalidade);

    if (filtros.valorMinimo !== undefined && valor !== null && valor < filtros.valorMinimo) {
      return;
    }
    if (filtros.valorMaximo !== undefined && valor !== null && valor > filtros.valorMaximo) {
      return;
    }

    imoveis.push({ ...data, id: doc.id, valor_efetivo: valor });
  });

  return ordenar(imoveis, filtros.ordenacao);
}

export function ordenar(
  imoveis: Imovel[],
  ordenacao?: Ordenacao
): Imovel[] {
  if (ordenacao === 'menor-preco') {
    return [...imoveis].sort(
      (a, b) =>
        (a.valor_efetivo ?? Number.MAX_VALUE) - (b.valor_efetivo ?? Number.MAX_VALUE)
    );
  }
  if (ordenacao === 'maior-preco') {
    return [...imoveis].sort(
      (a, b) =>
        (b.valor_efetivo ?? -1) - (a.valor_efetivo ?? -1)
    );
  }
  return [...imoveis].sort((a, b) => (b.criado_em ?? 0) - (a.criado_em ?? 0));
}

/**
 * Lista bairros distintos presentes no acervo (para autocomplete).
 * Busca os documentos mais recentes e deduplica os bairros em memória.
 */
export async function listarBairros(db: Firestore, maxDocs = 200): Promise<string[]> {
  const condicoes: QueryConstraint[] = [orderBy('criado_em', 'desc'), limit(maxDocs)];
  const snapshot = await getDocs(query(collection(db, COLEÇÃO), ...condicoes));
  const bairros = new Set<string>();

  snapshot.forEach((doc) => {
    const bairro = (doc.data() as Partial<Imovel>).bairro;
    if (bairro) bairros.add(bairro);
  });

  return Array.from(bairros).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}
