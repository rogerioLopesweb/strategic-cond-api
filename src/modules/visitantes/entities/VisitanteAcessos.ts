export type StatusAcesso = "aberta" | "finalizada" | "cancelada";

export interface IVisitanteAcessosProps {
  condominio_id: string;
  visitante_id: string;
  unidade_id?: string | null;
  autorizado_por_id?: string | null; // Morador que autorizou
  
  // 🛡️ Novos campos de Auditoria Operacional
  operador_entrada_id: string;       // Porteiro que fez o check-in
  operador_saida_id?: string | null; // Porteiro que fez o check-out
  
  data_entrada: Date;
  data_saida?: Date | null;
  placa_veiculo?: string | null;
  empresa_prestadora?: string | null;
  status: StatusAcesso;
  observacoes?: string | null;
}

export class VisitanteAcessos {
  public readonly id?: string;
  public props: IVisitanteAcessosProps;

  constructor(
    // Omitimos o que o sistema gera no ato da criação
    props: Omit<IVisitanteAcessosProps, "data_entrada" | "status" | "data_saida" | "operador_saida_id">,
    id?: string,
  ) {
    this.id = id;
    this.props = {
      ...props,
      status: "aberta",
      data_entrada: new Date(),
      operador_saida_id: null,
      data_saida: null
    };
  }

  // ✅ Regra de Negócio: Encerrar visita (Saída)
  // Agora pedimos o ID do operador que está registrando a saída
  public encerrar(operador_id: string) {
    if (this.props.status !== "aberta") {
      throw new Error("Esta visita já foi encerrada ou cancelada.");
    }
    
    this.props.operador_saida_id = operador_id;
    this.props.data_saida = new Date();
    this.props.status = "finalizada";
  }

  public cancelar() {
    this.props.status = "cancelada";
  }
}