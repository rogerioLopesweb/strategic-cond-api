const db = require('../config/db');

const listarUnidades = async (req, res) => {
    const { condominio_id, bloco, unidade, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    try {
        // Query para buscar os dados com filtros opcionais
        const dataQuery = `
            SELECT id, bloco, numero_unidade
            FROM unidades
            WHERE condominio_id = $1
              AND ($2::text IS NULL OR bloco = $2)
              AND ($3::text IS NULL OR numero_unidade = $3)
            ORDER BY bloco ASC, numero_unidade::integer ASC
            LIMIT $4 OFFSET $5;
        `;

        // Query para contar o total (necessário para a paginação no frontend)
        const countQuery = `
            SELECT COUNT(*) 
            FROM unidades
            WHERE condominio_id = $1
              AND ($2::text IS NULL OR bloco = $2)
              AND ($3::text IS NULL OR numero_unidade = $3);
        `;

        const values = [condominio_id, bloco || null, unidade || null];
        
        const [rowsResult, countResult] = await Promise.all([
            db.query(dataQuery, [...values, limit, offset]),
            db.query(countQuery, values)
        ]);

        const totalItems = parseInt(countResult.rows[0].count);

        res.json({
            success: true,
            data: rowsResult.rows,
            pagination: {
                total: totalItems,
                page: parseInt(page),
                limit: parseInt(limit),
                total_pages: Math.ceil(totalItems / limit)
            }
        });
    } catch (error) {
        console.error('Erro ao listar unidades:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const gerarUnidadesEmMassa = async (req, res) => {
    const { condominio_id, blocos, inicio, fim } = req.body;

    try {
        const unidadesInseridas = [];
        
        for (const bloco of blocos) {
            for (let i = inicio; i <= fim; i++) {
                unidadesInseridas.push([condominio_id, bloco, i.toString()]);
            }
        }

        // A query está perfeita, Rogério. 
        // O "ON CONFLICT" garante que se a unidade já existir, ele pula sem dar erro.
        const query = `
            INSERT INTO unidades (condominio_id, bloco, numero_unidade)
            SELECT * FROM UNNEST($1::uuid[], $2::text[], $3::text[])
            ON CONFLICT (condominio_id, bloco, numero_unidade) DO NOTHING
            RETURNING *;
        `;

        const values = [
            unidadesInseridas.map(u => u[0]),
            unidadesInseridas.map(u => u[1]),
            unidadesInseridas.map(u => u[2])
        ];

        const result = await pool.query(query, values);

        // Se rowCount for 0 e unidadesInseridas tiver itens, 
        // significa que tudo já estava cadastrado.
        res.json({ 
            success: true, 
            novas_unidades: result.rowCount,
            total_processado: unidadesInseridas.length,
            message: result.rowCount === 0 ? 'Todas as unidades já estavam cadastradas.' : 'Unidades geradas com sucesso.'
        });
        
    } catch (error) {
        console.error('Erro ao gerar unidades:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
const vincularMoradorUnidade = async (req, res) => {
    const { usuario_id, condominio_id, unidade_id, tipo_vinculo } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Garante o vínculo geral com o condomínio
        await client.query(`
            INSERT INTO vinculos_condominio (usuario_id, condominio_id, perfil, ativo)
            VALUES ($1, $2, 'morador', true)
            ON CONFLICT (usuario_id, condominio_id) DO UPDATE SET ativo = true;
        `, [usuario_id, condominio_id]);

        // 2. Cria o vínculo específico com a unidade
        const result = await client.query(`
            INSERT INTO unidade_usuarios (usuario_id, unidade_id, condominio_id, tipo_vinculo, status)
            VALUES ($1, $2, $3, $4, 'ativo')
            RETURNING id;
        `, [usuario_id, unidade_id, condominio_id, tipo_vinculo]);

        await client.query('COMMIT');
        res.json({ success: true, vinculo_id: result.rows[0].id });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
};

const buscarMoradoresPorUnidade = async (req, res) => {
    // Pega direto dos parâmetros da URL
    const { condominio_id, bloco, unidade } = req.query;

    // Validação simples: todos os 3 precisam existir
    if (!condominio_id || !bloco || !unidade) {
        return res.status(400).json({ 
            success: false, 
            message: 'Parâmetros insuficientes: condominio_id, bloco e unidade são obrigatórios.' 
        });
    }

    try {
        const query = `
            SELECT 
                u.id AS usuario_id,
                u.nome_completo AS Nome,
                uu.tipo_vinculo AS Tipo
            FROM unidade_usuarios uu
            INNER JOIN usuarios u ON uu.usuario_id = u.id
            INNER JOIN unidades uni ON uu.unidade_id = uni.id
            WHERE uu.condominio_id = $1
              AND uni.bloco = $2
              AND uni.numero_unidade = $3
              AND uu.status = TRUE
            ORDER BY 
                CASE 
                    WHEN uu.tipo_vinculo = 'inquilino' THEN 1 
                    WHEN uu.tipo_vinculo = 'proprietario' THEN 2 
                    ELSE 3 
                END ASC;
        `;

        const { rows } = await db.query(query, [condominio_id, bloco, unidade]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Nenhum morador encontrado.' });
        }

        return res.json(rows);

    } catch (error) {
        console.error('Erro:', error);
        return res.status(500).json({ error: 'Erro interno no servidor.' });
    }
};

module.exports = { listarUnidades, buscarMoradoresPorUnidade, gerarUnidadesEmMassa, vincularMoradorUnidade };