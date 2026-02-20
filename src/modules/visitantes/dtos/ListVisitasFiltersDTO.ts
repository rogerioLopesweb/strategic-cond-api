// Adicione esta interface no seu arquivo de DTOs ou no topo do repositório
export interface ListVisitasFiltersDTO {
  condominio_id: string;
  bloco?: string;
  unidade?: string;
  cpf?: string;
  status?: string;
  page?: number;
  limit?: number;
}
