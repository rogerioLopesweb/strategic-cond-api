export interface IEnviarMensagemDTO {
  mensagem: string;
  condominio_id: string;
  usuario_id: string;
  // ✅ Novos campos para dar contexto à IA
  nome_usuario?: string;
  perfil_usuario?: string;
}
