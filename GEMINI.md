# Contexto do Projeto: StrategicCond API

## 🎯 Objetivo

Sistema Multi-tenant para gestão de condomínios. Foco em código claro, confiável, escalável e sem sobrecarga de camadas desnecessárias.

## 🛠️ Tech Stack Obrigatória

- **Linguagem:** TypeScript (Strict Mode).
- **Runtime:** Node.js com Express.
- **Banco de Dados:** PostgreSQL (SQL Puro com biblioteca `pg`).
- **Validação:** Zod (Fail-fast em todas as entradas).
- **Autenticação:** JWT com middleware injetando `id` e `conta_id` no `req.usuario`.
- **Logs:** Morgan (Desenvolvimento) e Middleware de Erro Global.

## 🏗️ Estrutura do Projeto (src/)

A API segue uma organização rigorosa para evitar "pontos cegos":

1. **Routes (`src/routes/`):** Define endpoints e aplica middlewares de autenticação.
2. **Controllers (`src/controllers/`):**
   - Valida a entrada usando os schemas em `src/schemas/`.
   - Orquestra a chamada para os services.
   - Retorna respostas JSON padronizadas.
3. **Services (`src/services/`):**
   - Contém toda a lógica de negócio e queries SQL puras.
   - **Regra Multi-tenant:** Toda query de filtro ou listagem DEVE incluir `WHERE conta_id = $1`.
4. **Schemas (`src/schemas/`):** Definições Zod para validação de contratos de dados.
5. **Config (`src/config/`):** Conexão com banco (`db.ts`) e registro de documentação OpenAPI.
6. **Uploads:** Localizados em `src/public/uploads/`.

## 👮 Regras de Segurança e Observabilidade

- **Validar UUID:** Todo `:id` na URL deve ser validado como UUID pelo Zod antes da query.
- **Erro Global:** Todo erro deve ser capturado pelo `errorMiddleware` para evitar respostas 500 vazias e garantir logs no console.
- **SQL Seguro:** Proibido concatenar strings. Use apenas parâmetros preparados ($1, $2).
- **Caminhos de Arquivo:** Use `process.cwd()` para referenciar a pasta de uploads de forma absoluta a partir da raiz.

## 📝 Padrões de Código

- Retornar sempre `{ success: true, data: ... }` ou `{ success: false, error: ... }`.
- No desenvolvimento, queries complexas devem ser logadas para debug.
- O arquivo principal de entrada é o `server.ts` na raiz do projeto.
