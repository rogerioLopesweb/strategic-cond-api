export interface IListBaseConhecimentoFilters {
  page?: number;
  limit?: number;
  categoria?: string;
  busca?: string; // Para buscar por título ou descrição no app
}
