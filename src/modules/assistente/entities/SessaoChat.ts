import crypto from "crypto";

export type StatusSessao = "ATIVA" | "ENCERRADA";

// 👇 Tipo auxiliar para o construtor: Datas e Status são opcionais na criação
type SessaoChatConstructorProps = {
  condominio_id: string;
  usuario_id: string;
  status?: StatusSessao;
  created_at?: Date;
  updated_at?: Date;
};

export class SessaoChat {
  public readonly id: string;

  public props: {
    condominio_id: string;
    usuario_id: string;
    status: StatusSessao;
    created_at: Date;
    updated_at: Date;
  };

  // 👇 Agora o construtor aceita receber as datas antigas do banco de dados
  constructor(props: SessaoChatConstructorProps, id?: string) {
    this.id = id || crypto.randomUUID();
    this.props = {
      condominio_id: props.condominio_id,
      usuario_id: props.usuario_id,
      status: props.status || "ATIVA",
      created_at: props.created_at || new Date(),
      updated_at: props.updated_at || new Date(),
    };
  }

  public encerrarSessao(): void {
    this.props.status = "ENCERRADA";
    this.props.updated_at = new Date();
  }
}
