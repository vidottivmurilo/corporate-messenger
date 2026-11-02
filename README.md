# 🏢 Corporate Messenger (Full-Stack Monorepo v2.0)

Sistema corporativo de mensageria em tempo real, desenvolvido com arquitetura modular no modelo Monorepo (`npm workspaces`), separação vertical de responsabilidades, tipagem compartilhada ponta a ponta e pacote embutível reutilizável (Vue 3 + Web Component W3C).

---

## 🌟 Funcionalidades e Capacidades

### 📡 Comunicação em Tempo Real & Canais
- **Canais Públicos & Mensagens Diretas (DMs):** Suporte nativo a salas temáticas e conversas 1:1 com detecção automática de pares.
- **Histórico com Paginação por Cursor:** Carregamento de mensagens sob demanda sem saltos de scroll indesejados.
- **Presença em Tempo Real:** Listagem dinâmica de usuários conectados com atualização em tempo de execução via WebSocket e heartbeat a cada 30 segundos.

### ⚡ Produtividade Corporativa & Recursos V2
- **Command Palette (`Ctrl+K` / `Cmd+K`):** Navegação instantânea por teclado entre canais e contatos.
- **Indicador de Digitação:** Transmissão de eventos efêmeros com debounce (*"Fulano está digitando..."*).
- **Reações com Emojis:** Interações rápidas (`👍`, `❤️`, `🚀`, `👀`) com contadores e destaque visual para reações próprias.
- **Edição & Exclusão de Mensagens:** Edição in-line pelo autor com indicador discreto `(editada)` e exclusão lógica segura com atualização em tempo real para todos os membros da sala.
- **Notificações Desktop & Áudio Chime:** Notificações nativas do sistema operacional via Web Notifications API quando a janela estiver minimizada, áudio suave sintetizado via Web Audio API e badges cumulativos no título da aba (`(1) Corporate Messenger`).
- **Web Component W3C Nativo:** Tag personalizada `<corporate-chat-box>` pronta para ser injetada em qualquer aplicação externa (HTML puro, React, Angular, etc.).

---

## 🛠️ Stack Tecnológica

### Backend (`apps/server`)
- **Runtime & Framework:** Node.js 20+ com **Fastify** (alta performance e validação estrita de schema)
- **Tempo Real:** WebSocket nativo com handshake de segurança in-band (timeout de 3s), presença e broadcast seletivo
- **Persistência & ORM:** **PostgreSQL 16** + **Drizzle ORM** (zero overhead, type-safety total)
- **Segurança:** Autenticação JWT, hashing de senha com `bcryptjs`, validação estrita com **Zod**

### Frontend (`apps/web`)
- **Framework:** **Vue 3** + **Vite** + **TypeScript** + **Pinia**
- **Design System:** **Tailwind CSS** seguindo as diretrizes anti-clichê de IA (`09-frontend-design-craft`)
- **Ergonomia:** Alta densidade corporativa, agrupamento de mensagens (5 min), auto-scroll inteligente e atalhos de teclado (`Enter`, `Shift+Enter`, `Ctrl+K`)

### Pacote Reutilizável & Web Component (`packages/chat-widget`)
- **Componente Vue 3 & Custom Element W3C:** Exporta `<CorporateChatWidget />` e registra o Web Component nativo `<corporate-chat-box api-url="..." token="..."></corporate-chat-box>` compilado em UMD e ES.

### Tipos Compartilhados (`packages/shared`)
- Schemas Zod unificados, DTOs de requisição/resposta e tipos dos eventos WebSocket consumidos simultaneamente por backend, frontend e widget.

---

## 📁 Estrutura do Monorepo

```text
corporate-messenger/
├── .agents/                 # Submodule da Fábrica de Software Multi-Agente
├── apps/
│   ├── server/              # API REST Fastify + WebSocket Server (11 testes)
│   └── web/                 # Web App completo em Vue 3 (7 testes)
├── packages/
│   ├── shared/              # Contratos, DTOs e Schemas Zod compartilhados (5 testes)
│   └── chat-widget/         # 📦 Widget de chat & Web Component W3C (2 testes)
├── docs/
│   └── architecture-decisions.md # Histórico de ADRs (ADR-0001)
├── specs/                   # Contratos OpenAPI, WS Protocol, Especificações de UI, Kanban e Histórias
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

### 3. Rodar a Suíte Completa de Testes (25 testes)
```bash
npm test
```

### 4. Compilar todos os pacotes para Produção
```bash
npm run build
```

### 5. Iniciar em Desenvolvimento
```bash
# Terminal 1: Backend API + WebSocket (porta 3000)
npm --workspace=@corp-messenger/server run dev

# Terminal 2: Frontend Web App (porta 5173)
npm --workspace=@corp-messenger/web run dev
```

---

## 📜 Governança e Fábrica de Software
Este repositório é governado pelas regras e skills da Fábrica de Software contidas no submodule [`.agents`](.agents/AGENTS.md).
