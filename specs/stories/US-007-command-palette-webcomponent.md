---
id: "US-007"
title: "Command Palette com Ctrl+K & Web Component W3C do Widget"
points: 3
status: "done"
owner_back: "dev-backend-green"
owner_front: "dev-frontend-green"
contract_ref: "specs/frontend-spec.md#command-palette"
---

# US-007: Command Palette com Ctrl+K & Web Component W3C do Widget

<frozen-after-approval>

## 1. Intenção e Fronteiras
- **Como** colaborador avançado ou desenvolvedor integrador,
- **Quero** navegar rapidamente pelo sistema usando `Ctrl+K` e ter o widget exportado como Custom Element do W3C,
- **Para que** eu possa trabalhar sem tirar as mãos do teclado e embutir o chat em qualquer ecossistema tecnológico.

## 2. Critérios de Aceite em Gherkin

### Cenário 1: Abertura do Command Palette por teclado
- **Dado** que estou em qualquer tela da aplicação,
- **Quando** pressiono `Ctrl + K` (ou `Cmd + K`),
- **Então** o modal de busca rápida é aberto com foco automático no input,
- **E** posso filtrar canais e colaboradores por digitação,
- **E** pressionar `Enter` seleciona e abre a sala imediatamente,
- **E** pressionar `Esc` fecha o modal.

### Cenário 2: Web Component Nativo W3C
- **Dado** o pacote `@corp-messenger/chat-widget`,
- **Quando** importado em uma página HTML sem framework via `<script>`,
- **Então** a tag `<corporate-chat-box api-url="..." token="..."></corporate-chat-box>` renderiza o widget de chat completo e funcional.

</frozen-after-approval>

## 3. Checklist de Implementação
- [x] Frontend: componente `CommandPalette.vue` com atalhos de teclado globais
- [x] Widget: empacotamento com `defineCustomElement` do Vue 3
- [x] Testes automatizados passando

