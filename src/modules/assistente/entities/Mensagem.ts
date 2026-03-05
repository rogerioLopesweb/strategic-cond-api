import crypto from "crypto";

export type RoleMensagem = "user" | "assistant" | "system" | "tool";

// 👇 Tipo auxiliar para o construtor
type MensagemConstructorProps = {
  sessao_id: string;
  role: RoleMensagem;
  texto: string;
  tokens_usados?: number;
  created_at?: Date;
};

export class Mensagem {
  public readonly id: string;

  public props: {
    sessao_id: string;
    role: RoleMensagem;
    texto: string;
    tokens_usados: number;
    created_at: Date;
  };

  // 👇 Aceita a data original vinda do banco de dados
  constructor(props: MensagemConstructorProps, id?: string) {
    this.id = id || crypto.randomUUID();
    this.props = {
      sessao_id: props.sessao_id,
      role: props.role,
      texto: props.texto,
      tokens_usados: props.tokens_usados || 0,
      created_at: props.created_at || new Date(),
    };
  }
}
