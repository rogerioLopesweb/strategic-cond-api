export interface ICreateCondominioDTO {
  nome_fantasia: string;
  razao_social?: string;
  cnpj?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  perfil: string;
  conta_id?: string;
}

export interface IUpdateCondominioDTO {
  nome_fantasia?: string;
  razao_social?: string;
  cnpj?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  ativo?: boolean;
}

export interface IListCondominioFilters {
  cidade?: string;
  estado?: string;
  nome_fantasia?: string;
  cnpj?: string;
  page: number;
  limit: number;
}
