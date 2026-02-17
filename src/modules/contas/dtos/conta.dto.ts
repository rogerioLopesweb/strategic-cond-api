/**
 * Dados necessários para a criação de uma nova "Casca PJ"
 */
export interface CreateContaDTO {
  razao_social: string;
  email_financeiro?: string | null;
}

/**
 * Dados permitidos para atualização fiscal e financeira
 */
export interface UpdateContaDTO {
  cnpj?: string;
  razao_social?: string;
  email_financeiro?: string;
  status_conta?: "ativa" | "suspensa" | "aguardando_configuracao";
}

/**
 * Estrutura padrão de retorno para evitar exposição de dados sensíveis
 */
export interface ContaResponseDTO {
  id: string;
  dono_id: string;
  cnpj: string | null;
  razao_social: string;
  email_financeiro: string | null;
  status_conta: string;
  created_at: Date;
  updated_at?: Date;
}
