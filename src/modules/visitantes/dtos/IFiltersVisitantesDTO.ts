import { TipoVisitante } from "../types/TipoVisitante";

export interface IFiltersVisitantesDTO {
  condominio_id: string;   // Obrigatório para isolamento
  search?: string;         // Nome ou CPF ou RG
  tipo?: TipoVisitante;    // Filtra por Visitante, Prestador, etc.
  tem_restricao?: boolean; // 🎯 O novo filtro de segurança
  page?: number;
  limit?: number;
}