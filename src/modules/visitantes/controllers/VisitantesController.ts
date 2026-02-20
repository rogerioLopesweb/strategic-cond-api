import { Request, Response } from "express";
import { VisitantesFactory } from "../factories/VisitantesFactory";
import { getAuthUser } from "@shared/providers/utils/getAuthUser";
import { AppError } from "@shared/errors/AppError";

export class VisitantesController {
  async entrada(req: Request, res: Response) {
    // 1. Extrai o usuário e garante a autenticação
    const usuario = getAuthUser(req);

    const registrarEntrada = VisitantesFactory.makeRegistrarEntrada();

    // 2. Capturamos o condominio_id de forma robusta (Body ou Header)
    const targetCondominioId =
      (req.body.condominio_id as string) ||
      (req.headers["x-condominio-id"] as string);

    if (!targetCondominioId) {
      throw new AppError(
        "O ID do condomínio é obrigatório para registrar entrada.",
        400,
      );
    }

    const visita = await registrarEntrada.execute({
      ...req.body,
      condominio_id: targetCondominioId,
      autorizado_por_id: usuario.id, // 🔥 Importante: Grava quem autorizou/registrou na portaria
    });

    return res.status(201).json({ success: true, id: visita.id });
  }

  async saida(req: Request, res: Response) {
    const { id } = req.params;
    const registrarSaida = VisitantesFactory.makeRegistrarSaida();

    await registrarSaida.execute({
      id,
      dataSaida: new Date(),
    });

    return res.status(200).json({ success: true });
  }

  /**
   * 🔍 Método único consolidado: Substitui listarAbertas e listarHistorico
   */
  async listar(req: Request, res: Response) {
    // 1. Extrai o usuário logado para aplicar regras de segurança (ex: morador só vê o dele)
    const usuario = getAuthUser(req);

    // 2. Extraímos os filtros da query params
    const {
      page = 1,
      limit = 10,
      condominio_id,
      bloco,
      unidade,
      cpf,
      status,
    } = req.query;

    // 3. Validação: Query ou Header
    const targetCondominioId =
      (condominio_id as string) || (req.headers["x-condominio-id"] as string);

    if (!targetCondominioId) {
      throw new AppError("O ID do condomínio é obrigatório.", 400);
    }

    // 4. Chama a Factory atualizada
    const useCase = VisitantesFactory.makeListarVisitas();

    // 5. Executa passando os filtros e os dados de segurança do usuário
    const result = await useCase.execute(
      {
        condominio_id: targetCondominioId,
        page: Number(page),
        limit: Number(limit),
        bloco: bloco as string,
        unidade: unidade as string,
        cpf: cpf as string,
        status: status as string, // Ex: 'aberta' ou 'finalizada'
      },
      usuario.id, // Passado para segurança multi-tenant
      usuario.perfil, // Passado para segurança multi-tenant
    );

    return res.json(result);
  }
}
