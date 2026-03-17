import { Request, Response } from "express";
import { VisitantesFactory } from "../factories/VisitantesFactory";
import { getAuthUser } from "@shared/providers/utils/getAuthUser";
import { AppError } from "@shared/errors/AppError";

/**
 * VisitantesController: Interface de entrada para operações de CRM e Portaria.
 * Gerencia o fluxo entre as requisições HTTP e as Regras de Negócio (UseCases).
 */
export class VisitantesController {
  
  /**
   * 🔍 Helper Privado: Captura o ID do condomínio de forma robusta e segura.
   */
  private getCondominioId(req: Request): string {
    const id = (req.headers["x-condominio-id"] as string) || 
               (req.body.condominio_id as string) || 
               (req.query.condominio_id as string);

    if (!id) {
      throw new AppError("O contexto do condomínio (ID) é obrigatório.", 400);
    }
    return id;
  }

  // =================================================================
  // 1. GESTÃO DE ACESSOS (PORTARIA)
  // =================================================================

  /** 🚪 Registro de Entrada (Check-in) */
  async entrada(req: Request, res: Response) {
    const usuario = getAuthUser(req);
    const targetCondominioId = this.getCondominioId(req);
    const useCase = VisitantesFactory.makeRegistrarEntrada();

    const visita = await useCase.execute({
      ...req.body,
      condominio_id: targetCondominioId,
      operador_id: usuario.id,
    });

    return res.status(201).json({ 
      success: true, 
      id: visita.id,
      message: "Entrada registrada com sucesso." 
    });
  }

  /** 🏃 Registro de Saída (Check-out) */
  async saida(req: Request, res: Response) {
    const usuario = getAuthUser(req);
    const { id } = req.params;
    const targetCondominioId = this.getCondominioId(req);
    const useCase = VisitantesFactory.makeRegistrarSaida();

    await useCase.execute({
      id,
      condominio_id: targetCondominioId,
      operador_id: usuario.id,
    });

    return res.status(200).json({ success: true, message: "Saída registrada." });
  }

  /** 📊 Timeline de Acessos (Log Global) */
  async listarAcessos(req: Request, res: Response) {
    const usuario = getAuthUser(req);
    const targetCondominioId = this.getCondominioId(req);
    const { page, limit, bloco, unidade, cpf, status } = req.query;

    const useCase = VisitantesFactory.makeListarVisitanteAcessos();
    
    const result = await useCase.execute({
      condominio_id: targetCondominioId,
      page: Number(page) || 1,
      limit: Number(limit) || 12,
      bloco: bloco as string,
      unidade: unidade as string,
      cpf: cpf as string,
      status: status as string,
      usuario_id: usuario.id, 
      perfil: usuario.perfil
    });

    return res.json(result);
  }

  /** 🔍 Busca rápida por CPF para o motor de entrada */
  async buscarPorCpf(req: Request, res: Response) {
    const { cpf } = req.params;
    const targetCondominioId = this.getCondominioId(req);

    const useCase = VisitantesFactory.makeBuscarVisitantePorCpf();
    const result = await useCase.execute(cpf, targetCondominioId);

    if (!result) {
      return res.status(404).json({ success: false, message: "Visitante não localizado." });
    }

    return res.status(200).json(result);
  }

  // =================================================================
  // 2. GESTÃO DE VISITANTES (CRM)
  // =================================================================

  /** 📋 Lista a base mestra (Perfis) */
  async listarVisitantes(req: Request, res: Response) {
    const targetCondominioId = this.getCondominioId(req);
    const { search, page, limit, tem_restricao } = req.query;

    const useCase = VisitantesFactory.makeListarVisitantes();
    
    const result = await useCase.execute({
      condominio_id: targetCondominioId,
      search: search as string,
      tem_restricao: tem_restricao === "true" ? true : tem_restricao === "false" ? false : undefined,
      page: Number(page) || 1,
      limit: Number(limit) || 12
    });

    return res.json(result);
  }

  /** 🗂️ Dossiê Completo (Dados para o Modal) */
  async detalhes(req: Request, res: Response) {
    const { id } = req.params;
    const targetCondominioId = this.getCondominioId(req);

    const useCase = VisitantesFactory.makeObterDetalhesVisitante();
    const detalhes = await useCase.execute(id, targetCondominioId);
    
    return res.json(detalhes);
  }

  /** ➕ Criar perfil mestre */
  async cadastrar(req: Request, res: Response) {
    const usuario = getAuthUser(req);
    const targetCondominioId = this.getCondominioId(req);
    const useCase = VisitantesFactory.makeCadastrarVisitante();
    
    const visitante = await useCase.execute({
      ...req.body,
      condominio_id: targetCondominioId,
      operador_id: usuario.id 
    });

    return res.status(201).json(visitante);
  }

  /** 📝 Editar perfil mestre */
  async atualizar(req: Request, res: Response) {
    const { id } = req.params;
    const usuario = getAuthUser(req);
    const targetCondominioId = this.getCondominioId(req);
    const useCase = VisitantesFactory.makeUpdateVisitante();

    const visitante = await useCase.execute({
      id,
      ...req.body,
      condominio_id: targetCondominioId,
      operador_id: usuario.id 
    });

    return res.status(200).json(visitante);
  }

  /** 🗑️ Excluir perfil mestre */
  async excluir(req: Request, res: Response) {
    const { id } = req.params;
    const usuario = getAuthUser(req);
    const targetCondominioId = this.getCondominioId(req);
    const useCase = VisitantesFactory.makeExcluirVisitante();

    await useCase.execute({ 
      id, 
      condominio_id: targetCondominioId,
      operador_id: usuario.id 
    });

    return res.status(204).send();
  }

  // =================================================================
  // 3. SEGURANÇA (RESTRIÇÕES)
  // =================================================================

  /** 🛡️ Registrar novo bloqueio */
  async registrarRestricao(req: Request, res: Response) {
    const usuario = getAuthUser(req);
    const { id: visitante_id } = req.params;
    const targetCondominioId = this.getCondominioId(req);
    const useCase = VisitantesFactory.makeRegistrarRestricao();

    await useCase.execute({
      visitante_id,
      condominio_id: targetCondominioId,
      operador_id: usuario.id,
      dados: req.body.dados
    });

    return res.status(201).json({ success: true, message: "Restrição aplicada." });
  }

  /** ✍️ Editar textos do bloqueio */
  async atualizarRestricao(req: Request, res: Response) {
    const usuario = getAuthUser(req);
    const { id } = req.params; // ID da restrição
    const targetCondominioId = this.getCondominioId(req);
    const useCase = VisitantesFactory.makeUpdateRestricao();

    await useCase.execute({
      id,
      condominio_id: targetCondominioId,
      operador_id: usuario.id,
      dados: req.body.dados
    });

    return res.json({ success: true, message: "Restrição atualizada." });
  }

  /** 🔌 Desativar bloqueio (Resolver conflito) */
  async cancelarRestricao(req: Request, res: Response) {
    const usuario = getAuthUser(req);
    const { id } = req.params; // ID da restrição
    const targetCondominioId = this.getCondominioId(req);
    const useCase = VisitantesFactory.makeCancelarRestricao();

    await useCase.execute({
      id,
      condominio_id: targetCondominioId,
      operador_id: usuario.id
    });

    return res.json({ success: true, message: "Bloqueio desativado." });
  }

  /** 🗑️ Excluir registro de restrição */
  async excluirRestricao(req: Request, res: Response) {
    const usuario = getAuthUser(req);
    const { id } = req.params; // ID da restrição
    const targetCondominioId = this.getCondominioId(req);
    const useCase = VisitantesFactory.makeExcluirRestricao();

    await useCase.execute({
      id,
      condominio_id: targetCondominioId,
      operador_id: usuario.id
    });

    return res.status(204).send();
  }
}