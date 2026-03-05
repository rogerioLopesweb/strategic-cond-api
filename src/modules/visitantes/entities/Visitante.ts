export type TipoVisitante = "visitante" | "prestador" | "corretor";

export interface IVisitanteProps {
  nome_completo: string;
  cpf: string;
  rg?: string | null;
  foto_url?: string | null;
  tipo_padrao: TipoVisitante;
  empresa?: string | null; // ✅ Adicionado para suportar prestadores/corretores
  created_at: Date;
}

export class Visitante {
  // 🆔 O ID agora é opcional e readonly.
  // Ele só terá valor quando vier do banco de dados (via Repositório).
  public readonly id?: string;
  public props: IVisitanteProps;

  constructor(
    // Aceitamos as props sem o 'created_at', mas permitimos que ele seja passado (visto que vem do DB)
    props: Omit<IVisitanteProps, "created_at"> & { created_at?: Date },
    id?: string,
  ) {
    this.id = id;
    this.props = {
      ...props,
      // Se created_at não for informado (objeto novo), geramos o Date atual.
      created_at: props.created_at || new Date(),
    };
  }

  // Getters para facilitar o acesso (Encapsulamento)
  get nome() {
    return this.props.nome_completo;
  }

  get cpf() {
    return this.props.cpf;
  }

  get tipo() {
    return this.props.tipo_padrao;
  }

  // ✅ Getter adicionado para facilitar o uso no UseCase/Service
  get empresa() {
    return this.props.empresa;
  }
}
