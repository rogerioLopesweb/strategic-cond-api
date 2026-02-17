import { Request, Response } from "express";
import { AuthFactory } from "../factories/AuthFactory";
import { UsuarioAuth } from "../schemas/authSchema";

// Interface estendida para incluir o objeto 'usuario' populado pelo middleware
interface AuthenticatedRequest extends Request {
  usuario?: UsuarioAuth;
}

export class AuthController {
  // Login (Usa Request padrão pois os dados vêm do body)
  async login(req: Request, res: Response): Promise<Response> {
    const { login, senha } = req.body;

    const authenticateUser = AuthFactory.makeAuthenticateUser();

    // O UseCase retorna apenas o objeto { usuario: { ... } }
    const result = await authenticateUser.execute({ login, senha });

    // Aqui garantimos a casca correta com o "success" escrito certo (com dois 'c')
    return res.json({
      success: true,
      ...result, // Isso vai espalhar o objeto { usuario: ... } aqui dentro
    });
  }

  // Perfil (Usa AuthenticatedRequest para acessar req.usuario)
  async profile(req: AuthenticatedRequest, res: Response): Promise<Response> {
    // 🎯 AJUSTE: Acessando req.usuario definido na interface acima
    const usuarioLogado = req.usuario;

    // Verificação de segurança (caso o middleware tenha falhado ou TS reclame)
    if (!usuarioLogado || !usuarioLogado.id) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado.",
      });
    }

    const getProfile = AuthFactory.makeGetProfile();

    // Passa o ID correto vindo do req.usuario
    const user = await getProfile.execute(usuarioLogado.id);

    // Remove a senha antes de enviar
    const userResponse = { ...user };
    delete (userResponse as any).senha;

    return res.json({ success: true, data: userResponse });
  }
}
