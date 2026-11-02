# 🖥️ Frontend Specification: Corporate Messenger Web & Widget

## 1. Visão Geral e Ergonomia

Construído em **Vue 3 + Vite + Tailwind CSS**, seguindo as diretrizes de sobriedade e alta densidade de informação corporativa (estilo Linear/Slack), sem clichês visuais de IA.

---

## 2. Telas, Rotas e Componentes

### 2.1. Rota `/login` e `/register` (`AuthView.vue`)
- **Objetivo:** Autenticação e criação de conta do colaborador.
- **Componentes:**
  - `LoginForm.vue`: Campos de e-mail e senha, botão de submit com estado de carregamento.
  - `RegisterModal.vue`: Modal com nome, e-mail e senha para novos cadastros.
- **Estados Visuais Obrigatórios:**
  - **⏳ Loading:** Botão desabilitado com spinner e texto `"Entrando..."` / `"Criando conta..."`.
  - **📭 Empty:** Formulário limpo com foco automático no primeiro campo.
  - **❌ Error:** Mensagem em vermelho sóbrio (`text-destructive bg-destructive/10 border border-destructive/20`) acima dos botões.
  - **✅ Success:** Redirecionamento instantâneo para `/chat` com gravação segura do JWT e inicialização do WebSocket.

---

### 2.2. Rota `/chat` (`ChatView.vue`)
- **Layout de 2 Colunas Densas:**
  - **Coluna Lateral (`Sidebar.vue` - 260px):**
    - Perfil do usuário logado + status de conexão WS (`Conectado`, `Reconectando`).
    - Seção **Canais (`ChannelList.vue`)**: `#geral` e canais públicos com contadores de não lidas.
    - Seção **Mensagens Diretas (`DmList.vue`)**: Lista de colaboradores com indicador circular de presença (Verde = Online, Cinza = Offline). Clicar em um colaborador dispara `getOrCreateDmRoom`.
  - **Coluna Principal de Conversa (`ChatArea.vue`):**
    - **Cabeçalho:** Nome do canal/pessoa, status atual e botão de info.
    - **Área de Histórico (`MessageList.vue`):** Lista com scroll reverso.
      - Agrupamento de mensagens do mesmo remetente em até 5 minutos.
      - Botão flutuante *"Novas mensagens ↓"* caso o usuário esteja rolando o histórico antigo.
    - **Composição de Mensagem (`MessageComposer.vue`):** Textarea elástica.
      - `Enter`: envia a mensagem.
      - `Shift + Enter`: quebra de linha.
- **Estados Visuais Obrigatórios:**
  - **⏳ Loading:** Skeleton loader da lista de mensagens e canais enquanto a API responde.
  - **📭 Empty:** Quando uma sala não tem mensagens: ícone amigável e texto: *"Início da conversa no canal #geral. Envie a primeira mensagem!"*.
  - **❌ Error:** Banner discreto de erro de rede no topo com botão *"Tentar novamente"*.
  - **✅ Success:** Atualização otimista: a mensagem digitada aparece imediatamente com indicador de envio e confirmação do WS.

---

### 2.3. Componente Embutível (`packages/chat-widget/src/CorporateChatWidget.vue`)
- **Objetivo:** Mini-janela suspensa de chat flutuante (Bottom-Right) que pode ser incorporada em qualquer aplicação externa apenas passando a prop `api-url` e `token`.
- **Estados:** Minimizado (botão com badge de não lidas) e Expandido (janela de 380px x 520px com a mesma ergonomia do chat principal).
