const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: "Acesso negado. Token não encontrado." 
        });
    }

    try {
        const JWT_SECRET = process.env.JWT_SECRET || 'chave_mestra_secreta';
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Salva o objeto inteiro para uso posterior (perfil, nome, etc)
        req.usuario = decoded;
        
        // FACILITADOR: Salva o ID diretamente em usuarioId para o Controller
        // Certifique-se que no seu LOGIN você está salvando como 'id' ou 'usuario_id'
        req.usuarioId = decoded.id || decoded.usuario_id || decoded.sub;
        
        next();
    } catch (error) {
        return res.status(403).json({ 
            success: false, 
            message: "Token inválido ou expirado." 
        });
    }
};

module.exports = { verificarToken };