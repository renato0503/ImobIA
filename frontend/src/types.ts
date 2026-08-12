export type Finalidade = 'venda' | 'aluguel' | 'ambos';

export interface Imovel {
  id?: string;
  tipo: string;
  finalidade: Finalidade;
  bairro: string;
  cidade?: string;
  valor_venda?: number | null;
  valor_aluguel?: number | null;
  caracteristicas: string[];
  contato_nome?: string | null;
  contato_telefone?: string | null;
  fotos?: string[];
  descricao?: string;
  criado_em?: number;
  valor_efetivo?: number | null;
}
