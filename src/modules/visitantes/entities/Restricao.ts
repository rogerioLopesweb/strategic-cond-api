// src/modules/visitantes/entities/Restricao.ts
export class Restricao {
    id?: string;
    visitante_id: string;
    condominio_id: string;
    tipo_restricao: 'judicial' | 'administrativa' | 'conflito';
    descricao: string;
    instrucao_portaria: string;
    ativo: boolean;
    delete: boolean;
  
    // Auditoria
    data_cadastro: Date;
    operador_cadastro_id: string;
    
    data_atualizacao?: Date;
    operador_atualizacao_id?: string;
    
    data_cancelamento?: Date;
    operador_cancelamento_id?: string;
  
    constructor(props: Omit<Restricao, 'id' | 'data_cadastro'>, id?: string) {
      Object.assign(this, props);
      this.id = id;
      if (!this.data_cadastro) this.data_cadastro = new Date();
      if (this.ativo === undefined) this.ativo = true;
      if (this.delete === undefined) this.delete = false;
    }
  }