const express = require('express');
const router = express.Router();
const { 
    listarUnidades, 
    gerarUnidadesEmMassa, 
    vincularMoradorUnidade, 
    buscarMoradoresPorUnidade,
    vincularMoradorPorBloco, // ✅ Adicionado
    atualizarStatusVinculo   // ✅ Adicionado
} = require('../controllers/unidadeController');
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
 */
router.get('/', verificarToken, listarUnidades);

/**
 * @openapi
 * /api/unidades/gerar-unidades:
 *   post:
 *     summary: Gera unidades em massa
 *     tags:
 *       - Unidades
 *     security:
 *       - bearerAuth: []
 */
router.post('/gerar-unidades', verificarToken, gerarUnidadesEmMassa);

/**
 * @openapi
 * /api/unidades/vincular-morador:
 *   post:
 *     summary: Vincula morador via ID da Unidade
 *     tags:
 *       - Unidades
 *     security:
 *       - bearerAuth: []
 */
router.post('/vincular-morador', verificarToken, vincularMoradorUnidade);

/**
 * ✅ NOVA ROTA: Vincular por Bloco/Número
 * @openapi
 * /api/unidades/vincular-morador-bloco:
 *   post:
 *     summary: Vincula morador buscando por Bloco e Número
 *     description: Usado na tela de edição para vincular imóveis sem precisar do ID prévio da unidade.
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
 *               condominio_id:
 *                 type: string
 *                 format: uuid
 *               identificador_bloco:
 *                 type: string
 *                 example: "Torre A"
 *               numero:
 *                 type: string
 *                 example: "101"
 *               tipo_vinculo:
 *                 type: string
 *                 enum:
 *                   - proprietario
 *                   - inquilino
 *                   - residente
 */
router.post('/vincular-morador-bloco', verificarToken, vincularMoradorPorBloco);

/**
 * ✅ NOVA ROTA: Atualizar Vínculo (Histórico/Saída)
 * @openapi
 * /api/unidades/atualizar-vinculo:
 *   put:
 *     summary: Ativa ou encerra um vínculo (Soft Delete)
 *     description: Altera o status do vínculo. Se status for false, registra a data_saida.
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
 *               unidade_id:
 *                 type: string
 *                 format: uuid
 *               status:
 *                 type: boolean
 *                 description: "false para registrar saída"
 */
router.put('/atualizar-vinculo', verificarToken, atualizarStatusVinculo);

/**
 * @openapi
 * /api/unidades/moradores-vinculados:
 *   get:
 *     summary: Lista moradores ativos de uma unidade específica
 *     tags:
 *       - Unidades
 *     security:
 *       - bearerAuth: []
 */
router.get('/moradores-vinculados', verificarToken, buscarMoradoresPorUnidade);

module.exports = router;