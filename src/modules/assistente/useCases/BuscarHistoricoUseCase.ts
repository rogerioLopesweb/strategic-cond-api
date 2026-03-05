import { IAssistenteRepository } from "../repositories/IAssistenteRepository";

export class BuscarHistoricoUseCase {
  constructor(private assistenteRepository: IAssistenteRepository) {}

  async execute(usuario_id: string, condominio_id: string) {
    // 1. Busca se há uma sessão ativa para este usuário
    const sessao = await this.assistenteRepository.buscarSessaoAtiva(
      usuario_id,
      condominio_id,
    );

    // Se não tiver, devolve vazio para o Front começar uma tela limpa
    if (!sessao) {
      return { sessao_id: null, mensagens: [] };
    }

    // 2. Busca o histórico da sessão ativa (ex: últimas 50 mensagens para a tela)
    const historicoDb =
      await this.assistenteRepository.buscarHistoricoPorSessao(sessao.id, 50);

    // 3. Formata para o Front-end entender (remetente: 'usuario' ou 'otto')
    const mensagensFormatadas = historicoDb.map((msg) => ({
      id: msg.id,
      remetente: msg.props.role === "user" ? "usuario" : "otto",
      texto: msg.props.texto,
      data_hora: msg.props.created_at.toISOString(),
    }));

    return {
      sessao_id: sessao.id,
      mensagens: mensagensFormatadas,
    };
  }
}
