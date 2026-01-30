const express = require('express');
const router = express.Router();
const { cadastrarCondominio, listarMeusCondominios } = require('../controllers/condominioController');
const { verificarToken } = require('../middlewares/authMiddleware');

/**
 * @openapi
 * /api/condominios:
 *   post:
 *     summary: Cadastra um novo condomínio
 *     description: Cria o registro do condomínio e vincula o usuário logado como administrador/síndico.
 *     tags:
 *       - Condomínios
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome_fantasia:
 *                 type: string
 *                 example: "Residencial Solar"
 *               razao_social:
 *                 type: string
 *                 example: "Residencial Solar LTDA"
 *               cnpj:
 *                 type: string
 *                 example: "12.345.678/0001-90"
 *               logradouro:
 *                 type: string
 *                 example: "Rua das Flores"
 *               numero:
 *                 type: string
 *                 example: "100"
 *               bairro:
 *                 type: string
 *                 example: "Centro"
 *               cidade:
 *                 type: string
 *                 example: "Osasco"
 *               estado:
 *                 type: string
 *                 example: "SP"
 *               cep:
 *                 type: string
 *                 example: "06000-000"
 *               perfil:
 *                 type: string
 *                 enum: [admin, sindico]
 *                 example: "sindico"
 *     responses:
 *       201:
 *         description: Condomínio cadastrado e vinculado com sucesso.
 *       401:
 *         description: Token inválido ou ausente.
 */
router.post('/', verificarToken, cadastrarCondominio);

/**
 * @openapi
 * /api/condominios:
 *   get:
 *     summary: Lista meus condomínios com filtros e paginação
 *     description: Retorna os condomínios vinculados ao usuário autenticado, ordenados por Nome Fantasia.
 *     tags:
 *       - Condomínios
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: nome_fantasia
 *         description: Filtro por nome (busca parcial)
 *         schema:
 *           type: string
 *       - in: query
 *         name: cidade
 *         description: Filtro por cidade
 *         schema:
 *           type: string
 *       - in: query
 *         name: estado
 *         description: Filtro por estado (Ex SP)
 *         schema:
 *           type: string
 *       - in: query
 *         name: cnpj
 *         description: Filtro por CNPJ exato
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         description: Número da página
 *         schema:
 *           type: integer
 *         default: 1
 *       - in: query
 *         name: limit
 *         description: Quantidade de itens por página
 *         schema:
 *           type: integer
 *         default: 10
 *     responses:
 *       200:
 *         description: Lista de condomínios retornada com sucesso.
 */
router.get('/', verificarToken, listarMeusCondominios);

module.exports = router;