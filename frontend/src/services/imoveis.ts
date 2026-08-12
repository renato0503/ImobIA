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

  // Múltiplas características: usamos os campos booleanos tem_<slug> gravados
  // pelo backend (estrutura.py). Isso permite filtragem nativa com vários
  // `where(..., '==', true)` + índice composto (declarado no firestore.indexes.json).
  for (const c of filtros.caracteristicas) {
    const slug = slugDeCaracteristica(c);
    if (slug) {
      condicoes.push(where(`tem_${slug}`, '==', true));
    }
  }

  condicoes.push(orderBy('criado_em', 'desc'));
  condicoes.push(limit(filtros.limite ?? PAGINA_PADRAO));

  return condicoes;
}

export function slugDeCaracteristica(caracteristica: string): string {
  return caracteristica
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .join('_');
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
  try {
    const condicoes = construirQuery(db, filtros);
    const snapshot = await getDocs(query(collection(db, COLEÇÃO), ...condicoes));
    const imoveis: Imovel[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data() as Omit<Imovel, 'id'>;
      imoveis.push({ ...data, id: doc.id });
    });

    return filtrarEmMemoria(imoveis, filtros);
  } catch (err) {
    // Fallback: se a query com tem_* falhar (ex: imóveis antigos sem os campos
    // booleanos, ou índice não criado), fazemos a query por array-contains na
    // 1ª característica e filtramos o restante em memória.
    console.warn('Query nativa falhou, usando fallback:', err);
    const charFiltro = filtros.caracteristicas[0];
    const condicoesFallback: QueryConstraint[] = [];
    if (filtros.finalidade && filtros.finalidade !== 'ambos') {
      condicoesFallback.push(
        where(
          'finalidade',
          'in',
          filtros.finalidade === 'venda' ? ['venda', 'ambos'] : ['aluguel', 'ambos']
        )
      );
    }
    if (filtros.tipo) condicoesFallback.push(where('tipo', '==', filtros.tipo));
    if (filtros.bairro) condicoesFallback.push(where('bairro', '==', filtros.bairro));
    if (charFiltro) {
      condicoesFallback.push(
        where('caracteristicas', 'array-contains', charFiltro.toLowerCase())
      );
    }
    condicoesFallback.push(orderBy('criado_em', 'desc'));
    condicoesFallback.push(limit(filtros.limite ?? PAGINA_PADRAO));

    const snapshot = await getDocs(query(collection(db, COLEÇÃO), ...condicoesFallback));
    const imoveis: Imovel[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data() as Omit<Imovel, 'id'>;
      imoveis.push({ ...data, id: doc.id });
    });

    return filtrarEmMemoria(imoveis, filtros);
  }
}

function filtrarEmMemoria(imoveis: Imovel[], filtros: BuscaFiltros): Imovel[] {
  const resultado: Imovel[] = [];

  for (const imovel of imoveis) {
    const temTodasCaracteristicas = filtros.caracteristicas.every((c) =>
      (imovel.caracteristicas ?? []).some((x: string) =>
        x.toLowerCase().includes(c.toLowerCase())
      )
    );
    if (!temTodasCaracteristicas) continue;

    const valor = valorDoImovel(imovel, filtros.finalidade);

    if (filtros.valorMinimo !== undefined && valor !== null && valor < filtros.valorMinimo) {
      continue;
    }
    if (filtros.valorMaximo !== undefined && valor !== null && valor > filtros.valorMaximo) {
      continue;
    }

    resultado.push({ ...imovel, valor_efetivo: valor });
  }

  return ordenar(resultado, filtros.ordenacao);
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
