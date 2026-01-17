/**
 * Controller de Autenticação (Simulado)
 * Refinado para garantir estabilidade e mensagens claras
 */
const login = async (req, res) => {
    try {
        const { cpf, senha } = req.body;

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

        // 3. Lógica de Validação
        // Nota: Em produção, o CPF deve ser limpo (remover pontos e traços)
        const cpfLimpo = cpf.replace(/\D/g, ''); 

        if (cpfLimpo === usuarioSimulado.cpf && senha === usuarioSimulado.senha) {
            return res.status(200).json({
                success: true,
                usuario: {
                    id: usuarioSimulado.id,
                    nome: usuarioSimulado.nome,
                    cpf: usuarioSimulado.cpf,
                    perfil: usuarioSimulado.perfil,
                    condominio: usuarioSimulado.condominio,
                    condominio_id: usuarioSimulado.condominio_id,
                    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // Exemplo de estrutura JWT
                }
            });
        }

        // 4. Falha na Autenticação
        return res.status(401).json({
            success: false,
            message: "CPF ou Senha incorretos."
        });

    } catch (error) {
        // 5. Tratamento de erro inesperado (Previne queda do servidor)
        console.error("Erro interno no login:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno no servidor. Tente novamente mais tarde."
        });
    }
};

module.exports = { login };