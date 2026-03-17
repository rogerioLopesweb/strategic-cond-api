import { IVisitantesRepository } from "../repositories/IVisitantesRepository";
import { AppError } from "@shared/errors/AppError";

interface IRequest {
  id: string;
  condominio_id: string; // ✅ Agora faz parte do contrato principal
  operador_id: string;   // ✅ Auditoria (Quem deletou?)
}

export class ExcluirVisitanteUseCase {
  constructor(private repository: IVisitantesRepository) {}

  /**
   * Orquestra a remoção segura de um visitante da base operacional.
   */
  async execute({ id, condominio_id, operador_id }: IRequest): Promise<void> {
    
    // 🛡️ 1. Validação de Parâmetros Básicos
    if (!id || !condominio_id || !operador_id) {
      throw new AppError("Parâmetros insuficientes para realizar a exclusão.", 400);
    }

    // 🛡️ 2. Validação de Existência e Contexto (Anti-IDOR)
    // Buscamos o visitante GARANTINDO que ele pertença ao condomínio do operador.
    const visitante = await this.repository.findById(id, condominio_id);

    if (!visitante) {
      // Se o ID existe mas é de outro prédio, retornamos 404 para não vazar informação.
      throw new AppError("Visitante não encontrado ou você não tem permissão para esta ação.", 404);
    }

    // 🛡️ 3. Exclusão Lógica Auditada (Soft Delete)
    // Passamos o trio de segurança: O ALVO (id), o CONTEXTO (condo) e o RESPONSÁVEL (operador).
    await this.repository.delete(id, operador_id, condominio_id);
    
    // Nota: O Soft Delete mantém a integridade dos logs de portaria (visitante_acessos),
    // permitindo que o histórico antigo ainda exiba o nome do visitante, mas ele 
    // não aparecerá mais em novas buscas ou na listagem do CRM.
  }
}