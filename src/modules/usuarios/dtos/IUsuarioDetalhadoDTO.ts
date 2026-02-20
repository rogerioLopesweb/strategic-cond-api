// Defina a interface do retorno esperado pelo Front/UseCase
export interface IUsuarioDetalhadoDTO {
  id: string;
  nome_completo: string;
  email: string;
  telefone: string;
  cpf: string;
  foto_perfil: string | null;
  data_nascimento: Date | string | null;
  contato_emergencia: string | null;
  perfil: string; // ✅ Do vínculo neste condomínio
  ativo: boolean; // ✅ Do vínculo neste condomínio
  unidades_vinculadas: any[]; // ✅ Array montado pelo JSON_AGG
}
