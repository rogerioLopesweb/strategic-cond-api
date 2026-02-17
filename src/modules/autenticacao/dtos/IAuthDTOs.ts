export interface ILoginResponseDTO {
  success: boolean;
  usuario: {
    id: string;
    nome: string;
    cpf: string;
    token: string;
    isMaster: boolean;
    conta_id: string | null;
    condominios: Array<{
      id: string;
      nome_fantasia: string;
      perfil: string;
    }>;
  };
}
