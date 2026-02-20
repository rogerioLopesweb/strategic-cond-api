import { Visitante } from "../entities/Visitante";
import { Visita } from "../entities/Visita";
import { IVisitaDetalhadaDTO } from "../dtos/IVisitaDetalhadaDTO";
import { IVisitasPaginadasDTO } from "../dtos/IVisitasPaginadasDTO";
import { ListVisitasFiltersDTO } from "../dtos/ListVisitasFiltersDTO";
export { IVisitaDetalhadaDTO };

export interface IVisitantesRepository {
  // --- Métodos de Pessoas (Visitantes) ---
  findByCpf(cpf: string): Promise<Visitante | null>;
  createVisitante(visitante: Visitante): Promise<void>;
  updateVisitante(visitante: Visitante): Promise<void>;

  // --- Métodos de Acesso (Visitas) ---
  registrarEntrada(visita: Visita): Promise<void>;
  registrarSaida(visitaId: string, dataSaida: Date): Promise<void>;

  // --- Método de Listagem com Filtros e Paginação ---
  listar(
    filters: ListVisitasFiltersDTO,
    usuarioId?: string,
    perfil?: string,
  ): Promise<IVisitasPaginadasDTO>;
}
