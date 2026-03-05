import { Request, Response } from "express";
import { ContaService } from "../services/contaService";
import {
  createContaSchema,
  updateContaSchema,
  contaIdParamSchema,
} from "../schemas/contaSchema";
import { UsuarioAuth } from "../schemas/authSchema";

const service = new ContaService();

interface AuthRequest extends Request {
  usuario?: UsuarioAuth;
}

export const listarMinhasContas = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.usuario)
      return res
        .status(401)
        .json({ success: false, message: "Não autorizado." });

    const contas = await service.listarMinhasContas(req.usuario.id);

    res.json({
      success: true,
      data: contas,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const criarConta = async (req: AuthRequest, res: Response) => {
  try {
    const dados = createContaSchema.parse(req.body);

    if (!req.usuario)
      return res
        .status(401)
        .json({ success: false, message: "Não autorizado." });

    const novaConta = await service.criar(dados, req.usuario.id);

    res.status(201).json({
      success: true,
      message: "Conta criada com sucesso!",
      data: novaConta,
    });
  } catch (error: any) {
    if (error.name === "ZodError")
      return res.status(400).json({ success: false, errors: error.errors });
    res.status(500).json({ success: false, error: error.message });
  }
};

export const atualizarDadosFiscais = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { id } = contaIdParamSchema.parse(req.params);
    const dados = updateContaSchema.parse(req.body);

    if (!req.usuario)
      return res
        .status(401)
        .json({ success: false, message: "Não autorizado." });

    const contaAtualizada = await service.atualizar(id, dados, req.usuario.id);

    if (!contaAtualizada) {
      return res.status(403).json({
        success: false,
        message: "Conta não encontrada ou permissão negada.",
      });
    }

    res.json({
      success: true,
      message: "Dados atualizados com sucesso.",
      data: contaAtualizada,
    });
  } catch (error: any) {
    if (error.name === "ZodError")
      return res.status(400).json({ success: false, errors: error.errors });
    res.status(500).json({ success: false, error: error.message });
  }
};

export const buscarContaPorId = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = contaIdParamSchema.parse(req.params);
    if (!req.usuario)
      return res
        .status(401)
        .json({ success: false, message: "Não autorizado." });

    const conta = await service.buscarPorId(id, req.usuario.id);

    if (!conta)
      return res
        .status(404)
        .json({ success: false, message: "Conta não encontrada." });

    res.json({ success: true, data: conta });
  } catch (error: any) {
    if (error.name === "ZodError")
      return res.status(400).json({ success: false, errors: error.errors });
    res.status(500).json({ success: false, error: error.message });
  }
};
