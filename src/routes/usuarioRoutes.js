const express = require('express');
const router = express.Router();
const { listarUsuariosDoCondominio, cadastrarUsuarioCompleto, getUsuarioDetalhado, atualizarPerfil, atualizarStatusUsuario, salvarPushToken, atualizarFoto}  = require('../controllers/usuarioController');
const { verificarToken } = require('../middlewares/authMiddleware'); // Seu middleware de segurança

// --- ROTAS DE LISTAGEM ---

/**
 * @openapi
 * /api/usuarios/condominio:
 *   get:
 *     summary: Lista usuários de um condomínio com filtros e paginação
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 */
router.get('/condominio', verificarToken, listarUsuariosDoCondominio);

// --- ROTAS DE CADASTRO E ATUALIZAÇÃO ---

/**
 * @openapi
 * /api/usuarios/cadastrar:
 *   post:
 *     summary: Cadastro Mestre de Usuário (Gestão, Moradores e Equipe)
 *     description: Cria usuário, faz upload de foto e vincula unidades em uma única transação.
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 */
router.post('/cadastrar', verificarToken, cadastrarUsuarioCompleto);

/**
 * @openapi
 * /api/usuarios/perfil:
 *   put:
 *     summary: Atualiza dados de perfil, foto e contato de emergência
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 */
router.put('/perfil', verificarToken, atualizarPerfil);

/**
 * @openapi
 * /api/usuarios/detalhes:
 *   get:
 *     summary: Retorna detalhes de um usuário específico
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 */
router.get('/detalhes', getUsuarioDetalhado);

// --- ROTAS DE STATUS E NOTIFICAÇÕES ---

/**
 * @openapi
 * /api/usuarios/atualiza_status:
 *   post:
 *     summary: Ativa ou Desativa o vínculo do usuário (Toggle)
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 */
router.post('/atualiza_status', verificarToken, atualizarStatusUsuario);

/**
 * @openapi
 * /api/usuarios/push-token:
 *   post:
 *     summary: Salva o token do Expo para notificações push
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 */
router.post('/push-token', verificarToken, salvarPushToken);

/**
 * @openapi
 * /api/usuarios/atualizar-foto:
 *   post:
 *     summary: Salva a foto
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 */
router.post('/atualizar-foto', verificarToken, atualizarFoto);



module.exports = router;