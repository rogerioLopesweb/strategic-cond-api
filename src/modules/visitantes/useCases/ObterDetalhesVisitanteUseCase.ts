import { IVisitantesRepository } from "../repositories/IVisitantesRepository";
import { AppError } from "@shared/errors/AppError";

export class ObterDetalhesVisitanteUseCase {
  constructor(private repository: IVisitantesRepository) {}

  async execute(visitanteId: string, condominioId: string) {
    // 1. Busca os dados do cadastro fixo
    const visitante = await this.repository.findById(visitanteId);
    if (!visitante) throw new AppError("Visitante não encontrado.", 404);

    // 2. Busca o histórico de acessos (Timeline)
    const historico = await this.repository.listarHistoricoPorVisitante(visitanteId, condominioId);

    // 3. Busca se existe uma restrição ativa
    const restricao = await this.repository.verificarRestricao(visitanteId, condominioId);

    return {
      visitante: {
        id: visitante.id,
        ...visitante.props
      },
      historico, // Array das últimas visitas
      restricao: restricao || null, // Se null, o botão no modal será "Registrar Restrição"
      bloqueado: !!restricao
    };
  }
}