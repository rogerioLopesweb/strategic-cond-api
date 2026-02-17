import { db } from "../../../shared/infra/database/connection";
import {
  CreateUsuarioDTO,
  UpdateUsuarioDTO,
  ListUsuarioFilters,
} from "../dtos/usuario.dto";
import { Usuario } from "../entities/Usuario";
import { IUsuarioRepository } from "./IUsuarioRepository";
import { IUsuarioDetalhadoDTO } from "./IUsuarioDetalhadoDTO";

export class UsuarioRepository implements IUsuarioRepository {
  async listarComFiltros(f: ListUsuarioFilters) {
    const offset = (f.page - 1) * f.limit;
    const values = [
      f.condominio_id,
      f.nome ? `%${f.nome}%` : null,
      f.perfil || null,
      f.bloco || null,
      f.unidade || null,
    ];

    const dataQuery = `
      SELECT 
          u.id, u.nome_completo, u.email, u.telefone, u.cpf, u.foto_perfil,
          v.perfil, v.ativo,
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

    const [result, totalResult] = await Promise.all([
      db.query(dataQuery, [...values, f.limit, offset]),
      db.query(countQuery, values),
    ]);

    return {
      data: result.rows,
      total: parseInt(totalResult.rows[0].count),
    };
  }
  async cadastrarCompleto(dados: CreateUsuarioDTO, senhaHash: string) {
    const client = await db.connect();
    try {
      await client.query("BEGIN");

      // 1. Inserir Usuário
      const userRes = await client.query(
        `INSERT INTO usuarios (nome_completo, cpf, email, telefone, senha_hash, data_nascimento, contato_emergencia)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
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
      const usuarioId = userRes.rows[0].id;

      await client.query(
        `INSERT INTO vinculos_condominio (usuario_id, condominio_id, perfil, ativo) VALUES ($1, $2, $3, true)`,
        [usuarioId, dados.condominio_id, dados.perfil],
      );

      if (dados.unidades && dados.unidades.length > 0) {
        for (const uni of dados.unidades) {
          const uniDb = await client.query(
            `SELECT id FROM unidades WHERE condominio_id = $1 AND TRIM(bloco) = TRIM($2) AND TRIM(numero_unidade) = TRIM($3)`,
            [dados.condominio_id, uni.identificador_bloco, uni.numero],
          );

          if (uniDb.rows.length === 0) {
            throw new Error(
              `Unidade ${uni.identificador_bloco}-${uni.numero} inexistente.`,
            );
          }

          await client.query(
            `INSERT INTO unidade_usuarios (usuario_id, unidade_id, condominio_id, tipo_vinculo) VALUES ($1, $2, $3, $4)`,
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
      return { usuarioId };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getDetalhado(
    usuarioId: string,
    condominioId: string,
  ): Promise<IUsuarioDetalhadoDTO | null> {
    const query = `
      SELECT 
          u.id, 
          u.nome_completo, 
          u.email, 
          u.telefone, 
          u.cpf, 
          u.foto_perfil,
          u.data_nascimento, 
          u.contato_emergencia,
          
          v.perfil, 
          v.ativo,

          (
             SELECT COALESCE(JSON_AGG(JSON_BUILD_OBJECT(
                  'unidade_id', uni.id,
                  'identificador_bloco', uni.bloco,
                  'numero', uni.numero_unidade,
                  'tipo_vinculo', uu.tipo_vinculo
              )), '[]')
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

    const result = await db.query(query, [usuarioId, condominioId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      id: row.id,
      nome_completo: row.nome_completo,
      email: row.email,
      telefone: row.telefone,
      cpf: row.cpf,
      foto_perfil: row.foto_perfil,
      data_nascimento: row.data_nascimento,
      contato_emergencia: row.contato_emergencia,
      
      perfil: row.perfil,
      ativo: row.ativo,
      
      unidades_vinculadas: row.unidades_vinculadas,
    };
  }

  async atualizarCompleto(
    dados: UpdateUsuarioDTO,
    dataFormatada?: string | null,
  ) {
    const client = await db.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `UPDATE usuarios SET 
            nome_completo = COALESCE($2, nome_completo),
            email = COALESCE($3, email),
            telefone = COALESCE($4, telefone),
            data_nascimento = COALESCE($5, data_nascimento),
            contato_emergencia = COALESCE($6, contato_emergencia)
         WHERE id = $1`,
        [
          dados.usuario_id,
          dados.nome_completo,
          dados.email,
          dados.telefone,
          dataFormatada,
          dados.contato_emergencia,
        ],
      );

      if (dados.perfil) {
        await client.query(
          `UPDATE vinculos_condominio SET perfil = $3 WHERE usuario_id = $1 AND condominio_id = $2`,
          [dados.usuario_id, dados.condominio_id, dados.perfil],
        );
      }

      if (dados.unidades) {
        await client.query(
          `DELETE FROM unidade_usuarios WHERE usuario_id = $1 AND condominio_id = $2`,
          [dados.usuario_id, dados.condominio_id],
        );

        for (const uni of dados.unidades) {
          const uniDb = await client.query(
            `SELECT id FROM unidades WHERE condominio_id = $1 AND bloco = $2 AND numero_unidade = $3`,
            [dados.condominio_id, uni.identificador_bloco, uni.numero],
          );

          if (uniDb.rows.length > 0) {
            await client.query(
              `INSERT INTO unidade_usuarios (usuario_id, unidade_id, condominio_id, tipo_vinculo) VALUES ($1, $2, $3, $4)`,
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
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async updateStatus(usuarioId: string, condominioId: string, ativo: boolean) {
    const query = `UPDATE vinculos_condominio SET ativo = $3 WHERE usuario_id = $1 AND condominio_id = $2 RETURNING ativo`;
    const result = await db.query(query, [usuarioId, condominioId, ativo]);
    return result.rows[0];
  }

  async updatePushToken(usuarioId: string, token: string) {
    await db.query("UPDATE usuarios SET expo_push_token = $1 WHERE id = $2", [
      token,
      usuarioId,
    ]);
  }

  async updateFotoUrl(usuarioId: string, url: string) {
    await db.query("UPDATE usuarios SET foto_perfil = $1 WHERE id = $2", [
      url,
      usuarioId,
    ]);
  }

  async findByCpf(cpf: string) {
    const result = await db.query("SELECT * FROM usuarios WHERE cpf = $1", [
      cpf,
    ]);
    if (result.rows.length === 0) {
      return null;
    }
    const data = result.rows[0];
    return new Usuario(data, data.id);
  }
  async delete(id: string) {
    await db.query("DELETE FROM usuarios WHERE id = $1", [id]);
  }
  async findByEmail(email: string) {
    const result = await db.query("SELECT * FROM usuarios WHERE email = $1", [
      email,
    ]);
    if (result.rows.length === 0) {
      return null;
    }
    const data = result.rows[0];
    return new Usuario(data, data.id);
  }
  async findByLogin(login: string) {
    const query = `
      SELECT id, nome_completo, email, cpf, senha_hash 
      FROM usuarios 
      WHERE email = trim($1) OR cpf = trim($1)
      LIMIT 1;
    `;

    const result = await db.query(query, [login]);

    if (result.rows.length === 0) return null;

    const data = result.rows[0];
    return new Usuario({ ...data, senha_hash: data.senha_hash }, data.id);
  }
}