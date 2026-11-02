<template>
  <div
    ref="containerRef"
    @scroll="handleScroll"
    class="flex-1 overflow-y-auto px-6 py-4 space-y-1 relative"
  >
    <!-- Botão de carregar mensagens antigas (Cursor pagination) -->
    <div v-if="chatStore.hasMore" class="text-center py-2">
      <button
        @click="chatStore.loadMoreMessages"
        :disabled="chatStore.isLoadingMessages"
        class="text-xs text-muted hover:text-foreground bg-surface border border-border px-3 py-1 rounded transition-colors"
      >
        <span v-if="chatStore.isLoadingMessages">Carregando...</span>
        <span v-else>Carregar mensagens anteriores</span>
      </button>
    </div>

    <!-- Estado Vazio (Empty State) -->
    <div v-if="chatStore.messages.length === 0 && !chatStore.isLoadingMessages" class="h-full flex flex-col items-center justify-center text-center p-8">
      <div class="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-muted mb-3">
        💬
      </div>
      <h3 class="text-sm font-semibold text-foreground">Início da conversa</h3>
      <p class="text-xs text-muted mt-1 max-w-xs">
        Nenhuma mensagem enviada ainda nesta sala. Envie a primeira mensagem abaixo!
      </p>
    </div>

    <!-- Lista de Mensagens com Agrupamento Inteligente -->
    <div
      v-for="(msg, index) in chatStore.messages"
      :key="msg.id"
      :class="[
        'flex flex-col',
        shouldGroupWithPrevious(index) ? 'mt-0.5' : 'mt-3.5'
      ]"
    >
      <!-- Cabeçalho de autor e horário (se não agrupado) -->
      <div v-if="!shouldGroupWithPrevious(index)" class="flex items-baseline gap-2 mb-1">
        <span class="text-xs font-semibold text-foreground">{{ msg.senderName }}</span>
        <span class="text-[10px] text-muted">{{ formatTime(msg.createdAt) }}</span>
      </div>

      <!-- Corpo da Mensagem -->
      <div class="text-xs leading-relaxed text-foreground/90 pl-0 hover:bg-surface/30 rounded px-1 -mx-1 py-0.5 transition-colors">
        {{ msg.text }}
      </div>
    </div>

    <!-- Botão flutuante de Novas Mensagens -->
    <button
      v-if="showNewMessagesPill"
      @click="scrollToBottom"
      class="sticky bottom-2 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-md hover:bg-primary/90 transition-all flex items-center gap-1.5"
    >
      <span>Novas mensagens</span>
      <span>↓</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { useChatStore } from '../stores/chat.js';

const chatStore = useChatStore();
const containerRef = ref<HTMLElement | null>(null);
const showNewMessagesPill = ref(false);

function formatTime(isoDate: string) {
  try {
    const date = new Date(isoDate);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

// Agrupamento: autor igual e intervalo menor que 5 minutos (300.000 ms)
function shouldGroupWithPrevious(index: number) {
  if (index === 0) return false;
  const current = chatStore.messages[index];
  const previous = chatStore.messages[index - 1];

  if (current.senderId !== previous.senderId) return false;

  const diffMs = new Date(current.createdAt).getTime() - new Date(previous.createdAt).getTime();
  return diffMs < 5 * 60 * 1000;
}

function handleScroll() {
  if (!containerRef.value) return;
  const { scrollTop, scrollHeight, clientHeight } = containerRef.value;
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

  // Se o usuário rolou para cima e está lendo histórico antigo
  if (distanceFromBottom > 150) {
    showNewMessagesPill.value = false;
  } else {
    showNewMessagesPill.value = false;
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (containerRef.value) {
      containerRef.value.scrollTop = containerRef.value.scrollHeight;
      showNewMessagesPill.value = false;
    }
  });
}

// Auto-scroll inteligente: só desce se o usuário já estiver na base
watch(
  () => chatStore.messages.length,
  () => {
    if (!containerRef.value) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.value;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;

    if (isNearBottom) {
      scrollToBottom();
    } else {
      showNewMessagesPill.value = true;
    }
  }
);

watch(
  () => chatStore.activeRoom?.id,
  () => {
    scrollToBottom();
  }
);
</script>
