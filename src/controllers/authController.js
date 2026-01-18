const jwt = require('jsonwebtoken');
const db = require('../config/db'); // Importa a conexão que criamos acima

const login = async (req, res) => {
    const { cpf, senha } = req.body;

    try {
        // 1. Busca o usuário pelo CPF e traz os dados do vínculo e do condomínio em uma única query
        const queryText = `
            SELECT u.id, u.nome_completo, u.senha_hash, v.perfil, v.condominio_id 
            FROM usuarios u
            JOIN vinculos_condominio v ON u.id = v.usuario_id
            WHERE u.cpf = $1 AND v.ativo = true
            LIMIT 1
        `;
        
        const result = await db.query(queryText, [cpf]);

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Usuário não encontrado ou sem vínculo ativo' });
        }

        const usuario = result.rows[0];

        // 2. Validação da senha (Por enquanto comparando texto simples, depois usaremos bcrypt)
        if (senha !== usuario.senha_hash) {
            return res.status(401).json({ success: false, message: 'Senha inválida' });
        }

        // 3. Geração do Token JWT com dados reais do banco
        const token = jwt.sign(
            { 
                id: usuario.id, 
                perfil: usuario.perfil, 
                condominio_id: usuario.condominio_id 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: {
                nome: usuario.nome_completo,
                perfil: usuario.perfil
            }
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ success: false, message: 'Erro interno no servidor' });
    }
};

module.exports = { login };