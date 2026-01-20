const express = require('express');
const router = express.Router();
const { testUpload } = require('../controllers/testController');

/**
 * @openapi
 * /api/testes/upload:
 *   post:
 *     summary: Rota de teste para validar upload no disco da VPS (Volume Local)
 *     description: Envia uma imagem em Base64 para ser salva na pasta pública da VPS e retorna a URL de acesso.
 *     tags:
 *       - Testes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome_arquivo:
 *                 type: string
 *                 example: "foto-teste-vps"
 *               foto_base64:
 *                 type: string
 *                 description: String Base64 da imagem (enviar apenas o código, sem o prefixo data:image/...)
 *                 example: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
 *     responses:
 *       200:
 *         description: Upload concluído com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 detalhes:
 *                   type: object
 *                   properties:
 *                     arquivo:
 *                       type: string
 *                     url_publica:
 *                       type: string
 *       400:
 *         description: Falha no envio (Base64 ausente)
 *       500:
 *         description: Erro ao gravar arquivo no disco
 */
router.post('/upload', testUpload);

module.exports = router;