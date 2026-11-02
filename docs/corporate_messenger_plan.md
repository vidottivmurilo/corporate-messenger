# 🏢 Corporate Messenger — Plano de Desenvolvimento Completo

> Clone simplificado do Slack/Teams para empresas, com autenticação JWT, WebSocket bidirecional e salas/canais privados.

---

## 1. Visão Geral do Projeto (Overview)

O **Corporate Messenger** é um sistema de chat interno corporativo em tempo real. Ele permite que colaboradores de uma empresa façam login com segurança, vejam quem está online e troquem mensagens instantâneas em canais públicos ou em conversas diretas (DM). O sistema é composto por:

- **Backend Node.js**: API REST para autenticação e persistência + servidor WebSocket para o canal de tempo real.
- **Frontend Delphi**: Aplicação desktop VCL que consome a API REST e mantém uma conexão WebSocket bidirecional ativa.
- **Banco de Dados MySQL**: Armazena usuários, mensagens e canais.

---

## 2. Requisitos Funcionais

- [x] **RF-01** — Usuário pode se cadastrar (nome, e-mail, senha)
- [x] **RF-02** — Usuário pode fazer login e receber um JWT de acesso
- [x] **RF-03** — Rotas protegidas exigem o JWT no header `Authorization: Bearer <token>`
- [x] **RF-04** — Após o login, o cliente conecta ao WebSocket e aparece como "online"
- [x] **RF-05** — A lista de usuários online é atualizada em tempo real para todos
- [x] **RF-06** — Usuário pode enviar uma mensagem para um canal público (ex: `#geral`)
- [x] **RF-07** — Usuário pode enviar uma mensagem direta (DM) para outro usuário específico
- [x] **RF-08** — As mensagens são entregues em tempo real via WebSocket (sem polling)
- [x] **RF-09** — As mensagens são persistidas no banco de dados
- [x] **RF-10** — Ao abrir uma conversa, o histórico das últimas N mensagens é carregado via REST
- [x] **RF-11** — Usuário desconectado some da lista de "online" automaticamente

---

## 3. Requisitos Não-Funcionais

| # | Requisito | Detalhe |
|---|-----------|---------|
| RNF-01 | **Segurança** | Senhas armazenadas com `bcrypt` (hash + salt). Tokens JWT com expiração de 8h. |
| RNF-02 | **Performance** | Entrega de mensagem via WebSocket deve ser < 100ms na rede local. |
| RNF-03 | **Escalabilidade** | Arquitetura preparada para múltiplos canais; isolamento de sala via `room ID`. |
| RNF-04 | **Confiabilidade** | O cliente Delphi deve tentar reconectar ao WS automaticamente em caso de queda. |
| RNF-05 | **Manutenibilidade** | Backend em TypeScript com separação clara de camadas (Routes → Controllers → Services). |

---

## 4. Stack Tecnológica

### Backend
| Lib/Ferramenta | Justificativa |
|---|---|
| `Node.js` + `TypeScript` | Plataforma padrão de mercado para backends assíncronos em tempo real. TypeScript garante segurança de tipos. |
| `Express` | Framework HTTP minimalista e o mais adotado do ecossistema Node. Padrão de mercado para APIs REST. |
| `ws` (npm) | Biblioteca WebSocket **nativa e de baixo nível** para Node.js. Preferida sobre `socket.io` quando o controle do protocolo é necessário. |
| `jsonwebtoken` (npm) | Implementação de referência para JWT em Node.js. Padrão de mercado. |
| `bcryptjs` (npm) | Hash de senhas com salting. Padrão de segurança para autenticação. |
| `zod` (npm) | Validação de schema de entrada de dados. Leve e integrado com TypeScript. |
| `mysql2` (npm) | Driver MySQL para Node.js com suporte a Promises e pool de conexões nativo. Padrão de mercado para MySQL/MariaDB em Node. |
| `dotenv` (npm) | Carregamento de variáveis de ambiente. Padrão de mercado. |

### Frontend
| Lib/Ferramenta | Justificativa |
|---|---|
| `Delphi VCL` | Framework nativo para desktop Windows da Embarcadero. Padrão para o projeto. |
| `RESTRequest4Delphi` | Biblioteca open-source para consumo de APIs REST em Delphi via código fluente (sem componentes visuais). Evita poluição das units com TRESTClient/TRESTRequest dropped no form. Amplamente adotada na comunidade Delphi moderna. |
| `System.JSON` | Unit nativa do Delphi para serialização/deserialização de JSON. |
| `sgcWebSockets` | Biblioteca para conexão WebSocket em Delphi. Abstrai o handshake WS e expõe eventos `OnMessage`/`OnConnect` simples. |

### Banco de Dados
| Ferramenta | Justificativa |
|---|---|
| `MySQL 8+` | SGBD relacional amplamente adotado no mercado corporativo, com excelente performance para workloads de leitura/escrita. Padrão de mercado para aplicações web e sistemas internos. |

---

## 5. Arquitetura e Fluxo de Dados

```
┌──────────────────────────────────────────────────────────┐
│                     CLIENTE DELPHI                       │
│                                                          │
│  TForm (Login)  ──→  POST /auth/login  ──→  Salva JWT   │
│                                                          │
│  TForm (Chat)   ──→  GET /messages/:roomId  (histórico) │
│                  ──→  WebSocket: ws://host/ws            │
│                       ↕ (bidirecional)                   │
│                       Envia: { type, roomId, text }      │
│                       Recebe: { type, sender, text }     │
└──────────────────────────────────────────────────────────┘
              │ REST (HTTPS)      │ WebSocket (WSS)
              ▼                   ▼
┌──────────────────────────────────────────────────────────┐
│                    BACKEND NODE.JS                       │
│                                                          │
│  Routes/  ── Controllers/ ── Services/ ── Repository/   │
│                                                          │
│  [REST]                                                  │
│  POST /auth/register   → Cria usuário (bcrypt + DB)      │
│  POST /auth/login      → Valida senha → Gera JWT         │
│  GET  /messages/:roomId → Histórico paginado (JWT guard) │
│  GET  /users/online    → Lista usuários conectados       │
│                                                          │
│  [WebSocket Server - ws]                                 │
│  on('connection') → Valida JWT no query param            │
│  on('message')    → Roteia para room/DM → broadcast      │
│  on('close')      → Remove da lista de online            │
└──────────────────────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────────────────┐
│                      MYSQL 8+                            │
│                                                          │
│  users(id, name, email, password_hash, created_at)       │
│  rooms(id, name, is_direct, created_at)                  │
│  room_members(room_id, user_id)                          │
│  messages(id, room_id, sender_id, text, created_at)      │
└──────────────────────────────────────────────────────────┘
```

---

## 6. Entregáveis — Roadmap por Fases

| Fase | Nome | O que entrega |
|---|---|---|
| **Fase 1** | Fundação & Banco de Dados | Setup do projeto, schema SQL, migrações |
| **Fase 2** | Autenticação JWT (Backend) | Registro, Login, Middleware de guarda |
| **Fase 3** | WebSocket Server | Conexão, presença online, salas, broadcast |
| **Fase 4** | Mensagens REST | Histórico paginado, persistência no DB |
| **Fase 5** | Cliente Delphi — Auth | Tela de Login, chamada REST, armazenamento de JWT |
| **Fase 6** | Cliente Delphi — Chat | Conexão WS, envio/recebimento em tempo real, lista de online |
| **Fase 7** | DM (Direct Messages)| Salas privadas 1-para-1, roteamento no WS |
| **Fase 8** | Polimento & Estabilidade | Reconexão automática, tratamento de erros, UX |

---
---

# 📋 Issues de Desenvolvimento

---

## 🔵 FASE 1 — Fundação & Banco de Dados

---

### Issue #01

#### 📌 Título: `[Backend] Setup inicial do projeto Node.js + TypeScript`

#### 📝 Descrição
Inicializa o repositório do backend com a estrutura de pastas, dependências e configuração do TypeScript. Esta é a base sobre a qual todas as outras features serão construídas.

#### 🛠️ Tarefas
- [ ] Criar pasta `backend/` na raiz do projeto
- [ ] Executar `npm init -y` e `npm install typescript ts-node @types/node --save-dev`
- [ ] Gerar `tsconfig.json` com `npx tsc --init`
- [ ] Configurar `tsconfig.json`: `"outDir": "./dist"`, `"rootDir": "./src"`, `"strict": true`
- [ ] Instalar dependências de produção: `npm install express ws jsonwebtoken bcryptjs zod mysql2 dotenv`
- [ ] Instalar tipos: `npm install @types/express @types/ws @types/jsonwebtoken @types/bcryptjs --save-dev`
- [ ] Criar estrutura de pastas: `src/routes/`, `src/controllers/`, `src/services/`, `src/repositories/`, `src/middlewares/`, `src/config/`
- [ ] Criar arquivo `src/app.ts` com o servidor Express básico (health check `GET /`)
- [ ] Criar arquivo `.env` com `PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`
- [ ] Adicionar scripts no `package.json`: `"dev": "ts-node src/app.ts"`, `"build": "tsc"`
- [ ] Criar `.gitignore` ignorando `node_modules/`, `dist/`, `.env`

#### 💻 Detalhes Técnicos

**Estrutura de pastas esperada:**
```
backend/
├── src/
│   ├── app.ts
│   ├── config/
│   │   └── database.ts
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   └── middlewares/
├── .env
├── tsconfig.json
└── package.json
```

**`src/app.ts` mínimo:**
```typescript
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

app.get('/', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export { app };
```

#### ✅ Critérios de Aceite
- [ ] `npm run dev` sobe o servidor sem erros
- [ ] `GET http://localhost:3000/` retorna `{ "status": "ok" }`
- [ ] O TypeScript compila sem erros com `npm run build`

---

### Issue #02

#### 📌 Título: `[Database] Criar schema SQL e configurar conexão com MySQL`

#### 📝 Descrição
Define as tabelas do banco de dados e conecta o backend ao MySQL 8+. Este é o modelo de dados central de toda a aplicação.

#### 🛠️ Tarefas
- [ ] Criar banco de dados MySQL chamado `corporate_messenger`
- [ ] Criar arquivo `src/config/database.ts` com o pool de conexões `mysql2`
- [ ] Criar arquivo `migrations/001_initial_schema.sql` com as tabelas
- [ ] Criar script `npm run migrate` que executa o arquivo SQL

#### 💻 Detalhes Técnicos

**`migrations/001_initial_schema.sql`:**
```sql
CREATE DATABASE IF NOT EXISTS corporate_messenger
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE corporate_messenger;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rooms (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100),
  is_direct TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS room_members (
  room_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  PRIMARY KEY (room_id, user_id),
  CONSTRAINT fk_rm_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  CONSTRAINT fk_rm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  room_id CHAR(36) NOT NULL,
  sender_id CHAR(36),
  text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_msg_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  CONSTRAINT fk_msg_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Canal público padrão
INSERT IGNORE INTO rooms (id, name, is_direct) VALUES (UUID(), 'geral', 0);
```

> **Atenção:** `DEFAULT (UUID())` requer **MySQL 8.0.13+**. Para versões anteriores, gere o UUID no código Node antes de inserir.

**`src/config/database.ts`:**
```typescript
import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
});
```

**`.env`:**
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=corporate_messenger
```

**Diferença nas queries:** O `mysql2` usa `?` como placeholder (não `$1`, `$2` do PostgreSQL). Além disso, o resultado de `pool.query` retorna `[rows, fields]` — sempre desestruture:
```typescript
const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
```

#### ✅ Critérios de Aceite
- [ ] Executar `npm run migrate` cria todas as tabelas sem erro
- [ ] O canal `#geral` é inserido automaticamente
- [ ] A conexão `pool` pode executar queries sem erros

---

## 🟡 FASE 2 — Autenticação JWT

---

### Issue #03

#### 📌 Título: `[Backend] Implementar POST /auth/register`

#### 📝 Descrição
Cria a rota de cadastro de novos usuários. A senha nunca é armazenada em texto puro — apenas o hash gerado pelo `bcryptjs`.

#### 🛠️ Tarefas
- [ ] Criar `src/repositories/userRepository.ts` com `createUser` e `findUserByEmail`
- [ ] Criar `src/services/authService.ts` com a lógica de registro
- [ ] Criar `src/controllers/authController.ts` com o handler da rota
- [ ] Criar `src/routes/authRoutes.ts` e registrar `POST /auth/register`
- [ ] Registrar as rotas no `app.ts`
- [ ] Validar o body com `zod`

#### 💻 Detalhes Técnicos

**Request:**
```json
POST /auth/register
{
  "name": "João Silva",
  "email": "joao@empresa.com",
  "password": "senhaSegura123"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "name": "João Silva",
  "email": "joao@empresa.com"
}
```

**`authService.ts` — lógica de registro:**
```typescript
import bcrypt from 'bcryptjs';
import { createUser, findUserByEmail } from '../repositories/userRepository';

export async function register(name: string, email: string, password: string) {
  const existing = await findUserByEmail(email);
  if (existing) throw new Error('Email já cadastrado');
  
  const password_hash = await bcrypt.hash(password, 10);
  return createUser(name, email, password_hash);
}
```

**Schema Zod:**
```typescript
const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});
```

**Dica:** Nunca retorne o `password_hash` no response. Filtre o campo antes de responder.

#### ✅ Critérios de Aceite
- [ ] `POST /auth/register` com dados válidos retorna 201 com o usuário (sem senha)
- [ ] Email duplicado retorna 409 Conflict
- [ ] Dados inválidos retornam 400 com mensagem de erro do Zod

---

### Issue #04

#### 📌 Título: `[Backend] Implementar POST /auth/login e geração de JWT`

#### 📝 Descrição
Cria a rota de login. Valida as credenciais e retorna um token JWT assinado que o cliente usará em todas as requisições subsequentes.

#### 🛠️ Tarefas
- [ ] Adicionar `login` no `authService.ts`
- [ ] Criar `src/config/jwt.ts` com a função `signToken` e `verifyToken`
- [ ] Adicionar handler `POST /auth/login` no controller e na rota

#### 💻 Detalhes Técnicos

**Request:**
```json
POST /auth/login
{
  "email": "joao@empresa.com",
  "password": "senhaSegura123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@empresa.com"
  }
}
```

**`src/config/jwt.ts`:**
```typescript
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET!;

export interface JwtPayload {
  userId: string;
  name: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: '8h' });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload;
}
```

**Dica de segurança:** Em caso de email ou senha inválidos, SEMPRE retorne a mesma mensagem genérica (`"Credenciais inválidas"`) para não vazar informação sobre quais emails existem no sistema.

#### ✅ Critérios de Aceite
- [ ] Login com credenciais corretas retorna 200 com o token JWT
- [ ] Login com senha errada retorna 401
- [ ] O token expira em 8 horas (verificável via [jwt.io](https://jwt.io))

---

### Issue #05

#### 📌 Título: `[Backend] Criar Middleware de autenticação JWT (Guard)`

#### 📝 Descrição
Cria um middleware Express que intercepta requisições para rotas protegidas, valida o token JWT e injeta os dados do usuário no objeto `req`.

#### 🛠️ Tarefas
- [ ] Criar `src/middlewares/authMiddleware.ts`
- [ ] Extender o tipo `Request` do Express para incluir `req.user`
- [ ] Aplicar o middleware em todas as rotas que não sejam `/auth/*`

#### 💻 Detalhes Técnicos

**`src/middlewares/authMiddleware.ts`:**
```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../config/jwt';

export function authGuard(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyToken(token);
    req.user = payload; // Requer extensão do tipo Request
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}
```

**Extensão de tipo (`src/types/express.d.ts`):**
```typescript
import { JwtPayload } from '../config/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
```

#### ✅ Critérios de Aceite
- [ ] Rota protegida sem token retorna 401
- [ ] Rota protegida com token válido processa a requisição normalmente
- [ ] `req.user` contém `userId` e `name` dentro dos controllers protegidos

---

## 🟠 FASE 3 — Servidor WebSocket

---

### Issue #06

#### 📌 Título: `[Backend] Criar servidor WebSocket com autenticação por JWT`

#### 📝 Descrição
Inicializa o servidor WebSocket usando a biblioteca `ws`, integrado ao servidor HTTP do Express. A conexão WS só é aceita se o cliente enviar um JWT válido como query parameter.

#### 🛠️ Tarefas
- [ ] Criar `src/websocket/wsServer.ts` com a lógica do servidor WS
- [ ] Integrar o `WebSocketServer` ao `http.Server` criado pelo Express
- [ ] Validar o JWT no evento `upgrade` (antes de aceitar a conexão)
- [ ] Criar um `Map<string, WebSocket>` em memória para mapear `userId → socket`
- [ ] Emitir evento de "usuário conectado" para todos ao conectar/desconectar

#### 💻 Detalhes Técnicos

**URL de conexão do cliente:**
```
ws://localhost:3000/ws?token=eyJhbG...
```

**`src/websocket/wsServer.ts`:**
```typescript
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { verifyToken } from '../config/jwt';
import url from 'url';

// Mapa global: userId → WebSocket
export const clients = new Map<string, WebSocket & { userId?: string; name?: string }>();

export function setupWebSocket(server: http.Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const query = url.parse(req.url!, true).query;
    const token = query.token as string;

    try {
      const payload = verifyToken(token);
      ws.userId = payload.userId;
      ws.name = payload.name;
      clients.set(payload.userId, ws);
      
      broadcastOnlineUsers();
      console.log(`[WS] ${payload.name} conectado. Total: ${clients.size}`);
    } catch {
      ws.close(4001, 'Token inválido');
      return;
    }

    ws.on('message', (data) => handleMessage(ws, data));

    ws.on('close', () => {
      if (ws.userId) clients.delete(ws.userId);
      broadcastOnlineUsers();
      console.log(`[WS] ${ws.name} desconectado.`);
    });
  });
}

function broadcastOnlineUsers() {
  const onlineUsers = Array.from(clients.values()).map(c => ({
    userId: c.userId,
    name: c.name,
  }));
  const message = JSON.stringify({ type: 'ONLINE_USERS', data: onlineUsers });
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(message);
  });
}
```

**`src/app.ts` — integração:**
```typescript
import http from 'http';
import { setupWebSocket } from './websocket/wsServer';

const server = http.createServer(app);
setupWebSocket(server);
server.listen(PORT, () => console.log(`Server on port ${PORT}`));
```

**Dica:** Use `ws.userId` como propriedade customizada no objeto WebSocket. Para isso, estenda o tipo `WebSocket` no TypeScript ou use `as any`.

#### ✅ Critérios de Aceite
- [ ] Conexão WS com token válido é aceita e o cliente aparece no `Map`
- [ ] Conexão WS sem token é rejeitada com código `4001`
- [ ] Ao conectar, todos os clientes recebem a mensagem `ONLINE_USERS` atualizada
- [ ] Ao desconectar, `ONLINE_USERS` é reemitido sem o usuário que saiu

---

### Issue #07

#### 📌 Título: `[Backend] Implementar roteamento de mensagens por sala (Rooms)`

#### 📝 Descrição
Implementa a lógica de `handleMessage` no servidor WS para receber uma mensagem de um cliente, identificar a sala de destino e reenviar apenas para os membros daquela sala.

#### 🛠️ Tarefas
- [ ] Definir o protocolo de mensagens (formato JSON das payloads WS)
- [ ] Implementar `handleMessage` que parseia e roteia as mensagens
- [ ] Implementar `broadcastToRoom` que envia a mensagem apenas para membros da sala
- [ ] Persistir a mensagem no banco antes de fazer o broadcast
- [ ] Tratar erros de JSON malformado sem derrubar o servidor

#### 💻 Detalhes Técnicos

**Protocolo de mensagens (cliente → servidor):**
```json
{
  "type": "SEND_MESSAGE",
  "roomId": "uuid-da-sala",
  "text": "Olá pessoal!"
}
```

**Protocolo de mensagens (servidor → clientes):**
```json
{
  "type": "NEW_MESSAGE",
  "roomId": "uuid-da-sala",
  "messageId": "uuid",
  "senderId": "uuid",
  "senderName": "João Silva",
  "text": "Olá pessoal!",
  "createdAt": "2026-07-26T12:00:00Z"
}
```

**`handleMessage` + `broadcastToRoom`:**
```typescript
import { saveMessage } from '../repositories/messageRepository';
import { getRoomMembers } from '../repositories/roomRepository';

async function handleMessage(ws: any, raw: any) {
  try {
    const payload = JSON.parse(raw.toString());
    
    if (payload.type === 'SEND_MESSAGE') {
      const { roomId, text } = payload;
      
      // 1. Persiste no DB
      const message = await saveMessage(roomId, ws.userId, text);
      
      // 2. Busca membros da sala
      const memberIds = await getRoomMembers(roomId);
      
      // 3. Envia apenas para membros online
      const outbound = JSON.stringify({
        type: 'NEW_MESSAGE',
        roomId,
        messageId: message.id,
        senderId: ws.userId,
        senderName: ws.name,
        text,
        createdAt: message.created_at,
      });
      
      memberIds.forEach(memberId => {
        const memberSocket = clients.get(memberId);
        if (memberSocket?.readyState === WebSocket.OPEN) {
          memberSocket.send(outbound);
        }
      });
    }
  } catch (err) {
    console.error('[WS] Erro ao processar mensagem:', err);
  }
}
```

**Dica:** Envolva SEMPRE o `JSON.parse` em um `try/catch`. Um cliente malicioso ou com bug que enviar texto inválido não deve derrubar o servidor inteiro.

#### ✅ Critérios de Aceite
- [ ] Mensagem enviada para `#geral` chega para todos os membros conectados
- [ ] Mensagem enviada para DM chega apenas para os 2 participantes
- [ ] A mensagem é salva no banco de dados antes do broadcast
- [ ] JSON malformado retorna erro no log mas não derruba o servidor

---

## 🟢 FASE 4 — API REST de Mensagens

---

### Issue #08

#### 📌 Título: `[Backend] Implementar GET /messages/:roomId (histórico paginado)`

#### 📝 Descrição
Cria a rota REST protegida por JWT que retorna o histórico de mensagens de uma sala, com paginação por cursor. O cliente Delphi usa esta rota ao abrir uma conversa, antes de se conectar ao WS.

#### 🛠️ Tarefas
- [ ] Criar `src/repositories/messageRepository.ts` com `getMessagesByRoom`
- [ ] Criar `src/controllers/messageController.ts` e `src/routes/messageRoutes.ts`
- [ ] Aplicar o `authGuard` middleware na rota
- [ ] Implementar paginação com `LIMIT` e `OFFSET` via query params

#### 💻 Detalhes Técnicos

**Request:**
```
GET /messages/uuid-da-sala?limit=50&offset=0
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "messages": [
    {
      "id": "uuid",
      "senderId": "uuid",
      "senderName": "João Silva",
      "text": "Olá pessoal!",
      "createdAt": "2026-07-26T12:00:00Z"
    }
  ],
  "total": 150
}
```

**Query SQL (MySQL — placeholders com `?`):**
```sql
SELECT m.id, m.text, m.created_at, u.id as sender_id, u.name as sender_name
FROM messages m
JOIN users u ON m.sender_id = u.id
WHERE m.room_id = ?
ORDER BY m.created_at DESC
LIMIT ? OFFSET ?;
```

**Dica:** Retorne as mensagens em ordem `DESC` (mais recentes primeiro) para facilitar a paginação "carregar mais" no Delphi — o client inverte a lista antes de exibir.

#### ✅ Critérios de Aceite
- [ ] Rota sem JWT retorna 401
- [ ] Rota com JWT válido retorna lista de mensagens paginada
- [ ] `limit` e `offset` funcionam corretamente

---

### Issue #09

#### 📌 Título: `[Backend] Implementar GET /users/online e GET /rooms`

#### 📝 Descrição
Cria rotas REST auxiliares que o cliente Delphi usa na inicialização: listar usuários online (a partir do `Map` em memória do WS) e listar as salas disponíveis.

#### 🛠️ Tarefas
- [ ] Criar `src/routes/userRoutes.ts` com `GET /users/online`
- [ ] Criar `src/routes/roomRoutes.ts` com `GET /rooms`
- [ ] Exportar o `clients` Map do `wsServer.ts` para uso nos controllers
- [ ] Registrar as novas rotas no `app.ts`

#### 💻 Detalhes Técnicos

**`GET /users/online` Response:**
```json
{
  "users": [
    { "userId": "uuid", "name": "João Silva" },
    { "userId": "uuid", "name": "Maria Santos" }
  ]
}
```

**`GET /rooms` Response:**
```json
{
  "rooms": [
    { "id": "uuid", "name": "geral", "isDirect": false }
  ]
}
```

#### ✅ Critérios de Aceite
- [ ] `GET /users/online` retorna apenas usuários com socket ativo
- [ ] `GET /rooms` retorna a lista de salas públicas
- [ ] Ambas as rotas são protegidas por JWT

---

## 🔵 FASE 5 — Cliente Delphi: Autenticação

---

### Issue #10

#### 📌 Título: `[Delphi] Criar TForm de Login com chamada REST`

#### 📝 Descrição
Cria a primeira tela da aplicação Delphi: o formulário de login. Ao submeter, o form chama `POST /auth/login` via `RESTRequest4Delphi`, recebe o JWT e o armazena globalmente para uso em toda a sessão. A biblioteca é usada 100% via código — sem componentes dropped nos forms.

#### 🛠️ Tarefas
- [ ] Instalar `RESTRequest4Delphi` via GetIt Package Manager ou copiando os fontes para o projeto
- [ ] Criar `TfrmLogin` com campos `TEdit` para email e senha e um `TButton` de login
- [ ] Criar `TDataModule` global (`dmSession`) para armazenar `Token` (string) e `CurrentUser` (record)
- [ ] Implementar chamada `POST /auth/login` com `RESTRequest4Delphi` via interface fluente
- [ ] Parsear o JSON de resposta com `System.JSON`
- [ ] Em caso de sucesso, fechar o form de login e abrir o form de chat
- [ ] Em caso de erro, exibir `ShowMessage` com a mensagem de erro

#### 💻 Detalhes Técnicos

**Instalação:** Adicione as units do `RESTRequest4Delphi` ao `Search Path` do projeto ou instale via GetIt. As units principais são: `RDW.RESTClient`, `RDW.RESTRequest`, `RDW.RESTResponse`.

**Chamada REST em Delphi com RESTRequest4Delphi:**
```delphi
uses
  RESTRequest4D; // unit principal da biblioteca

procedure TfrmLogin.btnLoginClick(Sender: TObject);
var
  Response: IResponse;
  Json: TJSONObject;
begin
  Response := TRequest.New
    .BaseURL('http://localhost:3000')
    .Resource('/auth/login')
    .ContentType('application/json')
    .AddBody(Format('{"email":"%s","password":"%s"}',
      [edtEmail.Text, edtPassword.Text]))
    .Post;

  if Response.StatusCode = 200 then
  begin
    Json := TJSONObject.ParseJSONValue(Response.Content) as TJSONObject;
    try
      dmSession.Token := Json.GetValue<string>('token');
      dmSession.CurrentUserId :=
        Json.GetValue<TJSONObject>('user').GetValue<string>('id');
      dmSession.CurrentUserName :=
        Json.GetValue<TJSONObject>('user').GetValue<string>('name');

      TfrmChat.Create(Application).Show;
      Self.Close; // Action := caFree no OnClose
    finally
      Json.Free;
    end;
  end
  else
    ShowMessage('Credenciais inválidas. Verifique seu email e senha.');
end;
```

**Vantagens sobre TNetHTTPClient:**
- Sem componentes visuais no form — toda configuração é via código fluente
- Sem necessidade de gerenciar `TStringStream` ou `IHTTPResponse` manualmente
- Headers, body e autenticação configurados na mesma cadeia de chamadas

**Dica de memória:** Configure `Action := caFree` no evento `OnClose` do `TfrmLogin` para que o form seja destruído automaticamente ao ser fechado, evitando memory leak.

#### ✅ Critérios de Aceite
- [ ] Ao inserir credenciais corretas, o token é salvo no `dmSession` e o form de chat abre
- [ ] Ao inserir credenciais erradas, uma mensagem de erro é exibida
- [ ] O form de login é destruído da memória ao ser fechado

---

## 🟡 FASE 6 — Cliente Delphi: Chat em Tempo Real

---

### Issue #11

#### 📌 Título: `[Delphi] Conectar ao WebSocket e exibir usuários online`

#### 📝 Descrição
Após o login, o form de chat se conecta ao servidor WebSocket, enviando o JWT como query parameter. Quando recebe a mensagem `ONLINE_USERS` do servidor, atualiza a lista de usuários online na interface.

#### 🛠️ Tarefas
- [ ] Adicionar `Indy` ao projeto (componentes `TIdTCPClient` base para WebSocket)
- [ ] Usar a unit `sgcWebSockets` ou implementar handshake WebSocket manualmente via `TIdTCPClient`
- [ ] Na abertura do `TfrmChat`, iniciar a conexão WS em uma `TThread`
- [ ] Implementar o loop de leitura em background, enviando mensagens recebidas para o main thread via `TThread.Synchronize` ou `TThread.Queue`
- [ ] Ao receber `ONLINE_USERS`, atualizar um `TListBox` com os nomes dos usuários
- [ ] Ao fechar o form, encerrar a thread e desconectar o WS

#### 💻 Detalhes Técnicos

**Recomendação:** Use a biblioteca **`sgcWebSockets`** (community edition gratuita) ou **`TsgcWebSocketClient`**. Ela abstrai o handshake do protocolo WS e funciona nativamente com Delphi, enviando/recebendo via eventos OnMessage/OnConnect.

**Alternativa nativa:** Use `TIdHTTP` do Indy com upgrade para WebSocket — mais complexo mas sem dependências extras.

**URL de conexão:**
```
ws://localhost:3000/ws?token=eyJhbG...
```

**Tratamento de mensagem `ONLINE_USERS`:**
```delphi
procedure TfrmChat.OnWebSocketMessage(const Msg: string);
var
  Json: TJSONObject;
  UsersArray: TJSONArray;
  I: Integer;
begin
  Json := TJSONObject.ParseJSONValue(Msg) as TJSONObject;
  try
    if Json.GetValue<string>('type') = 'ONLINE_USERS' then
    begin
      UsersArray := Json.GetValue<TJSONArray>('data');
      TThread.Synchronize(nil, procedure
      begin
        lstOnlineUsers.Items.Clear;
        for I := 0 to UsersArray.Count - 1 do
          lstOnlineUsers.Items.Add(
            (UsersArray.Items[I] as TJSONObject).GetValue<string>('name')
          );
      end);
    end;
  finally
    Json.Free;
  end;
end;
```

**Dica crítica:** Toda atualização de componentes visuais (TListBox, TMemo) DEVE ocorrer na thread principal. Use `TThread.Synchronize` ou `TThread.Queue` para isso. Fazer UI update em background thread causa AV (Access Violation).

#### ✅ Critérios de Aceite
- [ ] Ao abrir o chat, a conexão WS é estabelecida
- [ ] A lista de usuários online é populada e atualizada em tempo real
- [ ] Fechar o form encerra a conexão WS sem travar a UI

---

### Issue #12

#### 📌 Título: `[Delphi] Implementar envio e recebimento de mensagens em tempo real`

#### 📝 Descrição
Implementa a funcionalidade central do chat: o usuário digita uma mensagem em um `TEdit`, pressiona Enter/Enviar, a mensagem é enviada via WebSocket, e as mensagens recebidas (`NEW_MESSAGE`) aparecem no `TMemo` ou `TListView` do chat.

#### 🛠️ Tarefas
- [ ] Adicionar `TMemo` (somente leitura) para exibir mensagens e `TEdit` + `TButton` para compor
- [ ] Ao clicar em Enviar (ou pressionar Enter), serializar o JSON e enviar via WS
- [ ] Ao receber `NEW_MESSAGE`, adicionar a mensagem formatada ao `TMemo`
- [ ] Ao abrir o chat de uma sala, fazer `GET /messages/:roomId` para carregar o histórico

#### 💻 Detalhes Técnicos

**Envio de mensagem:**
```delphi
procedure TfrmChat.btnSendClick(Sender: TObject);
var
  Payload: string;
begin
  if edtMessage.Text.Trim.IsEmpty then Exit;
  
  Payload := Format(
    '{"type":"SEND_MESSAGE","roomId":"%s","text":"%s"}',
    [FCurrentRoomId, edtMessage.Text]
  );
  FWebSocket.Send(Payload); // Método do componente WS escolhido
  edtMessage.Clear;
end;
```

**Recebimento de `NEW_MESSAGE`:**
```delphi
if MsgType = 'NEW_MESSAGE' then
begin
  TThread.Queue(nil, procedure
  begin
    memoChat.Lines.Add(Format(
      '[%s] %s: %s',
      [FormatDateTime('hh:nn', Now), SenderName, Text]
    ));
    // Auto-scroll para a última mensagem
    SendMessage(memoChat.Handle, WM_VSCROLL, SB_BOTTOM, 0);
  end);
end;
```

**Carregamento de histórico (REST com RESTRequest4Delphi):**
```delphi
uses
  RESTRequest4D;

procedure TfrmChat.LoadHistory(const RoomId: string);
var
  Response: IResponse;
  Json: TJSONObject;
  Messages: TJSONArray;
  I: Integer;
  Msg: TJSONObject;
begin
  Response := TRequest.New
    .BaseURL('http://localhost:3000')
    .Resource('/messages/' + RoomId)
    .AddParam('limit', '50')
    .AddParam('offset', '0')
    .Token(dmSession.Token)   // Injeta Authorization: Bearer <token> automaticamente
    .Get;

  if Response.StatusCode = 200 then
  begin
    Json := TJSONObject.ParseJSONValue(Response.Content) as TJSONObject;
    try
      Messages := Json.GetValue<TJSONArray>('messages');
      // Exibe em ordem cronológica (API retorna DESC, invertemos aqui)
      for I := Messages.Count - 1 downto 0 do
      begin
        Msg := Messages.Items[I] as TJSONObject;
        memoChat.Lines.Add(Format('[%s] %s: %s', [
          Msg.GetValue<string>('createdAt'),
          Msg.GetValue<string>('senderName'),
          Msg.GetValue<string>('text')
        ]));
      end;
    finally
      Json.Free;
    end;
  end;
end;
```

**Dica:** O método `.Token(jwt)` do `RESTRequest4Delphi` injeta automaticamente o header `Authorization: Bearer <token>` — sem precisar configurar `CustomHeaders` manualmente.

#### ✅ Critérios de Aceite
- [ ] Mensagem enviada aparece para todos os membros da sala em tempo real
- [ ] Histórico das últimas 50 mensagens é carregado ao abrir a conversa
- [ ] O chat faz auto-scroll para a mensagem mais recente

---

## 🟠 FASE 7 — Direct Messages (DM)

---

### Issue #13

#### 📌 Título: `[Backend] Implementar criação de sala DM (POST /rooms/dm)`

#### 📝 Descrição
Cria a lógica para iniciar uma conversa direta entre dois usuários. Se a sala DM entre eles já existir, retorna a existente em vez de criar uma nova.

#### 🛠️ Tarefas
- [ ] Criar `POST /rooms/dm` no `roomRoutes.ts`
- [ ] Implementar lógica "find or create" no `roomRepository.ts`
- [ ] Inserir os dois usuários em `room_members` automaticamente
- [ ] Retornar o `roomId` para o cliente iniciar o chat

#### 💻 Detalhes Técnicos

**Request:**
```json
POST /rooms/dm
Authorization: Bearer <token>
{
  "targetUserId": "uuid-do-destinatario"
}
```

**Response (200 ou 201):**
```json
{
  "roomId": "uuid-da-sala-dm"
}
```

**Query SQL "find or create":**
```sql
-- Verifica se já existe uma sala DM entre os dois usuários
SELECT r.id FROM rooms r
JOIN room_members rm1 ON rm1.room_id = r.id AND rm1.user_id = $1
JOIN room_members rm2 ON rm2.room_id = r.id AND rm2.user_id = $2
WHERE r.is_direct = TRUE
LIMIT 1;
```

#### ✅ Critérios de Aceite
- [ ] Dois usuários chamando o endpoint entre si recebem o mesmo `roomId`
- [ ] A sala DM é marcada como `is_direct = TRUE` no banco
- [ ] Apenas os 2 membros são adicionados à sala

---

### Issue #14

#### 📌 Título: `[Delphi] Implementar fluxo de Direct Message na UI`

#### 📝 Descrição
Ao clicar em um usuário na lista de "online", o Delphi chama `POST /rooms/dm` para obter ou criar a sala DM, e então navega para aquela conversa.

#### 🛠️ Tarefas
- [ ] Ao clicar em um item do `lstOnlineUsers`, capturar o `userId` selecionado
- [ ] Chamar `POST /rooms/dm` com o `targetUserId`
- [ ] Usar o `roomId` retornado para carregar histórico e filtrar mensagens WS
- [ ] Exibir o nome do destinatário no título da janela de chat

#### ✅ Critérios de Aceite
- [ ] Clicar em um usuário abre uma janela/aba de DM com ele
- [ ] Mensagens DM só aparecem para os 2 participantes, não para outros

---

## 🔴 FASE 8 — Polimento & Estabilidade

---

### Issue #15

#### 📌 Título: `[Delphi] Implementar reconexão automática ao WebSocket`

#### 📝 Descrição
Se a conexão WebSocket cair (servidor reiniciado, perda de rede), o cliente Delphi deve detectar a desconexão e tentar reconectar automaticamente com backoff exponencial.

#### 🛠️ Tarefas
- [ ] No evento `OnDisconnect` do componente WS, iniciar um `TTimer`
- [ ] Implementar backoff: tentar reconectar após 1s, 2s, 4s, 8s... (máximo 30s)
- [ ] Exibir um indicador de status na UI ("Reconectando..." vs "Conectado")
- [ ] Ao reconectar com sucesso, resetar o backoff

#### 💻 Detalhes Técnicos
```delphi
procedure TfrmChat.OnWebSocketDisconnect;
begin
  TThread.Queue(nil, procedure
  begin
    lblStatus.Caption := 'Desconectado. Reconectando...';
    tmrReconnect.Interval := Min(FReconnectDelay * 1000, 30000);
    tmrReconnect.Enabled := True;
    FReconnectDelay := FReconnectDelay * 2; // Backoff exponencial
  end);
end;

procedure TfrmChat.tmrReconnectTimer(Sender: TObject);
begin
  tmrReconnect.Enabled := False;
  ConnectWebSocket; // Tenta reconectar
end;
```

#### ✅ Critérios de Aceite
- [ ] Ao reiniciar o servidor, o cliente reconecta automaticamente em até 30s
- [ ] O usuário vê o status de "Reconectando..." na tela
- [ ] Após reconexão, o usuário volta a aparecer na lista de online

---

### Issue #16

#### 📌 Título: `[Backend] Adicionar rate limiting e tratamento global de erros`

#### 📝 Descrição
Adiciona proteções básicas ao backend: rate limiting para evitar spam nas rotas de autenticação e um middleware global de tratamento de erros para evitar que exceções não tratadas derrubem o servidor.

#### 🛠️ Tarefas
- [ ] Instalar `express-rate-limit`: `npm install express-rate-limit`
- [ ] Aplicar limite de 10 requisições/minuto nas rotas `/auth/*`
- [ ] Criar middleware de erro global no `app.ts`
- [ ] Garantir que erros do `ws` (WebSocket) são logados sem derrubar o processo

#### 💻 Detalhes Técnicos
```typescript
// Rate limiting
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10,
  message: { error: 'Muitas tentativas. Tente novamente em 1 minuto.' },
});
app.use('/auth', authLimiter);

// Middleware global de erro (deve ser o ÚLTIMO middleware)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[ERROR]', err.message, err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});
```

#### ✅ Critérios de Aceite
- [ ] Mais de 10 chamadas rápidas ao `/auth/login` resulta em 429 Too Many Requests
- [ ] Exceções não tratadas nos controllers retornam 500 sem derrubar o servidor

---

## 📊 Resumo Geral

| Fase | Issues | Responsável |
|---|---|---|
| 1 — Fundação | #01, #02 | Backend |
| 2 — Auth JWT | #03, #04, #05 | Backend |
| 3 — WebSocket | #06, #07 | Backend |
| 4 — REST Msgs | #08, #09 | Backend |
| 5 — Delphi Auth | #10 | Frontend |
| 6 — Delphi Chat | #11, #12 | Frontend |
| 7 — DM | #13, #14 | Full-Stack |
| 8 — Polimento | #15, #16 | Full-Stack |

**Total: 16 Issues** cobrindo a stack completa do projeto.
