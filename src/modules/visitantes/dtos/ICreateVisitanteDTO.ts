export type TipoVisitante = "visitante" | "prestador" | "corretor";

export interface ICreateVisitanteDTO {
  nome_completo: string;
  cpf: string;
  
  // ✅ Usamos optional (?) e nullable (null) para casar com o comportamento do Banco/Zod
  rg?: string | null;
  
  // ✅ Mudança crucial: No cadastro, recebemos o Base64 do App. 
  // O UseCase transformará isso em url_foto depois.
  foto_base64?: string | null; 
  
  tipo: TipoVisitante;
  
  // ✅ Adicionado para suportar Prestadores de Serviço e Corretores
  empresa?: string | null; 
}