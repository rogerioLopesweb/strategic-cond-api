import { Request, Response } from "express";
import { getAuthUser } from "@shared/providers/utils/getAuthUser";
import { AppError } from "@shared/errors/AppError";

import { CadastrarBaseConhecimentoUseCase } from "../useCases/CadastrarBaseConhecimentoUseCase";
import { ListarBaseConhecimentoUseCase } from "../useCases/ListarBaseConhecimentoUseCase";
import { AtualizarBaseConhecimentoUseCase } from "../useCases/AtualizarBaseConhecimentoUseCase";
import { DeletarBaseConhecimentoUseCase } from "../useCases/DeletarBaseConhecimentoUseCase";

export class BaseConhecimentoController {
  constructor(
    private cadastrarUseCase: CadastrarBaseConhecimentoUseCase,
    private listarUseCase: ListarBaseConhecimentoUseCase,
    private atualizarUseCase: AtualizarBaseConhecimentoUseCase,
    private deletarUseCase: DeletarBaseConhecimentoUseCase,
  ) {}

  public async store(req: Request, res: Response): Promise<Response> {
    const usuario = getAuthUser(req);
    // Pega do body, ou fallback para o condomínio do usuário logado
    const condominio_id = req.body.condominio_id || usuario.condominio_id;

    if (!condominio_id)
      throw new AppError("ID do condomínio não informado.", 400);

    const result = await this.cadastrarUseCase.execute({
      ...req.body,
      condominio_id,
      id_user_cadastrou: usuario.id,
    });

    return res.status(201).json({ success: true, data: result });
  }

  public async index(req: Request, res: Response): Promise<Response> {
    const usuario = getAuthUser(req);
    const condominio_id =
      (req.query.condominio_id as string) || usuario.condominio_id;

    if (!condominio_id)
      throw new AppError("ID do condomínio não informado.", 400);

    const { page = 1, limit = 10, categoria, busca } = req.query;

    const result = await this.listarUseCase.execute(condominio_id, {
      page: Number(page),
      limit: Number(limit),
      categoria: categoria as string,
      busca: busca as string,
    });

    return res.json(result);
  }

  public async update(req: Request, res: Response): Promise<Response> {
    const usuario = getAuthUser(req);
    const { id } = req.params;
    const condominio_id = req.body.condominio_id || usuario.condominio_id;

    const result = await this.atualizarUseCase.execute(id, condominio_id, {
      ...req.body,
      id_user_alterou: usuario.id,
    });

    return res.json({ success: true, data: result });
  }

  public async delete(req: Request, res: Response): Promise<Response> {
    const usuario = getAuthUser(req);
    const { id } = req.params;
    const condominio_id =
      (req.query.condominio_id as string) || usuario.condominio_id;

    await this.deletarUseCase.execute(id, condominio_id, usuario.id);

    return res.json({
      success: true,
      message: "Registro deletado com sucesso.",
    });
  }
}
