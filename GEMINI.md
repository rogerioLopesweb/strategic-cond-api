# Contexto do Projeto: StrategicCond API (v3.0 - SOLID)

## 🎯 Objetivo

Sistema Multi-tenant para gestão de condomínios. Foco em código desacoplado, alta testabilidade, escalabilidade e segurança rigorosa, seguindo os princípios de Clean Architecture e SOLID.

## 🛠️ Tech Stack Obrigatória

- **Linguagem:** TypeScript (Strict Mode) com target ES2020.
- **Runtime:** Node.js com Express.
- **Metadata:** `reflect-metadata` (Essencial para gestão de tipos e decorators).
- **Banco de Dados:** PostgreSQL (SQL Puro com biblioteca `pg` em Repositórios isolados).
- **Validação:** Zod (Fail-fast em 100% dos contratos de entrada e schemas OpenAPI).
- **Autenticação:** JWT com middleware injetando `usuario` (id, conta_id, perfil) no `req`.
- **Storage:** `DiskStorageProvider` abstraído por interface (`IStorageProvider`).

## 🏗️ Estrutura do Projeto (src/)

A API segue uma organização modular para isolar regras de negócio de detalhes de infraestrutura:

### 1. Modules (`src/modules/`)

Cada funcionalidade (ex: `usuarios`, `entregas`, `unidades`) possui sua própria pasta contendo:

- **Entities:** Classes de domínio que validam regras de negócio e higienizam dados.
- **Repositories:** Camada de persistência com SQL puro.
- **Use Cases:** Classes que executam uma única tarefa/processo de negócio.
- **Controllers:** Porta de entrada que valida o Request e chama o Use Case.
- **Factories:** Montagem das instâncias com Injeção de Dependência.
- **Routes:** Definição dos endpoints específicos do módulo.

### 2. Shared (`src/shared/`)

Recursos compartilhados por toda a aplicação:

- **core:** Entidades e lógicas de base compartilhadas.
- **infra:** Configurações de infraestrutura, incluindo o servidor HTTP (`server.ts`, rotas principais, middlewares, schemas OpenAPI) e conexão com o banco de dados.
- **providers:** Abstrações de serviços externos (ex: Storage, Email, Notificações).
- **errors:** Classes de erro customizadas e o manipulador de erro global (`globalErrorHandler`).

## 👮 Regras de Segurança e Multi-tenancy

- **Filtro Nativo:** Toda query de listagem ou busca DEVE incluir filtros baseados no `conta_id` ou `condominio_id` extraídos do Token.
- **Independência:** Use Cases não conhecem o banco de dados; Repositórios não conhecem o Express.
- **SQL Seguro:** Proibido concatenar strings em queries. Use apenas parâmetros preparados ($1, $2).
- **Tratamento de Erros:** Todo erro de negócio deve ser lançado via `AppError`. Erros inesperados são capturados pelo middleware global.

## 📝 Padrões de Código

- **Entrada:** O arquivo principal é o `src/shared/infra/http/server.ts`.
- **Respostas:** Padronizadas em `{ success: true, data: ... }` ou `{ success: false, message: ... }`.
- **Path Mapping:** - `@modules/*` -> `src/modules/*`
  - `@shared/*` -> `src/shared/*`
- **Uploads:** Gerenciados de forma absoluta a partir da raiz via `DiskStorageProvider`.

## ✅ Módulos Implementados

- **Autenticação:** Login e proteção de rotas.
- **Contas/Condomínios:** Gestão da estrutura multi-tenant.
- **Unidades:** Cadastro, geração em massa e vínculo de moradores.
- **Entregas:** Fluxo completo desde o recebimento até a retirada via QR Code ou Manual.
