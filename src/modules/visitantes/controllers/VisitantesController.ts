import { Request, Response } from "express";
import { VisitantesFactory } from "../factories/VisitantesFactory";
import { getAuthUser } from "@shared/providers/utils/getAuthUser";
import { AppError } from "@shared/errors/AppError";

export class VisitantesController {
  /**
   * 🚪 Registro de Entrada (Acesso em tempo real)
   */
  async entrada(req: Request, res: Response) {
    const usuario = getAuthUser(req);
    const registrarEntrada = VisitantesFactory.makeRegistrarEntrada();

    const targetCondominioId =
      (req.headers["x-condominio-id"] as string) || (req.body.condominio_id as string);

    if (!targetCondominioId) {
      throw new AppError("O ID do condomínio é obrigatório.", 400);
    }

    // Lógica de Autorização administrativa
    let autorizadoPor = req.body.autorizado_por_id;
    if (!autorizadoPor && !req.body.unidade_id) {
      autorizadoPor = usuario.id;
    }

    const visita = await registrarEntrada.execute({
      ...req.body,
      // Se houver foto_base64 no body, o UseCase processará através do StorageProvider
      condominio_id: targetCondominioId,
      autorizado_por_id: autorizadoPor,
      operador_id: usuario.id,
    });

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
   * 📊 Listagem de Acessos (Timeline da Portaria)
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
        status: status as string,
      },
      usuario.id,
      usuario.perfil
    );

    return res.json(result);
  }

  /**
   * 🔍 Busca rápida por CPF (Com Verificação de Segurança)
   */
  async buscarPorCpf(req: Request, res: Response) {
    const { cpf } = req.params;
    const targetCondominioId = req.headers["x-condominio-id"] as string;

    if (!cpf) throw new AppError("CPF é obrigatório.", 400);
    if (!targetCondominioId) throw new AppError("Contexto do condomínio não identificado.", 400);

    const useCase = VisitantesFactory.makeBuscarPorCpf();
    const result = await useCase.execute(cpf, targetCondominioId);

    if (!result) {
      return res.status(404).json({ 
        success: false, 
        message: "Visitante não encontrado. Prossiga para o cadastro." 
      });
    }

    return res.status(200).json(result);
  }

  // =================================================================
  // 👤 GESTÃO DE PESSOAS (CRM)
  // =================================================================

  /**
   * 👥 Listar Pessoas (Cadastros Únicos)
   */
  async listarPessoas(req: Request, res: Response) {
    const { search, page = 1, limit = 10 } = req.query;

    const useCase = VisitantesFactory.makeListarVisitantesPessoas();
    const result = await useCase.execute({
      search: search as string,
      page: Number(page),
      limit: Number(limit)
    });

    return res.json(result);
  }

  /**
   * 🖼️ Detalhes para o Modal (Dados + Histórico + Restrição)
   */
  async detalhes(req: Request, res: Response) {
    const { id } = req.params;
    const targetCondominioId = req.headers["x-condominio-id"] as string;

    if (!targetCondominioId) throw new AppError("ID do condomínio ausente.", 400);

    const useCase = VisitantesFactory.makeObterDetalhesVisitante();
    const detalhes = await useCase.execute(id, targetCondominioId);

    return res.json(detalhes);
  }

  /**
   * 📝 Cadastro Fixo de Pessoa
   */
  async cadastrarPessoa(req: Request, res: Response) {
    const useCase = VisitantesFactory.makeCadastrarVisitante();
    
    // Sem Multer: A foto vem no body como base64 ou url de storage temporário
    const { foto_url, foto_base64 } = req.body;

    const visitante = await useCase.execute({
      ...req.body,
      foto_url: foto_base64 || foto_url // Prioriza o base64 para processamento
    });

    return res.status(201).json(visitante);
  }

  /**
   * 🚫 Gerenciar Restrição (Bloquear/Desbloquear)
   */
  async gerenciarRestricao(req: Request, res: Response) {
    const { id: visitante_id } = req.params;
    const { acao, tipo_restricao, descricao, instrucao_portaria } = req.body;
    const targetCondominioId = req.headers["x-condominio-id"] as string;

    if (!targetCondominioId) throw new AppError("ID do condomínio ausente.", 400);

    const useCase = VisitantesFactory.makeGerenciarRestricao();

    await useCase.execute({
      visitante_id,
      condominio_id: targetCondominioId,
      acao,
      dados: { tipo_restricao, descricao, instrucao_portaria }
    });

    return res.json({ 
      success: true, 
      message: acao === "registrar" ? "Restrição aplicada." : "Restrição removida." 
    });
  }
}