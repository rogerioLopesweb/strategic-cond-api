const db = require('../config/db');

/**
 * Lista moradores ativos de uma unidade
 * Segurança: O condominio_id é extraído prioritariamente do Token (req.user)
 */
const buscarMoradoresPorUnidade = async (req, res) => {
    // 1. Identificação do Condomínio (Extraído do Token via Middleware de Auth)
    const condominio_id = req.user?.condominio_id || req.query.condominio_id;
    
    // 2. Extração e Limpeza dos parâmetros (trim remove espaços acidentais)
    const bloco = req.query.bloco?.trim();
    const unidade = req.query.unidade?.trim();

    // 3. Validação rigorosa
    if (!condominio_id) {
        return res.status(401).json({ error: 'Não autorizado: Condomínio não identificado.' });
    }

    if (!bloco || !unidade) {
        return res.status(400).json({ error: 'Parâmetros obrigatórios: bloco e unidade.' });
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
                END ASC, u.nome_completo ASC;
        `;

        const { rows } = await db.query(query, [condominio_id, bloco, unidade]);

        // 4. Retorno amigável
        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Nenhum morador ativo encontrado para esta unidade.' 
            });
        }

        return res.json(rows);

    } catch (error) {
        console.error('❌ Erro na query de busca de morador:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Erro interno ao processar a busca de moradores.' 
        });
    }
};

module.exports = { buscarMoradoresPorUnidade };