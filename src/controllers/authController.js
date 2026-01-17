/**
 * Controller de Autenticação (Simulado com JWT Bearer)
 * Refinado para garantir estabilidade e segurança com tokens reais
 */
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    try {
        const { cpf, senha } = req.body;
        // Puxa a chave do .env ou usa uma fallback para desenvolvimento
        const JWT_SECRET = process.env.JWT_SECRET || 'chave_mestra_secreta';

        // 1. Verificação de Segurança (Input Check)
        if (!cpf || !senha) {
            return res.status(400).json({
                success: false,
                message: "CPF e Senha são obrigatórios."
            });
        }

        // 2. Mock de dados (Simulação de Banco)
        const usuarioSimulado = {
            id: "uuid-usuario-456",
            cpf: "12345678900",
            senha: "123",
            nome: "João Silva",
            perfil: "Porteiro",
            condominio: "Residencial Solar",
            condominio_id: "uuid-condominio-123"
        };

        // 3. Lógica de Validação e Limpeza
        const cpfLimpo = cpf.replace(/\D/g, ''); 

        if (cpfLimpo === usuarioSimulado.cpf && senha === usuarioSimulado.senha) {
            
            // 4. Geração do Token Real
            // Colocamos o ID, Perfil e Condomínio no "payload" do token
            const token = jwt.sign(
                { 
                    id: usuarioSimulado.id, 
                    perfil: usuarioSimulado.perfil,
                    condominio_id: usuarioSimulado.condominio_id 
                },
                JWT_SECRET,
                { expiresIn: '24h' } // Token válido por 1 dia
            );

            return res.status(200).json({
                success: true,
                usuario: {
                    id: usuarioSimulado.id,
                    nome: usuarioSimulado.nome,
                    cpf: usuarioSimulado.cpf,
                    perfil: usuarioSimulado.perfil,
                    condominio: usuarioSimulado.condominio,
                    condominio_id: usuarioSimulado.condominio_id,
                    token: token // Agora este token é uma string real assinada
                }
            });
        }

        // 5. Falha na Autenticação
        return res.status(401).json({
            success: false,
            message: "CPF ou Senha incorretos."
        });

    } catch (error) {
        // 6. Tratamento de erro inesperado
        console.error("Erro interno no login:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno no servidor. Tente novamente mais tarde."
        });
    }
};

module.exports = { login };