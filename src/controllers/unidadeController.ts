import { Request, Response, NextFunction } from "express";
import { UnidadeService } from "../services/unidadeService";
import { z } from "zod";
import {
  listUnidadeSchema,
  gerarUnidadesSchema,
  buscarMoradoresSchema,
  vincularMoradorSchema,
  vincularMoradorPorTextoSchema,
  atualizarStatusVinculoSchema,
} from "../schemas/unidadeSchema";
import { UsuarioAuth } from "../schemas/authSchema";

const service = new UnidadeService();

interface AuthRequest extends Request {
  usuario?: UsuarioAuth;
}

export const listarUnidades = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const filters = listUnidadeSchema.parse(req.query);

    const result = await service.listar(filters);

    res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: filters.page,
        limit: filters.limit,
        total_pages: Math.ceil(result.total / filters.limit),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Filtros inválidos.",
        errors: error.errors,
      });
    }
    next(error);
  }
};

export const gerarUnidadesEmMassa = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const dados = gerarUnidadesSchema.parse(req.body);

    if (!req.usuario)
      return res
        .status(401)
        .json({ success: false, message: "Não autorizado." });

    const result = await service.gerarEmMassa(dados);

    res.json({
      success: true,
      novas_unidades: result.novas_unidades,
      total_processado: result.total_processado,
      message:
        result.novas_unidades === 0
          ? "Todas as unidades já estavam cadastradas."
          : "Unidades geradas com sucesso.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Dados inválidos.",
        errors: error.errors,
      });
    }
    // Logs para operações de escrita em massa são importantes
    if (process.env.NODE_ENV === "development") {
      console.error("--- 🚨 ERRO: GERAR UNIDADES EM MASSA ---");
      console.error(error);
    }
    next(error);
  }
};

export const buscarMoradoresPorUnidade = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const filters = buscarMoradoresSchema.parse(req.query);

    const moradores = await service.buscarMoradores(filters);

    if (moradores.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Nenhum morador encontrado." });
    }

    res.json({ success: true, data: moradores });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Filtros inválidos.",
        errors: error.errors,
      });
    }
    next(error);
  }
};

export const vincularMoradorUnidade = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const dados = vincularMoradorSchema.parse(req.body);

    await service.vincular(dados);

    res.json({ success: true, message: "Morador vinculado com sucesso!" });
  } catch (error) {
    // 1. Validação é erro de CLIENTE
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Dados inválidos.: " + error.errors,
        errors: error.errors,
      });
    }

    // 2. Logs de Desenvolvedor (Ajuda a identificar o erro 500)
    if (process.env.NODE_ENV === "development") {
      console.error("--- 🚨 ERRO NA CONTROLLER (VINCULAR MORADOR) ---");
      console.error("Timestamp:", new Date().toISOString());
      console.error("Dados enviados:", req.body);
      console.error("Stack Trace:", error);
      console.error("-----------------------------------------------");
    }

    // 3. Passa para o Middleware de Erro Global cuidar do 500
    next(error);
  }
};

export const vincularMoradorPorBloco = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const dados = vincularMoradorPorTextoSchema.parse(req.body);

    await service.vincularPorTexto(dados);

    res.json({ success: true, message: "Vínculo patrimonial criado!" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Dados inválidos.",
        errors: error.errors,
      });
    }

    // Tratamento específico de regra de negócio
    if (
      error instanceof Error &&
      error.message === "Unidade não encontrada neste condomínio."
    ) {
      return res.status(404).json({ success: false, message: error.message });
    }

    if (process.env.NODE_ENV === "development") {
      console.error("--- 🚨 ERRO: VINCULAR POR BLOCO ---");
      console.error("Dados:", req.body);
      console.error(error);
    }
    next(error);
  }
};

export const atualizarStatusVinculo = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const dados = atualizarStatusVinculoSchema.parse(req.body);

    const sucesso = await service.atualizarStatus(dados);

    if (!sucesso) {
      return res
        .status(404)
        .json({ success: false, message: "Vínculo não encontrado." });
    }

    res.json({
      success: true,
      message: dados.status
        ? "Vínculo ativado."
        : "Saída registrada com sucesso no histórico.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Dados inválidos.",
        errors: error.errors,
      });
    }

    if (process.env.NODE_ENV === "development") {
      console.error("--- 🚨 ERRO: ATUALIZAR STATUS VÍNCULO ---");
      console.error("Dados:", req.body);
      console.error(error);
    }
    next(error);
  }
};
