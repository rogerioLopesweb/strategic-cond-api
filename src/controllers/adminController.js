const pool = require('../config/db');
const bcrypt = require('bcrypt');

const gerarUnidadesEmMassa = async (req, res) => {
    const { condominio_id, blocos, inicio, fim } = req.body;
    // blocos: ["A", "B"], inicio: 101, fim: 110

    try {
        const unidadesInseridas = [];
        
        for (const bloco of blocos) {
            for (let i = inicio; i <= fim; i++) {
                unidadesInseridas.push([condominio_id, bloco, i.toString()]);
            }
        }

        // Usando unnest para inserção múltipla ultra rápida
        const query = `
            INSERT INTO unidades (condominio_id, bloco, numero_unidade)
            SELECT * FROM UNNEST($1::uuid[], $2::text[], $3::text[])
            ON CONFLICT (condominio_id, bloco, numero_unidade) DO NOTHING
            RETURNING *;
        `;

        const values = [
            unidadesInseridas.map(u => u[0]),
            unidadesInseridas.map(u => u[1]),
            unidadesInseridas.map(u => u[2])
        ];

        const result = await pool.query(query, values);
        res.json({ success: true, gerados: result.rowCount });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
const vincularMoradorUnidade = async (req, res) => {
    const { usuario_id, condominio_id, unidade_id, tipo_vinculo } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Garante o vínculo geral com o condomínio
        await client.query(`
            INSERT INTO vinculos_condominio (usuario_id, condominio_id, perfil, ativo)
            VALUES ($1, $2, 'morador', true)
            ON CONFLICT (usuario_id, condominio_id) DO UPDATE SET ativo = true;
        `, [usuario_id, condominio_id]);

        // 2. Cria o vínculo específico com a unidade
        const result = await client.query(`
            INSERT INTO unidade_usuarios (usuario_id, unidade_id, condominio_id, tipo_vinculo, status)
            VALUES ($1, $2, $3, $4, 'ativo')
            RETURNING id;
        `, [usuario_id, unidade_id, condominio_id, tipo_vinculo]);

        await client.query('COMMIT');
        res.json({ success: true, vinculo_id: result.rows[0].id });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
};

// Cadastro de Usuário Morador (Ação do Síndico/Admin)
const cadastrarUsuarioMorador = async (req, res) => {
    const { nome_completo, cpf, email, telefone, condominio_id } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Verificar se o CPF ou E-mail já existem
        const existe = await client.query(
            'SELECT id FROM usuarios WHERE cpf = $1 OR email = $2',
            [cpf, email]
        );

        if (existe.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'CPF ou E-mail já cadastrados.' });
        }

        // 2. Criar senha padrão (ex: 6 primeiros dígitos do CPF)
        const senhaPadrao = cpf.substring(0, 6);
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senhaPadrao, salt);

        // 3. Inserir Usuário
        const userResult = await client.query(`
            INSERT INTO usuarios (nome_completo, cpf, email, telefone, senha_hash)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id;
        `, [nome_completo, cpf, email, telefone, senhaHash]);

        const novoUsuarioId = userResult.rows[0].id;

        // 4. Criar vínculo inicial com o Condomínio como 'morador'
        // Usamos a tabela vinculos_condominio que você mapeou no JSON
        await client.query(`
            INSERT INTO vinculos_condominio (usuario_id, condominio_id, perfil, ativo)
            VALUES ($1, $2, 'morador', true);
        `, [novoUsuarioId, condominio_id]);

        await client.query('COMMIT');

        res.json({ 
            success: true, 
            message: 'Morador cadastrado com sucesso!',
            usuario_id: novoUsuarioId,
            senha_provisoria: senhaPadrao // Para você informar ao morador
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao cadastrar morador:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
};

// Cadastro de Condomínio (Ação do Síndico/Admin)
const cadastrarCondominio = async (req, res) => {
    const { nome_fantasia, razao_social, cnpj, logradouro, numero, bairro, cidade, estado, cep } = req.body;

    try {
        const result = await pool.query(`
            INSERT INTO condominios (nome_fantasia, razao_social, cnpj, logradouro, numero, bairro, cidade, estado, cep, ativo)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
            RETURNING id;
        `, [nome_fantasia, razao_social, cnpj, logradouro, numero, bairro, cidade, estado, cep]);

        res.json({ success: true, condominio_id: result.rows[0].id });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Cadastro de Portaria (Ação do Síndico)
const cadastrarUsuarioPortaria = async (req, res) => {
    const { nome_completo, cpf, email, condominio_id } = req.body;

    try {
        // Senha padrão para portaria: 123456 (ou os primeiros 6 do CPF)
        const senhaPadrao = cpf.substring(0, 6);
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senhaPadrao, salt);

        const userResult = await pool.query(`
            INSERT INTO usuarios (nome_completo, cpf, email, senha_hash)
            VALUES ($1, $2, $3, $4)
            RETURNING id;
        `, [nome_completo, cpf, email, senhaHash]);

        const usuarioId = userResult.rows[0].id;

        // Vínculo obrigatório com perfil 'portaria'
        await pool.query(`
            INSERT INTO vinculos_condominio (usuario_id, condominio_id, perfil, ativo)
            VALUES ($1, $2, 'portaria', true);
        `, [usuarioId, condominio_id]);

        res.json({ success: true, message: 'Portaria cadastrada!', senha_provisoria: senhaPadrao });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Não esqueça de exportar a nova função
module.exports = { 
    gerarUnidadesEmMassa, 
    vincularMoradorUnidade, 
    cadastrarUsuarioMorador,
    cadastrarCondominio,
    cadastrarUsuarioPortaria
};