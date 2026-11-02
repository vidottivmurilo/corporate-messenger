# 📘 Domain Rules: Corporate Messenger

## 1. Glossário Ubíquo (DDD)

| Termo Canônico | Sinônimos Proibidos | Definição |
| :--- | :--- | :--- |
| `User` | Conta, Cliente, Perfil | Colaborador registrado no sistema com credenciais de acesso. |
| `Room` | Conversa, Tópico, Sessão | Espaço delimitado onde mensagens são trocadas. Pode ser canal público ou DM. |
| `isDirect` | `is_private`, `p2p` | Booleano que indica se uma sala é uma conversa privada 1-para-1 entre 2 membros. |
| `Message` | Post, Chat, Linha | Texto enviado por um usuário dentro de uma sala em um instante de tempo. |
| `Cursor` | `offset`, `pageIndex` | Identificador único (`messageId` ou `timestamp`) usado para buscar registros anteriores sem saltos. |
| `Presence` | Status, Visto | Estado online/offline em tempo real do colaborador mantido via socket e heartbeat. |

---

## 2. Requisitos Funcionais Numerados (`FR-001..FR-008`)

### `FR-001`: Cadastro de Usuário
- **Pré-condições:** Email único e válido, senha com no mínimo 6 caracteres, nome com no mínimo 2 caracteres.
- **Pós-condições:** Usuário persistido com senha hash (bcrypt, 10 rounds). Retorna objeto do usuário sem o hash.
- **Idempotência:** Requisições com o mesmo email resultam em conflito (`409 Conflict`).

### `FR-002`: Autenticação e Emissão de JWT
- **Pré-condições:** Email e senha válidos.
- **Pós-condições:** Retorna token JWT com expiração de 8 horas e payload contendo `userId` e `name`.
- **Segurança:** Resposta genérica `"Credenciais inválidas"` para email inexistente ou senha incorreta (`401 Unauthorized`).

### `FR-003`: Listagem e Inicialização de Canais Públicos
- **Regra:** Todo sistema possui o canal público padrão `#geral`. Novas contas têm acesso automático a canais públicos.
- **Retorno:** `GET /rooms` retorna todas as salas onde `isDirect = false`.

### `FR-004`: Obtenção ou Criação de Sala DM (Find-or-Create)
- **Pré-condições:** Usuário logado (`userId`) requisita DM com `targetUserId`.
- **Regra:** Se já existir uma sala direta contendo exatamente esses 2 participantes, retorna a sala existente. Se não existir, cria a nova sala com `isDirect = true` e associa ambos os usuários.
- **Casos de Borda:** Criar DM consigo mesmo é proibido (`400 Bad Request`).

### `FR-005`: Histórico Paginado de Mensagens por Cursor
- **Endpoint:** `GET /messages/:roomId?beforeMessageId=uuid&limit=50`
- **Regra:** Retorna mensagens em ordem cronológica decrescente a partir do cursor. Limite padrão: 50 mensagens.
- **Segurança:** O usuário só pode ler mensagens de uma sala da qual ele seja membro (para DMs) ou se a sala for pública.

### `FR-006`: Handshake de Conexão WebSocket
- **Endpoint:** `/ws`
- **Regra:** A conexão deve enviar `{ type: "AUTH", token: string }` em até 3.000 milissegundos.
- **Timeout:** Se a mensagem de autenticação não chegar em 3s, o servidor executa `socket.close(4001, "Auth timeout")`.

### `FR-007`: Roteamento e Persistência de Mensagens em Tempo Real
- **Regra:** Ao receber `{ type: "SEND_MESSAGE", roomId, text }` via WebSocket:
  1. Valida se o usuário autenticado pertence à sala;
  2. Persiste a mensagem no PostgreSQL;
  3. Realiza o broadcast do evento `NEW_MESSAGE` exclusivamente para os sockets dos membros daquela sala que estiverem online.

### `FR-008`: Detecção de Presença e Heartbeat
- **Regra:** A cada 30 segundos, o servidor avalia sockets inativos. O cliente responde ao `PING` com `PONG`. Ao desconectar, o usuário é removido da lista de presença e um evento `ONLINE_USERS` atualizado é emitido.

---

## 3. Matriz de Casos de Borda e Erros (I/O Matrix)

| Operação | Happy Path | Entrada Inválida (400) | Não Autorizado (401) | Não Encontrado (404) | Conflito (409) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST /auth/register` | 201 Created (User) | Dados fora do schema Zod | N/A | N/A | Email já existente |
| `POST /auth/login` | 200 OK (JWT + User) | Formato inválido | Credenciais incorretas | N/A | N/A |
| `GET /rooms` | 200 OK (Room[]) | N/A | Token ausente/expirado | N/A | N/A |
| `POST /rooms/dm` | 200/201 (Room) | `targetUserId` = self | Token ausente/expirado | Usuário destino inexiste | N/A |
| `GET /messages/:roomId`| 200 OK (History) | `limit` inválido | Token ausente/expirado | Sala inexistente | N/A |
| `WS /ws` | `AUTH_SUCCESS` | Payload WS malformado | Token inválido/expirado | N/A | N/A |
