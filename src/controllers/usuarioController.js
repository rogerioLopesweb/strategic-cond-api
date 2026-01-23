const pool = require('../config/db');

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

module.exports = { salvarPushToken };