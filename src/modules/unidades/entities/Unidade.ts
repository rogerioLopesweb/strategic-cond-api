export interface UnidadeProps {
  id?: string;
  condominio_id: string;
  bloco: string;
  numero_unidade: string;
  created_at?: Date;
}

export class Unidade {
  private props: UnidadeProps;

  constructor(props: UnidadeProps) {
    // Regra de Negócio: Bloco e Número sempre em caixa alta para padronizar busca
    this.props = {
      ...props,
      bloco: props.bloco.toUpperCase().trim(),
      numero_unidade: props.numero_unidade.trim(),
    };
  }

  get id() {
    return this.props.id;
  }
  get condominio_id() {
    return this.props.condominio_id;
  }
  get bloco() {
    return this.props.bloco;
  }
  get numero_unidade() {
    return this.props.numero_unidade;
  }
}
