export interface IRegistrarEntradaDataDTO {
  nome_completo: string;
  cpf: string;
  rg?: string;
  tipo_padrao: "visitante" | "prestador" | "corretor";
  unidade_id?: string;
  autorizado_por_id?: string;
  placa_veiculo?: string;
  empresa_prestadora?: string; // ✅ NOVO CAMPO ADICIONADO
  observacoes?: string;
  condominio_id: string;
}
