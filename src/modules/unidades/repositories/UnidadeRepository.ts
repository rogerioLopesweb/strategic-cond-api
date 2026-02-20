import { db } from "@shared/infra/database/connection";
import {
  ListUnidadeFilters,
  // GerarUnidadesDTO removido daqui pois não é mais usado neste arquivo
  BuscarMoradoresDTO,
  VincularMoradorDTO,
} from "../schemas/unidadeSchema";

export class UnidadeRepository {
  /**
   * 🔍 Lista unidades com filtros de bloco/número e paginação
   */
  async listar(filters: ListUnidadeFilters) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 10;
    const offset = (page - 1) * limit;

    const values = [
      filters.condominio_id,
      filters.bloco?.toUpperCase() || null,
      filters.unidade || null,
    ];

    const dataQuery = `
      SELECT u.id, u.bloco, u.numero_unidade,
        (SELECT us.nome_completo FROM unidade_usuarios uu 
         JOIN usuarios us ON us.id = uu.usuario_id 
         WHERE uu.unidade_id = u.id AND uu.tipo_vinculo = 'proprietario' 
         AND uu.status = true LIMIT 1) as nome_proprietario
      FROM unidades u
      WHERE u.condominio_id = $1 
        AND ($2::text IS NULL OR u.bloco = $2)
        AND ($3::text IS NULL OR u.numero_unidade = $3)
      ORDER BY u.bloco ASC, LENGTH(u.numero_unidade) ASC, u.numero_unidade ASC
      LIMIT $4 OFFSET $5;
    `;

    const countQuery = `
      SELECT COUNT(*)::int as total FROM unidades
      WHERE condominio_id = $1 
        AND ($2::text IS NULL OR bloco = $2)
        AND ($3::text IS NULL OR numero_unidade = $3);
    `;

    const [rows, count] = await Promise.all([
      db.query(dataQuery, [...values, limit, offset]),
      db.query(countQuery, values),
    ]);

    return {
      data: rows.rows,
      total: count.rows[0].total,
      page,
      limit,
    };
  }

  /**
   * 🏗️ Inserção em massa de unidades (ignora duplicatas)
   * Recebe apenas a matriz processada pelo Use Case
   */
  async gerarEmMassa(unidadesParaInserir: string[][]) {
    const query = `
      INSERT INTO unidades (condominio_id, bloco, numero_unidade)
      SELECT * FROM UNNEST($1::uuid[], $2::text[], $3::text[])
      ON CONFLICT (condominio_id, bloco, numero_unidade) DO NOTHING
      RETURNING *;
    `;

    const values = [
      unidadesParaInserir.map((u) => u[0]),
      unidadesParaInserir.map((u) => u[1]),
      unidadesParaInserir.map((u) => u[2]),
    ];

    return await db.query(query, values);
  }

  /**
   * 🎯 Busca uma unidade específica por ID
   */
  async buscarPorId(id: string) {
    const res = await db.query(`SELECT * FROM unidades WHERE id = $1`, [id]);
    return res.rows[0];
  }

  /**
   * 텍 Buscar ID da unidade por texto (usado no vínculo simplificado)
   */
  async buscarUnidadePorTexto(
    condominioId: string,
    bloco: string,
    numero: string,
  ) {
    const res = await db.query(
      `SELECT id FROM unidades WHERE condominio_id = $1 AND UPPER(bloco) = UPPER($2) AND numero_unidade = $3`,
      [condominioId, bloco, numero],
    );
    return res.rows[0];
  }

  /**
   * 👥 Busca moradores vinculados a uma unidade específica
   */
  async buscarMoradores(filters: BuscarMoradoresDTO) {
    const query = `
      SELECT u.id AS usuario_id, u.nome_completo AS "Nome", uu.tipo_vinculo AS "Tipo",
             uu.status as status, TO_CHAR(uu.data_entrada, 'DD/MM/YYYY') as data_entrada
      FROM unidade_usuarios uu
      INNER JOIN usuarios u ON uu.usuario_id = u.id
      INNER JOIN unidades uni ON uu.unidade_id = uni.id
      WHERE uu.condominio_id = $1 AND UPPER(uni.bloco) = UPPER($2) AND uni.numero_unidade = $3
      ORDER BY uu.status DESC, uu.data_entrada DESC;
    `;
    const { rows } = await db.query(query, [
      filters.condominio_id,
      filters.bloco,
      filters.unidade,
    ]);
    return rows;
  }

  /**
   * 🔗 Executa a transação de vínculo (Condomínio + Unidade)
   */
  async vincularMorador(dados: VincularMoradorDTO): Promise<void> {
    const client = await db.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `INSERT INTO vinculos_condominio (usuario_id, condominio_id, perfil, ativo)
         VALUES ($1, $2, 'morador', true) 
         ON CONFLICT (usuario_id, condominio_id) DO NOTHING`,
        [dados.usuario_id, dados.condominio_id],
      );

      const checkUnidade = await client.query(
        "SELECT 1 FROM unidade_usuarios WHERE usuario_id = $1 AND unidade_id = $2",
        [dados.usuario_id, dados.unidade_id],
      );

      if ((checkUnidade.rowCount ?? 0) > 0) {
        await client.query(
          `UPDATE unidade_usuarios SET status = true, tipo_vinculo = $3, data_entrada = CURRENT_TIMESTAMP, data_saida = NULL 
            WHERE usuario_id = $1 AND unidade_id = $2`,
          [dados.usuario_id, dados.unidade_id, dados.tipo_vinculo],
        );
      } else {
        await client.query(
          `INSERT INTO unidade_usuarios (usuario_id, unidade_id, condominio_id, tipo_vinculo, status, data_entrada) 
            VALUES ($1, $2, $3, $4, true, CURRENT_TIMESTAMP)`,
          [
            dados.usuario_id,
            dados.unidade_id,
            dados.condominio_id,
            dados.tipo_vinculo,
          ],
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 🔄 Atualiza o status de um vínculo existente (Soft Delete/Reativação)
   */
  async atualizarStatusVinculo(
    usuarioId: string,
    unidadeId: string,
    status: boolean,
  ) {
    const query = `
      UPDATE unidade_usuarios 
      SET status = $3, 
          data_saida = CASE WHEN $3 = false THEN CURRENT_TIMESTAMP ELSE NULL END,
          updated_at = CURRENT_TIMESTAMP
      WHERE usuario_id = $1 AND unidade_id = $2
      RETURNING id;
    `;
    const result = await db.query(query, [usuarioId, unidadeId, status]);
    return (result.rowCount ?? 0) > 0;
  }
}
