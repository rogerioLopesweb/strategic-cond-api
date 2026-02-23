import { Request, Response } from "express";
import { getAuthUser } from "@shared/providers/utils/getAuthUser";
import { AppError } from "@shared/errors/AppError";
import { EnviarMensagemAssistenteUseCase } from "../useCases/EnviarMensagemAssistenteUseCase";

export class AssistenteController {
  // ✅ Injeção de dependência pelo construtor mantida perfeitamente
  constructor(private enviarMensagemUseCase: EnviarMensagemAssistenteUseCase) {}

  public async chat(req: Request, res: Response): Promise<Response> {
    const usuario = getAuthUser(req);

    // 1. Extraímos os dados do corpo da requisição
    const { mensagem, condominio_id } = req.body;

    if (!mensagem || String(mensagem).trim() === "") {
      throw new AppError("A mensagem é obrigatória.", 400);
    }

    // 2. Validação: Verificamos se o ID do condomínio veio no body ou no header
    const targetCondominioId =
      (condominio_id as string) || (req.headers["x-condominio-id"] as string);

    if (!targetCondominioId) {
      throw new AppError(
        "O ID do condomínio é obrigatório para falar com o assistente.",
        400,
      );
    }

    // 3. Executa a inteligência passando os dados Ricos para a IA (Injeção de Contexto)
    const resposta = await this.enviarMensagemUseCase.execute({
      mensagem,
      condominio_id: targetCondominioId,
      usuario_id: usuario.id,
      // 👇 Adicionamos o nome e o perfil para o Otto saber com quem está falando!
      nome_usuario: usuario.nome || "Usuário",
      perfil_usuario: usuario.perfil || "morador",
    });

    return res.status(200).json(resposta);
  }
}
