export interface ICreateEntregaDTO {
  condominio_id: string;
  unidade_id: string;
  descricao: string;
  codigo_rastreio?: string;
  foto_pacote_url?: string;
  recebido_por: string;
}

export interface IRegistrarRetiradaDTO {
  entrega_id: string;
  morador_id: string;
  foto_assinatura_url?: string;
}

export interface IListEntregasFilters {
  condominio_id: string;
  unidade_id?: string;
  status?: "pendente" | "retirado";
  page: number;
  limit: number;
}
