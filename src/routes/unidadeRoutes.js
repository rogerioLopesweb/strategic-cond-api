const express = require('express');
const router = express.Router();
const { buscarMoradoresPorUnidade } = require('../controllers/unidadeController');
const { verificarToken } = require('../middlewares/authMiddleware');

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
 *           description: "ID do condomínio (UUID)"
 *       - in: query
 *         name: bloco
 *         required: true
 *         schema:
 *           type: string
 *           description: "Bloco ou Torre (Ex: A)"
 *       - in: query
 *         name: unidade
 *         required: true
 *         schema:
 *           type: string
 *         description: "Número da unidade (Ex: 101)"
 *     responses:
 *       200:
 *         description: Lista enviada com sucesso
 *       400:
 *         description: Falta de parâmetros
 */
router.get('/moradores-vinculados', verificarToken, buscarMoradoresPorUnidade);

module.exports = router;