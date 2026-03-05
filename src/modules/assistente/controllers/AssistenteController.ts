import { Request, Response } from "express";
import { getAuthUser } from "@shared/providers/utils/getAuthUser";
import { AppError } from "@shared/errors/AppError";
import { EnviarMensagemAssistenteUseCase } from "../useCases/EnviarMensagemAssistenteUseCase";
import { BuscarHistoricoUseCase } from "../useCases/BuscarHistoricoUseCase"; // 👈 NOVO IMPORT

export class AssistenteController {
  // ✅ Injeção de dependência pelo construtor mantida perfeitamente
  constructor(
    private enviarMensagemUseCase: EnviarMensagemAssistenteUseCase,
    private buscarHistoricoUseCase: BuscarHistoricoUseCase,
  ) {}

  public async chat(req: Request, res: Response): Promise<Response> {
    // 1. Pega os dados do usuário logado (via Token JWT)
    const usuario = getAuthUser(req);

    // 2. Extraímos os dados do corpo da requisição
    const { mensagem, condominio_id } = req.body;

    if (!mensagem || String(mensagem).trim() === "") {
      throw new AppError("A mensagem é obrigatória.", 400);
    }

    // 3. Validação: Verificamos se o ID do condomínio veio no body ou no header
    const targetCondominioId =
      (condominio_id as string) || (req.headers["x-condominio-id"] as string);

    if (!targetCondominioId) {
      throw new AppError(
        "O ID do condomínio é obrigatório para falar com o assistente.",
        400,
      );
    }

    // 4. Delega para o UseCase (onde o Histórico, Banco de Dados e OpenAI rodam)
    const resposta = await this.enviarMensagemUseCase.execute({
      mensagem,
      condominio_id: targetCondominioId,
      usuario_id: usuario.id,

      // 👇 Contexto rico injetado dinamicamente para a IA
      nome_usuario: usuario.nome || "Usuário",
      perfil_usuario: usuario.perfil || "morador",
    });

    // 5. Devolve a resposta final para o Frontend
    // (O UseCase agora devolve { remetente, texto, data_hora, sessao_id })
    return res.status(200).json(resposta);
  }

  // 👇 NOVO MÉTODO PARA CARREGAR A TELA
  public async historico(req: Request, res: Response): Promise<Response> {
    const usuario = getAuthUser(req);
    const targetCondominioId = req.headers["x-condominio-id"] as string;

    if (!targetCondominioId) {
      throw new AppError("O ID do condomínio é obrigatório.", 400);
    }

    const resultado = await this.buscarHistoricoUseCase.execute(
      usuario.id,
      targetCondominioId,
    );

    return res.status(200).json(resultado);
  }
}
