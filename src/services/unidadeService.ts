import pool from "../config/db";
import {
  ListUnidadeFilters,
  GerarUnidadesDTO,
  BuscarMoradoresDTO,
  VincularMoradorDTO,
  VincularMoradorTextoDTO,
  AtualizarStatusVinculoDTO,
} from "../schemas/unidadeSchema";

export class UnidadeService {
  async listar(filters: ListUnidadeFilters) {
    const offset = (filters.page - 1) * filters.limit;

    const dataQuery = `
            SELECT 
                u.id, 
                u.bloco, 
                u.numero_unidade,
                (SELECT us.nome_completo 
                 FROM unidade_usuarios uu 
                 JOIN usuarios us ON us.id = uu.usuario_id 
                 WHERE uu.unidade_id = u.id 
                 AND uu.tipo_vinculo = 'proprietario' 
                 AND uu.status = true 
                 LIMIT 1) as nome_proprietario
            FROM unidades u
            WHERE u.condominio_id = $1
            AND ($2::text IS NULL OR u.bloco = $2)
            AND ($3::text IS NULL OR u.numero_unidade = $3)
            ORDER BY 
                u.bloco ASC, 
                LENGTH(u.numero_unidade) ASC, 
                u.numero_unidade ASC
            LIMIT $4 OFFSET $5;
        `;

    const countQuery = `
            SELECT COUNT(*)::int as total FROM unidades
            WHERE condominio_id = $1
              AND ($2::text IS NULL OR bloco = $2)
              AND ($3::text IS NULL OR numero_unidade = $3);
        `;

    const values = [
      filters.condominio_id,
      filters.bloco || null,
      filters.unidade || null,
    ];

    const [rowsResult, countResult] = await Promise.all([
      pool.query(dataQuery, [...values, filters.limit, offset]),
      pool.query(countQuery, values),
    ]);

    return {
      data: rowsResult.rows,
      total: countResult.rows[0].total,
    };
  }

  async gerarEmMassa(dados: GerarUnidadesDTO) {
    const unidadesInseridas: any[] = [];
    for (const bloco of dados.blocos) {
      for (let i = dados.inicio; i <= dados.fim; i++) {
        unidadesInseridas.push([dados.condominio_id, bloco, i.toString()]);
      }
    }

    const query = `
            INSERT INTO unidades (condominio_id, bloco, numero_unidade)
            SELECT * FROM UNNEST($1::uuid[], $2::text[], $3::text[])
            ON CONFLICT (condominio_id, bloco, numero_unidade) DO NOTHING
            RETURNING *;
        `;

    const values = [
      unidadesInseridas.map((u) => u[0]),
      unidadesInseridas.map((u) => u[1]),
      unidadesInseridas.map((u) => u[2]),
    ];

    const result = await pool.query(query, values);

    return {
      novas_unidades: result.rowCount,
      total_processado: unidadesInseridas.length,
    };
  }

  async buscarMoradores(filters: BuscarMoradoresDTO) {
    const query = `
            SELECT
                u.id AS usuario_id,
                u.nome_completo AS "Nome",
                uu.tipo_vinculo AS "Tipo",
                uu.status as status,
                TO_CHAR(uu.data_entrada, 'DD/MM/YYYY') as data_entrada,
                TO_CHAR(uu.data_saida, 'DD/MM/YYYY') as data_saida
            FROM unidade_usuarios uu
            INNER JOIN usuarios u ON uu.usuario_id = u.id
            INNER JOIN unidades uni ON uu.unidade_id = uni.id
            WHERE uu.condominio_id = $1
              AND uni.bloco = $2
              AND uni.numero_unidade = $3
            ORDER BY uu.status DESC, uu.data_entrada DESC;
        `;

    const { rows } = await pool.query(query, [
      filters.condominio_id,
      filters.bloco,
      filters.unidade,
    ]);
    return rows;
  }

  async vincular(dados: VincularMoradorDTO) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Verifica/Cria vínculo com o condomínio
      const checkCondo = await client.query(
        "SELECT 1 FROM vinculos_condominio WHERE usuario_id = $1 AND condominio_id = $2",
        [dados.usuario_id, dados.condominio_id],
      );

      if (checkCondo.rowCount === 0) {
        await client.query(
          `INSERT INTO vinculos_condominio (usuario_id, condominio_id, perfil, ativo)
           VALUES ($1, $2, 'morador', true)`,
          [dados.usuario_id, dados.condominio_id],
        );
      }

      // 2. Verifica/Atualiza vínculo com a unidade
      const checkUnidade = await client.query(
        "SELECT 1 FROM unidade_usuarios WHERE usuario_id = $1 AND unidade_id = $2",
        [dados.usuario_id, dados.unidade_id],
      );

      if (checkUnidade.rowCount && checkUnidade.rowCount > 0) {
        await client.query(
          `UPDATE unidade_usuarios SET status = true, tipo_vinculo = $3, data_entrada = CURRENT_TIMESTAMP, data_saida = NULL WHERE usuario_id = $1 AND unidade_id = $2`,
          [dados.usuario_id, dados.unidade_id, dados.tipo_vinculo],
        );
      } else {
        await client.query(
          `INSERT INTO unidade_usuarios (usuario_id, unidade_id, condominio_id, tipo_vinculo, status, data_entrada) VALUES ($1, $2, $3, $4, true, CURRENT_TIMESTAMP)`,
          [
            dados.usuario_id,
            dados.unidade_id,
            dados.condominio_id,
            dados.tipo_vinculo,
          ],
        );
      }

      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async vincularPorTexto(dados: VincularMoradorTextoDTO) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Busca o ID da unidade pelo texto enviado
      const unidadeRes = await client.query(
        `SELECT id FROM unidades 
                 WHERE condominio_id = $1 AND bloco = $2 AND numero_unidade = $3`,
        [dados.condominio_id, dados.identificador_bloco, dados.numero],
      );

      if (unidadeRes.rows.length === 0) {
        throw new Error("Unidade não encontrada neste condomínio.");
      }

      const unidadeId = unidadeRes.rows[0].id;

      // 2. Verifica/Atualiza vínculo com a unidade
      const checkUnidade = await client.query(
        "SELECT 1 FROM unidade_usuarios WHERE usuario_id = $1 AND unidade_id = $2",
        [dados.usuario_id, unidadeId],
      );

      if (checkUnidade.rowCount && checkUnidade.rowCount > 0) {
        await client.query(
          `UPDATE unidade_usuarios SET status = true, tipo_vinculo = $3, data_entrada = NOW(), data_saida = NULL WHERE usuario_id = $1 AND unidade_id = $2`,
          [dados.usuario_id, unidadeId, dados.tipo_vinculo],
        );
      } else {
        await client.query(
          `INSERT INTO unidade_usuarios (usuario_id, unidade_id, condominio_id, tipo_vinculo, status, data_entrada) VALUES ($1, $2, $3, $4, true, NOW())`,
          [
            dados.usuario_id,
            unidadeId,
            dados.condominio_id,
            dados.tipo_vinculo,
          ],
        );
      }

      // 3. Verifica/Cria vínculo com o condomínio
      const checkCondo = await client.query(
        "SELECT 1 FROM vinculos_condominio WHERE usuario_id = $1 AND condominio_id = $2",
        [dados.usuario_id, dados.condominio_id],
      );

      if (checkCondo.rowCount === 0) {
        await client.query(
          `INSERT INTO vinculos_condominio (usuario_id, condominio_id, perfil, ativo) VALUES ($1, $2, 'morador', true)`,
          [dados.usuario_id, dados.condominio_id],
        );
      }

      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async atualizarStatus(dados: AtualizarStatusVinculoDTO) {
    const query = `
            UPDATE unidade_usuarios 
            SET status = $3, 
                data_saida = CASE WHEN $3 = false THEN CURRENT_TIMESTAMP ELSE NULL END,
                updated_at = CURRENT_TIMESTAMP
            WHERE usuario_id = $1 AND unidade_id = $2
            RETURNING id;
        `;
    const result = await pool.query(query, [
      dados.usuario_id,
      dados.unidade_id,
      dados.status,
    ]);

    return result.rowCount && result.rowCount > 0;
  }
}
