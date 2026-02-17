export interface IAuthenticateUserRequestDTO {
  login: string; // ✅ Aceita CPF (000.000.000-00 ou limpo) ou Email
  senha: string;
}

export interface IAuthenticateUserResponseDTO {
  usuario: {
    id: string;
    nome: string;
    cpf: string;
    email: string;
    token: string;
    isMaster: boolean;
    conta_id: string | null;
    condominios: {
      id: string;
      nome_fantasia: string;
      perfil: string;
    }[];
  };
}
