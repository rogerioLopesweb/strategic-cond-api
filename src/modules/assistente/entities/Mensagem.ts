import crypto from "crypto";

export type RemetenteMensagem = "usuario" | "assistente";

export class Mensagem {
  public readonly id: string;

  public props: {
    condominio_id: string;
    usuario_id: string;
    remetente: RemetenteMensagem;
    texto: string;
    created_at: Date;
  };

  constructor(props: Omit<Mensagem["props"], "created_at">, id?: string) {
    this.id = id || crypto.randomUUID();
    this.props = {
      ...props,
      created_at: new Date(),
    };
  }
}
