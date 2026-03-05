export type StatusVisita = "aberta" | "finalizada" | "cancelada";

export interface IVisitaProps {
  condominio_id: string;
  visitante_id: string;
  unidade_id?: string | null;
  autorizado_por_id?: string | null;
  data_entrada: Date;
  data_saida?: Date | null;
  placa_veiculo?: string | null;
  empresa_prestadora?: string | null; // ✅ Campo mantido
  status: StatusVisita;
  observacoes?: string | null;
}

export class Visita {
  // 🆔 O ID agora é opcional na classe, pois o Postgres o gera via SERIAL ou UUID default
  public readonly id?: string;
  public props: IVisitaProps;

  constructor(
    // 1. Recebemos as props omitindo o que o sistema gera sozinho na criação
    props: Omit<IVisitaProps, "data_entrada" | "status">,
    id?: string,
  ) {
    this.id = id; // Só terá valor se vier do banco de dados
    this.props = {
      ...props,
      // Se tiver ID (veio do DB), respeitamos o status/data que vier. 
      // Se não tiver ID (novo), definimos os padrões:
      status: (props as IVisitaProps).status || "aberta",
      data_entrada: (props as IVisitaProps).data_entrada || new Date(),
    };
  }

  // ✅ Regra de Negócio: Encerrar visita (Saída)
  public encerrar() {
    if (this.props.status !== "aberta") {
      throw new Error("Esta visita já foi encerrada ou cancelada.");
    }
    this.props.data_saida = new Date();
    this.props.status = "finalizada";
  }

  // ✅ Regra de Negócio: Cancelar entrada
  public cancelar() {
    this.props.status = "cancelada";
  }
}