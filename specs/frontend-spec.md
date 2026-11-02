# 🖥️ Frontend Specification: Corporate Messenger Web & Widget (v1 + v2)

## 1. Visão Geral e Ergonomia

Construído em **Vue 3 + Vite + Tailwind CSS**, seguindo as diretrizes de sobriedade e alta densidade corporativa da skill [`09-frontend-design-craft`](../.agents/skills/09-frontend-design-craft/SKILL.md), sem clichês visuais de IA.

---

## 2. Componentes e Funcionalidades v2

### 2.1. Notificações e Badges (`useNotifications.ts`)
- **Notificação Nativa do Desktop:**
  - Pede permissão via `Notification.requestPermission()`.
  - Disparada sempre que uma nova mensagem for recebida e o documento estiver oculto (`document.hidden === true`).
  - Clicar na notificação foca a janela (`window.focus()`) e seleciona a sala correspondente.
- **Audio Chime:**
  - Sintetizado com precisão na Web Audio API (som de sino curto de 150ms a 880Hz suave), sem arquivos externos pesados.
- **Badges de Não Lidas:**
  - Contador numérico nos canais/DMs da barra lateral (`ChannelList.vue`, `DmList.vue`).
  - Título dinâmico: `(3) Corporate Messenger`.

### 2.2. Indicador de Digitação (`TypingIndicator.vue`)
- Exibe discretamente na base da conversa: *"João Silva está digitando..."* com animação suave de 3 pontinhos, desaparecendo após 3 segundos sem novas emissões.

### 2.3. Reações com Emojis (`MessageReactions.vue`)
- Chips discretos na base da mensagem com contador: `👍 3`, `🚀 1`.
- Clicar em um chip alterna (toggle) a reação do usuário logado.
- Barra de ação no hover da mensagem com atalhos rápidos para 👍, ❤️, 🚀, 👀.

### 2.4. Edição e Exclusão (`MessageActions.vue`)
- Ações no hover (apenas para mensagens do próprio usuário):
  - Botão de Editar: ativa modo de edição em linha com `Esc` para cancelar e `Enter` para salvar.
  - Botão de Excluir: confirmação rápida para marcar mensagem como apagada.

### 2.5. Command Palette Global (`CommandPalette.vue`)
- Pressionar `Ctrl + K` (ou `Cmd + K`) abre modal flutuante centralizado com busca rápida de canais e colaboradores, permitindo navegação 100% por setas do teclado e `Enter`.

### 2.6. Web Component do Widget (`<corporate-chat-box>`)
- Pacote `packages/chat-widget` exporta tanto o componente Vue quanto o Custom Element padrão do W3C.
