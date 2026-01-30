const express = require('express');
const router = express.Router();
const {cadastrarUsuarioMorador, cadastrarUsuarioPortaria, salvarPushToken  } = require('../controllers/usuarioController');
const { verificarToken } = require('../middlewares/authMiddleware');

/**
 * @openapi
 * /api/usuarios/morador:
 *   post:
 *     summary: Cadastra usuário morador
 *     description: Cadastra um novo usuário do tipo morador
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
 *               nome:
 *                 type: string
 *                 example: "João Silva"
 *               cpf:
 *                 type: string
 *                 example: "12345678900"
 *               email:
 *                 type: string
 *                 example: "joao@email.com"
 *               senha:
 *                 type: string
 *                 example: "senha123"
 *     responses:
 *       201:
 *         description: Usuário cadastrado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Token não fornecido ou inválido
 *       500:
 *         description: Erro interno do servidor
 */
// Nova rota para cadastro de moradores
router.post('/usuarios/morador', verificarToken, cadastrarUsuarioMorador);

/**
 * @openapi
 * /api/usuarios/portaria:
 *   post:
 *     summary: Cadastra usuário portaria
 *     description: Cadastra um novo usuário do tipo portaria (usado pelo Síndico para criar sua equipe)
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
 *               nome:
 *                 type: string
 *                 example: "Maria Portaria"
 *               cpf:
 *                 type: string
 *                 example: "12345678900"
 *               email:
 *                 type: string
 *                 example: "maria@email.com"
 *               senha:
 *                 type: string
 *                 example: "senha123"
 *     responses:
 *       201:
 *         description: Usuário cadastrado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Token não fornecido ou inválido
 *       500:
 *         description: Erro interno do servidor
 */
// O Síndico usa esta para criar sua equipe
router.post('/usuarios/portaria', verificarToken, cadastrarUsuarioPortaria);

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