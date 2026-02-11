import { Router } from "express";
import {
  listarUsuariosDoCondominio,
  cadastrarUsuarioCompleto,
  getUsuarioDetalhado,
  atualizarUsuarioCompleto,
  atualizarPerfil,
  atualizarFoto,
  atualizarStatusUsuario,
  salvarPushToken,
} from "../controllers/usuarioController";
import { verificarToken } from "../middlewares/authMiddleware";
import { registry } from "../config/openApiRegistry";
import {
  listUsuarioSchema,
  createUsuarioSchema,
  getUsuarioDetalhadoSchema,
  updateUsuarioSchema,
  updatePerfilSchema,
  updateFotoSchema,
  updateStatusSchema,
  pushTokenSchema,
} from "../schemas/usuarioSchema";
import { z } from "zod";

const router = Router();

registry.registerPath({
  method: "get",
  path: "/api/usuarios/condominio",
  tags: ["Usuários"],
  summary: "Lista usuários de um condomínio",
  security: [{ bearerAuth: [] }],
  request: {
    query: listUsuarioSchema,
  },
  responses: {
    200: {
      description: "Lista de usuários recuperada",
    },
  },
});
router.get("/condominio", verificarToken, listarUsuariosDoCondominio);

registry.registerPath({
  method: "post",
  path: "/api/usuarios/cadastrar",
  tags: ["Usuários"],
  summary: "Cadastra um novo usuário completo",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: createUsuarioSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Usuário cadastrado com sucesso",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            usuario_id: z.string().uuid(),
            senha_provisoria: z.string(),
            url_foto: z.string().nullable(),
          }),
        },
      },
    },
  },
});
router.post("/cadastrar", verificarToken, cadastrarUsuarioCompleto);

registry.registerPath({
  method: "get",
  path: "/api/usuarios/detalhes",
  tags: ["Usuários"],
  summary: "Busca detalhes de um usuário específico",
  security: [{ bearerAuth: [] }],
  request: {
    query: getUsuarioDetalhadoSchema,
  },
  responses: {
    200: {
      description: "Detalhes do usuário recuperados",
    },
  },
});
router.get("/detalhes", verificarToken, getUsuarioDetalhado);

registry.registerPath({
  method: "put",
  path: "/api/usuarios",
  tags: ["Usuários"],
  summary: "Atualiza dados completos de um usuário (Admin)",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: updateUsuarioSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Usuário atualizado com sucesso",
    },
  },
});
router.put("/", verificarToken, atualizarUsuarioCompleto);

registry.registerPath({
  method: "put",
  path: "/api/usuarios/perfil",
  tags: ["Usuários"],
  summary: "Atualiza o perfil do usuário (Dados básicos)",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: updatePerfilSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Perfil atualizado com sucesso",
    },
  },
});
router.put("/perfil", verificarToken, atualizarPerfil);

registry.registerPath({
  method: "put",
  path: "/api/usuarios/foto",
  tags: ["Usuários"],
  summary: "Atualiza a foto de perfil do usuário",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: updateFotoSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Foto atualizada com sucesso",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            url_foto: z.string(),
            message: z.string(),
          }),
        },
      },
    },
  },
});
router.put("/foto", verificarToken, atualizarFoto);

registry.registerPath({
  method: "post",
  path: "/api/usuarios/atualiza_status",
  tags: ["Usuários"],
  summary: "Atualiza o status (ativo/inativo) do usuário",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: updateStatusSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Status atualizado com sucesso",
    },
  },
});
router.post("/atualiza_status", verificarToken, atualizarStatusUsuario);

registry.registerPath({
  method: "post",
  path: "/api/usuarios/push-token",
  tags: ["Usuários"],
  summary: "Salva o token de notificação Push (Expo)",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: pushTokenSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Token salvo com sucesso",
    },
  },
});
router.post("/push-token", verificarToken, salvarPushToken);

export default router;
