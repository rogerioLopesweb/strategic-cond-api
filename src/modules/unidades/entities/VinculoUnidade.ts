export type TipoVinculo = "proprietario" | "inquilino" | "dependente" | "outro";

export interface VinculoUnidadeProps {
  id?: string;
  usuario_id: string;
  unidade_id: string;
  condominio_id: string;
  tipo_vinculo: TipoVinculo;
  status: boolean;
  data_entrada: Date;
  data_saida?: Date | null;
}

export class VinculoUnidade {
  private props: VinculoUnidadeProps;

  constructor(props: VinculoUnidadeProps) {
    this.props = {
      ...props,
      status: props.status ?? true,
      data_entrada: props.data_entrada ?? new Date(),
    };
  }

  /**
   * Regra de Negócio: Ao desativar um vínculo, a data de saída DEVE ser registrada.
   */
  public desativar(): void {
    this.props.status = false;
    this.props.data_saida = new Date();
  }

  /**
   * Regra de Negócio: Ao reativar, limpamos a data de saída.
   */
  public reativar(): void {
    this.props.status = true;
    this.props.data_saida = null;
  }

  // Getters
  get usuario_id() {
    return this.props.usuario_id;
  }
  get unidade_id() {
    return this.props.unidade_id;
  }
  get status() {
    return this.props.status;
  }
  get data_saida() {
    return this.props.data_saida;
  }
}
