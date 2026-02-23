import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PermissionService } from "../../services/permissionService";
import { contextCondominioSchema } from "@modules/usuarios/schemas/usuarioSchema";
import { IUsuarioAuth } from "@modules/autenticacao/dtos/IAuthDTOs"; // 🎯 Import necessário

// 🛡️ Interface local para garantir que o TS reconheça usuario e usuario_id
interface AuthenticatedRequest extends Request {
  usuario?: IUsuarioAuth;
  usuario_id?: string;
}

const permissionService = new PermissionService();

export const verificarToken = async (
  req: AuthenticatedRequest, // 👈 Alterado de 'Request' para 'AuthenticatedRequest'
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Token não encontrado." });
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET || "chave_mestra_secreta";

    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      conta_id?: string;
      nome?: string; // 👈 Agora esperamos o nome do token
      condominio_id?: string; // 👈 E o condominio base
      perfil?: string;
    };

    // ✅ Agora o TS permite estas atribuições sem erro
    req.usuario_id = decoded.id;
    req.usuario = {
      id: decoded.id,
      conta_id: String(decoded.conta_id || ""),
      isMaster: false,
      nome: decoded.nome || "Usuário", // Fallback caso seja um token gerado antes da nossa atualização
      condominio_id: decoded.condominio_id || "",
      perfil: decoded.perfil || "",
    };

    const contaIdDono = await permissionService.buscarContaMaster(decoded.id);
    const isMasterGeral = !!contaIdDono;

    if (req.usuario) {
      req.usuario.isMaster = isMasterGeral;
      if (isMasterGeral) req.usuario.conta_id = contaIdDono!;
    }

    const rawCondominioId =
      req.query?.condominio_id ||
      req.body?.condominio_id ||
      req.params?.condominio_id;

    const condominioId = rawCondominioId ? String(rawCondominioId) : null;

    if (!condominioId) {
      if (isMasterGeral && req.usuario) req.usuario.perfil = "master";
      return next();
    }

    try {
      contextCondominioSchema.parse(condominioId);
    } catch {
      return res
        .status(400)
        .json({ success: false, message: "ID do condomínio inválido." });
    }

    const perfilEncontrado = await permissionService.verificarPerfilCondominio(
      decoded.id,
      condominioId,
      contaIdDono,
    );

    if (!perfilEncontrado) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado para este condomínio.",
      });
    }

    if (req.usuario) req.usuario.perfil = perfilEncontrado;

    return next();
  } catch (error: any) {
    return res
      .status(403)
      .json({ success: false, message: "Token inválido ou expirado." });
  }
};
