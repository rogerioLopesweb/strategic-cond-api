import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // 1. Tratamento de Erros do Zod (Validação)
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

  // 2. Log do Erro (Apenas em Desenvolvimento)
  if (process.env.NODE_ENV === "development") {
    console.error("🔥 Erro capturado:", err);
  }

  // 3. Erro Genérico (Mensagem Amigável)
  return res.status(500).json({
    success: false,
    message: "Ocorreu um erro interno no servidor. Tente novamente mais tarde.",
  });
};
