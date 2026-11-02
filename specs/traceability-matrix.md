# 🎯 Matriz de Rastreabilidade e Paridade Full-Stack (v1 + v2)

Esta matriz garante paridade absoluta (1:1) entre contratos de backend, eventos em tempo real, telas de frontend e User Stories.

| operationId / Evento WS | Tipo | Rota / Endpoint | Componente Frontend Consumidor | User Story Vinculada | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `registerUser` | REST | `POST /auth/register` | `RegisterModal.vue` | `US-001` | **Implementado** ✅ |
| `loginUser` | REST | `POST /auth/login` | `LoginForm.vue` | `US-001` | **Implementado** ✅ |
| `listRooms` | REST | `GET /rooms` | `ChannelList.vue` | `US-002` | **Implementado** ✅ |
| `getOrCreateDmRoom` | REST | `POST /rooms/dm` | `DmList.vue` | `US-003` | **Implementado** ✅ |
| `getRoomMessages` | REST | `GET /messages/:roomId`| `MessageList.vue` | `US-002` / `US-003` | **Implementado** ✅ |
| `updateMessage` | REST | `PATCH /messages/:id` | `MessageList.vue` (In-line) | `US-006` | Em Desenvolvimento ⏳ |
| `deleteMessage` | REST | `DELETE /messages/:id` | `MessageList.vue` | `US-006` | Em Desenvolvimento ⏳ |
| `toggleReaction` | REST | `POST /messages/:id/reactions` | `MessageReactions.vue` | `US-005` | Em Desenvolvimento ⏳ |
| WS: `AUTH` | WS | `/ws` | `useWebSocket.ts` | `US-001` | **Implementado** ✅ |
| WS: `ONLINE_USERS` | WS | `/ws` | `Sidebar.vue` + `DmList.vue` | `US-002` | **Implementado** ✅ |
| WS: `SEND_MESSAGE` | WS | `/ws` | `MessageComposer.vue` | `US-002` / `US-003` | **Implementado** ✅ |
| WS: `NEW_MESSAGE` | WS | `/ws` | `MessageList.vue` | `US-002` / `US-003` | **Implementado** ✅ |
| WS: `TYPING` / `USER_TYPING` | WS | `/ws` | `TypingIndicator.vue` | `US-005` | Em Desenvolvimento ⏳ |
| WS: `MESSAGE_UPDATED` | WS | `/ws` | `MessageList.vue` | `US-006` | Em Desenvolvimento ⏳ |
| WS: `MESSAGE_DELETED` | WS | `/ws` | `MessageList.vue` | `US-006` | Em Desenvolvimento ⏳ |
| Web Notifications & Audio | Client | N/A | `useNotifications.ts` | `US-004` | Em Desenvolvimento ⏳ |
| Badges & Dynamic Title | Client | N/A | `Sidebar.vue` + `App.vue` | `US-004` | Em Desenvolvimento ⏳ |
| Command Palette (`Ctrl+K`)| Client | N/A | `CommandPalette.vue` | `US-007` | Em Desenvolvimento ⏳ |
| Custom Element Widget | Lib | N/A | `<corporate-chat-box>` | `US-007` | Em Desenvolvimento ⏳ |

### Regra de Auditoria de Paridade:
- **Total de Operações mapeadas:** 19 operações.
- **Total com Componente Frontend mapeado:** 19 (100% de cobertura).
- **Zero endpoints órfãos.**
