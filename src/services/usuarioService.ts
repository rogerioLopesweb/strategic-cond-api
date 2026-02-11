import pool from "../config/db";
import bcrypt from "bcrypt";
// @ts-ignore
import storage from "../services/storageService";
import {
  CreateUsuarioDTO,
  UpdateUsuarioDTO,
  ListUsuarioFilters,
} from "../schemas/usuarioSchema";

export class UsuarioService {
  /**
   * Lista usuários de um condomínio com filtros.
   */
  async listarPorCondominio(filters: ListUsuarioFilters) {
    const offset = (filters.page - 1) * filters.limit;

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

    const countQuery = `
            SELECT COUNT(DISTINCT u.id) as count
            FROM usuarios u
            INNER JOIN vinculos_condominio v ON u.id = v.usuario_id
            LEFT JOIN unidade_usuarios uu ON u.id = uu.usuario_id AND uu.condominio_id = v.condominio_id
            LEFT JOIN unidades uni ON uu.unidade_id = uni.id
            WHERE v.condominio_id = $1
              AND ($2::text IS NULL OR u.nome_completo ILIKE $2)
              AND ($3::text IS NULL OR v.perfil = $3)
              AND ($4::text IS NULL OR uni.bloco = $4)
              AND ($5::text IS NULL OR uni.numero_unidade = $5);
        `;

    const values = [
      filters.condominio_id,
      filters.nome ? `%${filters.nome}%` : null,
      filters.perfil || null,
      filters.bloco || null,
      filters.unidade || null,
    ];

    const [result, totalResult] = await Promise.all([
      pool.query(dataQuery, [...values, filters.limit, offset]),
      pool.query(countQuery, values),
    ]);

    const total_pages = Math.ceil(
      parseInt(totalResult.rows[0].count) / filters.limit,
    );

    return {
      success: true,
      meta: {
        total: parseInt(totalResult.rows[0].count),
        pagina: parseInt(filters.page.toString()),
        limite: parseInt(filters.limit.toString()),
        total_pages: total_pages,
      },
      data: result.rows,
    };
  }

  /**
   * Cadastro completo de usuário (Transacional).
   */
  async cadastrarCompleto(dados: CreateUsuarioDTO) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Criar Usuário Base
      const senhaPadrao = dados.cpf.replace(/\D/g, "").substring(0, 6);
      const salt = await bcrypt.genSalt(10);
      const senhaHash = await bcrypt.hash(senhaPadrao, salt);

      const userResult = await client.query(
        `
                INSERT INTO usuarios (nome_completo, cpf, email, telefone, senha_hash, data_nascimento, contato_emergencia)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id;
            `,
        [
          dados.nome_completo,
          dados.cpf,
          dados.email,
          dados.telefone,
          senhaHash,
          dados.data_nascimento,
          dados.contato_emergencia,
        ],
      );

      const usuarioId = userResult.rows[0].id;

      // 2. Upload de Foto
      let urlFoto = null;
      if (dados.foto_base64) {
        const nomeArquivo = `foto-${usuarioId}-${Date.now()}`;
        const pathRelativo = await storage.uploadFoto(
          dados.foto_base64,
          nomeArquivo,
        );
        if (pathRelativo) {
          urlFoto = await storage.gerarLinkVisualizacao(pathRelativo);
          await client.query(
            "UPDATE usuarios SET foto_perfil = $1 WHERE id = $2",
            [urlFoto, usuarioId],
          );
        }
      }

      // 3. Vínculo de Perfil
      await client.query(
        `
                INSERT INTO vinculos_condominio (usuario_id, condominio_id, perfil, ativo)
                VALUES ($1, $2, $3, true);
            `,
        [usuarioId, dados.condominio_id, dados.perfil],
      );

      // 4. Vínculo de Unidades
      if (dados.unidades && dados.unidades.length > 0) {
        for (const uni of dados.unidades) {
          const uniDb = await client.query(
            "SELECT id FROM unidades WHERE condominio_id = $1 AND TRIM(bloco) = TRIM($2) AND TRIM(numero_unidade) = TRIM($3)",
            [dados.condominio_id, uni.identificador_bloco, uni.numero],
          );
          if (uniDb.rows.length === 0)
            throw new Error(
              `Unidade ${uni.identificador_bloco}-${uni.numero} inexistente.`,
            );

          await client.query(
            `
                        INSERT INTO unidade_usuarios (usuario_id, unidade_id, condominio_id, tipo_vinculo)
                        VALUES ($1, $2, $3, $4);
                    `,
            [
              usuarioId,
              uniDb.rows[0].id,
              dados.condominio_id,
              uni.tipo_vinculo,
            ],
          );
        }
      }

      await client.query("COMMIT");
      return {
        usuario_id: usuarioId,
        senha_provisoria: senhaPadrao,
        url_foto: urlFoto,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Busca detalhada de usuário e suas unidades.
   */
  async getDetalhado(id: string, condominioId: string) {
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
                      AND uu.status = true
                ) as unidades_vinculadas
            FROM usuarios u
            INNER JOIN vinculos_condominio v ON u.id = v.usuario_id
            WHERE u.id = $1 AND v.condominio_id = $2;
        `;
    const result = await pool.query(query, [id, condominioId]);
    return result.rows[0];
  }

  /**
   * Atualiza dados do usuário (Completo ou Perfil).
   */
  async atualizar(dados: UpdateUsuarioDTO) {
    // Validação de data se fornecida
    let dataFormatada: string | null | undefined = dados.data_nascimento;
    if (dados.data_nascimento) {
      dataFormatada = this.validarEFormatarData(dados.data_nascimento);
      if (dataFormatada === null)
        throw new Error("Data de nascimento inválida.");
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Foto
      let urlFoto = null;
      if (dados.foto_base64) {
        const nomeArquivo = `foto-${dados.usuario_id}-${Date.now()}`;
        const pathRelativo = await storage.uploadFoto(
          dados.foto_base64,
          nomeArquivo,
        );
        if (pathRelativo) {
          urlFoto = await storage.gerarLinkVisualizacao(pathRelativo);
          await client.query(
            "UPDATE usuarios SET foto_perfil = $1 WHERE id = $2",
            [urlFoto, dados.usuario_id],
          );
        }
      }

      // 2. Update Usuário
      await client.query(
        `
                UPDATE usuarios SET 
                    nome_completo = COALESCE($2, nome_completo),
                    email = COALESCE($3, email),
                    telefone = COALESCE($4, telefone),
                    data_nascimento = COALESCE($5, data_nascimento),
                    contato_emergencia = COALESCE($6, contato_emergencia)
                WHERE id = $1
            `,
        [
          dados.usuario_id,
          dados.nome_completo,
          dados.email,
          dados.telefone,
          dataFormatada,
          dados.contato_emergencia,
        ],
      );

      // 3. Update Perfil
      if (dados.perfil) {
        await client.query(
          `
                    UPDATE vinculos_condominio SET perfil = $3
                    WHERE usuario_id = $1 AND condominio_id = $2
                `,
          [dados.usuario_id, dados.condominio_id, dados.perfil],
        );
      }

      // 4. Sincronização de Unidades
      if (dados.unidades) {
        await client.query(
          "DELETE FROM unidade_usuarios WHERE usuario_id = $1 AND condominio_id = $2",
          [dados.usuario_id, dados.condominio_id],
        );
        for (const uni of dados.unidades) {
          const uniDb = await client.query(
            "SELECT id FROM unidades WHERE condominio_id = $1 AND bloco = $2 AND numero_unidade = $3",
            [dados.condominio_id, uni.identificador_bloco, uni.numero],
          );
          if (uniDb.rows.length > 0) {
            await client.query(
              `
                            INSERT INTO unidade_usuarios (usuario_id, unidade_id, condominio_id, tipo_vinculo)
                            VALUES ($1, $2, $3, $4);
                        `,
              [
                dados.usuario_id,
                uniDb.rows[0].id,
                dados.condominio_id,
                uni.tipo_vinculo,
              ],
            );
          }
        }
      }

      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async atualizarStatus(
    usuarioId: string,
    condominioId: string,
    ativo: boolean,
  ) {
    const query = `
            UPDATE vinculos_condominio 
            SET ativo = $3 
            WHERE usuario_id = $1 AND condominio_id = $2
            RETURNING ativo;
        `;
    const result = await pool.query(query, [usuarioId, condominioId, ativo]);
    return result.rows[0];
  }

  async salvarPushToken(usuarioId: string, token: string) {
    await pool.query("UPDATE usuarios SET expo_push_token = $1 WHERE id = $2", [
      token,
      usuarioId,
    ]);
  }

  async atualizarFoto(usuarioId: string, fotoBase64: string) {
    const nomeArquivo = `foto-${usuarioId}-${Date.now()}`;
    const pathRelativo = await storage.uploadFoto(fotoBase64, nomeArquivo);

    if (!pathRelativo) throw new Error("Falha no upload do arquivo.");

    const urlFoto = await storage.gerarLinkVisualizacao(pathRelativo);
    await pool.query("UPDATE usuarios SET foto_perfil = $2 WHERE id = $1", [
      usuarioId,
      urlFoto,
    ]);
    return urlFoto;
  }

  /**
   * Helper para validar e formatar data (DD/MM/YYYY -> YYYY-MM-DD)
   */
  private validarEFormatarData(dataStr: string): string | null {
    if (!dataStr) return null;
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!regex.test(dataStr)) return null;

    const match = dataStr.match(regex);
    if (!match) return null;

    const [_, dia, mes, ano] = match;
    const dataTeste = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));

    const dataValida =
      dataTeste.getFullYear() == parseInt(ano) &&
      dataTeste.getMonth() + 1 == parseInt(mes) &&
      dataTeste.getDate() == parseInt(dia);

    return dataValida ? `${ano}-${mes}-${dia}` : null;
  }
}
