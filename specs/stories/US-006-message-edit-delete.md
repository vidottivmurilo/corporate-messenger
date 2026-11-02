---
id: "US-006"
title: "Edição e Exclusão de Mensagens com Broadcast em Tempo Real"
points: 3
status: "done"
owner_back: "dev-backend-green"
owner_front: "dev-frontend-green"
contract_ref: "specs/contracts/openapi.yaml#updateMessage,deleteMessage"
---

# US-006: Edição e Exclusão de Mensagens com Broadcast em Tempo Real

<frozen-after-approval>

## 1. Intenção e Fronteiras
- **Como** autor de uma mensagem,
- **Quero** editar erros de digitação ou excluir mensagens enviadas por engano,
- **Para que** as discussões reflitam informações corretas e sem ruídos.

## 2. Critérios de Aceite em Gherkin

### Cenário 1: Edição de mensagem pelo autor
- **Dado** que enviei uma mensagem com texto `"Texto orignal"`,
- **Quando** envio `PATCH /messages/:id` com `{ "text": "Texto corrigido" }`,
- **Então** o status de retorno é `200 OK`,
- **E** a mensagem passa a exibir o sufixo discreto `(editado)`,
- **E** todos os membros conectados na sala recebem o evento `{ type: "MESSAGE_UPDATED", message: { ... } }`.

### Cenário 2: Bloqueio de edição por terceiros
- **Dado** uma mensagem enviada pelo Usuário A,
- **Quando** o Usuário B tenta enviar `PATCH /messages/:id`,
- **Então** o status retornado é `403 Forbidden` com mensagem `"Apenas o autor pode editar esta mensagem"`.

### Cenário 3: Exclusão de mensagem
- **Dado** uma mensagem enviada por mim,
- **Quando** aciono `DELETE /messages/:id`,
- **Então** o status retornado é `200 OK`,
- **E** a mensagem no banco é marcada com `is_deleted = true`,
- **E** o texto visível é alterado para `"Esta mensagem foi apagada"`,
- **E** o evento `{ type: "MESSAGE_DELETED", messageId, roomId }` é emitido para todos na sala.

</frozen-after-approval>

## 3. Checklist de Implementação
- [x] Schema Drizzle: colunas `isEdited` e `isDeleted` na tabela `messages`
- [x] Backend: endpoints `PATCH /messages/:id` e `DELETE /messages/:id` com checagem de autor
- [x] Backend: emissão WS de `MESSAGE_UPDATED` e `MESSAGE_DELETED`
- [x] Frontend: botões de ação na mensagem com edição in-line e confirmação de exclusão
- [x] Testes automatizados passando

