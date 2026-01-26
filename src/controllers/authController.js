const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const login = async (req, res) => {
    const { cpf, senha } = req.body;

    try {
        // 1. Busca usuário, vínculo e o NOME do condomínio em uma única query
        const queryText = `
            SELECT 
                u.id, 
                u.nome_completo, 
                u.cpf,
                u.senha_hash, 
                v.perfil, 
                v.condominio_id,
                c.nome_fantasia as condominio_nome
            FROM usuarios u
            JOIN vinculos_condominio v ON u.id = v.usuario_id
            JOIN condominios c ON c.id = v.condominio_id
            WHERE u.cpf = $1 AND v.ativo = true
            LIMIT 1
        `;
        
        const result = await pool.query(queryText, [cpf]);

        if (result.rows.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Usuário não encontrado ou sem vínculo ativo' 
            });
        }

        const usuario = result.rows[0];

        // 2. Validação da senha
        if (senha !== usuario.senha_hash) {
            return res.status(401).json({ 
                success: false, 
                message: 'Senha inválida' 
            });
        }

        // 3. Geração do Token JWT
        const token = jwt.sign(
            { 
                id: usuario.id, 
                perfil: usuario.perfil, 
                condominio_id: usuario.condominio_id 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 4. Resposta com a estrutura solicitada
        res.json({
            success: true,
            usuario: {
                id: usuario.id,
                nome: usuario.nome_completo,
                cpf: usuario.cpf,
                perfil: usuario.perfil,
                condominio: usuario.condominio_nome,
                condominio_id: usuario.condominio_id,
                token: token
            }
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno no servidor' 
        });
    }
};

module.exports = { login };