import { TipoVisitante } from "../types/TipoVisitante";

export interface IUpdateVisitanteDTO {
  id: string;             // UUID do visitante (obrigatório para o WHERE do SQL)
  nome_completo: string;
  cpf: string;            // Útil para validação, mesmo que não mude com frequência
  rg?: string;
  foto_base64?: string;   // Se vier preenchido, o UseCase processa o novo upload
  tipo: TipoVisitante;
  empresa?: string;
  operador_id: string; 
  condominio_id: string;
}