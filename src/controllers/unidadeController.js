const db = require('../config/db');

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

module.exports = { buscarMoradoresPorUnidade };