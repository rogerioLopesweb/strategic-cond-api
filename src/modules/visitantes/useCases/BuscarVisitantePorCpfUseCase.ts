import { IVisitantesRepository } from "../repositories/IVisitantesRepository";
import { AppError } from "@shared/errors/AppError";

export class BuscarVisitantePorCpfUseCase {
  constructor(private visitantesRepository: IVisitantesRepository) {}

  /**
   * Busca um visitante e verifica instantaneamente se há restrições de acesso.
   * @param cpf CPF digitado pelo porteiro.
   * @param condominioId ID do condomínio para verificar restrições específicas.
   */
  async execute(cpf: string, condominioId: string) {
    // 1. Limpa a formatação visual
    const cpfLimpo = cpf.replace(/\D/g, "");

    if (cpfLimpo.length !== 11) {
      throw new AppError("CPF inválido.", 400);
    }

    // 2. Busca o cadastro base do visitante
    const visitante = await this.visitantesRepository.findByCpf(cpfLimpo);

    // 3. Se não encontrar, o porteiro seguirá para um cadastro novo
    if (!visitante) {
      return null;
    }

    // 🎯 4. PENTE FINO: O Crivo de Segurança (Red Alert)
    // Buscamos se esse visitante específico possui restrições neste condomínio
    const restricao = await this.visitantesRepository.verificarRestricao(
      String(visitante.id),
      condominioId
    );

    // 5. Retorno estruturado para o Frontend decidir a cor do alerta
    return {
      visitante: {
        id: visitante.id,
        nome_completo: visitante.props.nome_completo,
        cpf: visitante.props.cpf,
        rg: visitante.props.rg,
        foto_url: visitante.props.foto_url,
        tipo_padrao: visitante.props.tipo_padrao,
        empresa: visitante.props.empresa
      },
      // Se houver restrição, o objeto vai preenchido, disparando o alerta no front
      restricao: restricao ? {
        bloqueado: true,
        tipo: restricao.tipo_restricao,
        mensagem: restricao.descricao,
        instrucao: restricao.instrucao_portaria
      } : null
    };
  }
}