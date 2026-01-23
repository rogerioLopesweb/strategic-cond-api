const express = require('express');
const router = express.Router();
const { salvarPushToken  } = require('../controllers/usuarioController');
const { verificarToken } = require('../middlewares/authMiddleware');

/**
 * @openapi
 * /api/usuarios/push-token:
 *   put:
 *     summary: Salva o token de push do usuário
 *     tags:
 *       - Usuários
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 example: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
 *     responses:
 *       200:
 *         description: Token de push atualizado com sucesso
 *       401:
 *         description: Token de autenticação inválido ou ausente
 *       500:
 *         description: Erro ao registrar dispositivo
 */
router.put('/push-token', verificarToken, salvarPushToken);


module.exports = router;