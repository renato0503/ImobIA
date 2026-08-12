import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Firestore,
} from 'firebase/firestore';
import type { Imovel, Finalidade } from '../types';

export interface BuscaFiltros {
  finalidade?: Finalidade;
  tipo?: string;
  bairro?: string;
  valorMaximo?: number;
  caracteristicas: string[];
}

const COLEÇÃO = 'imoveis';

function construirQuery(db: Firestore, filtros: BuscaFiltros) {
  const condicoes: any[] = [];

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

  return query(
    collection(db, COLEÇÃO),
    ...condicoes,
    orderBy('criado_em', 'desc'),
    limit(100)
  );
}

function valorDoImovel(im: Imovel, finalidade: Finalidade | undefined): number | null {
  const f = finalidade ?? im.finalidade;
  if (f === 'venda') return im.valor_venda ?? null;
  if (f === 'aluguel') return im.valor_aluguel ?? null;
  return im.valor_venda ?? im.valor_aluguel ?? null;
}

export async function buscarImoveis(
  db: Firestore,
  filtros: BuscaFiltros
): Promise<Imovel[]> {
  const q = construirQuery(db, filtros);
  const snapshot = await getDocs(q);
  const imoveis: Imovel[] = [];

  snapshot.forEach((doc) => {
    const data = doc.data() as Omit<Imovel, 'id'>;

    const temTodasCaracteristicas = filtros.caracteristicas.every((c) =>
      (data.caracteristicas ?? []).some((x: string) =>
        x.toLowerCase().includes(c.toLowerCase())
      )
    );
    if (!temTodasCaracteristicas) return;

    if (filtros.valorMaximo !== undefined) {
      const valor = valorDoImovel(
        { ...data, id: doc.id },
        filtros.finalidade
      );
      if (valor !== null && valor > filtros.valorMaximo) return;
    }

    imoveis.push({ ...data, id: doc.id });
  });

  return imoveis;
}
