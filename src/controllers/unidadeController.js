const pool = require("../config/db");

/**
 * 1. LISTAGEM: Lista unidades com filtros
 */
const listarUnidades = async (req, res) => {
  const { condominio_id, bloco, unidade, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * Number(limit);

  try {
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

    // ✅ SQL: Adicionamos "as total" para o nome ficar explícito
    const countQuery = `
            SELECT COUNT(*)::int as total FROM unidades
            WHERE condominio_id = $1
              AND ($2::text IS NULL OR bloco = $2)
              AND ($3::text IS NULL OR numero_unidade = $3);
        `;

    const values = [condominio_id, bloco || null, unidade || null];

    /** @type {[import('pg').QueryResult, import('pg').QueryResult]} */
    const [rowsResult, countResult] = await Promise.all([
      pool.query(dataQuery, [...values, limit, offset]),
      pool.query(countQuery, values),
    ]);

    // ✅ ACESSO SEGURO: Usamos o alias "total" que definimos no SQL
    // O JS agora entende que rows[0] tem a propriedade total
    const totalItems = countResult.rows[0]?.total || 0;

    res.json({
      success: true,
      data: rowsResult.rows,
      pagination: {
        total: totalItems,
        page: Number(page),
        limit: Number(limit),
        total_pages: Math.ceil(totalItems / Number(limit)),
      },
    });
  } catch (error) {
    console.error("StrategicCond - Erro ao listar:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * 2. GERAÇÃO EM MASSA: Cria unidades em lote com proteção contra duplicatas
 */
const gerarUnidadesEmMassa = async (req, res) => {
  const { condominio_id, blocos, inicio, fim } = req.body;

  try {
    const unidadesInseridas = [];
    for (const bloco of blocos) {
      for (let i = inicio; i <= fim; i++) {
        unidadesInseridas.push([condominio_id, bloco, i.toString()]);
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

    res.json({
      success: true,
      novas_unidades: result.rowCount,
      total_processado: unidadesInseridas.length,
      message:
        result.rowCount === 0
          ? "Todas as unidades já estavam cadastradas."
          : "Unidades geradas com sucesso.",
    });
  } catch (error) {
    console.error("StrategicCond - Erro ao gerar unidades:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * 3. BUSCA DE MORADORES: Retorna quem vive em uma unidade específica (Apenas Ativos)
 */
const buscarMoradoresPorUnidade = async (req, res) => {
  const { condominio_id, bloco, unidade } = req.query;

  if (!condominio_id || !bloco || !unidade) {
    return res.status(400).json({
      success: false,
      message:
        "Parâmetros insuficientes: condominio_id, bloco e unidade são obrigatórios.",
    });
  }

  try {
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

    const { rows } = await pool.query(query, [condominio_id, bloco, unidade]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Nenhum morador encontrado." });
    }

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("StrategicCond - Erro ao buscar moradores:", error);
    return res
      .status(500)
      .json({ success: false, error: "Erro interno no servidor." });
  }
};

/**
 * 4. VINCULAR MORADOR: Cria ou reativa vínculo com status booleano e datas
 */
const vincularMoradorUnidade = async (req, res) => {
  const { usuario_id, condominio_id, unidade_id, tipo_vinculo } = req.body;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Garante vínculo geral com o condomínio
    await client.query(
      `
            INSERT INTO vinculos_condominio (usuario_id, condominio_id, perfil, ativo)
            VALUES ($1, $2, 'morador', true)
            ON CONFLICT (usuario_id, condominio_id) DO UPDATE SET ativo = true;
        `,
      [usuario_id, condominio_id],
    );

    // Cria ou reativa o vínculo patrimonial (Upsert)
    await client.query(
      `
            INSERT INTO unidade_usuarios (usuario_id, unidade_id, condominio_id, tipo_vinculo, status, data_entrada)
            VALUES ($1, $2, $3, $4, true, CURRENT_TIMESTAMP)
            ON CONFLICT (usuario_id, unidade_id) 
            DO UPDATE SET 
                status = true, 
                tipo_vinculo = $4, 
                data_entrada = CURRENT_TIMESTAMP, 
                data_saida = NULL,
                updated_at = CURRENT_TIMESTAMP;
        `,
      [usuario_id, unidade_id, condominio_id, tipo_vinculo],
    );

    await client.query("COMMIT");
    res.json({ success: true, message: "Morador vinculado com sucesso!" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("StrategicCond - Erro ao vincular morador:", error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
};

/**
 * 5. ATUALIZAR STATUS: Gerencia o botão de "SAÍDA" (Soft Delete Histórico)
 */
const atualizarStatusVinculo = async (req, res) => {
  const { usuario_id, unidade_id, status } = req.body; // status false = saída

  try {
    const query = `
            UPDATE unidade_usuarios 
            SET status = $3, 
                data_saida = CASE WHEN $3 = false THEN CURRENT_TIMESTAMP ELSE NULL END,
                updated_at = CURRENT_TIMESTAMP
            WHERE usuario_id = $1 AND unidade_id = $2
            RETURNING id;
        `;
    const result = await pool.query(query, [usuario_id, unidade_id, status]);

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Vínculo não encontrado." });
    }

    res.json({
      success: true,
      message: status
        ? "Vínculo ativado."
        : "Saída registrada com sucesso no histórico.",
    });
  } catch (error) {
    console.error("StrategicCond - Erro ao atualizar vínculo:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * 6. VINCULAR POR TEXTO: Busca o ID da unidade e vincula (Usado na Edição)
 */
/**
 * ✅ VINCULAR MORADOR (Tradução de Bloco/Número para ID)
 */
const vincularMoradorPorBloco = async (req, res) => {
  const {
    usuario_id,
    condominio_id,
    identificador_bloco,
    numero,
    tipo_vinculo,
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Busca o ID da unidade pelo texto enviado
    const unidadeRes = await client.query(
      `SELECT id FROM unidades 
             WHERE condominio_id = $1 AND bloco = $2 AND numero_unidade = $3`,
      [condominio_id, identificador_bloco, numero],
    );

    if (unidadeRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Unidade não encontrada neste condomínio.",
      });
    }

    const unidade_id = unidadeRes.rows[0].id;

    // 2. Insere o vínculo (ou atualiza se já existir)
    // Usamos ON CONFLICT para evitar erro de duplicidade se o morador já estiver lá
    await client.query(
      `
            INSERT INTO unidade_usuarios (
                usuario_id, 
                unidade_id, 
                condominio_id, 
                tipo_vinculo, 
                status, 
                data_entrada
            )
            VALUES ($1, $2, $3, $4, true, NOW())
            ON CONFLICT (usuario_id, unidade_id) 
            DO UPDATE SET 
                tipo_vinculo = EXCLUDED.tipo_vinculo, 
                status = true, 
                data_saida = NULL
        `,
      [usuario_id, unidade_id, condominio_id, tipo_vinculo],
    );

    await client.query("COMMIT");
    res.json({ success: true, message: "Vínculo patrimonial criado!" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao vincular unidade:", error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
};

module.exports = {
  listarUnidades,
  buscarMoradoresPorUnidade,
  gerarUnidadesEmMassa,
  vincularMoradorUnidade,
  vincularMoradorPorBloco,
  atualizarStatusVinculo,
};
