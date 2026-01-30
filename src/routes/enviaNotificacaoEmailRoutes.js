const express = require('express');
const router = express.Router();
const { processarFilaEmail } = require('../controllers/enviaNotificacaoEmailController');

/**
 * @openapi
 * /api/notificacoes-email/processar-fila:
 *   get:
 *     summary: Processa fila de notificações por e-mail
 *     description: Rota para processar a fila de notificações por e-mail
 *     tags:
 *       - Notificações
 *     responses:
 *       200:
 *         description: Fila processada com sucesso
 *       500:
 *         description: Erro interno do servidor
 */
// GET /api/notificacoes-email/processar-fila
router.get('/processar-fila', processarFilaEmail);

module.exports = router;