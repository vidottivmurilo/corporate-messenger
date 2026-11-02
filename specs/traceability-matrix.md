# 🎯 Matriz de Rastreabilidade e Paridade Full-Stack

Esta matriz garante paridade absoluta (1:1) entre contratos de backend, eventos em tempo real, telas de frontend e User Stories.

| operationId / Evento WS | Tipo | Rota / Endpoint | Componente Frontend Consumidor | User Story Vinculada | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `registerUser` | REST | `POST /auth/register` | `RegisterModal.vue` | `US-001` | **Implementado** ✅ |
| `loginUser` | REST | `POST /auth/login` | `LoginForm.vue` | `US-001` | **Implementado** ✅ |
| `listRooms` | REST | `GET /rooms` | `ChannelList.vue` | `US-002` | **Implementado** ✅ |
| `getOrCreateDmRoom` | REST | `POST /rooms/dm` | `DmList.vue` | `US-003` | **Implementado** ✅ |
| `getRoomMessages` | REST | `GET /messages/:roomId`| `MessageList.vue` | `US-002` / `US-003` | **Implementado** ✅ |
| WS: `AUTH` | WS | `/ws` | `useWebSocket.ts` | `US-001` | **Implementado** ✅ |
| WS: `ONLINE_USERS` | WS | `/ws` | `Sidebar.vue` + `DmList.vue` | `US-002` | **Implementado** ✅ |
| WS: `SEND_MESSAGE` | WS | `/ws` | `MessageComposer.vue` | `US-002` / `US-003` | **Implementado** ✅ |
| WS: `NEW_MESSAGE` | WS | `/ws` | `MessageList.vue` | `US-002` / `US-003` | **Implementado** ✅ |
| Widget Reutilizável | UI | N/A | `CorporateChatWidget.vue`| `US-003` | **Implementado** ✅ |

### Regra de Auditoria de Paridade:
- **Total de Endpoints de Usuário mapeados:** 5 REST + 4 WS = 9 operações.
- **Total com Componente Frontend implementado:** 9 (100% de cobertura).
- **Zero endpoints órfãos.**
