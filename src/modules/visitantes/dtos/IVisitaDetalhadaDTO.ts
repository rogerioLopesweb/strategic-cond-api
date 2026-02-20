// DTO para a tela da Portaria (Já vem com nomes mastigados)
export interface IVisitaDetalhadaDTO {
  visita_id: string;
  data_entrada: Date;
  data_saida?: Date;
  placa_veiculo?: string;
  nome_visitante: string;
  foto_url?: string;
  tipo: string;
  bloco?: string;
  unidade?: string;
  autorizado_por?: string;
  status?: string;
}
