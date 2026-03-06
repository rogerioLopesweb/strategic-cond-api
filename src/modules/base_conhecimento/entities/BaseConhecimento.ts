export class BaseConhecimento {
  id!: string;
  condominio_id!: string;
  titulo!: string;
  categoria!: string;
  descricao!: string;
  id_user_cadastrou!: string;
  id_user_alterou?: string | null;

  // No Postgres, esses campos costumam vir como Date ou ISO String
  data_cadastro!: Date;
  data_alteracao!: Date;
  deletado_em?: Date | null; // ✅ Padronizado com o nome da coluna no banco

  constructor(props: Partial<BaseConhecimento>) {
    Object.assign(this, props);
    
    // 💡 Dica: Se o banco retornar string e você precisar de Date:
    if (typeof this.data_cadastro === 'string') this.data_cadastro = new Date(this.data_cadastro);
    if (typeof this.data_alteracao === 'string') this.data_alteracao = new Date(this.data_alteracao);
  }
}
