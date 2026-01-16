const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Realiza login do usuário (Simulado)
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

module.exports = router;