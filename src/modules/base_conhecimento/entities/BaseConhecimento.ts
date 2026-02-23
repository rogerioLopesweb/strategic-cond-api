export class BaseConhecimento {
  id!: string;
  condominio_id!: string;

  titulo!: string;
  categoria!: string;
  descricao!: string;

  id_user_cadastrou!: string;
  id_user_alterou?: string | null;

  data_cadastro!: Date;
  data_alteracao!: Date;
  deletado_em?: Date | null;

  /**
   * O construtor recebe um Partial da própria classe (ou a linha crua do banco de dados)
   * e faz o "bind" (associação) automático das propriedades.
   */
  constructor(props: Partial<BaseConhecimento>) {
    Object.assign(this, props);
  }
}
