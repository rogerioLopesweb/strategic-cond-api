import { IVisitantesRepository } from "../repositories/IVisitantesRepository";
import { IFiltersVisitantesDTO } from "../dtos/IFiltersVisitantesDTO";
import { AppError } from "@shared/errors/AppError"; // ✅ Usando o padrão de erro do projeto

/**
 * ListarVisitantesUseCase: Orquestra a listagem da base mestra (CRM) de visitantes.
 * Responsável por validar o contexto multi-tenant e normalizar a paginação.
 */
export class ListarVisitantesUseCase {
  constructor(private repository: IVisitantesRepository) {}

  async execute(filters: IFiltersVisitantesDTO) {
    
    // 🛡️ 1. VALIDAÇÃO DE CONTEXTO (SEGURANÇA MULTI-TENANT)
    // Se o ID do condomínio não chegar aqui, o sistema barra a execução.
    if (!filters.condominio_id) {
      throw new AppError("O contexto do condomínio é obrigatório para esta listagem.", 400);
    }

    // 📏 2. NORMALIZAÇÃO DE PAGINAÇÃO
    // Evita valores negativos ou páginas inexistentes.
    const page = Math.max(1, filters.page || 1);
    
    // Proteção contra 'Overfetching': limita o máximo de registros por requisição.
    const limit = Math.min(50, filters.limit || 12); 
    
    // 🧹 3. SANITIZAÇÃO DE BUSCA
    // Remove espaços acidentais que podem causar falhas na busca textual.
    const search = filters.search?.trim() || "";

    // 🚀 4. EXECUÇÃO
    // Repassa os filtros limpos para o Repository.
    return await this.repository.listarVisitantes({
      ...filters,
      search,
      page,
      limit
    });
  }
}