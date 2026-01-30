const pool = require('../config/db');


// Cadastro de Condomínio com Vínculo Administrativo
const cadastrarCondominio = async (req, res) => {
    const { 
        nome_fantasia, razao_social, cnpj, logradouro, 
        numero, bairro, cidade, estado, cep, perfil 
    } = req.body;

    // Pegando o ID do usuário autenticado (seguindo seu padrão req.usuario.id)
    const usuario_id = req.usuario && req.usuario.id;

    if (!usuario_id) {
        return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Inserir o Condomínio
        const condoResult = await client.query(`
            INSERT INTO condominios (nome_fantasia, razao_social, cnpj, logradouro, numero, bairro, cidade, estado, cep, ativo)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
            RETURNING id;
        `, [nome_fantasia, razao_social, cnpj, logradouro, numero, bairro, cidade, estado, cep]);

        const novoCondominioId = condoResult.rows[0].id;

        // 2. Criar vínculo obrigatório (Admin ou Síndico)
        // Se o perfil não for enviado, definimos como 'sindico' por padrão
        const perfilVinculo = perfil || 'sindico';

        await client.query(`
            INSERT INTO vinculos_condominio (usuario_id, condominio_id, perfil, ativo)
            VALUES ($1, $2, $3, true);
        `, [usuario_id, novoCondominioId, perfilVinculo]);

        await client.query('COMMIT');

        res.json({ 
            success: true, 
            message: 'Condomínio e vínculo criados com sucesso!',
            condominio_id: novoCondominioId 
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao cadastrar condomínio:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
};

// Lista apenas os condomínios que o usuário logado tem permissão/vínculo
const listarMeusCondominios = async (req, res) => {
    // ID do usuário logado vindo do middleware
    const usuario_id = req.usuario && req.usuario.id;

    if (!usuario_id) {
        return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
    }

    // Filtros e Paginação (Padrão: página 1, 10 itens por vez)
    const { 
        cidade, 
        estado, 
        nome_fantasia, 
        cnpj, 
        page = 1, 
        limit = 10 
    } = req.query;

    const offset = (page - 1) * limit;

    try {
        // 1. Busca os dados com os filtros aplicados
        // Usamos ILIKE para cidade e nome_fantasia (busca aproximada)
        const dataQuery = `
            SELECT 
                c.id, 
                c.nome_fantasia, 
                c.razao_social, 
                c.cnpj, 
                c.logradouro, 
                c.numero, 
                c.bairro,
                c.cidade, 
                c.estado, 
                c.cep, 
                v.perfil, 
                c.plano, 
                c.criado_em 
            FROM condominios c
            INNER JOIN vinculos_condominio v ON c.id = v.condominio_id
            WHERE v.usuario_id = $1 
              AND v.ativo = true
              AND ($2::text IS NULL OR c.cidade ILIKE $2)
              AND ($3::text IS NULL OR c.estado = $3)
              AND ($4::text IS NULL OR c.nome_fantasia ILIKE $4)
              AND ($5::text IS NULL OR c.cnpj = $5)
            ORDER BY c.nome_fantasia ASC
            LIMIT $6 OFFSET $7;
        `;

        // 2. Conta o total de registros para controle da paginação no Frontend
        const countQuery = `
            SELECT COUNT(*) 
            FROM condominios c
            INNER JOIN vinculos_condominio v ON c.id = v.condominio_id
            WHERE v.usuario_id = $1 
              AND v.ativo = true
              AND ($2::text IS NULL OR c.cidade ILIKE $2)
              AND ($3::text IS NULL OR c.estado = $3)
              AND ($4::text IS NULL OR c.nome_fantasia ILIKE $4)
              AND ($5::text IS NULL OR c.cnpj = $5);
        `;

        // Formatação dos valores para busca parcial
        const values = [
            usuario_id,
            cidade ? `%${cidade}%` : null,
            estado || null,
            nome_fantasia ? `%${nome_fantasia}%` : null,
            cnpj || null
        ];

        // Execução paralela das queries
        const [rowsResult, countResult] = await Promise.all([
            pool.query(dataQuery, [...values, limit, offset]),
            pool.query(countQuery, values)
        ]);

        const totalItems = parseInt(countResult.rows[0].count);

        res.json({ 
            success: true, 
            condominios: rowsResult.rows,
            pagination: {
                total: totalItems,
                page: parseInt(page),
                limit: parseInt(limit),
                total_pages: Math.ceil(totalItems / limit)
            }
        });

    } catch (error) {
        console.error('Erro ao listar condomínios:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { 
    cadastrarCondominio,
    listarMeusCondominios
};
