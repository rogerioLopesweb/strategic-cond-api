import { Request, Response, NextFunction } from "express";
import { UsuarioService } from "../services/usuarioService";
import { z } from "zod";
import {
  createUsuarioSchema,
  listUsuarioSchema,
  updateUsuarioSchema,
  updatePerfilSchema,
  updateFotoSchema,
  updateStatusSchema,
  pushTokenSchema,
  getUsuarioDetalhadoSchema,
} from "../schemas/usuarioSchema";
import { idParamSchema } from "../schemas/condominioSchema"; // Reutilizando validação de ID
import { UsuarioAuth } from "../schemas/authSchema";

const service = new UsuarioService();

interface AuthRequest extends Request {
  usuario?: UsuarioAuth;
}

export const listarUsuariosDoCondominio = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const usuario_id = req.usuario?.id || "N/A";
  try {
    const filters = listUsuarioSchema.parse(req.query);
    const result = await service.listarPorCondominio(filters);
    res.json(result);
  } catch (error) {
    // 1. Validação é erro de CLIENTE, deve aparecer em qualquer ambiente.
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Dados de filtro inválidos.",
        errors: error.errors, // O Zod diz exatamente qual campo falhou
      });
    }

    // 2. Logs de Desenvolvedor (Riqueza de detalhes)
    if (process.env.NODE_ENV === "development") {
      console.error("--- 🚨 ERRO NA CONTROLLER (LISTAR USUÁRIOS) ---");
      console.error("Timestamp:", new Date().toISOString());
      console.error("Filtros enviados:", req.query);
      console.error("Usuário:", usuario_id);
      console.error("Stack Trace:", error);
      console.error("-----------------------------------------------");
    }

    // 3. Passa para o Middleware de Erro Global cuidar do 500
    next(error);
  }
};

export const cadastrarUsuarioCompleto = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const usuario_id = req.usuario?.id || "N/A";
  try {
    // Se foto_base64 vier como null (comum em JSON), removemos para o Zod tratar como undefined (optional)
    if (req.body.foto_base64 === null) {
      delete req.body.foto_base64;
    }

    const dados = createUsuarioSchema.parse(req.body);
    const result = await service.cadastrarCompleto(dados);
    res.json({ success: true, ...result });
  } catch (error) {
    // 1. Validação é erro de CLIENTE, deve aparecer em qualquer ambiente.
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Dados inválidos.",
        errors: error.errors, // O Zod diz exatamente qual campo falhou
      });
    }

    // 2. Logs de Desenvolvedor (Riqueza de detalhes)
    if (process.env.NODE_ENV === "development") {
      console.error("--- 🚨 ERRO NA CONTROLLER (CADASTRAR USUÁRIO) ---");
      console.error("Timestamp:", new Date().toISOString());
      console.error("Dados enviados:", req.body);
      console.error("Usuário:", usuario_id);
      console.error("Stack Trace:", error);
      console.error("-----------------------------------------------");
    }

    // 3. Passa para o Middleware de Erro Global cuidar do 500
    next(error);
  }
};

export const getUsuarioDetalhado = async (req: Request, res: Response) => {
  try {
    const { id, condominio_id } = getUsuarioDetalhadoSchema.parse(req.query);
    const usuario = await service.getDetalhado(id, condominio_id);
    res.json({ success: true, usuario });
  } catch (error: any) {
    if (error.name === "ZodError")
      return res.status(400).json({ success: false, errors: error.errors });
    res.status(500).json({ success: false, error: error.message });
  }
};

export const atualizarUsuarioCompleto = async (req: Request, res: Response) => {
  try {
    const dados = updateUsuarioSchema.parse(req.body);
    await service.atualizar(dados);
    res.json({ success: true, message: "Perfil atualizado!" });
  } catch (error: any) {
    if (error.name === "ZodError")
      return res.status(400).json({ success: false, errors: error.errors });
    res.status(500).json({ success: false, error: error.message });
  }
};

export const atualizarPerfil = async (req: Request, res: Response) => {
  try {
    const dados = updatePerfilSchema.parse(req.body);
    await service.atualizar(dados);
    res.json({ success: true, message: "Perfil atualizado!" });
  } catch (error: any) {
    if (error.name === "ZodError")
      return res.status(400).json({ success: false, errors: error.errors });
    res.status(500).json({ success: false, error: error.message });
  }
};

export const atualizarFoto = async (req: Request, res: Response) => {
  try {
    const { usuario_id, foto_base64 } = updateFotoSchema.parse(req.body);
    const url_foto = await service.atualizarFoto(usuario_id, foto_base64);
    res.json({
      success: true,
      url_foto,
      message: "Foto de perfil atualizada!",
    });
  } catch (error: any) {
    if (error.name === "ZodError")
      return res.status(400).json({ success: false, errors: error.errors });
    res.status(500).json({ success: false, error: error.message });
  }
};

export const atualizarStatusUsuario = async (req: Request, res: Response) => {
  try {
    const { usuario_id, condominio_id, ativo } = updateStatusSchema.parse(
      req.body,
    );
    const result = await service.atualizarStatus(
      usuario_id,
      condominio_id,
      ativo,
    );
    res.json({ success: true, ativo: result.ativo });
  } catch (error: any) {
    if (error.name === "ZodError")
      return res.status(400).json({ success: false, errors: error.errors });
    res.status(500).json({ success: false, error: error.message });
  }
};

export const salvarPushToken = async (req: AuthRequest, res: Response) => {
  try {
    const { token } = pushTokenSchema.parse(req.body);
    if (!req.usuario)
      return res
        .status(401)
        .json({ success: false, message: "Não autorizado." });

    await service.salvarPushToken(req.usuario.id, token);
    res.json({ success: true, message: "Token salvo!" });
  } catch (error: any) {
    if (error.name === "ZodError")
      return res.status(400).json({ success: false, errors: error.errors });
    res.status(500).json({ success: false, error: error.message });
  }
};
