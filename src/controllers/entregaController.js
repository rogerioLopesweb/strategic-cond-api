const pool = require('../config/db');
const storage = require('../services/storageService');

// 1. Registro de Entrada (Portaria recebe o pacote)
const registrarEntrega = async (req, res) => {
    const { 
        codigo_rastreio, unidade, bloco, morador_id, 
        marketplace, observacoes, foto_base64, condominio_id,
        // Novos campos recebidos do Front-end
        retirada_urgente, tipo_embalagem 
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
                condominio_id, 
                operador_entrada_id, 
                unidade, 
                bloco, 
                codigo_rastreio, 
                marketplace, 
                morador_id, 
                observacoes, 
                status, 
                data_recebimento, 
                url_foto_etiqueta,
                retirada_urgente,
                tipo_embalagem
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, 'recebido', NOW(), $9, $10, $11
            )
            RETURNING *`;

        // Tratamento de valores padrão para garantir a integridade
        const values = [
            condominio_id, 
            operador_entrada_id, 
            unidade, 
            bloco, 
            codigo_rastreio, 
            marketplace, 
            morador_id, 
            observacoes, 
            url_foto,
            retirada_urgente || false, // Default como falso
            tipo_embalagem || 'Pacote' // Default como Pacote
        ];

        const result = await pool.query(query, values);

        res.status(201).json({ 
            success: true, 
            message: 'Entrega registrada com sucesso!', 
            entrega: result.rows[0] 
        });
        
    } catch (error) {
        console.error('Erro ao registrar entrega:', error);
        if (error.code === '23503') {
            return res.status(400).json({ success: false, message: 'Morador ou Condomínio inválido.' });
        }
        res.status(500).json({ success: false, message: 'Erro ao salvar no banco de dados.' });
    }
};

// Função para atualizar uma entrega existente
const atualizarEntrega = async (req, res) => {
    const { id } = req.params; // ID da entrega
    const { 
        unidade, 
        bloco, 
        morador_id, 
        marketplace, 
        observacoes, 
        codigo_rastreio,
        retirada_urgente,
        tipo_embalagem
    } = req.body;

    const condominio_id = req.usuario.condominio_id;

    try {
        // Primeiro verificamos se a entrega pertence ao condomínio do usuário
        const buscaEntrega = await pool.query(
            'SELECT id FROM entregas WHERE id = $1 AND condominio_id = $2', 
            [id, condominio_id]
        );

        if (buscaEntrega.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Entrega não encontrada ou sem permissão para editar.' 
            });
        }

        const query = `
            UPDATE entregas 
            SET 
                unidade = COALESCE($1, unidade),
                bloco = COALESCE($2, bloco),
                morador_id = COALESCE($3, morador_id),
                marketplace = COALESCE($4, marketplace),
                observacoes = COALESCE($5, observacoes),
                codigo_rastreio = COALESCE($6, codigo_rastreio),
                retirada_urgente = COALESCE($7, retirada_urgente),
                tipo_embalagem = COALESCE($8, tipo_embalagem),
                atualizado_em = NOW()
            WHERE id = $9 AND condominio_id = $10
            RETURNING *`;

        const values = [
            unidade, 
            bloco, 
            morador_id, 
            marketplace, 
            observacoes, 
            codigo_rastreio, 
            retirada_urgente, 
            tipo_embalagem,
            id, 
            condominio_id
        ];

        const result = await pool.query(query, values);

        res.json({ 
            success: true, 
            message: 'Cadastro atualizado com sucesso!', 
            entrega: result.rows[0] 
        });

    } catch (error) {
        console.error('Erro ao atualizar entrega:', error);
        res.status(500).json({ success: false, message: 'Erro interno ao atualizar cadastro.' });
    }
};
// Função para deletar uma entrega
const deletarEntrega = async (req, res) => {
    const { id } = req.params;
    const condominio_id = req.usuario.condominio_id; // Pegando do Token JWT

    try {
        // 1. Verificamos se a entrega existe, se pertence ao condomínio e se o status é 'recebido' (pendente)
        const checkQuery = `
            SELECT status FROM entregas 
            WHERE id = $1 AND condominio_id = $2
        `;
        const checkResult = await pool.query(checkQuery, [id, condominio_id]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Entrega não encontrada ou você não tem permissão.' 
            });
        }

        const statusAtual = checkResult.rows[0].status;

        // 2. Trava de Segurança: Só deleta se for 'recebido'
        if (statusAtual !== 'recebido') {
            return res.status(400).json({ 
                success: false, 
                message: 'Não é possível deletar uma entrega que já foi retirada ou devolvida.' 
            });
        }

        // 3. Executa a deleção
        await pool.query('DELETE FROM entregas WHERE id = $1', [id]);

        res.json({ 
            success: true, 
            message: 'Entrega removida com sucesso!' 
        });

    } catch (error) {
        console.error('Erro ao deletar entrega:', error);
        res.status(500).json({ success: false, message: 'Erro interno ao processar a deleção.' });
    }
};

// 2. Listagem Inteligente (Filtros e Paginação)
const listarEntregas = async (req, res) => {
    const { unidade, bloco, status, codigo_rastreio, morador_id, pagina = 1, limite = 10 } = req.query;
    const condominio_id = req.usuario.condominio_id; 
    const offset = (pagina - 1) * limite;

    try {
        // Query melhorada com JOINs para trazer dados do morador e seu perfil
        let query = `
            SELECT 
                e.*, 
                u.nome_completo AS morador_nome, 
                u.telefone AS morador_telefone,
                vc.perfil AS morador_tipo
            FROM entregas e
            LEFT JOIN usuarios u ON e.morador_id = u.id
            LEFT JOIN vinculos_condominio vc ON u.id = vc.usuario_id AND vc.condominio_id = e.condominio_id
            WHERE e.condominio_id = $1
        `;
        
        let values = [condominio_id];
        let count = 2;

        // Filtros dinâmicos
        if (unidade) { query += ` AND e.unidade = $${count++}`; values.push(unidade); }
        if (bloco) { query += ` AND e.bloco = $${count++}`; values.push(bloco); }
        if (status) { query += ` AND e.status = $${count++}`; values.push(status); }
        if (morador_id) { query += ` AND e.morador_id = $${count++}`; values.push(morador_id); }
        if (codigo_rastreio) { 
            query += ` AND e.codigo_rastreio ILIKE $${count++}`; 
            values.push(`%${codigo_rastreio}%`); 
        }
        if (req.query.retirada_urgente) {
            query += ` AND e.retirada_urgente = $${count++}`;
            values.push(req.query.retirada_urgente === 'true');
        }

        // Ordenação e Paginação
        query += ` ORDER BY e.data_recebimento DESC LIMIT $${count++} OFFSET $${count++}`;
        values.push(limite, offset);

        const result = await pool.query(query, values);
        
        // Busca do total para paginação
        const totalResult = await pool.query(`SELECT COUNT(*) FROM entregas WHERE condominio_id = $1`, [condominio_id]);

        res.json({
            success: true,
            meta: { 
                total: parseInt(totalResult.rows[0].count), 
                pagina: parseInt(pagina), 
                limite: parseInt(limite) 
            },
            data: result.rows
        });
    } catch (error) {
        console.error('Erro na API:', error);
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

module.exports = { registrarEntrega, listarEntregas, registrarSaidaQRCode, registrarSaidaManual, deletarEntrega, atualizarEntrega };