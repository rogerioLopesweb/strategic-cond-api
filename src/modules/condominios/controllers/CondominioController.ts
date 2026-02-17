import { Request, Response } from "express";
import { AppError } from "@shared/errors/AppError";
import { getAuthUser } from "@shared/providers/utils/getAuthUser";
import { CondominiosFactory } from "../factories/CondominioFactory"; // ✅ O import mais importante

export class CondominioController {
  // -------------------------------------------------
  // 🆕 LISTAGEM LEVE (Auth/Selects)
  // -------------------------------------------------
  public async listForAuth(req: Request, res: Response): Promise<Response> {
    const usuario = getAuthUser(req);

    // 1. Instancia via Factory
    const listarAuth = CondominiosFactory.makeListarAuth();

    // 2. Executa
    const result = await listarAuth.execute(usuario.id);

    return res.json({
      success: true,
      data: result,
    });
  }

  // -------------------------------------------------
  // CADASTRAR
  // -------------------------------------------------
  public async store(req: Request, res: Response): Promise<Response> {
    const usuario = getAuthUser(req);

    // 1. Instancia via Factory
    const cadastrarUseCase = CondominiosFactory.makeCadastrar();

    const result = await cadastrarUseCase.execute(req.body, usuario);

    return res.status(201).json({
      success: true,
      message: "Condomínio cadastrado com sucesso!",
      data: result,
    });
  }

  // -------------------------------------------------
  // LISTAR (Paginado)
  // -------------------------------------------------
  public async index(req: Request, res: Response): Promise<Response> {
    const usuario = getAuthUser(req);
    const { page = 1, limit = 10, ...filters } = req.query;

    // 1. Instancia via Factory
    const listarUseCase = CondominiosFactory.makeListar();

    const result = await listarUseCase.execute(usuario, {
      page: Number(page),
      limit: Number(limit),
      ...filters,
    });

    return res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: Number(page),
        limit: Number(limit),
        total_pages: Math.ceil(result.total / Number(limit)),
      },
    });
  }

  // -------------------------------------------------
  // BUSCAR UM
  // -------------------------------------------------
  public async show(req: Request, res: Response): Promise<Response> {
    const usuario = getAuthUser(req);
    const { id } = req.params;

    // 1. Instancia via Factory
    const buscarUseCase = CondominiosFactory.makeBuscar();

    const condominio = await buscarUseCase.execute(String(id), usuario);

    return res.json({
      success: true,
      data: condominio,
    });
  }

  // -------------------------------------------------
  // ATUALIZAR
  // -------------------------------------------------
  public async update(req: Request, res: Response): Promise<Response> {
    const usuario = getAuthUser(req);
    const { id } = req.params;

    if (!usuario.conta_id) {
      throw new AppError("Acesso negado: Conta não identificada.", 403);
    }

    // 1. Instancia via Factory
    const atualizarUseCase = CondominiosFactory.makeAtualizar();

    const result = await atualizarUseCase.execute(
      String(id),
      req.body,
      usuario.conta_id,
    );

    return res.json({
      success: true,
      message: "Condomínio atualizado com sucesso!",
      data: result,
    });
  }
}
