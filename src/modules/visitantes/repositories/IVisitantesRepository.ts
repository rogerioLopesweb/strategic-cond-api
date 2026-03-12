import { Visitante } from "../entities/Visitante";
import { Visita } from "../entities/Visita";
import { IVisitaDetalhadaDTO } from "../dtos/IVisitaDetalhadaDTO";
import { IVisitasPaginadasDTO } from "../dtos/IVisitasPaginadasDTO";
import { ListVisitasFiltersDTO } from "../dtos/ListVisitasFiltersDTO";

export { IVisitaDetalhadaDTO };

export interface IVisitantesRepository {
  // --- 👤 Gestão de Pessoas (Cadastro Fixo) ---
  findByCpf(cpf: string): Promise<Visitante | null>;
  findById(id: string): Promise<Visitante | null>; // Para o Modal de Detalhes
  createVisitante(visitante: Visitante): Promise<Visitante>;
  updateVisitante(visitante: Visitante): Promise<void>;
  
  /** Lista paginada apenas das pessoas (Unique Visitors) */
  listarVisitantes(filters: any): Promise<{ data: Visitante[], total: number }>;

  // --- 🚫 Gestão de Restrições ---
  verificarRestricao(visitanteId: string, condominioId: string): Promise<any | null>;
  registrarRestricao(dados: any): Promise<void>;
  removerRestricao(visitanteId: string, condominioId: string): Promise<void>;

  // --- 🚪 Gestão de Acessos (Histórico) ---
  registrarEntrada(visita: Visita, operadorId: string): Promise<Visita>;
  registrarSaida(visitaId: string, dataSaida: Date, operadorId: string): Promise<void>;
  
  /** Busca todas as vezes que este ID específico entrou no condomínio */
  listarHistoricoPorVisitante(visitanteId: string, condominioId: string): Promise<any[]>;
  
  listar(filters: ListVisitasFiltersDTO, usuarioId?: string, perfil?: string): Promise<IVisitasPaginadasDTO>;
}