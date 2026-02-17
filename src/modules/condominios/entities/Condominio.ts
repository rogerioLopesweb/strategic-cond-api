export interface CondominioProps {
  id?: string;
  nome_fantasia: string;
  razao_social?: string;
  cnpj?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  ativo?: boolean;
  conta_id: string;
}

export class Condominio {
  public readonly props: CondominioProps;

  constructor(props: CondominioProps) {
    // Aqui você poderia colocar regras globais, ex: converter nome para CAIXA ALTA
    this.props = {
      ...props,
      ativo: props.ativo ?? true, // Default ativo como true
    };
  }

  // Getters para facilitar o acesso
  get id() {
    return this.props.id;
  }
  get nome_fantasia() {
    return this.props.nome_fantasia;
  }
  get conta_id() {
    return this.props.conta_id;
  }
}
