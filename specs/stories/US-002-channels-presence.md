---
id: "US-002"
title: "Canais Públicos, Histórico Paginado por Cursor e Mensageria WS"
points: 3
status: "done"
owner_back: "dev-backend-green"
owner_front: "dev-frontend-green"
contract_ref: "specs/contracts/openapi.yaml#listRooms,getRoomMessages"
---

# US-002: Canais Públicos, Histórico Paginado por Cursor e Mensageria WS

<frozen-after-approval>

## 1. Intenção e Fronteiras
- **Como** colaborador autenticado,
- **Quero** visualizar os canais públicos (incluindo `#geral`), carregar o histórico de mensagens sem duplicidade e enviar mensagens em tempo real,
- **Para que** eu possa interagir com a equipe instantaneamente.

## 2. Critérios de Aceite em Gherkin

### Cenário 1: Listagem de canais públicos
- **Dado** que estou autenticado com JWT,
- **Quando** aciono `GET /rooms`,
- **Então** o status deve ser `200 OK`,
- **E** a lista deve conter pelo menos o canal público `#geral` com `isDirect = false`.

### Cenário 2: Consulta de histórico com cursor
- **Dado** que existem 100 mensagens no canal `#geral`,
- **Quando** aciono `GET /messages/:roomId?limit=50`,
- **Então** recebo as 50 mensagens mais recentes e um `nextCursor`,
- **Quando** aciono `GET /messages/:roomId?beforeMessageId=<nextCursor>&limit=50`,
- **Então** recebo as 50 mensagens anteriores sem duplicações ou lacunas.

### Cenário 3: Envio e broadcast de mensagem em tempo real
- **Dado** que dois usuários estão conectados ao WebSocket na sala `#geral`,
- **Quando** o Usuário A envia `{ "type": "SEND_MESSAGE", "roomId": "<id_geral>", "text": "Bom dia!" }`,
- **Então** a mensagem é gravada no banco com `createdAt`,
- **E** ambos os usuários recebem o evento `{ "type": "NEW_MESSAGE", "message": { ... } }` em tempo real.

</frozen-after-approval>

## 3. Checklist de Implementação
- [ ] Schema Drizzle: tabelas `rooms`, `room_members` e `messages`
- [ ] Backend: seed/garantia do canal `#geral` no boot
- [ ] Backend: endpoint `GET /rooms` e `GET /messages/:roomId` com paginação por cursor
- [ ] Backend: handler WS de `SEND_MESSAGE` com broadcast para os membros da sala
- [ ] Frontend: `ChatView.vue`, `ChannelList.vue`, `MessageList.vue` e `MessageComposer.vue`
- [ ] Testes automatizados passando
