# 🏛️ Architecture Spine: Corporate Messenger

## 1. Stack Tecnológica & Comandos Oficiais (Single Source of Truth)

| Camada | Tecnologia / Versão | Comando de Build | Comando de Teste | Comando de Lint |
| :--- | :--- | :--- | :--- | :--- |
| **Monorepo** | pnpm 9+ / Node.js 20+ | `pnpm build` | `pnpm test` | `pnpm lint` |
| **Backend (`apps/server`)** | Fastify 4/5 + TypeScript + Drizzle ORM | `pnpm --filter @corp-messenger/server build` | `pnpm --filter @corp-messenger/server test` | `pnpm --filter @corp-messenger/server lint` |
| **Frontend (`apps/web`)** | Vue 3 + Vite + Tailwind CSS + Pinia | `pnpm --filter @corp-messenger/web build` | `pnpm --filter @corp-messenger/web test` | `pnpm --filter @corp-messenger/web lint` |
| **Shared (`packages/shared`)** | TypeScript + Zod | `pnpm --filter @corp-messenger/shared build` | `pnpm --filter @corp-messenger/shared test` | `pnpm --filter @corp-messenger/shared lint` |
| **Widget (`packages/chat-widget`)** | Vue 3 Component Library | `pnpm --filter @corp-messenger/chat-widget build` | `pnpm --filter @corp-messenger/chat-widget test` | `pnpm --filter @corp-messenger/chat-widget lint` |
| **InfraLocal** | Docker Compose + PostgreSQL 16 Alpine | `docker compose build` | `docker compose ps` | N/A |

---

## 2. Árvore de Diretórios Canônica

```text
corporate-messenger/
├── .agents/
├── docker-compose.yml
├── pnpm-workspace.yaml
├── package.json
├── README.md
├── docs/
│   ├── architecture-decisions.md
│   └── corporate_messenger_plan.md
├── specs/
│   ├── architecture-spine.md
│   ├── domain-rules.md
│   ├── frontend-spec.md
│   ├── traceability-matrix.md
│   ├── kanban-board.md
│   ├── contracts/
│   │   ├── openapi.yaml
│   │   └── websocket-protocol.json
│   └── stories/
│       ├── US-001-auth-core.md
│       ├── US-002-channels-presence.md
│       └── US-003-direct-messages.md
├── apps/
│   ├── server/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   ├── db/
│   │   │   │   ├── schema.ts
│   │   │   │   └── index.ts
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── rooms/
│   │   │   │   ├── messages/
│   │   │   │   └── presence/
│   │   │   ├── websocket/
│   │   │   └── app.ts
│   │   ├── tests/
│   │   ├── drizzle.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── web/
│       ├── src/
│       │   ├── assets/
│       │   ├── components/
│       │   ├── views/
│       │   ├── stores/
│       │   ├── services/
│       │   ├── App.vue
│       │   └── main.ts
│       ├── tests/
│       ├── vite.config.ts
│       ├── tsconfig.json
│       └── package.json
└── packages/
    ├── shared/
    │   ├── src/
    │   │   ├── schemas/
    │   │   ├── types/
    │   │   └── index.ts
    │   ├── tsconfig.json
    │   └── package.json
    └── chat-widget/
        ├── src/
        │   ├── CorporateChatWidget.vue
        │   └── index.ts
        ├── tsconfig.json
        └── package.json
```

---

## 3. Regras Invariantes de Arquitetura (`AD-01..AD-06`)

> **Atenção Subagentes:** Violar qualquer invariante abaixo resulta em reprovação imediata no Code Review Gate.

### `AD-01`: Vertical Slices & Módulos Autocontidos no Backend
- **Binds:** `apps/server/src/modules/`
- **Rule:** As funcionalidades são agrupadas por fatia vertical (`auth`, `rooms`, `messages`, `presence`). Cada módulo contém suas próprias rotas, validações de schema e regras de serviço.
- **Prevents:** Arquitetura horizontal anêmica com controladores sem lógica e cascata de DTOs inúteis.

### `AD-02`: Contrato de Tipos Único e Compartilhado (`@corp-messenger/shared`)
- **Binds:** `packages/shared/src/` e consumidores (`apps/server`, `apps/web`, `packages/chat-widget`)
- **Rule:** Todo DTO, enum, schema Zod de validação e evento WebSocket DEVE ser definido em `packages/shared`. O Backend e o Frontend importam estritamente o mesmo tipo.
- **Prevents:** Divergência de payload entre Frontend e Backend ou tipagens duplicadas manualmente.

### `AD-03`: Segurança e Handshake de WebSocket
- **Binds:** `apps/server/src/websocket/` e clientes WS
- **Rule:** O WebSocket conecta no endpoint `/ws` SEM token na URL. A primeira mensagem do cliente DEVE ser `{ type: "AUTH", token: string }` em até 3.000ms. Se não autenticar, o socket é encerrado com código `4001`.
- **Prevents:** Vazamento de JWTs em logs de proxy reverso e conexões não autenticadas consumindo recursos.

### `AD-04`: Paginação por Cursor Imutável
- **Binds:** `apps/server/src/modules/messages/`
- **Rule:** O histórico de mensagens é consultado exclusivamente via cursor: `beforeMessageId` ou `beforeTimestamp`.
- **Prevents:** Duplicação ou omissão de mensagens na interface durante a rolagem de histórico sob chat ativo (`LIMIT/OFFSET` proibido).

### `AD-05`: UI Sem Clichês de IA e com Alta Densidade
- **Binds:** `apps/web/src/` e `packages/chat-widget/src/`
- **Rule:** A interface deve seguir rigorosamente os princípios de `09-frontend-design-craft`: paleta sóbria de 4 a 6 tokens semânticos, ausência de gradientes decorativos ou cards inflados, agrupamento visual de mensagens em até 5 minutos e suporte total a atalhos de teclado (`Enter`, `Shift+Enter`, `Esc`, `Ctrl+K`).
- **Prevents:** Interfaces com estética genérica de IA ("AI slop") e layout sem densidade corporativa.

### `AD-06`: Persistência Segura com Drizzle ORM & PostgreSQL
- **Binds:** `apps/server/src/db/`
- **Rule:** Todas as tabelas, foreign keys e índices são definidos via Drizzle schema com chaves primárias UUIDv7 ou UUIDv4 seguras. Consultas utilizam queries tipadas do Drizzle.
- **Prevents:** SQL Injection, ausência de constraints de integridade referencial e quebra de tipos em tempo de execução.
