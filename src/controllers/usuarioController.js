const path = require('path');
const pool = require('../config/db');
const bcrypt = require('bcrypt');

// Cadastro de Usuário Morador (Ação do Síndico/Admin)
const cadastrarUsuarioMorador = async (req, res) => {
    const { nome_completo, cpf, email, telefone, condominio_id } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Verificar se o CPF ou E-mail já existem
        const existe = await client.query(
            'SELECT id FROM usuarios WHERE cpf = $1 OR email = $2',
            [cpf, email]
        );

        if (existe.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'CPF ou E-mail já cadastrados.' });
        }

        // 2. Criar senha padrão (ex: 6 primeiros dígitos do CPF)
        const senhaPadrao = cpf.substring(0, 6);
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senhaPadrao, salt);

        // 3. Inserir Usuário
        const userResult = await client.query(`
            INSERT INTO usuarios (nome_completo, cpf, email, telefone, senha_hash)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id;
        `, [nome_completo, cpf, email, telefone, senhaHash]);

        const novoUsuarioId = userResult.rows[0].id;

        // 4. Criar vínculo inicial com o Condomínio como 'morador'
        // Usamos a tabela vinculos_condominio que você mapeou no JSON
        await client.query(`
            INSERT INTO vinculos_condominio (usuario_id, condominio_id, perfil, ativo)
            VALUES ($1, $2, 'morador', true);
        `, [novoUsuarioId, condominio_id]);

        await client.query('COMMIT');

        res.json({ 
            success: true, 
            message: 'Morador cadastrado com sucesso!',
            usuario_id: novoUsuarioId,
            senha_provisoria: senhaPadrao // Para você informar ao morador
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao cadastrar morador:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
};

// Cadastro de Portaria (Ação do Síndico)
const cadastrarUsuarioPortaria = async (req, res) => {
    const { nome_completo, cpf, email, condominio_id } = req.body;

    try {
        // Senha padrão para portaria: 123456 (ou os primeiros 6 do CPF)
        const senhaPadrao = cpf.substring(0, 6);
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senhaPadrao, salt);

        const userResult = await pool.query(`
            INSERT INTO usuarios (nome_completo, cpf, email, senha_hash)
            VALUES ($1, $2, $3, $4)
            RETURNING id;
        `, [nome_completo, cpf, email, senhaHash]);

        const usuarioId = userResult.rows[0].id;

        // Vínculo obrigatório com perfil 'portaria'
        await pool.query(`
            INSERT INTO vinculos_condominio (usuario_id, condominio_id, perfil, ativo)
            VALUES ($1, $2, 'portaria', true);
        `, [usuarioId, condominio_id]);

        res.json({ success: true, message: 'Portaria cadastrada!', senha_provisoria: senhaPadrao });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const salvarPushToken = async (req, res) => {
    const { token } = req.body;
    
    // Boa prática: Validar se o token foi enviado antes de processar
    if (!token) {
        return res.status(400).json({ success: false, message: 'Token não fornecido.' });
    }

    const usuario_id = req.usuario && req.usuario.id; 

    if (!usuario_id) {
        return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
    }

    try {
        // Sugestão: Limpar o token de qualquer outro usuário que use o mesmo aparelho
        // Isso evita que o morador antigo receba notificações do novo (e vice-versa)
        await pool.query(
            'UPDATE usuarios SET expo_push_token = NULL WHERE expo_push_token = $1 AND id != $2',
            [token, usuario_id]
        );

        // Atualiza o token do usuário atual
        const result = await pool.query(
            'UPDATE usuarios SET expo_push_token = $1 WHERE id = $2',
            [token, usuario_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
        }

        res.json({ success: true, message: 'Dispositivo registrado para notificações.' });
    } catch (error) {
        console.error('Erro ao salvar token:', error);
        res.status(500).json({ success: false, message: 'Erro interno ao registrar dispositivo.' });
    }
};

module.exports = { cadastrarUsuarioMorador, cadastrarUsuarioPortaria, salvarPushToken };