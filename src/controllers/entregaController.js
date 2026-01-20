const pool = require('../config/db');
const storage = require('../services/storageService');

// 1. Registro de Entrada (Portaria recebe o pacote)
const registrarEntrega = async (req, res) => {
    const { 
        codigo_rastreio, unidade, bloco, morador_id, 
        marketplace, observacoes, foto_base64, condominio_id 
    } = req.body;

    const operador_entrada_id = req.usuarioId || (req.usuario && req.usuario.id);

    if (!operador_entrada_id) {
        return res.status(401).json({ success: false, message: 'Operador não identificado.' });
    }

    try {
        let url_foto = null;
        if (foto_base64) {
            const nomeArquivo = `entrega-${unidade}-${bloco}`;
            const pathRelativo = await storage.uploadFoto(foto_base64, nomeArquivo);
            if (pathRelativo) {
                url_foto = await storage.gerarLinkVisualizacao(pathRelativo);
            }
        }

        const query = `
            INSERT INTO entregas (
                condominio_id, operador_entrada_id, unidade, bloco, 
                codigo_rastreio, marketplace, morador_id, observacoes, 
                status, data_recebimento, url_foto_etiqueta
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'recebido', NOW(), $9)
            RETURNING *`;

        const values = [condominio_id, operador_entrada_id, unidade, bloco, codigo_rastreio, marketplace, morador_id, observacoes, url_foto];
        const result = await pool.query(query, values);

        res.status(201).json({ success: true, message: 'Entrega registrada!', entrega: result.rows[0] });
    } catch (error) {
        if (error.code === '23503') {
            return res.status(400).json({ success: false, message: 'Morador ou Condomínio inválido.' });
        }
        res.status(500).json({ success: false, message: 'Erro ao salvar no banco.' });
    }
};

// 2. Listagem Inteligente (Filtros e Paginação)
const listarEntregas = async (req, res) => {
    const { unidade, bloco, status, codigo_rastreio, morador_id, pagina = 1, limite = 10 } = req.query;
    const condominio_id = req.usuario.condominio_id; 
    const offset = (pagina - 1) * limite;

    try {
        let query = `SELECT * FROM entregas WHERE condominio_id = $1`;
        let values = [condominio_id];
        let count = 2;

        if (unidade) { query += ` AND unidade = $${count++}`; values.push(unidade); }
        if (bloco) { query += ` AND bloco = $${count++}`; values.push(bloco); }
        if (status) { query += ` AND status = $${count++}`; values.push(status); }
        if (morador_id) { query += ` AND morador_id = $${count++}`; values.push(morador_id); }
        if (codigo_rastreio) { 
            query += ` AND codigo_rastreio ILIKE $${count++}`; 
            values.push(`%${codigo_rastreio}%`); 
        }

        query += ` ORDER BY data_recebimento DESC LIMIT $${count++} OFFSET $${count++}`;
        values.push(limite, offset);

        const result = await pool.query(query, values);
        const totalResult = await pool.query(`SELECT COUNT(*) FROM entregas WHERE condominio_id = $1`, [condominio_id]);

        res.json({
            success: true,
            meta: { total: parseInt(totalResult.rows[0].count), pagina: parseInt(pagina), limite: parseInt(limite) },
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao buscar entregas.' });
    }
};

// 3. Baixa Manual (Porteiro identifica quem retirou)
const registrarSaidaManual = async (req, res) => {
    const { id } = req.params;
    const { quem_retirou, documento_retirou } = req.body;
    const operador_saida_id = req.usuarioId || (req.usuario && req.usuario.id);

    try {
        const query = `
            UPDATE entregas 
            SET status = 'entregue', data_entrega = NOW(), operador_saida_id = $1,
                quem_retirou = $2, documento_retirou = $3
            WHERE id = $4 AND status = 'recebido' RETURNING *`;

        const result = await pool.query(query, [operador_saida_id, quem_retirou, documento_retirou, id]);
        
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Entrega indisponível.' });

        res.json({ success: true, message: 'Saída manual registrada!', entrega: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 4. Baixa via QR Code (Auto-atendimento/Rápida)
const registrarSaidaQRCode = async (req, res) => {
    const { id } = req.params;
    const operador_saida_id = req.usuarioId || (req.usuario && req.usuario.id);

    try {
        const query = `
            UPDATE entregas 
            SET status = 'entregue', data_entrega = NOW(), operador_saida_id = $1,
                quem_retirou = 'Portador do QR Code (Autorizado)', documento_retirou = 'Validado via App'
            WHERE id = $2 AND status = 'recebido' RETURNING *`;

        const result = await pool.query(query, [operador_saida_id, id]);

        if (result.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'QR Code inválido ou já utilizado.' });
        }

        res.json({ success: true, message: 'Retirada via QR Code confirmada!', entrega: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao processar QR Code.' });
    }
};

module.exports = { registrarEntrega, listarEntregas, registrarSaidaQRCode, registrarSaidaManual };