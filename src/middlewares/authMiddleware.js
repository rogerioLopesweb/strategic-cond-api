const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    // Busca o token no cabeçalho Authorization
    const authHeader = req.headers['authorization'];
    // O formato esperado é: "Bearer TOKEN_AQUI"
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: "Acesso negado. Token não encontrado." 
        });
    }

    try {
        const JWT_SECRET = process.env.JWT_SECRET || 'chave_mestra_secreta';
        // Verifica se o token é legítimo e não expirou
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Salva os dados do usuário (id, perfil) dentro da requisição
        req.usuario = decoded;
        
        // Libera para a próxima função (o Controller)
        next();
    } catch (error) {
        return res.status(403).json({ 
            success: false, 
            message: "Token inválido ou expirado." 
        });
    }
};

module.exports = { verificarToken };