export type TipoVisitante = "visitante" | "prestador" | "corretor";

export interface ICreateVisitanteDTO {
  // 🏢 O contexto do condomínio é OBRIGATÓRIO agora
  condominio_id: string; 

  nome_completo: string;
  cpf: string;
  
  // ✅ Flexibilidade para o Banco/Zod
  rg?: string | null;
  
  // ✅ No cadastro (Front -> UseCase), tratamos o Base64
  foto_base64?: string | null; 
  
  tipo: TipoVisitante;
  
  // ✅ Suporte para Prestadores e Corretores
  empresa?: string | null; 

  // 🛡️ Auditoria: Quem está realizando o cadastro
  operador_id: string;
}