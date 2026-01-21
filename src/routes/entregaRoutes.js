const express = require('express');
const router = express.Router();
const { 
    registrarEntrega, 
    listarEntregas, 
    atualizarEntrega,
    deletarEntrega, 
    registrarSaidaManual,
    registrarSaidaQRCode 
} = require('../controllers/entregaController');
const { verificarToken } = require('../middlewares/authMiddleware');

/**
 * @openapi
 * /api/entregas/registrar:
 *   post:
 *     summary: Registra a entrada de uma nova encomenda
 *     tags: [Entregas]
 *     security: [{ bearerAuth: [] }]
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
 *               morador_id:
 *                 type: string
 *                 format: uuid
 *               codigo_rastreio:
 *                 type: string
 *               unidade:
 *                 type: string
 *               bloco:
 *                 type: string
 *               marketplace:
 *                 type: string
 *               observacoes:
 *                 type: string
 *               retirada_urgente:
 *                 type: boolean
 *                 default: false
 *               tipo_embalagem:
 *                 type: string
 *                 example: "Caixa"
 *               foto_base64:
 *                 type: string
 *     responses:
 *       201:
 *         description: "Entrega registrada"
 */
router.post('/registrar', verificarToken, registrarEntrega);

/**
 * @openapi
 * /api/entregas/{id}:
 *   put:
 *     summary: Atualiza os dados de uma entrega existente (Correção de cadastro)
 *     tags: [Entregas]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               unidade:
 *                 type: string
 *               bloco:
 *                 type: string
 *               morador_id:
 *                 type: string
 *                 format: uuid
 *               marketplace:
 *                 type: string
 *               retirada_urgente:
 *                 type: boolean
 *               tipo_embalagem:
 *                 type: string
 *     responses:
 *       200:
 *         description: "Cadastro atualizado"
 *       404:
 *         description: "Entrega não encontrada"
 */
router.put('/:id', verificarToken, atualizarEntrega);

/**
 * @openapi
 * /api/entregas/{id}:
 *   delete:
 *     summary: Remove uma entrega (Somente se status for 'recebido')
 *     tags: [Entregas]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *     responses:
 *       200:
 *         description: "Entrega excluída"
 *       400:
 *         description: "Não é possível excluir entregas já retiradas"
 */
router.delete('/:id', verificarToken, deletarEntrega);

/**
 * @openapi
 * /api/entregas:
 *   get:
 *     summary: Lista entregas com filtros e paginação
 *     tags: [Entregas]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *     - in: query
 *       name: unidade
 *       schema:
 *         type: string
 *     - in: query
 *       name: bloco
 *       schema:
 *         type: string
 *     - in: query
 *       name: status
 *       schema:
 *         type: string
 *         enum: [recebido, entregue, devolvida]
 *     - in: query
 *       name: retirada_urgente
 *       schema:
 *         type: boolean
 *     - in: query
 *       name: pagina
 *       schema:
 *         type: integer
 *         default: 1
 *     - in: query
 *       name: limite
 *       schema:
 *         type: integer
 *         default: 10
 *     responses:
 *       200:
 *         description: "Lista retornada"
 */
router.get('/', verificarToken, listarEntregas);

/**
 * @openapi
 * /api/entregas/{id}/saida-manual:
 *   patch:
 *     summary: Registra a retirada manual (Identificação do recebedor)
 *     tags: [Entregas]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quem_retirou:
 *                 type: string
 *               documento_retirou:
 *                 type: string
 *     responses:
 *       200:
 *         description: "Status atualizado"
 */
router.patch('/:id/saida-manual', verificarToken, registrarSaidaManual);

/**
 * @openapi
 * /api/entregas/{id}/saida-qrcode:
 *   patch:
 *     summary: Baixa rápida de encomenda via leitura de QR Code
 *     tags: [Entregas]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *     responses:
 *       200:
 *         description: "Saída confirmada"
 */
router.patch('/:id/saida-qrcode', verificarToken, registrarSaidaQRCode);

module.exports = router;