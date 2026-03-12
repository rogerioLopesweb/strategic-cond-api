import { IVisitantesRepository } from "../repositories/IVisitantesRepository";

export class ConsultarPorCpfUseCase {
  constructor(private repository: IVisitantesRepository) {}

  async execute(cpf: string, condominioId: string) {
    const visitante = await this.repository.findByCpf(cpf);
    
    if (!visitante) return null;

    const restricao = await this.repository.verificarRestricao(String(visitante.id), condominioId);

    return {
      visitante: { id: visitante.id, ...visitante.props },
      restricao: restricao ? {
        bloqueado: true,
        tipo: restricao.tipo_restricao,
        mensagem: restricao.descricao,
        instrucao: restricao.instrucao_portaria
      } : null
    };
  }
}