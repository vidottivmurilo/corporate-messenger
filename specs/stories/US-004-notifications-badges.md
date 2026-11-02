---
id: "US-004"
title: "Notificações Desktop, Badges de Não Lidas & Áudio Chime"
points: 3
status: "done"
owner_back: "dev-backend-green"
owner_front: "dev-frontend-green"
contract_ref: "specs/contracts/websocket-protocol.json#NEW_MESSAGE"
---

# US-004: Notificações Desktop, Badges de Não Lidas & Áudio Chime

<frozen-after-approval>

## 1. Intenção e Fronteiras
- **Como** colaborador usando o chat em segundo plano,
- **Quero** receber notificações do sistema operacional, áudio sutil e ver contadores de mensagens não lidas,
- **Para que** eu não perca discussões importantes enquanto trabalho em outras janelas.

## 2. Critérios de Aceite em Gherkin

### Cenário 1: Notificação de Desktop com Janela Oculta
- **Dado** que autorizei as notificações no navegador e a aba está minimizada ou em segundo plano (`document.hidden = true`),
- **Quando** recebo uma mensagem nova via WebSocket,
- **Então** uma notificação nativa do Windows é exibida com o nome do remetente e o texto,
- **E** ao clicar na notificação, a janela do navegador ganha foco e a sala da mensagem é aberta.

### Cenário 2: Efeito Sonoro (Audio Chime)
- **Dado** que uma mensagem chega de outro usuário,
- **Quando** a mensagem é renderizada,
- **Então** um som suave sintetizado é reproduzido (sem travar a interface).

### Cenário 3: Badges de Não Lidas e Título da Aba
- **Dado** que estou no canal `#geral` e recebo mensagens em uma conversa direta (DM),
- **Quando** a mensagem chega,
- **Então** um badge com o número de não lidas é exibido ao lado do contato na sidebar,
- **E** o título da aba do navegador é atualizado para `(1) Corporate Messenger`,
- **E** ao abrir a conversa direta, o contador de não lidas daquela sala é zerado.

</frozen-after-approval>

## 3. Checklist de Implementação
- [x] Utilitário Web Audio API para síntese sonora sem dependências externas
- [x] Gerenciador de Web Notifications API com pedido de permissão
- [x] Pinia chat store com controle de `unreadCount` por sala
- [x] Atualização reativa de `document.title`
- [x] Testes automatizados passando

