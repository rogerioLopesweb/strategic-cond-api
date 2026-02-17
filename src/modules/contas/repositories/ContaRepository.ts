import { db } from "@shared/infra/database/connection";
import { CreateContaDTO, UpdateContaDTO } from "../dtos/conta.dto";
import { IContaRepository } from "./IContaRepository";

export class ContaRepository implements IContaRepository {
  async listarPorDono(donoId: string) {
    const query = `
      SELECT id, cnpj, razao_social, email_financeiro, status_conta, created_at 
      FROM contas WHERE dono_id = $1 ORDER BY created_at DESC;
    `;
    const { rows } = await db.query(query, [donoId]);
    return rows;
  }

  async criar(dados: CreateContaDTO, donoId: string) {
    const query = `
      INSERT INTO contas (dono_id, razao_social, email_financeiro, status_conta)
      VALUES ($1, $2, $3, 'aguardando_configuracao') RETURNING *;
    `;
    const { rows } = await db.query(query, [
      donoId,
      dados.razao_social,
      dados.email_financeiro || null,
    ]);
    return rows[0];
  }

  async atualizar(id: string, dados: UpdateContaDTO, donoId: string) {
    const query = `
      UPDATE contas 
      SET cnpj = COALESCE($1, cnpj),
          razao_social = COALESCE($2, razao_social),
          email_financeiro = COALESCE($3, email_financeiro),
          status_conta = COALESCE($4, status_conta),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5 AND dono_id = $6 RETURNING *;
    `;
    const values = [
      dados.cnpj,
      dados.razao_social,
      dados.email_financeiro,
      dados.status_conta,
      id,
      donoId,
    ];
    const { rows } = await db.query(query, values);
    return rows[0];
  }

  async buscarPorId(id: string, donoId: string) {
    const query = `SELECT * FROM contas WHERE id = $1 AND dono_id = $2`;
    const { rows } = await db.query(query, [id, donoId]);
    return rows[0];
  }

  // Busca ID da conta se o usuário for dono
  async findContaMaster(usuarioId: string): Promise<string | null> {
    // Ajuste "dono_id" e "status_conta" conforme o nome real das suas colunas
    const query = `SELECT id FROM contas WHERE dono_id = $1 AND status_conta = 'ativa' LIMIT 1`;
    const result = await db.query(query, [usuarioId]);

    return result.rows.length > 0 ? result.rows[0].id : null;
  }
}
