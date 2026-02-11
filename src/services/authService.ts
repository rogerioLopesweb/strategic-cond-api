import pool from "../config/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { LoginDTO } from "../schemas/authSchema";

export class AuthService {
  async login(dados: LoginDTO) {
    // 1. Busca o usuário
    const userQuery = `SELECT id, nome_completo, cpf, senha_hash FROM usuarios WHERE cpf = $1`;
    const userResult = await pool.query(userQuery, [dados.cpf]);

    if (userResult.rows.length === 0) {
      throw new Error("Usuário não encontrado");
    }

    const usuario = userResult.rows[0];

    // 2. Validação da senha
    // Tenta comparar com bcrypt (padrão novo). Se falhar, tenta comparação direta (legado/texto plano).
    const senhaBcrypt = await bcrypt.compare(dados.senha, usuario.senha_hash);
    const senhaPlana = dados.senha === usuario.senha_hash;

    if (!senhaBcrypt && !senhaPlana) {
      throw new Error("Senha inválida");
    }

    // 3. Busca se o usuário é dono de alguma CONTA (PJ)
    const contaQuery = `SELECT id FROM contas WHERE dono_id = $1 AND status_conta = 'ativa' LIMIT 1`;
    const contaResult = await pool.query(contaQuery, [usuario.id]);

    const conta_id =
      contaResult.rows.length > 0 ? contaResult.rows[0].id : null;
    const isMaster = !!conta_id;

    // 4. Busca vínculos em condomínios
    const vinculosQuery = `
            SELECT 
                v.condominio_id, 
                v.perfil, 
                c.nome_fantasia
            FROM vinculos_condominio v
            JOIN condominios c ON c.id = v.condominio_id
            WHERE v.usuario_id = $1 AND v.ativo = true
        `;
    const vinculosResult = await pool.query(vinculosQuery, [usuario.id]);
    const listaCondominios = vinculosResult.rows;

    // 5. Lógica de Trava: Só barra se não for Master E não tiver vínculos
    if (!isMaster && listaCondominios.length === 0) {
      throw new Error("Usuário sem vínculos ativos ou conta pendente.");
    }

    // 6. Geração do Token JWT
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET não configurado no ambiente.");
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        isMaster,
        conta_id,
        vinculos: listaCondominios.map((v: any) => ({
          id: v.condominio_id,
          perfil: v.perfil,
        })),
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    return {
      usuario: {
        id: usuario.id,
        nome: usuario.nome_completo,
        cpf: usuario.cpf,
        token: token,
        isMaster: isMaster,
        conta_id: conta_id,
        condominios: listaCondominios.map((v: any) => ({
          id: v.condominio_id,
          nome_fantasia: v.nome_fantasia,
          perfil: v.perfil,
        })),
      },
    };
  }
}
