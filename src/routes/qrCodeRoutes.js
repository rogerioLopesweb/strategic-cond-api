const express = require('express');
const router = express.Router();
const { gerarQrCodeEntrega } = require('../controllers/qrCodeController');

/**
 * @openapi
 * /api/qrcode/entrega/{id}:
 *   get:
 *     summary: Gera QR Code para entrega
 *     description: Rota pública para o QR Code (acessível pelo link no e-mail)
 *     tags:
 *       - QR Code
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da entrega
 *     responses:
 *       200:
 *         description: QR Code gerado com sucesso
 *       404:
 *         description: Entrega não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
// Rota pública para o QR Code (acessível pelo link no e-mail)
router.get('/entrega/:id', gerarQrCodeEntrega);

module.exports = router;