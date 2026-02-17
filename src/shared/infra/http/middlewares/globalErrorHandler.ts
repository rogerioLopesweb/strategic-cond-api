// src/shared/infra/http/middlewares/globalErrorHandler.ts

import { Request, Response, NextFunction } from "express";
// 🎯 A correção: Subimos 3 níveis para alcançar a pasta shared/errors
import { AppError } from "../../../errors/AppError";

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Agora o TS consegue verificar se o erro é uma instância de AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Erro genérico para falhas não tratadas
  console.error("❌ Internal Server Error:", err);

  return res.status(500).json({
    success: false,
    message: "Erro interno do servidor.",
  });
};
