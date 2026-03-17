import { db } from "@shared/infra/database/connection";
import { Visitante } from "../entities/Visitante";
import { VisitanteAcessos } from "../entities/VisitanteAcessos";
import { IVisitantesRepository } from "./IVisitantesRepository";
import { IFiltersListVisitanteAcessosDTO } from "../dtos/IFiltersListVisitanteAcessosDTO";
import { IFiltersVisitantesDTO } from "../dtos/IFiltersVisitantesDTO";

/**
 * VisitantesRepository: Gestão de pessoas e histórico operacional 
 * com isolamento Multi-tenant (StrategicCond Standard).
 */
export class VisitantesRepository implements IVisitantesRepository {
  
  // =================================================================
  // 1. GESTÃO DE PESSOAS (VISITANTES / CRM)
  // =================================================================

  /**
   * Localiza um visitante pelo CPF dentro de um contexto de condomínio.
   */
  async findByCpf(cpf: string, condominio_id: string): Promise<Visitante | null> {
    const query = `
      SELECT * FROM visitantes 
      WHERE cpf = $1 AND condominio_id = $2 AND delete = false 
      LIMIT 1
    `;
    const result = await db.query(query, [cpf.replace(/\D/g, ""), condominio_id]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return new Visitante({
      ...row,
      data_cadastro: row.data_cadastro,
      operador_cadastro_id: row.operador_cadastro_id
    }, row.id);
  }

  /**
   * Localiza um visitante pelo UUID, validando a posse pelo condomínio.
   */
  async findById(id: string, condominio_id: string): Promise<Visitante | null> {
    const query = `
      SELECT * FROM visitantes 
      WHERE id = $1 AND condominio_id = $2 AND delete = false
    `;
    const result = await db.query(query, [id, condominio_id]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return new Visitante({
      ...row,
      data_cadastro: row.data_cadastro,
      operador_cadastro_id: row.operador_cadastro_id
    }, row.id);
  }

  /**
   * Lista os visitantes com filtros de busca e isolamento de dados.
   */
  async listarVisitantes(filters: IFiltersVisitantesDTO) {
    const { condominio_id, search, tem_restricao, page = 1, limit = 12 } = filters;
    const offset = (page - 1) * limit;
  
    // 1. Definição da Subquery de Segurança (Reutilizável)
    // Ela verifica se existe restrição ativa para o visitante no condomínio logado
    const subQueryRestricao = `
      SELECT 1 FROM visitante_restricoes r 
      WHERE r.visitante_id = v.id 
      AND r.condominio_id = v.condominio_id 
      AND r.ativo = true 
      AND r.delete = false
    `;
  
    const values: any[] = [condominio_id];
    let whereClause = `WHERE v.condominio_id = $1 AND v.delete = false`;
  
    // 2. Filtro de Busca Textual (Nome, CPF ou RG)
    if (search) {
      const searchClean = search.replace(/\D/g, "");
      // Usamos o índice $2 para todos para simplificar a query com ILIKE
      values.push(`%${search}%`); 
      const idx = values.length;
      
      whereClause += ` AND (
        v.nome_completo ILIKE $${idx} OR 
        v.cpf ILIKE $${idx} OR 
        v.rg ILIKE $${idx}
      )`;
    }
  
    // 3. Filtro de Segurança (Opcional - Ativado pelo Switch no App)
    if (tem_restricao !== undefined) {
      whereClause += tem_restricao === true 
        ? ` AND EXISTS (${subQueryRestricao})` 
        : ` AND NOT EXISTS (${subQueryRestricao})`;
    }
  
    // 4. Montagem da Query com a coluna 'tem_restricao' para o Frontend
    const dataQuery = `
      SELECT 
        v.*,
        EXISTS (${subQueryRestricao}) as tem_restricao -- 🎯 Coluna crucial para o ícone vermelho
      FROM visitantes v
      ${whereClause} 
      ORDER BY v.nome_completo ASC 
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
  
    const totalQuery = `SELECT COUNT(v.id) as total FROM visitantes v ${whereClause}`;
  
    // 5. Execução Paralela
    const [resData, resTotal] = await Promise.all([
      db.query(dataQuery, [...values, limit, offset]),
      db.query(totalQuery, values),
    ]);
  
    return {
      data: resData.rows,
      total: parseInt(resTotal.rows[0].total)
    };
  }

  /**
   * Cria o perfil mestre do visitante já vinculado ao condomínio.
   */
  async createVisitante(visitante: Visitante): Promise<Visitante> {
    const query = `
      INSERT INTO visitantes (
        nome_completo, cpf, rg, foto_url, tipo, empresa, 
        operador_cadastro_id, condominio_id, data_cadastro
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id, data_cadastro;
    `;

    const result = await db.query(query, [
      visitante.props.nome_completo,
      visitante.props.cpf.replace(/\D/g, ""),
      visitante.props.rg || null,
      visitante.props.foto_url || null,
      visitante.props.tipo,
      visitante.props.empresa || null,
      visitante.props.operador_cadastro_id,
      visitante.props.condominio_id
    ]);

    const { id, data_cadastro } = result.rows[0];
    return new Visitante({ ...visitante.props, data_cadastro }, id);
  }

  /**
   * Atualiza dados cadastrais com trava de segurança por condomínio.
   */
  async updateVisitante(visitante: Visitante, operadorId: string): Promise<void> {
    const query = `
      UPDATE visitantes 
      SET nome_completo = $1, rg = $2, foto_url = $3, tipo = $4, empresa = $5, 
          operador_atualizacao_id = $6, data_atualizacao = NOW()
      WHERE id = $7 AND condominio_id = $8
    `;

    await db.query(query, [
      visitante.props.nome_completo,
      visitante.props.rg || null,
      visitante.props.foto_url || null,
      visitante.props.tipo,
      visitante.props.empresa || null,
      operadorId,
      visitante.id,
      visitante.props.condominio_id
    ]);
  }

  // =================================================================
  // 2. GESTÃO DE RESTRIÇÕES (SEGURANÇA 1:N)
  // =================================================================

  async verificarRestricaoAtiva(visitanteId: string, condominioId: string): Promise<any | null> {
    const query = `
      SELECT tipo_restricao, descricao, instrucao_portaria, data_cadastro 
      FROM visitante_restricoes 
      WHERE visitante_id = $1 AND condominio_id = $2 AND ativo = true AND delete = false
      ORDER BY data_cadastro DESC LIMIT 1
    `;
    const result = await db.query(query, [visitanteId, condominioId]);
    return result.rows[0] || null;
  }

  async listarRestricoes(visitanteId: string, condominioId: string): Promise<any[]> {
    const query = `
      SELECT r.*, u.nome_completo as operador_nome
      FROM visitante_restricoes r
      LEFT JOIN usuarios u ON r.operador_cadastro_id = u.id
      WHERE r.visitante_id = $1 AND r.condominio_id = $2 AND r.delete = false
      ORDER BY r.data_cadastro DESC
    `;
    const result = await db.query(query, [visitanteId, condominioId]);
    return result.rows;
  }

  async registrarRestricao(dados: any): Promise<void> {
    const query = `
      INSERT INTO visitante_restricoes (
        visitante_id, condominio_id, tipo_restricao, descricao, 
        instrucao_portaria, operador_cadastro_id, ativo, data_cadastro
      )
      VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
    `;
    await db.query(query, [
      dados.visitante_id,
      dados.condominio_id,
      dados.tipo_restricao,
      dados.descricao,
      dados.instrucao_portaria,
      dados.operador_cadastro_id
    ]);
  }

  /**
   * ✍️ EDITAR: Atualiza os textos e o tipo de uma restrição existente.
   */
  async updateRestricao(id: string, condominioId: string, dados: any): Promise<void> {
    const query = `
      UPDATE visitante_restricoes 
      SET tipo_restricao = $1, 
          descricao = $2, 
          instrucao_portaria = $3,
          operador_atualizacao_id = $4,
          data_atualizacao = NOW()
      WHERE id = $5 AND condominio_id = $6
    `;
    await db.query(query, [
      dados.tipo_restricao,
      dados.descricao,
      dados.instrucao_portaria,
      dados.operador_id,
      id,
      condominioId
    ]);
  }

  /**
   * 🔌 DESATIVAR: Mantém o registro histórico, mas libera o acesso do visitante.
   */
  async cancelarRestricao(id: string, operadorId: string, condominioId: string): Promise<void> {
    /** * 💡 SET ativo = NOT ativo: Inverte o valor booleano atual.
     * Também atualizamos a data e o operador para manter o log de quem "mexeu" por último.
     */
    const query = `
      UPDATE visitante_restricoes 
      SET 
        ativo = NOT ativo, 
        data_cancelamento = NOW(), 
        operador_cancelamento_id = $1 
      WHERE id = $2 AND condominio_id = $3
    `;
    
    await db.query(query, [operadorId, id, condominioId]);
  }

  /**
   * 🗑️ EXCLUIR: Soft delete para remover restrições inseridas por erro.
   */
  async excluirRestricao(id: string, operadorId: string, condominioId: string): Promise<void> {
    const query = `
      UPDATE visitante_restricoes 
      SET "delete" = true, -- Use aspas se a coluna for palavra reservada
          operador_exclusao_id = $1, 
          data_exclusao = NOW(),
          ativo = false 
      WHERE id = $2 AND condominio_id = $3
    `;
    await db.query(query, [operadorId, id, condominioId]);
  }

  // =================================================================
  // 3. GESTÃO DE ACESSOS (VISITAS)
  // =================================================================

  async registrarEntrada(visita: VisitanteAcessos, operadorId: string): Promise<VisitanteAcessos> {
    const query = `
      INSERT INTO visitante_acessos (
        condominio_id, visitante_id, unidade_id, autorizado_por_usuario_id, 
        placa_veiculo, empresa_prestadora, observacoes, status, 
        data_entrada, operador_entrada_id 
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'aberta', NOW(), $8)
      RETURNING id, data_entrada;
    `;

    const result = await db.query(query, [
      visita.props.condominio_id,
      visita.props.visitante_id,
      visita.props.unidade_id || null,
      visita.props.autorizado_por_id || null,
      visita.props.placa_veiculo || null,
      visita.props.empresa_prestadora || null,
      visita.props.observacoes || null,
      operadorId,
    ]);

    const { id } = result.rows[0];

    // Lógica de Notificação Push (Omitida para brevidade, mas mantida no seu original)
    // ...

    return new VisitanteAcessos({ ...visita.props }, id);
  }

  async registrarSaida(visitaId: string, operadorId: string, condominioId: string): Promise<void> {
    const query = `
      UPDATE visitante_acessos SET data_saida = NOW(), status = 'finalizada', operador_saida_id = $1 
      WHERE id = $2 AND condominio_id = $3
    `;
    await db.query(query, [operadorId, visitaId, condominioId]);
  }

  async listarHistoricoPorVisitante(visitanteId: string, condominioId: string): Promise<any[]> {
    const query = `
      SELECT v.data_entrada, v.data_saida, v.status,
             u.bloco, u.numero_unidade as unidade,
             op.nome_completo as registrado_por
      FROM visitante_acessos v
      LEFT JOIN unidades u ON v.unidade_id = u.id
      LEFT JOIN usuarios op ON v.operador_entrada_id = op.id
      WHERE v.visitante_id = $1 AND v.condominio_id = $2
      ORDER BY v.data_entrada DESC LIMIT 20;
    `;
    const result = await db.query(query, [visitanteId, condominioId]);
    return result.rows;
  }

  async listarAcessos(filters: IFiltersListVisitanteAcessosDTO) {
    const { condominio_id, status, bloco, unidade, cpf, page = 1, limit = 10, usuario_id, perfil } = filters;
    const offset = (page - 1) * limit;
    const values: any[] = [condominio_id];
    let count = 2;
  
    let queryBase = `
      FROM visitante_acessos v
      INNER JOIN visitantes vis ON v.visitante_id = vis.id
      LEFT JOIN unidades u ON v.unidade_id = u.id
      LEFT JOIN usuarios op_in ON v.operador_entrada_id = op_in.id
      WHERE v.condominio_id = $1
    `;
  
    if (perfil === "morador" && usuario_id) {
      queryBase += ` AND v.autorizado_por_usuario_id = $${count++}`;
      values.push(usuario_id);
    }
  
    if (status) { queryBase += ` AND v.status = $${count++}`; values.push(status); }
    if (bloco) { queryBase += ` AND u.bloco ILIKE $${count++}`; values.push(`%${bloco}%`); }
    if (unidade) { queryBase += ` AND u.numero_unidade ILIKE $${count++}`; values.push(`%${unidade}%`); }
    if (cpf) { queryBase += ` AND vis.cpf = $${count++}`; values.push(cpf.replace(/\D/g, "")); }
  
    const dataQuery = `
      SELECT v.*, vis.nome_completo as nome_visitante, vis.foto_url, vis.tipo, u.bloco, u.numero_unidade as unidade,
             op_in.nome_completo as operador_entrada_nome
      ${queryBase} 
      ORDER BY v.data_entrada DESC 
      LIMIT $${count} OFFSET $${count + 1}
    `;
  
    const totalQuery = `SELECT COUNT(v.id) as total ${queryBase}`;
  
    const [resData, resTotal] = await Promise.all([
      db.query(dataQuery, [...values, limit, offset]),
      db.query(totalQuery, values),
    ]);
  
    return {
      data: resData.rows,
      pagination: {
        total: parseInt(resTotal.rows[0].total),
        page,
        limit,
        total_pages: Math.ceil(parseInt(resTotal.rows[0].total) / limit),
      },
    };
  }

  async delete(id: string, operadorId: string, condominioId: string): Promise<void> {
    const query = `
      UPDATE visitantes 
      SET delete = true, operador_atualizacao_id = $1, data_atualizacao = NOW() 
      WHERE id = $2 AND condominio_id = $3
    `;
    await db.query(query, [operadorId, id, condominioId]);
  }
}