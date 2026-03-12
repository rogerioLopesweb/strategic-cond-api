export interface ISendMailDTO {
  to: string;
  subject: string;
  body: string;
  from?: string;
  attachments?: any[];
  
  /** * ✅ Atualizado: Agora aceita 'visita'
   */
  template?: 'default' | 'entrega' | 'visita'; 
  
  /** IDs para os templates específicos */
  id_entrega?: string; 
  visita_id?: string;
}

export interface IMailProvider {
  sendMail(data: ISendMailDTO): Promise<void>;
}