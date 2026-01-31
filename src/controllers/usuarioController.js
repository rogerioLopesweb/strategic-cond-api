const pool = require('../config/db');
const bcrypt = require('bcrypt');
const storage = require('../services/storageService');

// 1. LISTAGEM: Atualizada com CPF, Foto e Novos Perfis
const listarUsuariosDoCondominio = async (req, res) => {
    const { condominio_id, nome, perfil, bloco, unidade, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    if (!condominio_id) {
        return res.status(400).json({ success: false, message: 'ID do condomínio é obrigatório.' });
    }

    try {
        const dataQuery = `
            SELECT 
                u.id, 
                u.nome_completo, 
                u.email, 
                u.telefone, 
                u.cpf,
                u.foto_perfil,
                v.perfil,
                v.ativo,
                STRING_AGG(DISTINCT uni.bloco || '-' || uni.numero_unidade, ', ') AS unidades
            FROM usuarios u
            INNER JOIN vinculos_condominio v ON u.id = v.usuario_id
            LEFT JOIN unidade_usuarios uu ON u.id = uu.usuario_id AND uu.condominio_id = v.condominio_id
            LEFT JOIN unidades uni ON uu.unidade_id = uni.id
            WHERE v.condominio_id = $1
              AND ($2::text IS NULL OR u.nome_completo ILIKE $2)
              AND ($3::text IS NULL OR v.perfil = $3)
              AND ($4::text IS NULL OR uni.bloco = $4)
              AND ($5::text IS NULL OR uni.numero_unidade = $5)
            GROUP BY u.id, v.perfil, v.ativo
            ORDER BY u.nome_completo ASC
            LIMIT $6 OFFSET $7;
        `;

        const filterValues = [condominio_id, nome ? `%${nome}%` : null, perfil || null, bloco || null, unidade || null];
        const rowsResult = await pool.query(dataQuery, [...filterValues, limit, offset]);

        res.json({ success: true, usuarios: rowsResult.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
/**
 * CADASTRO COMPLETO: Agora com Foto, Nascimento e Emergência
 */
const cadastrarUsuarioCompleto = async (req, res) => {
    const { 
        nome_completo, cpf, email, telefone, perfil, 
        condominio_id, unidades, foto_base64,
        data_nascimento, contato_emergencia 
    } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Criar Usuário Base
        const senhaPadrao = cpf.replace(/\D/g, '').substring(0, 6);
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senhaPadrao, salt);

        const userResult = await client.query(`
            INSERT INTO usuarios (nome_completo, cpf, email, telefone, senha_hash, data_nascimento, contato_emergencia)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id;
        `, [nome_completo, cpf, email, telefone, senhaHash, data_nascimento, contato_emergencia]);

        const usuario_id = userResult.rows[0].id;

        // 2. Lógica de Foto (Conforme solicitado)
        let url_foto = null;
        if (foto_base64) {
            const nomeArquivo = `foto-${usuario_id}-${Date.now()}`;
            const pathRelativo = await storage.uploadFoto(foto_base64, nomeArquivo);
            if (pathRelativo) {
                url_foto = await storage.gerarLinkVisualizacao(pathRelativo);
                // Atualiza o registro com a URL gerada
                await client.query('UPDATE usuarios SET foto_perfil = $1 WHERE id = $2', [url_foto, usuario_id]);
            }
        }

        // 3. Vínculo de Perfil no Condomínio
        await client.query(`
            INSERT INTO vinculos_condominio (usuario_id, condominio_id, perfil, ativo)
            VALUES ($1, $2, $3, true);
        `, [usuario_id, condominio_id, perfil]);

        // 4. Vínculo de Unidades (Validando Existência)
        if (unidades && unidades.length > 0) {
            for (const uni of unidades) {
                const uniDb = await client.query(
                    'SELECT id FROM unidades WHERE condominio_id = $1 AND TRIM(bloco) = TRIM($2) AND TRIM(numero_unidade) = TRIM($3)',
                    [condominio_id, uni.identificador_bloco, uni.numero]
                );
                if (uniDb.rows.length === 0) throw new Error(`Unidade ${uni.identificador_bloco}-${uni.numero} inexistente.`);

                await client.query(`
                    INSERT INTO unidade_usuarios (usuario_id, unidade_id, condominio_id, tipo_vinculo)
                    VALUES ($1, $2, $3, $4);
                `, [usuario_id, uniDb.rows[0].id, condominio_id, uni.tipo_vinculo]);
            }
        }

        await client.query('COMMIT');
        res.json({ success: true, usuario_id, senha_provisoria: senhaPadrao, url_foto });

    } catch (error) {
        await client.query('ROLLBACK');
        res.status(400).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};

/* 2. DETALHADO: Inclui Unidades Vinculadas e Foto */
const getUsuarioDetalhado = async (req, res) => {
    const { id, condominio_id } = req.query;

    try {
        const query = `
            SELECT 
                u.id, u.nome_completo, u.email, u.telefone, u.cpf, u.foto_perfil,
                u.data_nascimento, u.contato_emergencia,
                v.perfil, v.ativo,
                (
                    SELECT JSON_AGG(JSON_BUILD_OBJECT(
                        'unidade_id', uni.id,
                        'identificador_bloco', uni.bloco,
                        'numero', uni.numero_unidade,
                        'tipo_vinculo', uu.tipo_vinculo
                    ))
                    FROM unidade_usuarios uu
                    JOIN unidades uni ON uu.unidade_id = uni.id
                    WHERE uu.usuario_id = u.id 
                      AND uu.condominio_id = $2 
                      AND uu.status = true  -- ✅ Traz apenas o que está ATIVO
                ) as unidades_vinculadas
            FROM usuarios u
            INNER JOIN vinculos_condominio v ON u.id = v.usuario_id
            WHERE u.id = $1 AND v.condominio_id = $2;
        `;

        const result = await pool.query(query, [id, condominio_id]);
        res.json({ success: true, usuario: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * ATUALIZAR COMPLETO: Edição de Perfil e Foto
 */
const atualizarUsuarioCompleto = async (req, res) => {
    const { 
        usuario_id, nome_completo, email, telefone, perfil, 
        condominio_id, unidades, foto_base64,
        data_nascimento, contato_emergencia 
    } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Lógica de Upload/Troca de Foto
        let url_foto = null;
        if (foto_base64) {
            const nomeArquivo = `foto-${usuario_id}-${Date.now()}`;
            const pathRelativo = await storage.uploadFoto(foto_base64, nomeArquivo);
            if (pathRelativo) {
                url_foto = await storage.gerarLinkVisualizacao(pathRelativo);

                await client.query(`
                    UPDATE usuarios SET 
                        foto_perfil = COALESCE($2, foto_perfil)
                    WHERE id = $1`, [usuario_id,url_foto]);
            }
        }

        // 2. Update na tabela Usuarios
        await client.query(`
            UPDATE usuarios SET 
                nome_completo = COALESCE($2, nome_completo),
                email = COALESCE($3, email),
                telefone = COALESCE($4, telefone),
                data_nascimento = COALESCE($5, data_nascimento),
                contato_emergencia = COALESCE($6, contato_emergencia)
            WHERE id = $1
        `, [usuario_id, nome_completo, email, telefone, data_nascimento, contato_emergencia]);

        // 3. Update no Vínculo do Condomínio
        if (perfil) {
            await client.query(`
                UPDATE vinculos_condominio SET perfil = $3
                WHERE usuario_id = $1 AND condominio_id = $2
            `, [usuario_id, condominio_id, perfil]);
        }

        // 4. Sincronização de Unidades (Delete e Re-insert)
        if (unidades) {
            await client.query('DELETE FROM unidade_usuarios WHERE usuario_id = $1 AND condominio_id = $2', [usuario_id, condominio_id]);
            for (const uni of unidades) {
                const uniDb = await client.query(
                    'SELECT id FROM unidades WHERE condominio_id = $1 AND bloco = $2 AND numero_unidade = $3',
                    [condominio_id, uni.identificador_bloco, uni.numero]
                );
                if (uniDb.rows.length > 0) {
                    await client.query(`
                        INSERT INTO unidade_usuarios (usuario_id, unidade_id, condominio_id, tipo_vinculo)
                        VALUES ($1, $2, $3, $4);
                    `, [usuario_id, uniDb.rows[0].id, condominio_id, uni.tipo_vinculo]);
                }
            }
        }

        await client.query('COMMIT');
        res.json({ success: true, message: 'Perfil atualizado!' });

    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
};

// 3. ATUALIZAÇÃO (EDITE): Para completar dados de Emergência e Foto
/**
 * ✅ ATUALIZAR PERFIL (Apenas dados textuais e cargo)
 */
/**
 * Helper: Valida se a data é real (ex: evita 31/02) e converte para YYYY-MM-DD
 */
const validarEFormatarData = (dataStr) => {
    if (!dataStr) return null;

    // 1. Verifica o formato básico via Regex (DD/MM/AAAA)
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!regex.test(dataStr)) return false;

    const [_, dia, mes, ano] = dataStr.match(regex);
    
    // 2. Tenta criar um objeto de data (Mês no JS começa em 0, por isso mes - 1)
    const dataTeste = new Date(ano, mes - 1, dia);

    // 3. Verifica se o JS não "rolou" a data (ex: 31/02 vira 03/03)
    const dataValida = dataTeste.getFullYear() == ano && 
                       (dataTeste.getMonth() + 1) == mes && 
                       dataTeste.getDate() == dia;

    return dataValida ? `${ano}-${mes}-${dia}` : false;
};

const atualizarPerfil = async (req, res) => {
    const { 
        usuario_id, nome_completo, email, telefone, 
        perfil, condominio_id, data_nascimento, contato_emergencia 
    } = req.body;

    // ✅ VALIDAÇÃO DE DATA ANTES DE TUDO
    const dataFormatada = data_nascimento ? validarEFormatarData(data_nascimento) : null;

    if (data_nascimento && dataFormatada === false) {
        return res.status(400).json({ 
            success: false, 
            message: "Data de nascimento inválida. Verifique o dia e o mês." 
        });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Update com a data já tratada e segura para o Postgres
        await client.query(`
            UPDATE usuarios SET 
                nome_completo = COALESCE($2, nome_completo),
                email = COALESCE($3, email),
                telefone = COALESCE($4, telefone),
                data_nascimento = COALESCE($5, data_nascimento),
                contato_emergencia = COALESCE($6, contato_emergencia)
            WHERE id = $1
        `, [usuario_id, nome_completo, email, telefone, dataFormatada, contato_emergencia]);

        if (perfil) {
            await client.query(`
                UPDATE vinculos_condominio SET perfil = $3
                WHERE usuario_id = $1 AND condominio_id = $2
            `, [usuario_id, condominio_id, perfil]);
        }

        await client.query('COMMIT');
        res.json({ success: true, message: 'Perfil atualizado!' });

    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
};

/**
 * ✅ ATUALIZAR FOTO (Processo Individual de Storage)
 */
const atualizarFoto = async (req, res) => {
    const { usuario_id, condominio_id, foto_base64 } = req.body;

    if (!foto_base64) {
        return res.status(400).json({ success: false, message: "Foto não fornecida." });
    }

    try {
        const nomeArquivo = `foto-${usuario_id}-${Date.now()}`;
        
        // 1. Upload para o storage (DigitalOcean/AWS/Local)
        const pathRelativo = await storage.uploadFoto(foto_base64, nomeArquivo);
        
        if (!pathRelativo) throw new Error("Falha no upload do arquivo.");

        // 2. Gera o link público
        const url_foto = await storage.gerarLinkVisualizacao(pathRelativo);

        // 3. Salva apenas a URL no banco
        await pool.query(`
            UPDATE usuarios SET foto_perfil = $2 WHERE id = $1
        `, [usuario_id, url_foto]);

        res.json({ success: true, url_foto, message: 'Foto de perfil atualizada!' });

    } catch (error) {
        console.error('Erro ao processar foto:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// 4. ATUALIZAR STATUS (Certifique-se que esta função EXISTE aqui no arquivo)
const atualizarStatusUsuario = async (req, res) => {
    const { usuario_id, condominio_id, ativo } = req.body;
    try {
        const query = `
            UPDATE vinculos_condominio 
            SET ativo = $3 
            WHERE usuario_id = $1 AND condominio_id = $2
            RETURNING ativo;
        `;
        const result = await pool.query(query, [usuario_id, condominio_id, ativo]);
        res.json({ success: true, ativo: result.rows[0].ativo });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 5. PUSH TOKEN (Certifique-se que esta função EXISTE aqui no arquivo)
const salvarPushToken = async (req, res) => {
    const { token } = req.body;
    const usuario_id = req.usuario.id;
    try {
        await pool.query('UPDATE usuarios SET expo_push_token = $1 WHERE id = $2', [token, usuario_id]);
        res.json({ success: true, message: 'Token salvo!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};



// ✅ O SEGREDO ESTÁ AQUI: EXPORTE APENAS OS NOMES DAS FUNÇÕES
module.exports = { 
    listarUsuariosDoCondominio, 
    cadastrarUsuarioCompleto, 
    getUsuarioDetalhado,
    atualizarPerfil,
    atualizarStatusUsuario,
    salvarPushToken,
    atualizarFoto
};