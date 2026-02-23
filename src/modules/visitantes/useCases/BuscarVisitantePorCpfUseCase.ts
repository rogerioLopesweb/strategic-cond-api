// src/modules/visitantes/useCases/BuscarVisitantePorCpfUseCase.ts

import { IVisitantesRepository } from "../repositories/IVisitantesRepository";
import { AppError } from "@shared/errors/AppError";

export class BuscarVisitantePorCpfUseCase {
  constructor(private visitantesRepository: IVisitantesRepository) {}

  async execute(cpf: string) {
    // 1. Limpa a formatação visual (pontos e traços) caso o frontend envie sujo
    const cpfLimpo = cpf.replace(/\D/g, "");

    if (cpfLimpo.length !== 11) {
      throw new AppError("CPF inválido.", 400);
    }

    // 2. Busca no banco de dados
    const visitante = await this.visitantesRepository.findByCpf(cpfLimpo);

    // 3. Se não encontrar, retorna nulo para o Controller lidar
    if (!visitante) {
      return null;
    }

    // 4. Se encontrar, formata os dados para o Frontend usar no auto-preenchimento
    return {
      id: visitante.id,
      nome_completo: visitante.props.nome_completo,
      cpf: visitante.props.cpf,
      rg: visitante.props.rg,
      foto_url: visitante.props.foto_url,
      tipo_padrao: visitante.props.tipo_padrao,
    };
  }
}
