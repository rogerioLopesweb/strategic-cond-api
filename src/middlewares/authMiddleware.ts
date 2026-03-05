import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PermissionService } from "../middlewares/permissionService";
import { contextCondominioSchema } from "../middlewares/permissionSchema";
import { UsuarioAuth } from "../schemas/authSchema";

const permissionService = new PermissionService();

// Estendendo a interface Request do Express globalmente ou localmente
declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioAuth;
      usuario_id?: string;
    }
  }
}

export const verificarToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Token não encontrado." });
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET || "chave_mestra_secreta";
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Injeta dados básicos do token no request
    req.usuario = {
      id: decoded.id,
      conta_id: decoded.conta_id, // Pode vir do login, mas vamos revalidar abaixo
      isMaster: false,
    };
    req.usuario_id = decoded.id;

    // 🔍 01 - TRUQUE MESTRE: Verifica no banco se é dono de conta ATIVA (Segurança Realtime)
    const contaIdDono = await permissionService.buscarContaMaster(decoded.id);
    const isMasterGeral = !!contaIdDono;

    // Atualiza o contexto do usuário com a informação fresca do banco
    if (req.usuario) {
      req.usuario.isMaster = isMasterGeral;
      if (isMasterGeral) {
        req.usuario.conta_id = contaIdDono!; // Sobrescreve com a conta real ativa
      }
    }

    // Extração do Contexto (Condomínio Alvo)
    // Tenta pegar de query, body ou params
    const rawCondominioId =
      req.query?.condominio_id ||
      req.body?.condominio_id ||
      req.params?.condominio_id;

    // Validação Zod (se existir ID, deve ser UUID)
    const condominioId = rawCondominioId
      ? contextCondominioSchema.parse(rawCondominioId)
      : null;

    // 🛡️ CASO A: Rota Global (Sem condomínio específico)
    if (!condominioId) {
      if (isMasterGeral && req.usuario) {
        req.usuario.perfil = "master";
      }
      return next();
    }

    // 🛡️ CASO B: Rota Contextual (Dentro de um condomínio)
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
    next();
  } catch (error: any) {
    // Se for erro do Zod (ID inválido na URL/Body)
    if (error.name === "ZodError")
      return res
        .status(400)
        .json({ success: false, message: "ID do condomínio inválido." });
    return res
      .status(403)
      .json({ success: false, message: "Token inválido ou expirado." });
  }
};
