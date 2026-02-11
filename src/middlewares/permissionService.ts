import pool from "../config/db";

export class PermissionService {
  /**
   * Verifica se o usuário é dono de uma conta (PJ) ativa.
   * Retorna o ID da conta se for Master, ou null.
   */
  async buscarContaMaster(usuarioId: string): Promise<string | null> {
    const query =
      "SELECT id AS conta_id FROM contas WHERE dono_id = $1 AND status_conta = 'ativa'";
    const result = await pool.query(query, [usuarioId]);

    return result.rows.length > 0 ? result.rows[0].conta_id : null;
  }

  /**
   * Verifica o perfil de acesso do usuário a um condomínio específico.
   * 1. Se for Master da conta dona do condomínio -> 'master'
   * 2. Se tiver vínculo direto (Síndico/Morador) -> perfil do vínculo
   */
  async verificarPerfilCondominio(
    usuarioId: string,
    condominioId: string,
    contaIdMaster: string | null,
  ): Promise<string | null> {
    // 1. Checagem de Master (Dono da Conta)
    if (contaIdMaster) {
      const queryMaster =
        "SELECT id FROM condominios WHERE id = $1 AND conta_id = $2";
      const resMaster = await pool.query(queryMaster, [
        condominioId,
        contaIdMaster,
      ]);

      if (resMaster.rows.length > 0) {
        return "master";
      }
    }

    // 2. Checagem de Vínculo Comum (Síndico, Porteiro, Morador)
    const queryVinculo = `
            SELECT LOWER(b.perfil) as perfil 
            FROM condominios a 
            INNER JOIN vinculos_condominio b ON a.id = b.condominio_id 
            WHERE a.id = $1 AND b.usuario_id = $2 AND b.ativo = true
        `;

    const resVinculo = await pool.query(queryVinculo, [
      condominioId,
      usuarioId,
    ]);

    if (resVinculo.rows.length > 0) {
      return resVinculo.rows[0].perfil;
    }

    return null; // Sem acesso
  }
}
