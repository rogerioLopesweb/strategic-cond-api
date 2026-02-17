import { UsuarioAuth } from "../../modules/autenticacao/schemas/authSchema";

declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioAuth;
      usuario_id?: string;
    }
  }
}
export {};
