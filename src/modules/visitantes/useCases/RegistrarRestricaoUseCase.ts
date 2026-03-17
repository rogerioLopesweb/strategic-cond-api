// Local: src/modules/visitantes/useCases/RegistrarRestricaoUseCase.ts
import { IVisitantesRepository } from "../repositories/IVisitantesRepository";
import { AppError } from "@shared/errors/AppError";

interface IRequest {
  visitante_id: string;
  condominio_id: string;
  operador_id: string;
  dados: {
    tipo_restricao: "administrativa" | "judicial" | "conflito";
    descricao: string;
    instrucao_portaria: string;
  };
}

export class RegistrarRestricaoUseCase {
  constructor(private visitantesRepository: IVisitantesRepository) {}

  async execute({ visitante_id, condominio_id, operador_id, dados }: IRequest) {
    // 🛡️ Regra de Negócio: Verificar se o visitante existe e pertence ao condomínio
    const visitante = await this.visitantesRepository.findById(visitante_id, condominio_id);
    if (!visitante) throw new AppError("Visitante não localizado.");

    await this.visitantesRepository.registrarRestricao({
      visitante_id,
      condominio_id,
      operador_cadastro_id: operador_id,
      ...dados,
    });

    return { success: true, message: "Restrição registrada com sucesso." };
  }
}