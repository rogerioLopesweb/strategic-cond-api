const express = require('express');
const router = express.Router();
const { 
    registrarEntrega, 
    listarEntregas, 
    registrarSaidaManual,
    registrarSaidaQRCode 
} = require('../controllers/entregaController');
const { verificarToken } = require('../middlewares/authMiddleware');

/**
 * @openapi
 * /api/entregas/registrar:
 *   post:
 *     summary: Registra a entrada de uma nova encomenda (Scanner)
 *     description: Recebe os dados da encomenda e a foto em Base64, salvando no disco da VPS e registrando no banco com IDs em formato UUID.
 *     tags: [Entregas]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               condominio_id: { type: string, format: uuid, example: "550e8400-e29b-41d4-a716-446655440000" }
 *               morador_id: { type: string, format: uuid, example: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" }
 *               codigo_rastreio: { type: string, example: "BR123456789SH" }
 *               unidade: { type: string, example: "101" }
 *               bloco: { type: string, example: "A" }
 *               marketplace: { type: string, example: "Mercado Livre" }
 *               observacoes: { type: string, example: "Pacote deixado na portaria" }
 *               foto_base64: { type: string, description: "Base64 sem prefixo", example: "iVBORw0KGgo..." }
 *     responses:
 *       201: { description: "Entrega registrada com sucesso" }
 */
router.post('/registrar', verificarToken, registrarEntrega);

/**
 * @openapi
 * /api/entregas:
 *   get:
 *     summary: Lista entregas com filtros e paginação
 *     tags: [Entregas]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: unidade
 *         schema: { type: string }
 *       - in: query
 *         name: bloco
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [recebido, entregue, cancelado] }
 *       - in: query
 *         name: pagina
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limite
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200: { description: "Lista retornada" }
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
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quem_retirou: { type: string, example: "Próprio Morador" }
 *               documento_retirou: { type: string, example: "123.456.789-00" }
 *     responses:
 *       200: { description: "Status atualizado" }
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
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: "Saída confirmada via QR Code" }
 */
router.patch('/:id/saida-qrcode', verificarToken, registrarSaidaQRCode);

module.exports = router;