---
id: "US-001"
title: "Autenticação JWT, Usuários e Handshake WebSocket Seguro"
points: 3
status: "done"
owner_back: "dev-backend-green"
owner_front: "dev-frontend-green"
contract_ref: "specs/contracts/openapi.yaml#registerUser,loginUser"
---

# US-001: Autenticação JWT, Usuários e Handshake WebSocket Seguro

<frozen-after-approval>

## 1. Intenção e Fronteiras
- **Como** colaborador da empresa,
- **Quero** me cadastrar e realizar login no sistema com credenciais seguras,
- **Para que** eu possa acessar o ambiente de mensagens com minha identidade verificada e estabelecer conexão WebSocket autenticada.

## 2. Critérios de Aceite em Gherkin

### Cenário 1: Cadastro com sucesso
- **Dado** que envio nome `"Murilo Vidotti"`, e-mail `"murilo@empresa.com"` e senha `"senhaForte123"`,
- **Quando** a rota `POST /auth/register` é acionada,
- **Então** o status de retorno deve ser `201 Created`,
- **E** o payload deve conter o `id`, `name` e `email`, sem expor o hash de senha.

### Cenário 2: Erro ao cadastrar e-mail duplicado
- **Dado** que o e-mail `"murilo@empresa.com"` já existe no banco de dados,
- **Quando** tento cadastrar um novo usuário com o mesmo e-mail,
- **Então** o status retornado deve ser `409 Conflict`.

### Cenário 3: Login com credenciais válidas
- **Dado** que um usuário está cadastrado com e-mail `"murilo@empresa.com"` e senha `"senhaForte123"`,
- **Quando** aciono `POST /auth/login` com as credenciais corretas,
- **Então** o status deve ser `200 OK`,
- **E** a resposta deve conter um token JWT válido com expiração de 8h e os dados do usuário.

### Cenário 4: Tentativa de login com senha incorreta
- **Dado** que o usuário existe,
- **Quando** tento fazer login com a senha `"senhaErrada"`,
- **Então** o status deve ser `401 Unauthorized` com mensagem `"Credenciais inválidas"`.

### Cenário 5: Handshake de WebSocket Autenticado
- **Dado** que estabeleço uma conexão WebSocket em `/ws`,
- **Quando** envio a mensagem `{ "type": "AUTH", "token": "<jwt_valido>" }` em até 3 segundos,
- **Então** o servidor responde com `{ "type": "AUTH_SUCCESS", "userId": "...", "name": "..." }`,
- **E** se o token for inválido ou o tempo expirar, a conexão é encerrada com código `4001`.

</frozen-after-approval>

## 3. Checklist de Implementação
- [ ] Schema PostgreSQL: tabela `users` no Drizzle ORM
- [ ] Backend: rotas `POST /auth/register` e `POST /auth/login`
- [ ] Backend: middleware de verificação JWT
- [ ] Backend: servidor WS com handler de `AUTH` e timeout de 3s
- [ ] Frontend: `LoginForm.vue` e `RegisterModal.vue` com estados Loading/Error/Success
- [ ] Testes automatizados (Unitários e de Integração) passando
