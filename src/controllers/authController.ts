import { Request, Response } from "express";
import { AuthService } from "../services/authService";
import { loginSchema, UsuarioAuth } from "../schemas/authSchema";

const service = new AuthService();

interface AuthRequest extends Request {
  usuario?: UsuarioAuth;
}

export const login = async (req: Request, res: Response) => {
  try {
    // 1. Validação Zod
    const dados = loginSchema.parse(req.body);

    // 2. Chamada ao Service
    const result = await service.login(dados);

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    // Tratamento de erros de negócio conhecidos
    if (
      [
        "Usuário não encontrado",
        "Senha inválida",
        "Usuário sem vínculos ativos ou conta pendente.",
      ].includes(error.message)
    ) {
      return res.status(401).json({ success: false, message: error.message });
    }

    console.error("StrategicCond - Erro no login:", error);
    res
      .status(500)
      .json({ success: false, message: "Erro interno no servidor" });
  }
};

export const getPerfil = async (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    message: "Perfil autenticado com sucesso",
    usuario: req.usuario,
  });
};
