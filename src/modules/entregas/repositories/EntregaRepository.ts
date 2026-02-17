import { db } from "@shared/infra/database/connection";
import { ListEntregaFilters } from "../schemas/entregaSchema";
import { Entrega } from "../entities/Entrega";

export class EntregaRepository {
  /**
   * 💾 Salva uma nova entrega (Persistência da Entidade)
   */
  async salvar(entrega: Entrega) {
    const p = entrega.props;
    const query = `
      INSERT INTO entregas (
        condominio_id, operador_entrada_id, unidade, bloco, marketplace, 
        codigo_rastreio, morador_id, observacoes, status, url_foto_etiqueta, 
        retirada_urgente, tipo_embalagem
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING *`;

    const res = await db.query(query, [
      p.condominio_id,
      p.operador_entrada_id,
      p.unidade,
      p.bloco,
      p.marketplace,
      p.codigo_rastreio,
      p.morador_id,
      p.observacoes,
      p.status,
      p.url_foto_etiqueta,
      p.retirada_urgente,
      p.tipo_embalagem,
    ]);
    return res.rows[0];
  }

  async buscarPorId(id: string) {
    const res = await db.query(`SELECT * FROM entregas WHERE id = $1`, [id]);
    return res.rows[0];
  }

  /**
   * 🔍 Listar entregas com filtros cumulativos e segurança Multi-tenant
   */
  async listar(
    filters: ListEntregaFilters,
    usuarioId?: string,
    perfil?: string,
  ) {
    const {
      condominio_id,
      unidade,
      bloco,
      status,
      retirada_urgente,
      page = 1,
      limit = 10,
    } = filters;

    const offset = (page - 1) * limit;
    const values: any[] = [condominio_id];

    let queryBase = `WHERE e.condominio_id = $1`;
    let count = 2;

    // 🛡️ SEGURANÇA: Se for morador, restringe ao ID dele
    if (perfil === "morador" && usuarioId) {
      queryBase += ` AND e.morador_id = $${count++}`;
      values.push(usuarioId);
    }

    // 🔍 FILTROS DINÂMICOS
    if (unidade) {
      queryBase += ` AND e.unidade ILIKE $${count++}`;
      values.push(`${unidade}%`);
    }

    if (bloco) {
      queryBase += ` AND e.bloco ILIKE $${count++}`;
      values.push(`${bloco}%`);
    }

    if (status) {
      queryBase += ` AND e.status = $${count++}`;
      values.push(status);
    }

    // 🔥 FILTRO DE URGÊNCIA (Trata string e boolean com segurança)
    if (Boolean(retirada_urgente) === true || retirada_urgente === "true") {
      queryBase += ` AND e.retirada_urgente = true`;
    }

    const dataQuery = `
      SELECT 
        e.*, 
        u.nome_completo AS morador_nome, 
        op_in.nome_completo AS operador_entrada_nome,
        op_out.nome_completo AS operador_saida_nome
      FROM entregas e
      LEFT JOIN usuarios u ON e.morador_id = u.id
      LEFT JOIN usuarios op_in ON e.operador_entrada_id = op_in.id
      LEFT JOIN usuarios op_out ON e.operador_saida_id = op_out.id
      ${queryBase} 
      ORDER BY e.data_recebimento DESC 
      LIMIT $${count++} OFFSET $${count++}`;

    const totalQuery = `SELECT COUNT(*) as total FROM entregas e ${queryBase}`;

    const [resData, resTotal] = await Promise.all([
      db.query(dataQuery, [...values, limit, offset]),
      db.query(totalQuery, values),
    ]);

    const totalRecords = parseInt(resTotal.rows[0].total);

    return {
      data: resData.rows,
      pagination: {
        total: totalRecords,
        page,
        limit,
        total_pages: Math.ceil(totalRecords / limit),
      },
    };
  }

  /**
   * ✍️ Atualiza status ou campos específicos
   */
  async atualizarStatus(id: string, campos: Partial<Entrega["props"]>) {
    const keys = Object.keys(campos);

    // Evita erro de SQL se o objeto de campos vier vazio
    if (keys.length === 0) return null;

    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
    const query = `
      UPDATE entregas 
      SET ${setClause} 
      WHERE id = $${keys.length + 1} 
      RETURNING *`;

    const res = await db.query(query, [...Object.values(campos), id]);
    return res.rows[0];
  }
}
