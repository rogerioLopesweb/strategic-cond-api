import pool from "../config/db";
import {
  CreateCondominioDTO,
  UpdateCondominioDTO,
  ListCondominioFilters,
} from "../schemas/condominioSchema";

export class CondominioService {
  /**
   * Cadastra um condomínio e vincula o usuário criador a ele.
   * Transacional.
   */
  async cadastrar(
    dados: CreateCondominioDTO,
    usuarioId: string,
    contaId: string,
  ) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Inserir Condomínio
      const queryCondo = `
                INSERT INTO condominios (
                    nome_fantasia, razao_social, cnpj, logradouro, 
                    numero, bairro, cidade, estado, cep, ativo, conta_id
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10)
                RETURNING id;
            `;

      const valuesCondo = [
        dados.nome_fantasia,
        dados.razao_social,
        dados.cnpj,
        dados.logradouro,
        dados.numero,
        dados.bairro,
        dados.cidade,
        dados.estado,
        dados.cep,
        contaId,
      ];

      const resCondo = await client.query(queryCondo, valuesCondo);
      const novoCondominioId = resCondo.rows[0].id;

      // 2. Criar Vínculo
      const queryVinculo = `
                INSERT INTO vinculos_condominio (usuario_id, condominio_id, perfil, ativo)
                VALUES ($1, $2, $3, true);
            `;
      await client.query(queryVinculo, [
        usuarioId,
        novoCondominioId,
        dados.perfil,
      ]);

      await client.query("COMMIT");
      return { condominio_id: novoCondominioId };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Atualiza dados do condomínio.
   * Segurança: Garante que o condomínio pertence à conta do usuário.
   */
  async atualizar(id: string, dados: UpdateCondominioDTO, contaId: string) {
    const query = `
            UPDATE condominios 
            SET 
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
            WHERE id = $11 AND conta_id = $12
            RETURNING id;
        `;

    const values = [
      dados.nome_fantasia,
      dados.razao_social,
      dados.cnpj,
      dados.logradouro,
      dados.numero,
      dados.bairro,
      dados.cidade,
      dados.estado,
      dados.cep,
      dados.ativo,
      id,
      contaId,
    ];

    const result = await pool.query(query, values);
    return result.rowCount && result.rowCount > 0;
  }

  /**
   * Busca por ID com verificação de segurança contextual (Master vs Comum).
   */
  async buscarPorId(
    id: string,
    usuarioId: string,
    contaId: string,
    isMaster: boolean,
  ) {
    let query = "";
    let values = [id];

    if (isMaster) {
      // Master vê se pertence à conta
      query = `SELECT * FROM condominios WHERE id = $1 AND conta_id = $2`;
      values.push(contaId);
    } else {
      // Usuário comum vê se tem vínculo
      query = `
                SELECT c.* FROM condominios c
                INNER JOIN vinculos_condominio v ON c.id = v.condominio_id
                WHERE c.id = $1 AND v.usuario_id = $2 AND v.ativo = true
            `;
      values.push(usuarioId);
    }

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Lista condomínios da conta (Visão Admin).
   */
  async listarPorConta(contaId: string, filters: ListCondominioFilters) {
    const offset = (filters.page - 1) * filters.limit;

    const baseConditions = `
            WHERE conta_id = $1
            AND ($2::text IS NULL OR cidade ILIKE $2)
            AND ($3::text IS NULL OR estado = $3)
            AND ($4::text IS NULL OR nome_fantasia ILIKE $4)
            AND ($5::text IS NULL OR cnpj = $5)
        `;

    const values = [
      contaId,
      filters.cidade ? `%${filters.cidade}%` : null,
      filters.estado || null,
      filters.nome_fantasia ? `%${filters.nome_fantasia}%` : null,
      filters.cnpj || null,
    ];

    const dataQuery = `
            SELECT * FROM condominios 
            ${baseConditions} 
            ORDER BY nome_fantasia ASC 
            LIMIT $6 OFFSET $7
        `;

    const countQuery = `SELECT COUNT(*)::int as total FROM condominios ${baseConditions}`;

    const [rowsResult, countResult] = await Promise.all([
      pool.query(dataQuery, [...values, filters.limit, offset]),
      pool.query(countQuery, values),
    ]);

    return {
      data: rowsResult.rows,
      total: countResult.rows[0].total,
    };
  }

  /**
   * Lista condomínios vinculados ao usuário (Visão App/Usuário).
   */
  async listarMeusCondominios(
    usuarioId: string,
    filters: ListCondominioFilters,
  ) {
    const offset = (filters.page - 1) * filters.limit;

    const baseConditions = `
            WHERE v.usuario_id = $1 
              AND v.ativo = true
              AND ($2::text IS NULL OR c.cidade ILIKE $2)
              AND ($3::text IS NULL OR c.estado = $3)
              AND ($4::text IS NULL OR c.nome_fantasia ILIKE $4)
              AND ($5::text IS NULL OR c.cnpj = $5)
        `;

    const values = [
      usuarioId,
      filters.cidade ? `%${filters.cidade}%` : null,
      filters.estado || null,
      filters.nome_fantasia ? `%${filters.nome_fantasia}%` : null,
      filters.cnpj || null,
    ];

    const dataQuery = `
            SELECT c.*, v.perfil 
            FROM condominios c
            INNER JOIN vinculos_condominio v ON c.id = v.condominio_id
            ${baseConditions}
            ORDER BY c.nome_fantasia ASC
            LIMIT $6 OFFSET $7
        `;

    const countQuery = `
            SELECT COUNT(*)::int as total 
            FROM condominios c
            INNER JOIN vinculos_condominio v ON c.id = v.condominio_id
            ${baseConditions}
        `;

    const [rowsResult, countResult] = await Promise.all([
      pool.query(dataQuery, [...values, filters.limit, offset]),
      pool.query(countQuery, values),
    ]);

    return {
      data: rowsResult.rows,
      total: countResult.rows[0].total,
    };
  }
}
