const path = require('path');
const pool = require('../config/db');
const storage = require('../services/storageService');

/**
 * CONTROLADOR DE ENTREGAS - STRATEGICCOND
 * Gerencia o ciclo de vida das encomendas: Recebimento -> Notificação -> Retirada.
 */

// 1. REGISTRO DE ENTRADA (Portaria bipa/cadastra encomenda)
const registrarEntrega = async (req, res) => {
    const { 
        codigo_rastreio, unidade, bloco, morador_id, 
        marketplace, observacoes, foto_base64, condominio_id,
        retirada_urgente, tipo_embalagem 
    } = req.body;

    // Pega o operador logado do token (Middleware de autenticação)
    const operador_entrada_id = req.usuarioId || (req.usuario && req.usuario.id);

    if (!operador_entrada_id || !condominio_id) {
        return res.status(400).json({ success: false, message: 'Operador ou Condomínio não identificado.' });
    }

    const client = await pool.connect(); 

    try {
        await client.query('BEGIN');

        // Upload da foto da etiqueta (se houver)
        let url_foto = null;
        if (foto_base64) {
            const nomeArquivo = `entrega-${unidade}-${bloco}-${Date.now()}`;
            const pathRelativo = await storage.uploadFoto(foto_base64, nomeArquivo);
            if (pathRelativo) {
                url_foto = await storage.gerarLinkVisualizacao(pathRelativo);
            }
        }

        // Inserção da Encomenda (Unidade e Bloco salvos como String/Varchar)
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

        // 2. BUSCAR DADOS DO MORADOR PARA FILA DE NOTIFICAÇÃO
        if (morador_id) {
            const resMorador = await client.query(
                'SELECT nome_completo, email, expo_push_token FROM usuarios WHERE id = $1',
                [morador_id]
            );
            const morador = resMorador.rows[0];

            if (morador) {
                const primeiroNome = morador.nome_completo ? morador.nome_completo.split(' ')[0] : 'Morador';
                
                // Grava notificação pendente para o serviço de mensageria processar
                await client.query(`
                    INSERT INTO notificacoes (
                        condominio_id, usuario_id, entrega_id, canal, 
                        status, titulo, mensagem, destino, criado_em, tentativas
                    ) VALUES ($1, $2, $3, 'push', 'pendente', $4, $5, $6, NOW(), 0)`,
                    [condominio_id, morador_id, entrega.id, '📦 Nova Encomenda!', `Olá ${primeiroNome}, uma encomenda (${marketplace || 'Volume'}) chegou na portaria.`, morador.expo_push_token]
                );
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ success: true, message: 'Entrega registrada com sucesso!', entrega });
        
    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error('Erro no registro de entrega:', error);
        res.status(500).json({ success: false, message: 'Erro ao processar registro.', error: error.message });
    } finally {
        if (client) client.release();
    }
};

// 2. LISTAGEM INTELIGENTE (Filtros Alfanuméricos e Multi-Tenant)
const listarEntregas = async (req, res) => {
    const { 
        condominio_id, unidade, bloco, status, 
        codigo_rastreio, pagina = 1, limite = 10, retirada_urgente 
    } = req.query;

    if (!condominio_id) {
        return res.status(400).json({ success: false, message: 'ID do condomínio é obrigatório.' });
    }

    const offset = (pagina - 1) * limite;

    try {
        // Filtro mestre: Condomínio selecionado
        let baseFilter = ` WHERE e.condominio_id = $1`;
        let values = [condominio_id];
        let count = 2;

        // Se o perfil for morador, trava a visualização apenas nos itens dele
        if (req.usuario.perfil === 'morador') {
            baseFilter += ` AND e.morador_id = $${count++}`;
            values.push(req.usuario.id);
        }

        // Filtros dinâmicos (Unidade e Bloco agora tratam letras e números)
        if (unidade && unidade.trim() !== "") { 
            baseFilter += ` AND e.unidade ILIKE $${count++}`; 
            values.push(`${unidade}%`); 
        }
        if (bloco && bloco.trim() !== "") { 
            baseFilter += ` AND e.bloco ILIKE $${count++}`; 
            values.push(`${bloco}%`); 
        }
        if (status) { 
            baseFilter += ` AND e.status = $${count++}`; 
            values.push(status); 
        }
        if (codigo_rastreio) {
            baseFilter += ` AND e.codigo_rastreio ILIKE $${count++}`;
            values.push(`%${codigo_rastreio}%`);
        }
        if (retirada_urgente === 'true') {
            baseFilter += ` AND e.retirada_urgente = true`;
        }

        const queryDados = `
            SELECT 
                e.*, 
                u.nome_completo AS morador_nome, 
                op_in.nome_completo AS operador_entrada_nome,
                op_out.nome_completo AS operador_saida_nome
            FROM entregas e
            LEFT JOIN usuarios u ON e.morador_id = u.id
            LEFT JOIN usuarios op_in ON e.operador_entrada_id = op_in.id
            LEFT JOIN usuarios op_out ON e.operador_saida_id = op_out.id
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
        console.error('Erro na listagem de entregas:', error);
        res.status(500).json({ success: false, message: 'Erro interno ao listar entregas.' });
    }
};

// 3. BAIXA MANUAL (Retirada física na portaria)
const registrarSaidaManual = async (req, res) => {
    const { id } = req.params;
    const { quem_retirou, documento_retirou } = req.body;
    const operador_saida_id = req.usuario.id;

    try {
        const query = `
            UPDATE entregas 
            SET status = 'entregue', 
                data_entrega = NOW(), 
                operador_saida_id = $1,
                quem_retirou = $2, 
                documento_retirou = $3
            WHERE id = $4 AND status = 'recebido' 
            RETURNING *`;

        const result = await pool.query(query, [operador_saida_id, quem_retirou, documento_retirou, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Encomenda não disponível para baixa.' });
        }

        res.json({ success: true, message: 'Saída registrada com sucesso!', entrega: result.rows[0] });
    } catch (error) {
        console.error('Erro na baixa manual:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// 4. BAIXA VIA QR CODE (Validado pelo morador)
const registrarSaidaQRCode = async (req, res) => {
    let { id } = req.params;
    const idLimpo = id.trim().substring(0, 36); // Sanitização básica UUID

    try {
        const query = `
            UPDATE entregas 
            SET status = 'entregue', 
                data_entrega = NOW(), 
                operador_saida_id = $1,
                quem_retirou = 'Portador do QR Code', 
                documento_retirou = 'Validado via App'
            WHERE id = $2 AND status = 'recebido' 
            RETURNING *`;

        const result = await pool.query(query, [req.usuario.id, idLimpo]);
        
        if (result.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'QR Code inválido ou já utilizado.' });
        }

        res.json({ success: true, message: 'Retirada confirmada!', entrega: result.rows[0] });
    } catch (error) {
        console.error('Erro no QR Code:', error);
        res.status(500).json({ success: false, message: 'Erro ao processar QR Code.' });
    }
};

// 5. ATUALIZAR / AUDITORIA (Correção de dados)
const atualizarEntrega = async (req, res) => {
    const { id } = req.params; 
    const { marketplace, observacoes, codigo_rastreio, retirada_urgente, tipo_embalagem } = req.body;
    const operador_atualizacao_id = req.usuario.id; 
    const condominio_id = req.usuario.condominio_id;

    try {
        const query = `
            UPDATE entregas 
            SET marketplace = COALESCE($1, marketplace), 
                observacoes = COALESCE($2, observacoes),
                codigo_rastreio = COALESCE($3, codigo_rastreio), 
                retirada_urgente = COALESCE($4, retirada_urgente),
                tipo_embalagem = COALESCE($5, tipo_embalagem), 
                operador_atualizacao_id = $6, 
                data_atualizacao = NOW()
            WHERE id = $7 AND condominio_id = $8 AND status = 'recebido' 
            RETURNING *`;

        const result = await pool.query(query, [marketplace, observacoes, codigo_rastreio, retirada_urgente, tipo_embalagem, operador_atualizacao_id, id, condominio_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Encomenda não encontrada ou já finalizada.' });
        }
        res.json({ success: true, message: 'Dados atualizados!', entrega: result.rows[0] });
    } catch (error) {
        console.error('Erro na atualização:', error);
        res.status(500).json({ success: false, message: 'Erro ao atualizar dados.' });
    }
};

// 6. CANCELAMENTO (Trilha de auditoria)
const cancelarEntrega = async (req, res) => {
    const { id } = req.params;
    const { motivo_cancelamento } = req.body;
    const operador_cancelamento_id = req.usuario.id;
    const condominio_id = req.usuario.condominio_id;

    try {
        const query = `
            UPDATE entregas 
            SET status = 'cancelada', 
                data_cancelamento = NOW(), 
                operador_cancelamento_id = $1, 
                motivo_cancelamento = $2
            WHERE id = $3 AND condominio_id = $4 AND status = 'recebido' 
            RETURNING *`;

        const result = await pool.query(query, [operador_cancelamento_id, motivo_cancelamento, id, condominio_id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Cancelamento não permitido para esta entrega.' });
        }
        res.json({ success: true, message: 'Entrega cancelada com sucesso!', entrega: result.rows[0] });
    } catch (error) {
        console.error('Erro no cancelamento:', error);
        res.status(500).json({ success: false, message: 'Erro ao cancelar.' });
    }
};

// 7. DELEÇÃO (Limpeza técnica - usar com cautela)
const deletarEntrega = async (req, res) => {
    const { id } = req.params;
    const condominio_id = req.usuario.condominio_id;

    try {
        const result = await pool.query(
            'DELETE FROM entregas WHERE id = $1 AND condominio_id = $2 AND status = \'recebido\'', 
            [id, condominio_id]
        );
        if (result.rowCount === 0) return res.status(404).json({ success: false, message: 'Não permitido excluir.' });
        res.json({ success: true, message: 'Registro removido do banco.' });
    } catch (error) {
        console.error('Erro na deleção:', error);
        res.status(500).json({ success: false, message: 'Erro ao deletar.' });
    }
};

module.exports = { 
    registrarEntrega, 
    listarEntregas, 
    registrarSaidaQRCode, 
    registrarSaidaManual, 
    atualizarEntrega, 
    cancelarEntrega, 
    deletarEntrega 
};