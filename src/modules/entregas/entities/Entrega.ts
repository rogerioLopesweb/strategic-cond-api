export type EntregaStatus = "recebido" | "entregue" | "cancelada";

export interface EntregaProps {
  id?: string;
  condominio_id: string;
  operador_entrada_id: string;
  unidade: string;
  bloco: string;
  marketplace: string;
  codigo_rastreio?: string;
  morador_id?: string;
  observacoes?: string;
  status: EntregaStatus;
  data_recebimento: Date;
  url_foto_etiqueta?: string;
  retirada_urgente: boolean;
  tipo_embalagem: string;

  // 🚚 Campos de Saída (Finalização)
  data_entrega?: Date;
  operador_saida_id?: string;
  quem_retirou?: string;
  documento_retirou?: string;

  // 🚫 Campos de Cancelamento (Específicos)
  motivo_cancelamento?: string;
  data_cancelamento?: Date;
  operador_cancelamento_id?: string; // 🔥 Adicionado conforme sua tabela

  // ✨ Campos de Auditoria Geral (Qualquer alteração)
  operador_atualizacao_id?: string;
  data_atualizacao?: Date;
}

export class Entrega {
  public readonly props: EntregaProps;

  constructor(props: EntregaProps) {
    this.props = {
      ...props,
      status: props.status ?? "recebido",
      data_recebimento: props.data_recebimento ?? new Date(),
      retirada_urgente: props.retirada_urgente ?? false,
      tipo_embalagem: props.tipo_embalagem ?? "Pacote",
    };
  }

  /**
   * 📝 Registra quem foi o último operador a mexer no registro (Audit Geral)
   */
  private registrarAuditoria(operadorId: string) {
    this.props.operador_atualizacao_id = operadorId;
    this.props.data_atualizacao = new Date();
  }

  /**
   * 🚀 Finaliza a entrega para o morador
   */
  public finalizarSaida(
    operadorId: string,
    quemRetirou: string,
    documento: string,
  ) {
    if (this.props.status !== "recebido") {
      throw new Error("Entrega não disponível para saída.");
    }

    this.props.status = "entregue";
    this.props.data_entrega = new Date();
    this.props.operador_saida_id = operadorId;
    this.props.quem_retirou = quemRetirou;
    this.props.documento_retirou = documento;

    this.registrarAuditoria(operadorId);
  }

  /**
   * 🛑 Cancela a entrega e registra os dados de cancelamento
   */
  public cancelar(operadorId: string, motivo: string) {
    if (this.props.status !== "recebido") {
      throw new Error("Apenas entregas 'recebidas' podem ser canceladas.");
    }

    this.props.status = "cancelada";
    this.props.motivo_cancelamento = motivo;

    // 🔥 Campos específicos de cancelamento conforme seu banco
    this.props.data_cancelamento = new Date();
    this.props.operador_cancelamento_id = operadorId;

    // Também atualizamos a auditoria geral
    this.registrarAuditoria(operadorId);
  }

  /**
   * 🔄 Atualização de dados gerais (correção de marketplace, rastreio, etc)
   */
  public atualizarDados(operadorId: string, novosDados: Partial<EntregaProps>) {
    Object.assign(this.props, novosDados);
    this.registrarAuditoria(operadorId);
  }
}
