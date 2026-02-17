import { Request, Response } from "express";
import { AppError } from "@shared/errors/AppError";
import { getAuthUser } from "@shared/providers/utils/getAuthUser";
import { ContasFactory } from "../factories/ContaFactory"; // ✅ Import correto da Factory

export class ContaController {
  // --- GET /contas/meu-status ---
  async checkMaster(req: Request, res: Response) {
    const usuario = getAuthUser(req);

    const findContaMaster = ContasFactory.makeFindContaMaster();
    const contaId = await findContaMaster.execute(usuario.id);

    return res.json({
      success: true,
      isMaster: !!contaId,
      conta_id: contaId,
    });
  }

  // --- GET /contas ---
  async index(req: Request, res: Response) {
    const usuario = getAuthUser(req);
    const donoId = usuario.id;
    if (!donoId) throw new AppError("Usuário não identificado", 401);

    // ✅ Instanciando via Factory
    const listarContas = ContasFactory.makeListarContas();
    const contas = await listarContas.execute(donoId);

    return res.json({ success: true, data: contas });
  }

  // --- POST /contas ---
  async store(req: Request, res: Response) {
    const usuario = getAuthUser(req);
    const donoId = usuario.id;
    if (!donoId) throw new AppError("Não autorizado", 401);

    // ✅ Instanciando via Factory
    const criarConta = ContasFactory.makeCriarConta();
    const conta = await criarConta.execute(req.body, donoId);

    return res.status(201).json({
      success: true,
      message: "Conta criada!",
      data: conta,
    });
  }

  // --- GET /contas/:id ---
  async show(req: Request, res: Response) {
    const { id } = req.params;
    const usuario = getAuthUser(req);
    const donoId = usuario.id;
    if (!donoId) throw new AppError("Não autorizado", 401);

    // ✅ Instanciando via Factory
    const buscarConta = ContasFactory.makeBuscarConta();
    const conta = await buscarConta.execute(String(id), donoId);

    if (!conta) throw new AppError("Conta não encontrada", 404);

    return res.json({ success: true, data: conta });
  }

  // --- PUT /contas/:id ---
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const usuario = getAuthUser(req);
    const donoId = usuario.id;
    if (!donoId) throw new AppError("Não autorizado", 401);

    // ✅ Instanciando via Factory
    const atualizarConta = ContasFactory.makeAtualizarConta();
    const conta = await atualizarConta.execute(String(id), req.body, donoId);

    if (!conta)
      throw new AppError("Conta não encontrada ou permissão negada", 403);

    return res.json({
      success: true,
      message: "Dados atualizados!",
      data: conta,
    });
  }
}
