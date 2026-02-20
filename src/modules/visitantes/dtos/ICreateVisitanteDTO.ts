// DTOs para entrada de dados
export interface ICreateVisitanteDTO {
  nome_completo: string;
  cpf: string;
  rg?: string;
  foto_url?: string;
  tipo: "visitante" | "prestador";
}
