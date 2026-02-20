export type TipoVisitante = "visitante" | "prestador" | "corretor";

export class Visitante {
  public readonly id: string;

  public props: {
    nome_completo: string;
    cpf: string;
    rg?: string | null;
    foto_url?: string | null;
    tipo_padrao: TipoVisitante;
    empresa?: string | null;
    created_at: Date; // ✅ Retirei a interrogação aqui, pois no estado final ela sempre existe
  };

  // 🔄 CORREÇÃO AQUI NA ASSINATURA DO CONSTRUTOR:
  // Aceitamos "todas as props SEM created_at" E "created_at opcional"
  constructor(
    props: Omit<Visitante["props"], "created_at"> & { created_at?: Date },
    id?: string,
  ) {
    this.id = id || crypto.randomUUID();
    this.props = {
      ...props,
      // Se vier do banco (Repo), usa a data dele. Se for novo (UseCase), gera agora.
      created_at: props.created_at || new Date(),
    };
  }

  // Getters
  get nome() {
    return this.props.nome_completo;
  }
  get cpf() {
    return this.props.cpf;
  }
}
