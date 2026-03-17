import { IVisitantesRepository } from "../repositories/IVisitantesRepository";
import { IFiltersListVisitanteAcessosDTO } from "../dtos/IFiltersListVisitanteAcessosDTO";
import { AppError } from "@shared/errors/AppError";

/**
 * ListarVisitanteAcessosUseCase: Orquestra a recuperação da Timeline de acessos.
 * Aplica regras de visibilidade baseadas no perfil (Morador vs Portaria).
 */
export class ListarVisitanteAcessosUseCase {
  constructor(private visitantesRepository: IVisitantesRepository) {}

  /**
   * Executa a listagem aplicando travas de contexto e segurança Multi-tenant.
   */
  async execute(filters: IFiltersListVisitanteAcessosDTO) {
    
    // 🛡️ 1. Validação de Contexto Obrigatório
    if (!filters.condominio_id) {
      throw new AppError("O contexto do condomínio é obrigatório para listar acessos.", 400);
    }

    // 🛡️ 2. Validação de Perfil
    // Se for morador, o usuario_id é obrigatório para filtrar apenas os seus convidados
    if (filters.perfil === "morador" && !filters.usuario_id) {
      throw new AppError("Usuário não identificado para este perfil de acesso.", 401);
    }

    // 📏 3. Normalização de Paginação (Prevenção de sobrecarga no banco)
    const normalizedFilters: IFiltersListVisitanteAcessosDTO = {
      ...filters,
      page: Math.max(1, filters.page || 1),
      limit: Math.min(50, filters.limit || 12),
      // Limpeza de CPF para busca exata
      cpf: filters.cpf ? filters.cpf.replace(/\D/g, "") : undefined,
    };

    // 🚀 4. Chamada ao Repositório
    // O Repositório já contém a lógica SQL que usa o filters.perfil 
    // para decidir se faz o filtro por 'autorizado_por_usuario_id'.
    const resultado = await this.visitantesRepository.listarAcessos(normalizedFilters);

    return resultado;
  }
}