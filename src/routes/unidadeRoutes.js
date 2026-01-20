const express = require('express');
const router = express.Router();
const { buscarMoradoresPorUnidade } = require('../controllers/unidadeController');
const { verificarToken } = require('../middlewares/authMiddleware');

/**
 * @openapi
 * /api/unidades/moradores-vinculados:
 *   get:
 *     summary: Lista moradores ativos de uma unidade específica
 *     description: Retorna uma lista de usuários (inquilinos, proprietários, etc.) vinculados a uma unidade e bloco. Requer Token JWT para identificar o condomínio.
 *     tags:
 *       - Unidades
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: bloco
 *         required: true
 *         schema:
 *           type: string
 *           description: "Bloco ou Torre da unidade (Ex: A, B, 1)"
 *       - in: query
 *         name: unidade
 *         required: true
 *         schema:
 *           type: string
 *           description: "Número da unidade/apartamento (Ex: 101, 202)"
 *     responses:
 *       200:
 *         description: Lista de moradores encontrada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   usuario_id:
 *                     type: string
 *                     format: uuid
 *                   Nome:
 *                     type: string
 *                   Tipo:
 *                     type: string
 *                     example: "proprietario"
 *       400:
 *         description: Parâmetros insuficientes (bloco ou unidade ausentes)
 *       401:
 *         description: Não autorizado (Token ausente ou condomínio não identificado)
 *       404:
 *         description: Nenhum morador ativo encontrado para esta unidade
 *       500:
 *         description: Erro interno no servidor
 */
router.get('/moradores-vinculados', verificarToken, buscarMoradoresPorUnidade);

module.exports = router;