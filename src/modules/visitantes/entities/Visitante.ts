import { TipoVisitante } from "../types/TipoVisitante";

export interface IVisitanteProps {
  // 🏢 Contexto Multi-tenant (Obrigatório)
  condominio_id: string; 

  nome_completo: string;
  cpf: string;
  rg?: string | null;
  foto_url?: string | null;
  tipo: TipoVisitante;
  empresa?: string | null;
  
  // 🛡️ Auditoria de Criação
  data_cadastro: Date;
  operador_cadastro_id: string;

  // 🛡️ Auditoria de Atualização
  data_atualizacao?: Date | null;
  operador_atualizacao_id?: string | null;
}

export class Visitante {
  public readonly id?: string;
  public props: IVisitanteProps;

  constructor(
    // ✅ Omitimos campos automáticos, mas condominio_id é OBRIGATÓRIO no nascimento
    props: Omit<IVisitanteProps, "data_cadastro" | "data_atualizacao" | "operador_atualizacao_id"> & { 
      data_cadastro?: Date;
      data_atualizacao?: Date | null;
      operador_atualizacao_id?: string | null;
    },
    id?: string,
  ) {
    this.id = id;
    this.props = {
      ...props,
      data_cadastro: props.data_cadastro || new Date(),
      data_atualizacao: props.data_atualizacao || null,
      operador_atualizacao_id: props.operador_atualizacao_id || null,
    };
  }

  /**
   * ✅ Regra de Negócio: Atualizar Dados do Perfil
   * Note que omitimos o 'condominio_id', pois ele nunca muda.
   */
  public atualizarDados(
    novosDados: Partial<Omit<IVisitanteProps, 
      "condominio_id" | "data_cadastro" | "operador_cadastro_id" | "data_atualizacao" | "operador_atualizacao_id"
    >>,
    operador_id: string
  ) {
    this.props = {
      ...this.props,
      ...novosDados,
      data_atualizacao: new Date(),
      operador_atualizacao_id: operador_id,
    };
  }

  // Getters para facilitar o acesso e manter o código limpo
  get condominioId() { return this.props.condominio_id; }
  get nome() { return this.props.nome_completo; }
  get cpf() { return this.props.cpf; }
  get tipo() { return this.props.tipo; }
  get empresa() { return this.props.empresa; }
  get foto() { return this.props.foto_url; }
}