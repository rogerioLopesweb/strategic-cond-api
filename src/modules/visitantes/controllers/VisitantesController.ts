import { Request, Response } from "express";
import { VisitantesFactory } from "../factories/VisitantesFactory";
import { getAuthUser } from "@shared/providers/utils/getAuthUser";
import { AppError } from "@shared/errors/AppError";

export class VisitantesController {
  /**
   * 🚪 Registro de Entrada
   */
  async entrada(req: Request, res: Response) {
    const usuario = getAuthUser(req);
    const registrarEntrada = VisitantesFactory.makeRegistrarEntrada();

    // Priorizamos o ID do condomínio que vem do cabeçalho (injetado pelo middleware de segurança)
    const targetCondominioId =
      (req.headers["x-condominio-id"] as string) || (req.body.condominio_id as string);

    if (!targetCondominioId) {
      throw new AppError("O ID do condomínio é obrigatório.", 400);
    }

    // 🧠 Lógica de Autorização:
    // Se não há morador autorizando e não há unidade alvo, a visita é administrativa.
    // O operador (porteiro) assume a responsabilidade pela entrada.
    let autorizadoPor = req.body.autorizado_por_id;
    if (!autorizadoPor && !req.body.unidade_id) {
      autorizadoPor = usuario.id;
    }

    const visita = await registrarEntrada.execute({
      ...req.body, // Aqui já deve vir o foto_base64 se o app enviar
      condominio_id: targetCondominioId,
      autorizado_por_id: autorizadoPor,
      operador_id: usuario.id, // Auditoria: quem operou o sistema
    });

    // Como o ID agora é gerado pelo Postgres, o UseCase retorna a entidade persistida
    return res.status(201).json({ 
      success: true, 
      id: visita.id,
      message: "Entrada registrada com sucesso." 
    });
  }

  /**
   * 🏃 Registro de Saída
   */
  async saida(req: Request, res: Response) {
    const usuario = getAuthUser(req);
    const { id } = req.params;

    const registrarSaida = VisitantesFactory.makeRegistrarSaida();

    await registrarSaida.execute({
      id,
      dataSaida: new Date(),
      operador_id: usuario.id,
    });

    return res.status(200).json({ success: true, message: "Saída confirmada." });
  }

  /**
   * 🔍 Listagem dinâmica (Fila de Abertas ou Histórico)
   */
  async listar(req: Request, res: Response) {
    const usuario = getAuthUser(req);

    const {
      page = 1,
      limit = 10,
      condominio_id,
      bloco,
      unidade,
      cpf,
      status,
    } = req.query;

    const targetCondominioId =
      (req.headers["x-condominio-id"] as string) || (condominio_id as string);

    if (!targetCondominioId) {
      throw new AppError("O ID do condomínio é obrigatório para listagem.", 400);
    }

    const useCase = VisitantesFactory.makeListarVisitas();

    const result = await useCase.execute(
      {
        condominio_id: targetCondominioId,
        page: Number(page),
        limit: Number(limit),
        bloco: bloco as string,
        unidade: unidade as string,
        cpf: cpf as string,
        status: status as string, // Ex: 'aberta' para a tela de "Quem está no prédio"
      },
      usuario.id,
      usuario.perfil
    );

    return res.json(result);
  }

  /**
   * 🆔 Busca rápida por CPF (Verifica se já é cadastrado)
   */
  async buscarPorCpf(req: Request, res: Response) {
    const { cpf } = req.params;

    if (!cpf) {
      throw new AppError("CPF é obrigatório para a busca.", 400);
    }

    const useCase = VisitantesFactory.makeBuscarPorCpf();
    const visitante = await useCase.execute(cpf);

    if (!visitante) {
      // 404 é o correto semanticamente. O front lida com o catch.
      return res.status(404).json({ 
        success: false, 
        message: "Visitante não encontrado no banco de dados." 
      });
    }

    return res.status(200).json(visitante);
  }
}