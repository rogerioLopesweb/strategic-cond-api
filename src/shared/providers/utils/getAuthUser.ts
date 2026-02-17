import { Request } from "express";
import { UsuarioAuth } from "../../../modules/autenticacao/schemas/authSchema";
import { AppError } from "../../errors/AppError";

/**
 * Extrai o usuário autenticado do Request de forma segura e tipada.
 * Se o usuário não existir, já lança um erro 401 automaticamente.
 */
export const getAuthUser = (req: Request): UsuarioAuth => {
  // Fazemos o cast para 'any' apenas aqui dentro, isolando o problema
  const usuario = (req as any).usuario as UsuarioAuth | undefined;

  if (!usuario) {
    throw new AppError("Usuário não autenticado ou sessão inválida.", 401);
  }

  return usuario;
};
