# 📘 Domain Rules: Corporate Messenger (v1 + v2)

## 1. Glossário Ubíquo (DDD)

| Termo Canônico | Sinônimos Proibidos | Definição |
| :--- | :--- | :--- |
| `User` | Conta, Cliente, Perfil | Colaborador registrado no sistema com credenciais de acesso. |
| `Room` | Conversa, Tópico, Sessão | Espaço delimitado onde mensagens são trocadas. Pode ser canal público ou DM. |
| `isDirect` | `is_private`, `p2p` | Booleano que indica se uma sala é uma conversa privada 1-para-1 entre 2 membros. |
| `Message` | Post, Chat, Linha | Texto enviado por um usuário dentro de uma sala em um instante de tempo. |
| `Reaction` | Like, Joinha, Emote | Emojis atrelados a uma mensagem enviados por usuários específicos. |
| `TypingState` | Escrevendo | Estado efêmero emitido quando um colaborador está ativamente digitando. |
| `Cursor` | `offset`, `pageIndex` | Identificador único (`messageId` ou `timestamp`) usado para buscar registros anteriores sem saltos. |
| `Presence` | Status, Visto | Estado online/offline em tempo real do colaborador mantido via socket e heartbeat. |

---

## 2. Requisitos Funcionais Numerados

### Core v1
- `FR-001`: Cadastro de Usuário com hash bcrypt e validação estrita.
- `FR-002`: Autenticação e emissão de JWT (8h).
- `FR-003`: Listagem de canais públicos (incluindo `#geral`).
- `FR-004`: Obtenção ou criação de sala DM (find-or-create).
- `FR-005`: Histórico paginado de mensagens por cursor (`beforeMessageId`).
- `FR-006`: Handshake de conexão WebSocket em 3s.
- `FR-007`: Roteamento e persistência de mensagens em tempo real.
- `FR-008`: Detecção de presença e heartbeat a cada 30 segundos.

### Expansão v2
- `FR-009`: **Notificações Desktop & Alertas Sonoros**
  - Quando uma nova mensagem chegar e o usuário estiver com a aba em segundo plano (`document.hidden = true`), o sistema dispara uma notificação do navegador (Web Notification) e toca um chime sutil sintetizado via Web Audio API.
  - Atualiza o título da aba do navegador para `(N) Corporate Messenger`.
- `FR-010`: **Badges de Mensagens Não Lidas**
  - Cada canal e DM monitora mensagens recebidas enquanto o usuário está em outra sala e exibe um badge numérico com a contagem de não lidas.
- `FR-011`: **Indicador de Digitação (Typing Indicator)**
  - Ao digitar na caixa de composição, o cliente envia `{ type: "TYPING", roomId }`. O servidor repassa para os membros da sala com expiração automática de 3 segundos.
- `FR-012`: **Reações com Emojis (Reactions)**
  - Qualquer membro da sala pode reagir a uma mensagem com emojis (ex: 👍, ❤️, 🚀, 👀). Se o usuário já tiver reagido com o mesmo emoji, a reação é removida (toggle).
- `FR-013`: **Edição e Exclusão de Mensagens**
  - Apenas o autor original pode editar ou excluir sua própria mensagem. Mensagens editadas recebem a flag `isEdited = true`. Mensagens excluídas recebem `isDeleted = true` e o texto é substituído por `"Esta mensagem foi apagada"`.
- `FR-014`: **Command Palette (`Ctrl + K`)**
  - Permite busca rápida por teclado para alternar entre canais e colaboradores instantaneamente.
- `FR-015`: **Web Component W3C do Widget**
  - O componente `<CorporateChatWidget />` é empacotado como Custom Element `<corporate-chat-box>` para funcionar em qualquer plataforma web.
