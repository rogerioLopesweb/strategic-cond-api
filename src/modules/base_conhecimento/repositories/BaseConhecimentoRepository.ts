import { db } from "@shared/infra/database/connection";
import { BaseConhecimento } from "../entities/BaseConhecimento";
import { IBaseConhecimentoRepository } from "./IBaseConhecimentoRepository";
import { ICreateBaseConhecimentoDTO } from "../dtos/ICreateBaseConhecimentoDTO";
import { IUpdateBaseConhecimentoDTO } from "../dtos/IUpdateBaseConhecimentoDTO";
import { IListBaseConhecimentoFilters } from "../dtos/IListBaseConhecimentoFilters";
import { IBaseConhecimentoListResult } from "../dtos/IBaseConhecimentoListResult";

export class BaseConhecimentoRepository implements IBaseConhecimentoRepository {
  async create(data: ICreateBaseConhecimentoDTO): Promise<BaseConhecimento> {
    const query = `
      INSERT INTO base_conhecimento_informacoes 
        (condominio_id, titulo, categoria, descricao, id_user_cadastrou)
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *;
    `;
    const params = [
      data.condominio_id,
      data.titulo,
      data.categoria,
      data.descricao,
      data.id_user_cadastrou,
    ];

    const result = await db.query(query, params);
    return new BaseConhecimento(result.rows[0]);
  }

  async update(
    id: string,
    condominio_id: string,
    data: IUpdateBaseConhecimentoDTO,
  ): Promise<BaseConhecimento | null> {
    // Usamos COALESCE para atualizar apenas os campos que vieram no DTO
    const query = `
      UPDATE base_conhecimento_informacoes SET 
        titulo = COALESCE($1, titulo), 
        categoria = COALESCE($2, categoria),
        descricao = COALESCE($3, descricao),
        id_user_alterou = $4,
        data_alteracao = CURRENT_TIMESTAMP
      WHERE id = $5 AND condominio_id = $6 AND deletado_em IS NULL
      RETURNING *;
    `;
    const params = [
      data.titulo ?? null,
      data.categoria ?? null,
      data.descricao ?? null,
      data.id_user_alterou,
      id,
      condominio_id,
    ];

    const result = await db.query(query, params);

    if (result.rowCount === 0) return null;
    return new BaseConhecimento(result.rows[0]);
  }

  async findById(
    id: string,
    condominio_id: string,
  ): Promise<BaseConhecimento | null> {
    const query = `
      SELECT * FROM base_conhecimento_informacoes 
      WHERE id = $1 AND condominio_id = $2 AND deletado_em IS NULL
    `;
    const result = await db.query(query, [id, condominio_id]);

    if (result.rowCount === 0) return null;
    return new BaseConhecimento(result.rows[0]);
  }

  async findAll(
    condominio_id: string,
    filters: IListBaseConhecimentoFilters,
  ): Promise<IBaseConhecimentoListResult> {
    const { page = 1, limit = 10, categoria, busca } = filters;
    const offset = (page - 1) * limit;

    const whereClauses = ["condominio_id = $1", "deletado_em IS NULL"];
    const params: any[] = [condominio_id];

    if (categoria) {
      params.push(categoria);
      whereClauses.push(`categoria = $${params.length}`);
    }

    if (busca) {
      params.push(`%${busca}%`);
      whereClauses.push(
        `(titulo ILIKE $${params.length} OR descricao ILIKE $${params.length})`,
      );
    }

    const where = `WHERE ${whereClauses.join(" AND ")}`;

    const dataQuery = `
      SELECT * FROM base_conhecimento_informacoes 
      ${where} 
      ORDER BY categoria ASC, titulo ASC 
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    const countQuery = `SELECT COUNT(*)::int as total FROM base_conhecimento_informacoes ${where}`;

    const dataPromise = db.query(dataQuery, [...params, limit, offset]);
    const countPromise = db.query(countQuery, params);

    const [dataResult, countResult] = await Promise.all([
      dataPromise,
      countPromise,
    ]);

    const totalRecords = countResult.rows[0].total;

    // ✅ Retorno padronizado para o Frontend renderizar a paginação
    return {
      data: dataResult.rows.map((row) => new BaseConhecimento(row)),
      pagination: {
        total: totalRecords,
        page: Number(page),
        limit: Number(limit),
        total_pages: Math.ceil(totalRecords / limit),
      },
    };
  }

  async delete(
    id: string,
    condominio_id: string,
    id_user_alterou: string,
  ): Promise<boolean> {
    // Soft Delete: Atualizamos a data de deleção em vez de apagar a linha
    const query = `
      UPDATE base_conhecimento_informacoes 
      SET deletado_em = CURRENT_TIMESTAMP, id_user_alterou = $1
      WHERE id = $2 AND condominio_id = $3 AND deletado_em IS NULL
    `;
    const result = await db.query(query, [id_user_alterou, id, condominio_id]);
    return (result.rowCount ?? 0) > 0;
  }

  // ====================================================================
  // 🧠 MÉTODOS DE INTELIGÊNCIA ARTIFICIAL (OTTO)
  // ====================================================================

  /**
   * Traz toda a base de conhecimento de forma "crua" e sem paginação
   * para o Assistente conseguir ler tudo de uma vez.
   */
  async buscarParaIA(condominio_id: string): Promise<BaseConhecimento[]> {
    const query = `
      SELECT titulo, categoria, descricao 
      FROM base_conhecimento_informacoes 
      WHERE condominio_id = $1 AND deletado_em IS NULL
    `;
    const result = await db.query(query, [condominio_id]);

    // O retorno puro é ótimo para fazer JSON.stringify() direto no Otto
    return result.rows.map((row) => new BaseConhecimento(row));
  }
}
