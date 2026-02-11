import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import pool from "../config/db";
import * as storage from "../services/storageService";
import { EntregaService } from "../services/entregaService";
import { UsuarioAuth } from "../schemas/authSchema";

const service = new EntregaService();

// --- Schemas de Validação (Zod) ---

const registrarEntregaSchema = z.object({
  condominio_id: z.string().uuid("ID do condomínio inválido"),
  unidade: z.string().min(1, "Unidade é obrigatória"),
  bloco: z.string().min(1, "Bloco é obrigatório"),
  marketplace: z.string().min(1, "Marketplace é obrigatório"),
  codigo_rastreio: z.string().optional(),
  morador_id: z.string().uuid().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  retirada_urgente: z.boolean().optional(),
  tipo_embalagem: z.string().optional(),

  // ✅ CORREÇÃO: .nullable() permite que o campo venha como null do frontend
  foto_base64: z.string().nullable().optional(),
});

const registrarRetiradaSchema = z.object({
  entrega_id: z.string().uuid("ID da entrega inválido"),
  retirado_por: z.string().min(1, "Nome de quem retirou é obrigatório"),
  foto_retirada_base64: z.string().nullable().optional(),
});

const registrarSaidaManualSchema = z.object({
  quem_retirou: z.string().min(1, "Nome de quem retirou é obrigatório"),
  documento_retirou: z.string().min(1, "Documento é obrigatório"),
});

const atualizarEntregaSchema = z.object({
  condominio_id: z.string().uuid("ID do condomínio inválido"),
  marketplace: z.string().optional(),
  observacoes: z.string().optional().nullable(),
  codigo_rastreio: z.string().optional().nullable(),
  retirada_urgente: z.boolean().optional(),
  tipo_embalagem: z.string().optional(),
});

const cancelarEntregaSchema = z.object({
  motivo_cancelamento: z
    .string()
    .min(1, "Motivo do cancelamento é obrigatório"),
  condominio_id: z.string().uuid("ID do condomínio inválido"),
});

interface AuthRequest extends Request {
  usuario?: UsuarioAuth;
}

// --- Controladores ---

export const cadastrarEntrega = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // 1. Validação dos dados (Lança erro se falhar, capturado pelo errorMiddleware)
    const data = registrarEntregaSchema.parse(req.body);

    // 2. Identificação do Operador
    const operador_entrada_id = (req as any).usuario?.id;
    if (!operador_entrada_id) {
      return res
        .status(401)
        .json({ success: false, message: "Operador não identificado." });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 3. Upload da Foto (Apenas se existir e não for null)
      let url_foto = null;
      if (data.foto_base64) {
        const nomeArquivo = `entrega-${data.unidade}-${data.bloco}-${Date.now()}`;
        // @ts-ignore - Assumindo que storageService aceita string
        const pathRelativo = await storage.uploadFoto(
          data.foto_base64,
          nomeArquivo,
        );
        if (pathRelativo) {
          // @ts-ignore
          url_foto = await storage.gerarLinkVisualizacao(pathRelativo);
        }
      }

      // 4. Inserção no Banco
      const queryEntrega = `
        INSERT INTO entregas (
            condominio_id, operador_entrada_id, unidade, bloco, 
            codigo_rastreio, marketplace, morador_id, observacoes, 
            status, data_recebimento, url_foto_etiqueta,
            retirada_urgente, tipo_embalagem
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, 'recebido', NOW(), $9, $10, $11
        )
        RETURNING *`;

      const valuesEntrega = [
        data.condominio_id,
        operador_entrada_id,
        data.unidade,
        data.bloco,
        data.codigo_rastreio || null,
        data.marketplace,
        data.morador_id || null,
        data.observacoes || null,
        url_foto,
        data.retirada_urgente || false,
        data.tipo_embalagem || "Pacote",
      ];

      const resultEntrega = await client.query(queryEntrega, valuesEntrega);
      const entrega = resultEntrega.rows[0];

      // 5. Notificação (Lógica simplificada)
      if (data.morador_id) {
        const resMorador = await client.query(
          "SELECT nome_completo, expo_push_token FROM usuarios WHERE id = $1",
          [data.morador_id],
        );
        const morador = resMorador.rows[0];

        if (morador) {
          const primeiroNome = morador.nome_completo.split(" ")[0];
          await client.query(
            `INSERT INTO notificacoes (
                condominio_id, usuario_id, entrega_id, canal, 
                status, titulo, mensagem, destino, criado_em, tentativas
            ) VALUES ($1, $2, $3, 'push', 'pendente', $4, $5, $6, NOW(), 0)`,
            [
              data.condominio_id,
              data.morador_id,
              entrega.id,
              "📦 Nova Encomenda!",
              `Olá ${primeiroNome}, uma encomenda (${data.marketplace}) chegou!`,
              morador.expo_push_token,
            ],
          );
        }
      }

      await client.query("COMMIT");
      res
        .status(201)
        .json({ success: true, message: "Entrega registrada!", entrega });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err; // Repassa para o catch externo
    } finally {
      client.release();
    }
  } catch (error) {
    next(error); // Passa para o errorMiddleware (que trata ZodError)
  }
};

export const registrarRetirada = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = registrarRetiradaSchema.parse(req.body);
    const operador_saida_id = (req as any).usuario?.id;

    if (!operador_saida_id) {
      return res
        .status(401)
        .json({ success: false, message: "Não autorizado." });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      let url_foto_retirada = null;
      if (data.foto_retirada_base64) {
        const nomeArquivo = `retirada-${data.entrega_id}-${Date.now()}`;
        // @ts-ignore
        const pathRelativo = await storage.uploadFoto(
          data.foto_retirada_base64,
          nomeArquivo,
        );
        if (pathRelativo) {
          // @ts-ignore
          url_foto_retirada = await storage.gerarLinkVisualizacao(pathRelativo);
        }
      }

      const query = `
        UPDATE entregas
        SET status = 'retirado',
            data_retirada = NOW(),
            retirado_por = $1,
            url_foto_retirada = $2,
            operador_saida_id = $3
        WHERE id = $4
        RETURNING *`;

      const result = await client.query(query, [
        data.retirado_por,
        url_foto_retirada,
        operador_saida_id,
        data.entrega_id,
      ]);

      if (result.rowCount === 0) {
        await client.query("ROLLBACK");
        return res
          .status(404)
          .json({ success: false, message: "Entrega não encontrada." });
      }

      await client.query("COMMIT");
      res.json({
        success: true,
        message: "Entrega retirada com sucesso!",
        entrega: result.rows[0],
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
};

export const registrarSaidaManual = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;
    const { quem_retirou, documento_retirou } =
      registrarSaidaManualSchema.parse(req.body);
    const operador_saida_id = (req as any).usuario?.id;

    if (!operador_saida_id) {
      return res
        .status(401)
        .json({ success: false, message: "Não autorizado." });
    }

    const client = await pool.connect();
    try {
      const entrega = await service.registrarSaidaManual(
        id,
        { quem_retirou, documento_retirou },
        operador_saida_id,
      );

      if (!entrega) {
        return res.status(404).json({
          success: false,
          message: "Encomenda não disponível para baixa.",
        });
      }

      res.json({
        success: true,
        message: "Saída registrada com sucesso!",
        entrega,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
};

export const registrarSaidaQRCode = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;
    const operador_saida_id = (req as any).usuario?.id;

    if (!operador_saida_id) {
      return res
        .status(401)
        .json({ success: false, message: "Não autorizado." });
    }

    const entrega = await service.registrarSaidaQRCode(id, operador_saida_id);

    if (!entrega) {
      return res
        .status(400)
        .json({ success: false, message: "QR Code inválido ou já utilizado." });
    }

    res.json({ success: true, message: "Retirada confirmada!", entrega });
  } catch (error) {
    next(error);
  }
};

export const atualizarEntrega = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;
    const data = atualizarEntregaSchema.parse(req.body);
    const operador_atualizacao_id = (req as any).usuario?.id;

    if (!operador_atualizacao_id) {
      return res
        .status(401)
        .json({ success: false, message: "Não autorizado." });
    }

    const entrega = await service.atualizar(id, data, operador_atualizacao_id);

    if (!entrega) {
      return res.status(404).json({
        success: false,
        message: "Encomenda não encontrada ou já finalizada.",
      });
    }

    res.json({ success: true, message: "Dados atualizados!", entrega });
  } catch (error) {
    next(error);
  }
};

export const cancelarEntrega = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;
    const { motivo_cancelamento, condominio_id } = cancelarEntregaSchema.parse(
      req.body,
    );
    const usuario = (req as any).usuario;
    const operador_cancelamento_id = usuario?.id;

    if (!operador_cancelamento_id) {
      return res
        .status(401)
        .json({ success: false, message: "Não autorizado." });
    }

    const entrega = await service.cancelar(
      id,
      motivo_cancelamento,
      operador_cancelamento_id,
      condominio_id,
    );

    if (!entrega) {
      (console.log("id", id),
        console.log("condominio_id", condominio_id),
        console.log("operador_cancelamento_id", operador_cancelamento_id),
        console.log("entrega", entrega),
        console.log("motivo_cancelamento", motivo_cancelamento),
        console.log("usuario", usuario));

      return res.status(404).json({
        success: false,
        message: "Cancelamento não permitido para esta entrega. ",
      });
    }
    res.json({
      success: true,
      message: "Entrega cancelada com sucesso!",
      entrega,
    });
  } catch (error) {
    next(error);
  }
};

export const listarEntregas = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const usuario = req.usuario;

  try {
    // 💡 O 'filters' agora inclui 'retirada_urgente' vindo de req.query
    const result = await service.listar(
      req.query as any,
      usuario?.id,
      usuario?.perfil,
    );

    // O result já contém { success, pagination, data }
    return res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Dados de filtro inválidos.",
        errors: error.errors,
      });
    }
    next(error);
  }
};
