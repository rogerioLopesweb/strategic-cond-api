import { Mensagem } from "../entities/Mensagem";
import { SessaoChat } from "../entities/SessaoChat";

export interface IAssistenteRepository {
  // ==========================================
  // 1. GERENCIAMENTO DA SESSÃO (A Sala)
  // ==========================================

  /**
   * Busca se o usuário já tem uma conversa rolando (Status: ATIVA)
   */
  buscarSessaoAtiva(
    usuario_id: string,
    condominio_id: string,
  ): Promise<SessaoChat | null>;

  /**
   * Cria uma nova sala de conversa no banco
   */
  criarSessao(sessao: SessaoChat): Promise<void>;

  /**
   * Atualiza a sessão (Útil para quando chamarmos o sessao.encerrarSessao())
   */
  atualizarSessao(sessao: SessaoChat): Promise<void>;

  // ==========================================
  // 2. GERENCIAMENTO DE MENSAGENS (O Histórico)
  // ==========================================

  /**
   * Salva a mensagem (seja a pergunta do usuário ou a resposta do Otto)
   */
  salvarMensagem(mensagem: Mensagem): Promise<void>;

  /**
   * Busca as mensagens de uma sessão específica, ordenadas da mais antiga para a mais nova.
   * O 'limite' serve para não mandar 500 mensagens para a IA e gastar tokens à toa.
   */
  buscarHistoricoPorSessao(
    sessao_id: string,
    limite?: number,
  ): Promise<Mensagem[]>;
}
