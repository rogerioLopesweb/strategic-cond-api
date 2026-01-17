const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');
const { verificarToken } = require('../middlewares/authMiddleware');

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Realiza login do usuário (Simulado)
 *     tags:
 *       - Autenticação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cpf:
 *                 type: string
 *                 example: "12345678900"
 *               senha:
 *                 type: string
 *                 example: "123"
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *       401:
 *         description: Credenciais inválidas
 */
router.post('/login', login);

/**
 * @openapi
 * /api/auth/perfil:
 *   get:
 *     summary: Retorna os dados do usuário logado através do Token
 *     tags:
 *       - Autenticação
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do perfil recuperados com sucesso
 *       401:
 *         description: Token não fornecido ou inválido
 */
router.get('/perfil', verificarToken, (req, res) => {
    res.json({
        success: true,
        message: "Perfil autenticado com sucesso",
        usuario: req.usuario
    });
});

module.exports = router;