---
id: "US-003"
title: "Conversas Diretas (DMs), Presença Online e Widget Reutilizável"
points: 4
status: "done"
owner_back: "dev-backend-green"
owner_front: "dev-frontend-green"
contract_ref: "specs/contracts/openapi.yaml#getOrCreateDmRoom"
---

# US-003: Conversas Diretas (DMs), Presença Online e Widget Reutilizável

<frozen-after-approval>

## 1. Intenção e Fronteiras
- **Como** colaborador,
- **Quero** ver quem está online em tempo real, iniciar conversas diretas 1-para-1 privadas com colegas e ter a capacidade de acoplar esse chat em outros sistemas via widget,
- **Para que** possamos colaborar individualmente com privacidade e flexibilidade.

## 2. Critérios de Aceite em Gherkin

### Cenário 1: Notificação de presença em tempo real
- **Dado** que estou conectado ao WebSocket,
- **Quando** outro colaborador conecta e autentica no WS,
- **Então** recebo o evento `{ "type": "ONLINE_USERS", "users": [...] }` contendo a lista atualizada de quem está online,
- **E** quando ele desconecta ou expira o heartbeat, recebo a lista sem o colaborador.

### Cenário 2: Criar ou recuperar DM (Find-or-Create)
- **Dado** que o Usuário A quer conversar com o Usuário B,
- **Quando** o Usuário A envia `POST /rooms/dm` com `{ "targetUserId": "<id_do_b>" }`,
- **Então** uma sala privada é criada ou retornada com `isDirect = true`,
- **E** apenas Usuário A e Usuário B são membros dessa sala.

### Cenário 3: Isolamento estrito de DM no WebSocket
- **Dado** uma sala DM entre Usuário A e Usuário B,
- **Quando** o Usuário A envia uma mensagem para essa sala,
- **Então** apenas o Usuário B recebe a mensagem em tempo real,
- **E** nenhum outro usuário conectado ao servidor recebe o evento.

### Cenário 4: Widget de Chat Reutilizável
- **Dado** o pacote `@corp-messenger/chat-widget`,
- **Quando** importado em qualquer aplicação Vue externa passando as propriedades `:api-url` e `:token`,
- **Então** ele renderiza o botão flutuante e a janela de chat com conexão WebSocket e histórico funcional.

</frozen-after-approval>

## 3. Checklist de Implementação
- [ ] Backend: endpoint `POST /rooms/dm` com lógica find-or-create e filtro de membros
- [ ] Backend: rotina de heartbeat ping/pong a cada 30 segundos no WebSocket
- [ ] Frontend: `DmList.vue` com indicador de presença verde/cinza
- [ ] Widget: pacote `packages/chat-widget` exportando `CorporateChatWidget.vue`
- [ ] Testes automatizados passando
