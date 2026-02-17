export interface ListUsuarioFilters {
  condominio_id: string;
  nome?: string;
  perfil?: string;
  bloco?: string;
  unidade?: string;
  page: number;
  limit: number;
}

export interface CreateUsuarioDTO {
  nome_completo: string;
  cpf: string;
  email: string;
  telefone: string;
  perfil: string;
  condominio_id: string;
  data_nascimento?: string;
  contato_emergencia?: string;
  foto_base64?: string;
  unidades?: Array<{
    identificador_bloco: string;
    numero: string;
    tipo_vinculo: string;
  }>;
}

export interface UpdateUsuarioDTO extends Partial<CreateUsuarioDTO> {
  usuario_id: string;
}

export interface DeleteUsuarioDTO {
  usuario_id: string;
}
