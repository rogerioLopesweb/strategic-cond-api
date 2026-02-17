import { db } from "../database/connection";

export class PermissionService {
  /**
   * 🔍 Verifica se o usuário é o dono (Master) de uma conta PJ ativa.
   * Se for, ele tem permissão implícita em todos os condomínios daquela conta.
   */
  async buscarContaMaster(usuarioId: string): Promise<string | null> {
    const query = `
      SELECT id 
      FROM contas 
      WHERE dono_id = $1 
        AND status_conta = 'ativa' 
      LIMIT 1
    `;

    const result = await db.query(query, [usuarioId]);

    // Retorna o ID da conta se ele for o dono, ou null se não for.
    return result.rows.length > 0 ? result.rows[0].id : null;
  }

  /**
   * 🛡️ Verifica qual o nível de acesso do usuário dentro de um condomínio alvo.
   * Leva em conta se ele é o dono da conta (Master) ou se possui um vínculo direto.
   */
  async verificarPerfilCondominio(
    usuarioId: string,
    condominioId: string,
    contaIdDono?: string | null,
  ): Promise<string | null> {
    // 1. REGRA MASTER: Se ele é o dono da conta, verificamos se o condomínio pertence a essa conta.
    if (contaIdDono) {
      const queryMaster = `
        SELECT id FROM condominios 
        WHERE id = $1 AND conta_id = $2
      `;
      const resMaster = await db.query(queryMaster, [
        condominioId,
        contaIdDono,
      ]);

      // Se o condomínio pertence à conta dele, ele entra como 'master' (poder total).
      if (resMaster.rows.length > 0) return "master";
    }

    // 2. REGRA DE VÍNCULO: Se não for master, buscamos o perfil específico dele no condomínio.
    const queryPerfil = `
      SELECT perfil 
      FROM vinculos_condominio 
      WHERE usuario_id = $1 
        AND condominio_id = $2 
        AND ativo = true 
      LIMIT 1
    `;

    const resPerfil = await db.query(queryPerfil, [usuarioId, condominioId]);

    // Retorna o perfil (ex: 'sindico', 'morador', 'portaria') ou null se não houver vínculo ativo.
    return resPerfil.rows.length > 0 ? resPerfil.rows[0].perfil : null;
  }
}
