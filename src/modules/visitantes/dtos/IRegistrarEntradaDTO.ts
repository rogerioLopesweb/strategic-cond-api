export interface IRegistrarEntradaDTO {
  visitante_id: string;
  condominio_id: string;
  unidade_id?: string;
  autorizado_por_id: string;
  placa_veiculo?: string;
  observacoes?: string;
}
