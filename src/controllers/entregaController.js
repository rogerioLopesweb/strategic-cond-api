const path = require('path');
// CORREÇÃO: Importando como 'pool' para consistência em todo o código
const pool = require('../config/db');
const storage = require('../services/storageService');

// 1. Registro de Entrada
const registrarEntrega = async (req, res) => {
    const { 
        codigo_rastreio, unidade, bloco, morador_id, 
        marketplace, observacoes, foto_base64, condominio_id,
        retirada_urgente, tipo_embalagem 
    } = req.body;

    const operador_entrada_id = req.usuarioId || (req.usuario && req.usuario.id);

    if (!operador_entrada_id) {
        return res.status(401).json({ success: false, message: 'Operador não identificado.' });
    }

    const client = await pool.connect(); 

    try {
        await client.query('BEGIN');

        let url_foto = null;
        if (foto_base64) {
            const nomeArquivo = `entrega-${unidade}-${bloco}`;
            const pathRelativo = await storage.uploadFoto(foto_base64, nomeArquivo);
            if (pathRelativo) {
                url_foto = await storage.gerarLinkVisualizacao(pathRelativo);
            }
        }

        // 1. INSERIR A ENTREGA
        const queryEntrega = `
            INSERT INTO entregas (
                condominio_id, operador_entrada_id, unidade, bloco, 
                codigo_rastreio, marketplace, morador_id, observacoes, 
                status, data_recebimento, url_foto_etiqueta,
                retirada_urgente, tipo_embalagem
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, 'recebido', NOW(), $9, $10, $11
            )
            RETURNING *`;

        const valuesEntrega = [
            condominio_id, operador_entrada_id, unidade, bloco, 
            codigo_rastreio, marketplace, morador_id, observacoes, 
            url_foto, retirada_urgente || false, tipo_embalagem || 'Pacote'
        ];

        const resultEntrega = await client.query(queryEntrega, valuesEntrega);
        const entrega = resultEntrega.rows[0];

        // 2. BUSCAR DADOS DO MORADOR
        const resMorador = await client.query(
            'SELECT nome_completo, email, expo_push_token FROM usuarios WHERE id = $1',
            [morador_id]
        );
        const morador = resMorador.rows[0];

        // 3. REGISTRAR LOGS DE NOTIFICAÇÃO
        if (morador) {
            const notificacoes = [];
            // Proteção contra nome nulo para evitar erro no .split()
            const primeiroNome = morador.nome_completo ? morador.nome_completo.split(' ')[0] : 'Morador';
            
            if (morador.expo_push_token) {
                notificacoes.push({
                    canal: 'push',
                    destino: morador.expo_push_token,
                    titulo: '📦 Nova Encomenda!',
                    mensagem: `Olá ${primeiroNome}, um pacote (${marketplace || 'Volume'}) chegou na portaria.`
                });
            }

            if (morador.email) {
                notificacoes.push({
                    canal: 'email',
                    destino: morador.email,
                    titulo: 'StrategicCond: Recebimento de Volume',
                    mensagem: `Existe uma nova encomenda (${marketplace || 'Volume'}) para a unidade ${unidade} ${bloco}.`
                });
            }

            for (const n of notificacoes) {
                await client.query(`
                    INSERT INTO notificacoes (
                        condominio_id, usuario_id, entrega_id, canal, 
                        status, titulo, mensagem, destino, criado_em, tentativas
                    ) VALUES ($1, $2, $3, $4, 'pendente', $5, $6, $7, NOW(), 0)`,
                    [condominio_id, morador_id, entrega.id, n.canal, n.titulo, n.mensagem, n.destino]
                );
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ success: true, message: 'Entrega registrada com sucesso!', entrega });
        
    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error('Erro técnico no registro:', error);
        res.status(500).json({ success: false, message: 'Erro ao processar registro.', error: error.message });
    } finally {
        if (client) client.release();
    }
};

// 2. Listagem Inteligente (Filtros e Paginação)
const listarEntregas = async (req, res) => {
    // Pegamos os filtros da query
    const { unidade, bloco, status, codigo_rastreio, pagina = 1, limite = 10 } = req.query;
    
    // 1. SEGURANÇA: Se o perfil for 'morador', forçamos o filtro pelo ID dele
    // Se for 'portaria' ou 'admin', usamos o morador_id que vier na query (se vier)
    let morador_id_filtro = req.query.morador_id;
    
    if (req.usuario.perfil === 'morador') {
        morador_id_filtro = req.usuario.id; // O morador só vê o que é dele
    }

    const condominio_id = req.usuario.condominio_id; 
    const offset = (pagina - 1) * limite;

    try {
        let baseFilter = ` WHERE e.condominio_id = $1`;
        let values = [condominio_id];
        let count = 2;

        if (unidade) { baseFilter += ` AND e.unidade = $${count++}`; values.push(unidade); }
        if (bloco) { baseFilter += ` AND e.bloco = $${count++}`; values.push(bloco); }
        if (status) { baseFilter += ` AND e.status = $${count++}`; values.push(status); }
        
        // Aplica o filtro de morador (seja o forçado pelo perfil ou o da busca da portaria)
        if (morador_id_filtro) { 
            baseFilter += ` AND e.morador_id = $${count++}`; 
            values.push(morador_id_filtro); 
        }

        if (codigo_rastreio) { 
            baseFilter += ` AND e.codigo_rastreio ILIKE $${count++}`; 
            values.push(`%${codigo_rastreio}%`); 
        }

        if (req.query.retirada_urgente) {
            baseFilter += ` AND e.retirada_urgente = $${count++}`;
            values.push(req.query.retirada_urgente === 'true');
        }

        let queryDados = `
            SELECT 
                e.*, 
                u.nome_completo AS morador_nome, 
                op_in.nome_completo AS operador_entrada_nome,
                op_out.nome_completo AS operador_saida_nome,
                op_can.nome_completo AS operador_cancelamento_nome
            FROM entregas e
            LEFT JOIN usuarios u ON e.morador_id = u.id
            LEFT JOIN usuarios op_in ON e.operador_entrada_id = op_in.id
            LEFT JOIN usuarios op_out ON e.operador_saida_id = op_out.id
            LEFT JOIN usuarios op_can ON e.operador_cancelamento_id = op_can.id
            ${baseFilter}
            ORDER BY 
                CASE WHEN e.status = 'recebido' THEN 1 ELSE 2 END, -- Pendentes primeiro
                e.data_recebimento DESC 
            LIMIT $${count++} OFFSET $${count++}`;
        
        const result = await pool.query(queryDados, [...values, parseInt(limite), offset]);
        const totalResult = await pool.query(`SELECT COUNT(*) FROM entregas e ${baseFilter}`, values);

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
        console.error('Erro na listagem:', error);
        res.status(500).json({ success: false, message: 'Erro interno ao listar.' });
    }
};

// 3. Baixa Manual
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

// 4. Baixa via QR Code (Revisada e Sanitizada)
const registrarSaidaQRCode = async (req, res) => {
    let { id } = req.params;

    // CORREÇÃO: Sanitização do UUID para evitar erros de sintaxe (remove caracteres sujos)
    const idLimpo = id.trim().substring(0, 36);
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(idLimpo)) {
        return res.status(400).json({ success: false, message: 'QR Code inválido.' });
    }

    try {
        const query = `
            UPDATE entregas 
            SET status = 'entregue', data_entrega = NOW(), operador_saida_id = $1,
                quem_retirou = 'Portador do QR Code (Autorizado)', documento_retirou = 'Validado via App'
            WHERE id = $2 AND status = 'recebido' RETURNING *`;

        const result = await pool.query(query, [req.usuario.id, idLimpo]);
        
        if (result.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Entrega não encontrada ou já retirada.' });
        }

        res.json({ success: true, message: 'Retirada confirmada!', entrega: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao processar QR Code.' });
    }
};

// Funções de Auditoria e Deleção (Utilizando 'pool')
const atualizarEntrega = async (req, res) => {
    const { id } = req.params; 
    const { marketplace, observacoes, codigo_rastreio, retirada_urgente, tipo_embalagem } = req.body;
    const operador_atualizacao_id = req.usuario.id; 
    const condominio_id = req.usuario.condominio_id;

    try {
        const query = `
            UPDATE entregas 
            SET marketplace = COALESCE($1, marketplace), observacoes = COALESCE($2, observacoes),
                codigo_rastreio = COALESCE($3, codigo_rastreio), retirada_urgente = COALESCE($4, retirada_urgente),
                tipo_embalagem = COALESCE($5, tipo_embalagem), operador_atualizacao_id = $6, data_atualizacao = NOW()
            WHERE id = $7 AND condominio_id = $8 AND status = 'recebido' RETURNING *`;

        const result = await pool.query(query, [marketplace, observacoes, codigo_rastreio, retirada_urgente, tipo_embalagem, operador_atualizacao_id, id, condominio_id]);

        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Não encontrado ou já finalizado.' });
        res.json({ success: true, message: 'Atualizado!', entrega: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao atualizar.' });
    }
};

const deletarEntrega = async (req, res) => {
    const { id } = req.params;
    const condominio_id = req.usuario.condominio_id;
    try {
        const result = await pool.query('DELETE FROM entregas WHERE id = $1 AND condominio_id = $2 AND status = \'recebido\'', [id, condominio_id]);
        if (result.rowCount === 0) return res.status(404).json({ success: false, message: 'Não permitido deletar.' });
        res.json({ success: true, message: 'Removido!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao deletar.' });
    }
};

const cancelarEntrega = async (req, res) => {
    const { id } = req.params;
    const { motivo_cancelamento } = req.body;
    const operador_cancelamento_id = req.usuario.id;
    const condominio_id = req.usuario.condominio_id;

    try {
        const query = `UPDATE entregas SET status = 'cancelada', data_cancelamento = NOW(), operador_cancelamento_id = $1, motivo_cancelamento = $2
                       WHERE id = $3 AND condominio_id = $4 AND status = 'recebido' RETURNING *`;
        const result = await pool.query(query, [operador_cancelamento_id, motivo_cancelamento, id, condominio_id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Cancelamento não permitido.' });
        res.json({ success: true, message: 'Cancelado!', entrega: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao cancelar.' });
    }
};

module.exports = { registrarEntrega, listarEntregas, registrarSaidaQRCode, registrarSaidaManual, deletarEntrega, cancelarEntrega, atualizarEntrega };