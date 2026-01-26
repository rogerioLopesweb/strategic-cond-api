const express = require('express');
const router = express.Router();
const { processarFilaPush } = require('../controllers/enviaNotificacaoPushController');

/**
 * @openapi
 * /api/notificacoes/processar-fila:
 *   get:
 *     summary: Rota oficial para ser chamada via Cron Job externo
 *     description: Rota oficial para ser chamada via Cron Job externo (EasyPanel/Cron)
 *     tags:
 *       - Notificações
 *     responses:
 *       200:
 *         description: Fila processada com sucesso
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/processar-fila', processarFilaPush);

module.exports = router;