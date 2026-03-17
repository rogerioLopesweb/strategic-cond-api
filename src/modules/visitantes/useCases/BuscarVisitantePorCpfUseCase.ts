import { IVisitantesRepository } from "../repositories/IVisitantesRepository";
import { AppError } from "@shared/errors/AppError";

export class BuscarVisitantePorCpfUseCase {
  constructor(private visitantesRepository: IVisitantesRepository) {}

  async execute(cpf: string, condominioId: string) {
    const cpfLimpo = cpf.replace(/\D/g, "");

    if (cpfLimpo.length !== 11) {
      throw new AppError("CPF inválido. Certifique-se de digitar os 11 números.", 400);
    }

    // 🛡️ Agora buscamos o CPF fechado no contexto do condomínio
    const visitante = await this.visitantesRepository.findByCpf(cpfLimpo, condominioId);

    if (!visitante) return null;

    // 🛡️ Verifica se o "dono" do CPF tem bronca no condomínio atual
    const restricaoAtiva = await this.visitantesRepository.verificarRestricaoAtiva(
      String(visitante.id),
      condominioId
    );

    return {
      visitante: {
        id: visitante.id,
        nome_completo: visitante.nome,
        cpf: visitante.cpf,
        rg: visitante.props.rg,
        foto_url: visitante.props.foto_url,
        tipo: visitante.tipo,
        empresa: visitante.empresa
      },
      restricao: restricaoAtiva ? {
        bloqueado: true,
        tipo: restricaoAtiva.tipo_restricao,
        mensagem: restricaoAtiva.descricao,
        instrucao: restricaoAtiva.instrucao_portaria,
        data_cadastro: restricaoAtiva.data_cadastro
      } : null
    };
  }
}