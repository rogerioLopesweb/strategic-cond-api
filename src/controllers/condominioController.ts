import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { CondominioService } from "../services/condominioService";
import {
  createCondominioSchema,
  updateCondominioSchema,
  listCondominioSchema,
  idParamSchema,
} from "../schemas/condominioSchema";
import { UsuarioAuth } from "../schemas/authSchema";

const service = new CondominioService();

// Extensão do Request para incluir o usuário do middleware
interface AuthRequest extends Request {
  usuario?: UsuarioAuth;
}

export const cadastrarCondominio = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Validação Zod
    const dados = createCondominioSchema.parse(req.body);

    if (!req.usuario)
      return res
        .status(401)
        .json({ success: false, message: "Não autorizado." });

    // 2. Regra de Negócio: Conta ID
    // Se o usuário enviou conta_id (Master criando para subconta), usa ela.
    // Senão, usa a conta_id do próprio usuário logado.
    const contaAlvo = dados.conta_id || req.usuario.conta_id;

    if (!contaAlvo) {
      return res
        .status(400)
        .json({ success: false, message: "Conta ID não identificada." });
    }

    // 3. Chamada ao Service
    const result = await service.cadastrar(dados, req.usuario.id, contaAlvo);

    res.status(201).json({
      success: true,
      message: "Condomínio cadastrado com sucesso!",
      ...result,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

export const atualizarCondominio = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const dados = updateCondominioSchema.parse(req.body);

    if (!req.usuario?.conta_id)
      return res
        .status(403)
        .json({ success: false, message: "Conta não identificada." });

    const atualizado = await service.atualizar(id, dados, req.usuario.conta_id);

    if (!atualizado) {
      return res.status(403).json({
        success: false,
        message: "Condomínio não encontrado ou sem permissão.",
      });
    }

    res.json({ success: true, message: "Condomínio atualizado." });
  } catch (error: any) {
    if (error.name === "ZodError")
      return res.status(400).json({ success: false, errors: error.errors });
    // Tratamento específico para duplicidade (ex: CNPJ)
    if (error.code === "23505")
      return res
        .status(400)
        .json({ success: false, message: "Dado duplicado (ex: CNPJ)." });

    res.status(500).json({ success: false, error: error.message });
  }
};

export const buscarCondominioPorId = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    // --- DEBUG: Identificar colisão de rotas ---
    // Se "por-conta" ou "meus" cair aqui, significa que a rota específica falhou
    if (req.params.id === "por-conta" || req.params.id === "meus") {
      console.error(
        `[ALERTA DE ROTA] A URL /${req.params.id} caiu no handler genérico de ID!`,
      );
      console.error(
        `[ALERTA DE ROTA] Verifique se o router está montado corretamente no app.ts`,
      );
    }

    const { id } = idParamSchema.parse(req.params);

    if (!req.usuario)
      return res
        .status(401)
        .json({ success: false, message: "Não autorizado." });

    const condominio = await service.buscarPorId(
      id,
      req.usuario.id,
      req.usuario.conta_id,
      req.usuario.perfil === "master",
    );

    if (!condominio) {
      return res.status(404).json({
        success: false,
        message: "buscarCondominioPorId > Condomínio não encontrado.",
      });
    }

    res.json({ success: true, condominio });
  } catch (error: any) {
    if (error.name === "ZodError")
      return res.status(400).json({ success: false, errors: error.errors });
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listarCondominiosPorConta = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  console.log("[DEBUG] Controller listarCondominiosPorConta iniciada");
  let conta_id = req.params.id || "N/A"; // Para logs de erro

  try {
    const { id } = idParamSchema.parse(req.params);
    conta_id = id;

    const filters = listCondominioSchema.parse(req.query);

    const result = await service.listarPorConta(conta_id, filters);

    res.json({
      success: true,
      condominios: result.data,
      pagination: {
        total: result.total,
        page: filters.page,
        limit: filters.limit,
        total_pages: Math.ceil(result.total / filters.limit),
      },
    });
  } catch (error) {
    // 1. Validação é erro de CLIENTE, deve aparecer em qualquer ambiente.
    if (error instanceof z.ZodError) {
      // 🕵️ ISSO AQUI VAI TE MOSTRAR O CAMPO EXATO NO TERMINAL
      console.log(
        "❌ Erro de Validação Zod:",
        JSON.stringify(error.flatten().fieldErrors, null, 2),
      );

      return res.status(400).json({
        success: false,
        message: "Dados de filtro inválidos.",
        errors: error.errors,
      });
    }

    // 2. Logs de Desenvolvedor (Riqueza de detalhes)
    if (process.env.NODE_ENV === "development") {
      console.error(
        "--- 🚨 ERRO NA CONTROLLER (LISTAR CONDOMÍNIOS POR CONTA) ---",
      );
      console.error("Timestamp:", new Date().toISOString());
      console.error("Filtros enviados:", req.query);
      console.error("Conta:", conta_id);
      console.error("Stack Trace:", error);
      console.error("-----------------------------------------------");
    }

    // 3. Passa para o Middleware de Erro Global cuidar do 500
    next(error);
  }
};

export const listarMeusCondominios = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const filters = listCondominioSchema.parse(req.query);
    if (!req.usuario)
      return res
        .status(401)
        .json({ success: false, message: "Não autorizado." });

    const result = await service.listarMeusCondominios(req.usuario.id, filters);

    res.json({
      success: true,
      condominios: result.data,
      pagination: {
        total: result.total,
        page: filters.page,
        limit: filters.limit,
        total_pages: Math.ceil(result.total / filters.limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
