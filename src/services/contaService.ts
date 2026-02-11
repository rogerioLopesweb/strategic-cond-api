import pool from "../config/db";
import { CreateContaDTO, UpdateContaDTO } from "../schemas/contaSchema";

export class ContaService {
  /**
   * Lista todas as contas (PJs) vinculadas ao usuário logado.
   */
  async listarMinhasContas(donoId: string) {
    const query = `
            SELECT id, cnpj, razao_social, email_financeiro, status_conta, created_at 
            FROM contas 
            WHERE dono_id = $1
            ORDER BY created_at DESC;
        `;
    const { rows } = await pool.query(query, [donoId]);
    return rows;
  }

  /**
   * Cria uma nova "Casca PJ".
   */
  async criar(dados: CreateContaDTO, donoId: string) {
    const query = `
            INSERT INTO contas (dono_id, razao_social, email_financeiro, status_conta)
            VALUES ($1, $2, $3, 'aguardando_configuracao')
            RETURNING *;
        `;

    const { rows } = await pool.query(query, [
      donoId,
      dados.razao_social,
      dados.email_financeiro || null,
    ]);

    return rows[0];
  }

  /**
   * Atualiza dados fiscais da conta.
   * Segurança: Verifica se o usuário logado é o dono da conta.
   */
  async atualizar(id: string, dados: UpdateContaDTO, donoId: string) {
    const query = `
            UPDATE contas 
            SET cnpj = COALESCE($1, cnpj),
                razao_social = COALESCE($2, razao_social),
                email_financeiro = COALESCE($3, email_financeiro),
                status_conta = COALESCE($4, status_conta),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $5 AND dono_id = $6
            RETURNING *;
        `;

    const values = [
      dados.cnpj,
      dados.razao_social,
      dados.email_financeiro,
      dados.status_conta,
      id,
      donoId,
    ];

    const result = await pool.query(query, values);
    return result.rows[0]; // Retorna undefined se não encontrar/atualizar
  }

  /**
   * Busca detalhes de uma conta específica.
   */
  async buscarPorId(id: string, donoId: string) {
    const query = `SELECT * FROM contas WHERE id = $1 AND dono_id = $2`;
    const { rows } = await pool.query(query, [id, donoId]);

    return rows[0];
  }
}
