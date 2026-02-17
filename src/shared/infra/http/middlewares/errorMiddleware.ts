import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../../../errors/AppError"; // 🎯 Importe o seu AppError

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction, // 🛡️ O '_' silencia o Linter e mantém a assinatura do Express
) => {
  // 1. Tratamento de Erros de Regra de Negócio (AppError)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // 2. Tratamento de Erros do Zod (Validação de Input)
  if (err instanceof ZodError) {
    const errors = err.errors.map((issue) => ({
      campo: issue.path.join("."),
      mensagem: issue.message,
    }));

    return res.status(400).json({
      success: false,
      message: "Erro de validação nos dados enviados.",
      errors,
    });
  }

  // 3. Log do Erro (Apenas em Desenvolvimento para não expor a infra)
  if (process.env.NODE_ENV === "development") {
    console.error("🔥 Erro capturado:", err);
  }

  // 4. Erro Genérico (Fallback para erros inesperados)
  return res.status(500).json({
    success: false,
    message: "Ocorreu um erro interno no servidor. Tente novamente mais tarde.",
  });
};
