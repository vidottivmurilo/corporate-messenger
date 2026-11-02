# 🏛️ Registros de Decisão de Arquitetura (ADRs)

---

## ADR-0001: Definição da Stack Full-Stack, Monorepo e Protocolo de Tempo Real

### Contexto
O projeto **Corporate Messenger** foi inicialmente concebido com Backend em Node.js (Express + `ws` cru + MySQL) e Frontend em Delphi VCL Desktop. Durante a revisão técnica e arquitetural com o Tech Lead, identificou-se a necessidade de:
1. Migrar o Frontend para a Web com alta ergonomia, densidade de dados e estética corporativa sóbria (sem clichês de IA).
2. Construir um backend com velocidade máxima, segurança estrita e validação de schema nativa.
3. Permitir que o componente de chat seja reutilizável como um pacote/widget em outros sistemas que o desenvolvedor criar.
4. Evitar over-engineering (como introduzir mensageria pesada Kafka/RabbitMQ para um chat de escala empresarial interna).

### Decisão
1. **Monorepo com pnpm Workspaces:**
   - Adotado monorepo gerenciado pelo `pnpm` com compartilhamento de dependências e tipos em tempo real.
   - Divisão em `apps/server`, `apps/web`, `packages/shared` e `packages/chat-widget`.
2. **Backend: Fastify + TypeScript + Drizzle ORM + PostgreSQL 16:**
   - **Fastify:** Fornece throughput superior ao Express, validação de schema compilada via Ajv/Zod e suporte integrado a WebSockets via `@fastify/websocket`.
   - **PostgreSQL 16:** Banco de dados relacional maduro para concorrência e tipos estruturados.
   - **Drizzle ORM:** Type-safety absoluto com overhead nulo em relação ao SQL puro.
3. **Frontend & Widget: Vue 3 + Vite + Tailwind CSS:**
   - **Vue 3 (Composition API):** Reatividade limpa, suporte a componentes leves e compilação ágil.
   - **Tailwind CSS + Design Tokens:** Paleta corporativa de alta densidade sem clichês de IA (sem gradientes desnecessários ou sombras infladas).
   - **Widget Exportável:** `packages/chat-widget` exporta `<CorporateChatWidget />` para consumo externo.
4. **Protocolo WebSocket & Segurança:**
   - Handshake em 2 passos: conexão limpa em `/ws` + mensagem inicial `{ type: "AUTH", token: string }` com timeout estrito de 3 segundos.
   - Paginação de histórico por **Cursor** (`beforeMessageId`).

### Consequências e Trade-offs
- **Positivas:**
  - Compartilhamento 1:1 de tipos e schemas Zod entre backend, frontend e widget.
  - Eliminação de vulnerabilidades de vazamento de JWT em URLs de logs e proxies.
  - Paginação consistente que não duplica mensagens em tempo real.
  - O widget pode ser acoplado em qualquer novo projeto da empresa.
- **Negativas / Mitigações:**
  - Exige orquestração de build monorepo (mitigado pelo `pnpm` e scripts centralizados).

### Status
**Aprovado** (02/11/2026)
