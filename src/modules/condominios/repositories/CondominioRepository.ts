import { db } from "@shared/infra/database/connection";
import {
  ICreateCondominioDTO,
  IUpdateCondominioDTO,
  IListCondominioFilters,
} from "../dtos/condominio.dto";
import {
  ICondominioRepository,
  ICondominioListResult,
} from "./ICondominioRepository";
import { Condominio } from "../entities/Condominio";

export class CondominioRepository implements ICondominioRepository {
  async create(
    data: ICreateCondominioDTO,
    contaId: string,
  ): Promise<Condominio> {
    const query = `
      INSERT INTO condominios (nome_fantasia, razao_social, cnpj, logradouro, numero, bairro, cidade, estado, cep, ativo, conta_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10) 
      RETURNING *;
    `;
    const params = [
      data.nome_fantasia,
      data.razao_social,
      data.cnpj,
      data.logradouro,
      data.numero,
      data.bairro,
      data.cidade,
      data.estado,
      data.cep,
      contaId,
    ];

    const result = await db.query(query, params);
    return new Condominio(result.rows[0]);
  }

  async vincularUsuario(
    condominioId: string,
    usuarioId: string,
    perfil: string,
  ): Promise<void> {
    const query = `
      INSERT INTO vinculos_condominio (usuario_id, condominio_id, perfil, ativo) 
      VALUES ($1, $2, $3, true)
    `;
    await db.query(query, [usuarioId, condominioId, perfil]);
  }

  async update(
    id: string,
    data: IUpdateCondominioDTO,
  ): Promise<Condominio | null> {
    // O COALESCE garante que apenas os campos fornecidos sejam atualizados
    const query = `
      UPDATE condominios SET 
        nome_fantasia = COALESCE($1, nome_fantasia), 
        razao_social = COALESCE($2, razao_social),
        cnpj = COALESCE($3, cnpj), 
        logradouro = COALESCE($4, logradouro),
        numero = COALESCE($5, numero), 
        bairro = COALESCE($6, bairro),
        cidade = COALESCE($7, cidade), 
        estado = COALESCE($8, estado),
        cep = COALESCE($9, cep), 
        ativo = COALESCE($10, ativo), 
        atualizado_em = NOW()
      WHERE id = $11 
      RETURNING *;
    `;
    const params = [...Object.values(data), id];
    const result = await db.query(query, params);

    if (result.rowCount === 0) {
      return null;
    }
    return new Condominio(result.rows[0]);
  }

  async findById(id: string): Promise<Condominio | null> {
    const result = await db.query("SELECT * FROM condominios WHERE id = $1", [
      id,
    ]);
    if (result.rowCount === 0) {
      return null;
    }
    return new Condominio(result.rows[0]);
  }

  async findByIdComVinculo(
    id: string,
    usuarioId: string,
  ): Promise<Condominio | null> {
    const query = `
      SELECT c.* FROM condominios c
      INNER JOIN vinculos_condominio v ON c.id = v.condominio_id
      WHERE c.id = $1 AND v.usuario_id = $2 AND v.ativo = true
    `;
    const result = await db.query(query, [id, usuarioId]);
    if (result.rowCount === 0) {
      return null;
    }
    return new Condominio(result.rows[0]);
  }

  async findByCnpj(cnpj: string, contaId: string): Promise<Condominio | null> {
    const result = await db.query(
      "SELECT * FROM condominios WHERE cnpj = $1 AND conta_id = $2",
      [cnpj, contaId],
    );
    if (result.rowCount === 0) {
      return null;
    }
    return new Condominio(result.rows[0]);
  }

  async findAll(
    contaId: string,
    filters: IListCondominioFilters,
  ): Promise<ICondominioListResult> {
    const { page = 1, limit = 10, cidade } = filters;
    const offset = (page - 1) * limit;

    // TODO: Adicionar mais filtros dinâmicos de forma segura
    const whereClauses = ["conta_id = $1"];
    const params: any[] = [contaId];

    if (cidade) {
      params.push(`%${cidade}%`);
      whereClauses.push(`cidade ILIKE $${params.length}`);
    }

    const where =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const dataQuery = `SELECT * FROM condominios ${where} ORDER BY nome_fantasia ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const countQuery = `SELECT COUNT(*)::int as total FROM condominios ${where}`;

    const dataPromise = db.query(dataQuery, [...params, limit, offset]);
    const countPromise = db.query(countQuery, params);

    const [dataResult, countResult] = await Promise.all([
      dataPromise,
      countPromise,
    ]);

    return {
      data: dataResult.rows.map((row) => new Condominio(row)),
      total: countResult.rows[0].total,
    };
  }

  async delete(id: string): Promise<boolean> {
    // Implementação de exclusão lógica (soft delete)
    const result = await db.query(
      "UPDATE condominios SET ativo = false, atualizado_em = NOW() WHERE id = $1",
      [id],
    );
    return (result.rowCount ?? 0) > 0;
  }

  // O método listarMeus é específico e pode ser mantido ou movido para um caso de uso
  // que utiliza o findAll com filtros de usuário. Por enquanto, vamos mantê-lo separado
  // para não quebrar a funcionalidade existente.
  async listarMeus(
    usuarioId: string,
    filters: IListCondominioFilters,
  ): Promise<ICondominioListResult> {
    const { page = 1, limit = 10, cidade } = filters;
    const offset = (page - 1) * limit;

    const baseQuery = `
      FROM condominios c
      INNER JOIN vinculos_condominio v ON c.id = v.condominio_id
      WHERE v.usuario_id = $1 AND v.ativo = true
      AND ($2::text IS NULL OR c.cidade ILIKE $2)
    `;
    const params = [usuarioId, cidade ? `%${cidade}%` : null, limit, offset];

    const dataQuery = `SELECT c.*, v.perfil ${baseQuery} ORDER BY c.nome_fantasia ASC LIMIT $3 OFFSET $4`;
    const countQuery = `SELECT COUNT(*)::int as total ${baseQuery}`;

    const dataPromise = db.query(dataQuery, params);
    // Ajuste nos parâmetros para o count
    const countPromise = db.query(countQuery, [
      usuarioId,
      cidade ? `%${cidade}%` : null,
    ]);

    const [dataResult, countResult] = await Promise.all([
      dataPromise,
      countPromise,
    ]);

    return {
      data: dataResult.rows.map((row) => new Condominio(row)),
      total: countResult.rows[0].total,
    };
  }
  /**
   * Método otimizado para o Login:
   * - Sem paginação (traz tudo)
   * - Apenas campos essenciais
   * - Apenas vínculos ativos
   */
  async listarParaAuth(usuarioId: string) {
    const query = `
      SELECT 
        c.id, 
        c.nome_fantasia, 
        v.perfil
      FROM condominios c
      INNER JOIN vinculos_condominio v ON c.id = v.condominio_id
      WHERE v.usuario_id = $1 AND v.ativo = true
      ORDER BY c.nome_fantasia ASC
    `;

    const result = await db.query(query, [usuarioId]);

    // Retorna array puro com os dados essenciais
    return result.rows.map((row) => ({
      id: row.id,
      nome_fantasia: row.nome_fantasia,
      perfil: row.perfil,
    }));
  }
}
