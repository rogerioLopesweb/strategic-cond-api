import { Request, Response } from "express";
import { getAuthUser } from "@shared/providers/utils/getAuthUser";
import { AppError } from "@shared/errors/AppError";
import { CadastrarEntregaUseCase } from "../useCases/CadastrarEntregaUseCase";
import { ListarEntregasUseCase } from "../useCases/ListarEntregasUseCase";
import { FinalizarSaidaEntregaUseCase } from "../useCases/FinalizarSaidaEntregaUseCase";
import { CancelarEntregaUseCase } from "../useCases/CancelarEntregaUseCase";
import { AtualizarEntregaUseCase } from "../useCases/AtualizarEntregaUseCase";

export class EntregaController {
  constructor(
    private cadastrarEntregaUseCase: CadastrarEntregaUseCase,
    private listarEntregasUseCase: ListarEntregasUseCase,
    private finalizarSaidaEntregaUseCase: FinalizarSaidaEntregaUseCase,
    private cancelarEntregaUseCase: CancelarEntregaUseCase,
    private atualizarEntregaUseCase: AtualizarEntregaUseCase,
  ) {}

  /**
   * 📦 Registrar nova entrega
   */
  public async store(req: Request, res: Response): Promise<Response> {
    const usuario = getAuthUser(req);

    const result = await this.cadastrarEntregaUseCase.execute(
      req.body,
      usuario.id,
    );

    return res.status(201).json({
      success: true,
      message: "Entrega registrada com sucesso!",
      data: result,
    });
  }

  /**
   * 📋 Listar entregas com filtros e paginação
   */
  public async index(req: Request, res: Response): Promise<Response> {
    const usuario = getAuthUser(req);

    // 1. Extraímos os filtros da query
    // 🎯 Capturamos o condominio_id que o Use Case exige
    const { page = 1, limit = 10, condominio_id, ...filters } = req.query;

    // 2. Validação: Se não veio na query, verificamos se o usuário tem um condomínio vinculado
    // Isso evita o erro de "missing property"
    const targetCondominioId =
      (condominio_id as string) || (req.headers["x-condominio-id"] as string);

    if (!targetCondominioId) {
      throw new AppError(
        "O ID do condomínio é obrigatório para listar entregas.",
        400,
      );
    }

    // 3. Execução do Use Case com todos os campos obrigatórios
    const result = await this.listarEntregasUseCase.execute(
      {
        ...filters,
        condominio_id: targetCondominioId, // ✅ Agora ele está aqui!
        page: Number(page),
        limit: Number(limit),
      },
      usuario.id,
      usuario.perfil,
    );

    return res.json(result);
  }

  /**
   * 🤝 Registrar retirada (Saída manual)
   */
  public async registrarRetirada(
    req: Request,
    res: Response,
  ): Promise<Response> {
    const usuario = getAuthUser(req);

    // 🎯 Captura o ID de forma robusta
    const entrega_id = String(req.params.id || req.body.entrega_id);

    const result = await this.finalizarSaidaEntregaUseCase.execute(
      { ...req.body, entrega_id },
      usuario.id,
      false, // IsQrCode = false
    );

    return res.json({
      success: true,
      message: "Retirada registrada com sucesso!",
      data: result,
    });
  }

  /**
   * 📱 Saída rápida via QR Code
   */
  public async saidaQRCode(req: Request, res: Response): Promise<Response> {
    const usuario = getAuthUser(req);
    const id = String(req.params.id);

    const result = await this.finalizarSaidaEntregaUseCase.execute(
      { entrega_id: id, retirado_por: "Portador do QR Code" },
      usuario.id,
      true, // IsQrCode = true
    );

    return res.json({
      success: true,
      message: "Retirada via QR Code confirmada!",
      data: result,
    });
  }

  /**
   * 📝 Atualizar informações da entrega
   */
  public async update(req: Request, res: Response): Promise<Response> {
    const usuario = getAuthUser(req);
    const { id } = req.params;

    const result = await this.atualizarEntregaUseCase.execute(
      String(id),
      req.body,
      usuario.id,
    );

    return res.json({
      success: true,
      message: "Entrega atualizada com sucesso!",
      data: result,
    });
  }

  /**
   * 🛑 Cancelar entrega (Auditoria)
   */
  public async cancelar(req: Request, res: Response): Promise<Response> {
    const usuario = getAuthUser(req);
    const { id } = req.params;
    const { motivo_cancelamento, condominio_id } = req.body;

    const result = await this.cancelarEntregaUseCase.execute(
      String(id),
      String(motivo_cancelamento),
      usuario.id,
      String(condominio_id),
    );

    return res.json({
      success: true,
      message: "Entrega cancelada e registrada para auditoria.",
      data: result,
    });
  }
}
