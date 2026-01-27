const express = require('express');
const router = express.Router();
const { gerarUnidadesEmMassa, vincularMoradorUnidade, cadastrarUsuarioMorador, cadastrarCondominio, cadastrarUsuarioPortaria } = require('../controllers/adminController');
const { verificarToken } = require('../middlewares/authMiddleware'); // Seu middleware de JWT

/**
 * @openapi
 * /api/admin/gerar-unidades:
 *   post:
 *     summary: Gera unidades em massa
 *     description: Gera unidades (blocos/apartamentos) em massa para um condomínio
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               condominioId:
 *                 type: integer
 *                 example: 1
 *               blocos:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Unidades geradas com sucesso
 *       401:
 *         description: Token não fornecido ou inválido
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/gerar-unidades', verificarToken, gerarUnidadesEmMassa);

/**
 * @openapi
 * /api/admin/vincular-morador:
 *   post:
 *     summary: Vincula morador a unidade
 *     description: Vincula um usuário a uma unidade específica e ao condomínio
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               usuarioId:
 *                 type: integer
 *                 example: 1
 *               unidadeId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Morador vinculado com sucesso
 *       401:
 *         description: Token não fornecido ou inválido
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/vincular-morador', verificarToken, vincularMoradorUnidade);

/**
 * @openapi
 * /api/admin/usuarios/morador:
 *   post:
 *     summary: Cadastra usuário morador
 *     description: Cadastra um novo usuário do tipo morador
 *     tags:
 *       - Admin
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
 * /api/admin/condominio:
 *   post:
 *     summary: Cadastra condomínio
 *     description: Cadastra um novo condomínio (usado pelo Síndico ou Admin master)
 *     tags:
 *       - Admin
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
 *                 example: "Condomínio XYZ"
 *               endereco:
 *                 type: string
 *                 example: "Rua ABC, 123"
 *     responses:
 *       201:
 *         description: Condomínio cadastrado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Token não fornecido ou inválido
 *       500:
 *         description: Erro interno do servidor
 */
// O Síndico ou Admin master usa esta
router.post('/condominio', verificarToken, cadastrarCondominio);

/**
 * @openapi
 * /api/admin/usuarios/portaria:
 *   post:
 *     summary: Cadastra usuário portaria
 *     description: Cadastra um novo usuário do tipo portaria (usado pelo Síndico para criar sua equipe)
 *     tags:
 *       - Admin
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

// Portaria ou Síndico usam estas para o dia a dia
router.post('/usuarios/morador', verificarToken, cadastrarUsuarioMorador);
router.post('/vincular-morador', verificarToken, vincularMoradorUnidade);

module.exports = router;

