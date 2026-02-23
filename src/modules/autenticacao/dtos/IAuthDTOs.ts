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

// (Mantenha as outras interfaces que já existem neste arquivo, apenas adicione esta:)

export interface IUsuarioAuth {
  id: string;
  condominio_id: string;
  perfil?: string;
  nome: string; // ✅ Adicionamos o nome aqui para a IA usar sem bater no banco
  isMaster?: boolean;
  conta_id?: string;
}
