# 🏢 Corporate Messenger (Full-Stack Monorepo)

Sistema corporativo de mensageria em tempo real, desenvolvido com arquitetura modular no modelo Monorepo (`npm workspaces`), separação vertical de responsabilidades, tipagem compartilhada ponta a ponta e pacote embutível reutilizável.

---

## 🛠️ Stack Tecnológica

### Backend (`apps/server`)
- **Runtime & Framework:** Node.js 20+ com **Fastify** (alta performance e validação estrita de schema)
- **Tempo Real:** WebSocket nativo com handshake de segurança em 3s, presença e heartbeat a cada 30s
- **Persistência & ORM:** **PostgreSQL 16** + **Drizzle ORM** (zero overhead, type-safety total)
- **Segurança:** Autenticação JWT, hashing de senha com `bcryptjs`, validação estrita com **Zod**

### Frontend (`apps/web`)
- **Framework:** **Vue 3** + **Vite** + **TypeScript** + **Pinia**
- **Design System:** **Tailwind CSS** seguindo as diretrizes anti-clichê de IA (`09-frontend-design-craft`)
- **Ergonomia:** Alta densidade corporativa, agrupamento de mensagens (5 min), auto-scroll inteligente e atalhos de teclado (`Enter`, `Shift+Enter`)

### Pacote Reutilizável (`packages/chat-widget`)
- **Widget Embutível:** Componente Vue `<CorporateChatWidget />` exportável e compilado em UMD/ES para integração rápida em qualquer outro sistema corporativo.

### Tipos Compartilhados (`packages/shared`)
- Schemas Zod unificados, DTOs de requisição/resposta e tipos dos eventos WebSocket consumidos simultaneamente por backend, frontend e widget.

---

## 📁 Estrutura do Monorepo

```text
corporate-messenger/
├── .agents/                 # Submodule da Fábrica de Software Multi-Agente
├── apps/
│   ├── server/              # API REST Fastify + WebSocket Server (11 testes)
│   └── web/                 # Web App completo em Vue 3 (3 testes)
├── packages/
│   ├── shared/              # Contratos, DTOs e Schemas Zod compartilhados (5 testes)
│   └── chat-widget/         # 📦 Widget de chat para reutilização externa (1 teste)
├── docs/
│   ├── architecture-decisions.md # Histórico de ADRs
│   └── corporate_messenger_plan.md # Especificação legada
├── specs/                   # Contratos OpenAPI, Especificações de UI, Kanban e User Stories
└── docker-compose.yml       # PostgreSQL 16 Alpine
```

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos
- Node.js 20+ (testado no Node.js v24)
- npm 10+
- Docker & Docker Compose (para o PostgreSQL)

### 1. Instalar dependências
```bash
npm install
```

### 2. Subir o Banco de Dados Local
```bash
docker compose up -d
```

### 3. Rodar a Suíte Completa de Testes (20 testes)
```bash
npm test
```

### 4. Compilar todos os pacotes
```bash
npm run build
```

### 5. Iniciar em Desenvolvimento
```bash
# Terminal 1: Backend API + WebSocket
npm --workspace=@corp-messenger/server run dev

# Terminal 2: Frontend Web App
npm --workspace=@corp-messenger/web run dev
```

---

## 📜 Governança e Fábrica de Software
Este repositório é governado pelas regras e skills da Fábrica de Software contidas no submodule [`.agents`](.agents/AGENTS.md).
