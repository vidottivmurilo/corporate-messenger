<template>
  <main class="flex-1 flex flex-col h-full bg-background overflow-hidden">
    <!-- Header do Canal / DM -->
    <header v-if="chatStore.activeRoom" class="h-14 border-b border-border px-6 flex items-center justify-between bg-surface/30">
      <div class="flex items-center gap-2">
        <span class="text-sm font-semibold text-foreground">
          <span v-if="!chatStore.activeRoom.isDirect" class="text-muted">#</span>
          {{ chatStore.activeRoom.name }}
        </span>
        <span v-if="chatStore.activeRoom.isDirect" class="text-[10px] bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.5 rounded">
          Conversa Direta
        </span>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="$emit('open-palette')"
          class="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-surface border border-border rounded text-[11px] text-muted hover:text-foreground transition-colors"
          title="Abrir Command Palette"
        >
          <span>🔍</span>
          <span>Pesquisar</span>
          <kbd class="text-[9px] font-mono bg-background border border-border px-1 rounded">Ctrl+K</kbd>
        </button>
        <span class="text-xs text-muted">v2.0</span>
      </div>
    </header>

    <!-- Área de Conteúdo / Histórico -->
    <template v-if="chatStore.activeRoom">
      <MessageList />
      <MessageComposer />
    </template>

    <!-- Nenhuma sala selecionada -->
    <div v-else class="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted">
      <p class="text-xs">Selecione um canal ou uma conversa direta na barra lateral para começar.</p>
    </div>
  </main>
</template>

<script setup lang="ts">
import { useChatStore } from '../stores/chat.js';
import MessageList from './MessageList.vue';
import MessageComposer from './MessageComposer.vue';

defineEmits<{
  (e: 'open-palette'): void;
}>();

const chatStore = useChatStore();
</script>
