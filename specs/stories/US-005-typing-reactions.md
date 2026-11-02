---
id: "US-005"
title: "Indicador de Digitação em Tempo Real & Reações com Emojis"
points: 3
status: "done"
owner_back: "dev-backend-green"
owner_front: "dev-frontend-green"
contract_ref: "specs/contracts/openapi.yaml#toggleReaction,specs/contracts/websocket-protocol.json#TYPING"
---

# US-005: Indicador de Digitação em Tempo Real & Reações com Emojis

<frozen-after-approval>

## 1. Intenção e Fronteiras
- **Como** colaborador participando de uma conversa,
- **Quero** ver quando colegas estão digitando e reagir a mensagens com emojis,
- **Para que** a comunicação seja fluida, ágil e expressiva sem poluir o histórico com respostas curtas.

## 2. Critérios de Aceite em Gherkin

### Cenário 1: Indicador de digitação efêmero
- **Dado** que o Usuário A está na sala `#geral`,
- **Quando** o Usuário A digita na caixa de composição de texto,
- **Então** o evento `{ type: "TYPING", roomId }` é enviado com debounce,
- **E** o Usuário B vê *"Usuário A está digitando..."* na parte inferior da conversa,
- **E** o indicador desaparece após 3 segundos sem novas digitações.

### Cenário 2: Adicionar reação com emoji (Toggle On)
- **Dado** uma mensagem existente no canal,
- **Quando** clico para reagir com `👍`,
- **Então** o endpoint `POST /messages/:id/reactions` registra a reação,
- **E** um badge `👍 1` aparece fixado abaixo da mensagem para todos os membros da sala.

### Cenário 3: Remover reação com emoji (Toggle Off)
- **Dado** que já reagi com `👍` em uma mensagem,
- **Quando** clico novamente no badge `👍 1`,
- **Então** minha reação é removida e o contador é decrementado ou o badge removido se zerar.

</frozen-after-approval>

## 3. Checklist de Implementação
- [x] Schema PostgreSQL: tabela `message_reactions`
- [x] Backend: handler WS de `TYPING` com broadcast para os membros da sala
- [x] Backend: endpoint `POST /messages/:messageId/reactions` (toggle de reação)
- [x] Frontend: `TypingIndicator.vue` e barra de reações no hover da mensagem
- [x] Testes automatizados passando

