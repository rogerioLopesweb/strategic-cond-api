const express = require('express');
const router = express.Router();
const { listarUnidades, gerarUnidadesEmMassa, vincularMoradorUnidade, buscarMoradoresPorUnidade } = require('../controllers/unidadeController');
const { verificarToken } = require('../middlewares/authMiddleware');

/**
 * @openapi
 * /api/unidades:
 *   get:
 *     summary: Lista unidades com filtros e paginação
 *     tags:
 *       - Unidades
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: condominio_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: bloco
 *         schema:
 *           type: string
 *         description: Filtrar por bloco (opcional)
 *       - in: query
 *         name: unidade
 *         schema:
 *           type: string
 *         description: Filtrar por número da unidade (opcional)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         default: 10
 *     responses:
 *       200:
 *         description: Lista de unidades retornada com sucesso
 */
router.get('/', verificarToken, listarUnidades);

/**
 * @openapi
 * /api/unidades/gerar-unidades:
 *   post:
 *     summary: Gera unidades em massa
 *     description: Gera unidades (blocos/apartamentos) em massa para um condomínio
 *     tags:
 *       - Unidades
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               condominio_id:
 *                 type: string
 *                 format: uuid
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               blocos:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["A", "B"]
 *               inicio:
 *                 type: integer
 *                 example: 101
 *               fim:
 *                 type: integer
 *                 example: 110
 */
router.post('/gerar-unidades', verificarToken, gerarUnidadesEmMassa);

/**
 * @openapi
 * /api/unidades/vincular-morador:
 *   post:
 *     summary: Vincula morador a unidade
 *     description: Vincula um usuário a uma unidade específica e ao condomínio
 *     tags:
 *       - Unidades
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               usuario_id:
 *                 type: string
 *                 format: uuid
 *                 example: "uuid-do-usuario"
 *               condominio_id:
 *                 type: string
 *                 format: uuid
 *                 example: "uuid-do-condominio"
 *               unidade_id:
 *                 type: string
 *                 format: uuid
 *                 example: "uuid-da-unidade"
 *               tipo_vinculo:
 *                 type: string
 *                 enum: [proprietario, inquilino, dependente]
 *                 example: "inquilino"
 */
router.post('/vincular-morador', verificarToken, vincularMoradorUnidade);

/**
 * @openapi
 * /api/unidades/moradores-vinculados:
 *   get:
 *     summary: Lista moradores ativos de uma unidade específica
 *     description: Retorna uma lista de moradores vinculados a uma unidade.
 *     tags:
 *       - Unidades
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: condominio_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: "ID do condomínio (UUID)"
 *       - in: query
 *         name: bloco
 *         required: true
 *         schema:
 *           type: string
 *         description: "Bloco ou Torre (Ex: A)"
 *       - in: query
 *         name: unidade
 *         required: true
 *         schema:
 *           type: string
 *         description: "Número da unidade (Ex: 101)"
 *     responses:
 *       200:
 *         description: Lista enviada com sucesso
 *       404:
 *         description: Nenhum morador encontrado
 */
router.get('/moradores-vinculados', verificarToken, buscarMoradoresPorUnidade);

module.exports = router;