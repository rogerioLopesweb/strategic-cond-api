const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const login = async (req, res) => {
    const { cpf, senha } = req.body;

    try {
        // 1. Busca o usuário primeiro
        const userQuery = `SELECT id, nome_completo, cpf, senha_hash FROM usuarios WHERE cpf = $1`;
        const userResult = await pool.query(userQuery, [cpf]);

        if (userResult.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Usuário não encontrado' });
        }

        const usuario = userResult.rows[0];

        // 2. Validação da senha (recomendo bcrypt futuramente, mas mantendo sua lógica atual)
        if (senha !== usuario.senha_hash) {
            return res.status(401).json({ success: false, message: 'Senha inválida' });
        }

        // 3. Busca TODOS os vínculos ativos deste usuário
        const vinculosQuery = `
            SELECT 
                v.condominio_id, 
                v.perfil, 
                c.nome_fantasia as condominio_nome
            FROM vinculos_condominio v
            JOIN condominios c ON c.id = v.condominio_id
            WHERE v.usuario_id = $1 AND v.ativo = true
        `;
        const vinculosResult = await pool.query(vinculosQuery, [usuario.id]);

        if (vinculosResult.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Usuário sem vínculos ativos' });
        }

        const listaCondominios = vinculosResult.rows;

        // 4. Geração do Token JWT com suporte a Multi-Condomínio
        // Guardamos o array completo no Token para evitar consultas extras ao DB
        const token = jwt.sign(
            { 
                id: usuario.id, 
                vinculos: listaCondominios.map(v => ({
                    id: v.condominio_id,
                    perfil: v.perfil
                }))
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 5. Resposta com estrutura para seleção no App
        res.json({
            success: true,
            usuario: {
                id: usuario.id,
                nome: usuario.nome_completo,
                cpf: usuario.cpf,
                token: token,
                // O App usa esse array para mostrar a lista de escolha ou trocar via menu
                condominios: listaCondominios.map(v => ({
                    id: v.condominio_id,
                    nome: v.condominio_nome,
                    perfil: v.perfil
                }))
            }
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ success: false, message: 'Erro interno no servidor' });
    }
};

module.exports = { login };