import { db } from "@shared/infra/database/connection";
import { Visitante } from "../entities/Visitante";
import { Visita } from "../entities/Visita";
import { IVisitantesRepository } from "./IVisitantesRepository";

export class VisitantesRepository implements IVisitantesRepository {
  // =================================================================
  // 1. GESTÃO DE PESSOAS (VISITANTES) - Tabela: visitantes
  // =================================================================

  async findByCpf(cpf: string): Promise<Visitante | null> {
    const query = `SELECT * FROM visitantes WHERE cpf = $1 LIMIT 1`;
    const result = await db.query(query, [cpf.replace(/\D/g, "")]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return new Visitante(
      {
        nome_completo: row.nome_completo,
        cpf: row.cpf,
        rg: row.rg,
        foto_url: row.foto_url,
        tipo_padrao: row.tipo_padrao,
        empresa: row.empresa, // ✅ Campo recuperado do cadastro fixo
        created_at: row.created_at,
      },
      row.id,
    );
  }

  async createVisitante(visitante: Visitante): Promise<Visitante> {
    const query = `
      INSERT INTO visitantes (nome_completo, cpf, rg, foto_url, tipo_padrao, empresa)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, created_at;
    `;

    const result = await db.query(query, [
      visitante.props.nome_completo,
      visitante.props.cpf.replace(/\D/g, ""),
      visitante.props.rg || null,
      visitante.props.foto_url || null,
      visitante.props.tipo_padrao,
      visitante.props.empresa || null, // ✅ Salva a empresa no cadastro da pessoa
    ]);

    const { id, created_at } = result.rows[0];
    return new Visitante({ ...visitante.props, created_at }, id);
  }

  async updateVisitante(visitante: Visitante): Promise<void> {
    const query = `
      UPDATE visitantes 
      SET nome_completo = $1, rg = $2, foto_url = $3, tipo_padrao = $4, empresa = $5, updated_at = NOW()
      WHERE id = $6
    `;

    await db.query(query, [
      visitante.props.nome_completo,
      visitante.props.rg || null,
      visitante.props.foto_url || null,
      visitante.props.tipo_padrao,
      visitante.props.empresa || null,
      visitante.id,
    ]);
  }

  // =================================================================
  // 2. GESTÃO DE ACESSOS (VISITAS) - Tabela: visitas
  // =================================================================

  async registrarEntrada(visita: Visita, operadorId: string): Promise<Visita> {
    const query = `
      INSERT INTO visitas (
        condominio_id, 
        visitante_id, 
        unidade_id, 
        autorizado_por_usuario_id, 
        placa_veiculo,
        empresa_prestadora, 
        observacoes, 
        status, 
        data_entrada,
        operador_entrada_id 
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id;
    `;

    const result = await db.query(query, [
      visita.props.condominio_id,
      visita.props.visitante_id,
      visita.props.unidade_id || null,
      visita.props.autorizado_por_id || null,
      visita.props.placa_veiculo || null,
      visita.props.empresa_prestadora || null, // ✅ Empresa específica desta visita
      visita.props.observacoes || null,
      visita.props.status || "aberta",
      visita.props.data_entrada || new Date(),
      operadorId,
    ]);

    return new Visita(visita.props, result.rows[0].id);
  }

  async registrarSaida(
    visitaId: string,
    dataSaida: Date,
    operadorId: string,
  ): Promise<void> {
    const query = `
      UPDATE visitas 
      SET data_saida = $1, status = 'finalizada', operador_saida_id = $3 
      WHERE id = $2
    `;
    await db.query(query, [dataSaida, visitaId, operadorId]);
  }

  // =================================================================
  // 3. LISTAGEM E FILTROS
  // =================================================================

  async listar(filters: any, usuarioId?: string, perfil?: string) {
    const {
      condominio_id,
      unidade,
      bloco,
      cpf,
      status,
      page = 1,
      limit = 10,
    } = filters;
    const offset = (page - 1) * limit;
    const values: any[] = [condominio_id];

    let queryBase = `
      FROM visitas v
      INNER JOIN visitantes vis ON v.visitante_id = vis.id
      LEFT JOIN unidades u ON v.unidade_id = u.id
      LEFT JOIN usuarios u_auth ON v.autorizado_por_usuario_id = u_auth.id
      LEFT JOIN usuarios op_in ON v.operador_entrada_id = op_in.id
      LEFT JOIN usuarios op_out ON v.operador_saida_id = op_out.id
      WHERE v.condominio_id = $1
    `;

    let count = 2;

    if (perfil === "morador" && usuarioId) {
      queryBase += ` AND (v.autorizado_por_usuario_id = $${count} OR u.id IN (SELECT unidade_id FROM usuarios_unidades WHERE usuario_id = $${count++}))`;
      values.push(usuarioId);
    }

    if (bloco) {
      queryBase += ` AND LOWER(TRIM(u.bloco)) = LOWER(TRIM($${count++}))`;
      values.push(bloco);
    }

    if (unidade) {
      queryBase += ` AND LOWER(TRIM(u.numero_unidade)) = LOWER(TRIM($${count++}))`;
      values.push(unidade);
    }

    if (cpf) {
      queryBase += ` AND vis.cpf = $${count++}`;
      values.push(cpf.replace(/\D/g, ""));
    }

    if (status) {
      queryBase += ` AND v.status = $${count++}`;
      values.push(status);
    }

    const dataQuery = `
      SELECT v.id as visita_id, v.data_entrada, v.data_saida, v.status, v.placa_veiculo, v.observacoes, v.empresa_prestadora,
             vis.nome_completo as nome_visitante, vis.cpf as cpf_visitante, vis.foto_url, vis.tipo_padrao as tipo,
             u.bloco, u.numero_unidade as unidade, u_auth.nome_completo as morador_nome,
             op_in.nome_completo as operador_entrada_nome, op_out.nome_completo as operador_saida_nome
      ${queryBase} ORDER BY v.data_entrada DESC LIMIT $${count++} OFFSET $${count++}
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
}
