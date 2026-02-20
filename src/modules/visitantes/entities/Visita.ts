export type StatusVisita = "aberta" | "finalizada" | "cancelada";

export class Visita {
  public readonly id: string;

  public props: {
    condominio_id: string;
    visitante_id: string;
    unidade_id?: string | null; // Pode ser nulo se for na administração
    autorizado_por_id?: string | null; // Quem liberou?

    data_entrada: Date;
    data_saida?: Date | null;

    placa_veiculo?: string | null;
    status: StatusVisita;
    observacoes?: string | null;
  };

  constructor(
    props: Omit<Visita["props"], "data_entrada" | "status">,
    id?: string,
  ) {
    this.id = id || crypto.randomUUID();
    this.props = {
      ...props,
      status: "aberta",
      data_entrada: new Date(), // Entrou agora
    };
  }

  // ✅ Regra de Negócio: Encerrar visita
  encerrar() {
    if (this.props.status !== "aberta") {
      throw new Error("Esta visita já foi encerrada ou cancelada.");
    }
    this.props.data_saida = new Date();
    this.props.status = "finalizada";
  }
}
