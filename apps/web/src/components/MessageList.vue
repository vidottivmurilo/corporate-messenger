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
        'flex flex-col relative group px-2 py-1 rounded-md transition-colors',
        shouldGroupWithPrevious(index) ? 'mt-0.5' : 'mt-3.5',
        'hover:bg-surface/40'
      ]"
    >
      <!-- Cabeçalho de autor e horário (se não agrupado) -->
      <div v-if="!shouldGroupWithPrevious(index)" class="flex items-baseline gap-2 mb-0.5">
        <span class="text-xs font-semibold text-foreground">{{ msg.senderName }}</span>
        <span class="text-[10px] text-muted">{{ formatTime(msg.createdAt) }}</span>
      </div>

      <!-- Barra de Ações Rápidas no Hover (Reações, Editar, Excluir) -->
      <div
        v-if="!msg.isDeleted && editingMessageId !== msg.id && deletingMessageId !== msg.id"
        class="absolute right-2 -top-3 hidden group-hover:flex items-center gap-1 bg-[#121824] border border-border/80 rounded-md shadow-md px-1.5 py-0.5 z-10 animate-in fade-in duration-100"
      >
        <!-- Reações rápidas -->
        <button
          v-for="emoji in quickEmojis"
          :key="emoji"
          @click="toggleReaction(msg.id, emoji)"
          class="text-xs p-1 hover:bg-surface rounded transition-transform hover:scale-110"
          :title="`Reagir com ${emoji}`"
        >
          {{ emoji }}
        </button>

        <div v-if="msg.senderId === authStore.user?.id" class="w-[1px] h-3 bg-border mx-1"></div>

        <!-- Editar Mensagem (apenas autor) -->
        <button
          v-if="msg.senderId === authStore.user?.id"
          @click="startEditing(msg)"
          class="text-[11px] text-muted hover:text-foreground px-1.5 py-0.5 hover:bg-surface rounded transition-colors"
          title="Editar mensagem"
        >
          ✏️
        </button>

        <!-- Excluir Mensagem (apenas autor) -->
        <button
          v-if="msg.senderId === authStore.user?.id"
          @click="promptDelete(msg.id)"
          class="text-[11px] text-muted hover:text-destructive px-1.5 py-0.5 hover:bg-surface rounded transition-colors"
          title="Excluir mensagem"
        >
          🗑️
        </button>
      </div>

      <!-- Modo de Edição In-line -->
      <div v-if="editingMessageId === msg.id" class="mt-1 space-y-2">
        <input
          v-model="editDraftText"
          type="text"
          @keydown.enter.prevent="saveEdit(msg.id)"
          @keydown.esc.prevent="cancelEdit"
          class="w-full bg-background border border-primary/50 rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          autofocus
        />
        <div class="flex items-center gap-2 text-[10px]">
          <button
            @click="saveEdit(msg.id)"
            class="px-2 py-0.5 bg-primary text-white rounded font-medium hover:bg-primary/90 transition-colors"
          >
            Salvar
          </button>
          <button
            @click="cancelEdit"
            class="px-2 py-0.5 bg-surface text-muted hover:text-foreground rounded transition-colors"
          >
            Cancelar
          </button>
          <span class="text-muted/60">Enter salva • Esc cancela</span>
        </div>
      </div>

      <!-- Confirmação de Exclusão In-line (100% não-bloqueante) -->
      <div
        v-else-if="deletingMessageId === msg.id"
        class="mt-1 flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/30 rounded text-xs animate-in fade-in duration-100"
      >
        <span class="text-destructive font-medium">Excluir esta mensagem?</span>
        <button
          @click="executeDelete(msg.id)"
          class="px-2 py-0.5 bg-destructive text-white rounded text-[11px] font-medium hover:bg-destructive/90 transition-colors"
        >
          Confirmar
        </button>
        <button
          @click="cancelDelete"
          class="px-2 py-0.5 bg-surface text-muted hover:text-foreground rounded text-[11px] transition-colors"
        >
          Cancelar
        </button>
      </div>

      <!-- Visualização Normal da Mensagem -->
      <template v-else>
        <!-- Mensagem Apagada -->
        <div v-if="msg.isDeleted" class="text-xs italic text-muted/60 leading-relaxed">
          🚫 Esta mensagem foi apagada
        </div>

        <!-- Mensagem Ativa -->
        <div v-else class="text-xs leading-relaxed text-foreground/90">
          <span>{{ msg.text }}</span>
          <span v-if="msg.isEdited" class="text-[10px] text-muted/70 italic ml-1.5">
            (editada)
          </span>
        </div>

        <!-- Chips de Reações -->
        <div
          v-if="msg.reactions && msg.reactions.length > 0 && !msg.isDeleted"
          class="flex flex-wrap gap-1 mt-1.5"
        >
          <button
            v-for="reaction in msg.reactions"
            :key="reaction.emoji"
            @click="toggleReaction(msg.id, reaction.emoji)"
            :class="[
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border transition-all cursor-pointer select-none',
              hasUserReacted(reaction)
                ? 'bg-primary/15 border-primary/40 text-primary font-semibold'
                : 'bg-surface/70 border-border text-foreground/80 hover:bg-surface hover:border-border/80'
            ]"
            :title="`Reagido por ${reaction.users.length} pessoa(s)`"
          >
            <span>{{ reaction.emoji }}</span>
            <span class="text-[10px]">{{ reaction.count }}</span>
          </button>
        </div>
      </template>
    </div>

    <!-- Indicador de Digitação (Typing Indicator) -->
    <div
      v-if="typingNotificationText"
      class="sticky bottom-0 left-0 right-0 py-1.5 px-2 bg-background/90 backdrop-blur-xs flex items-center gap-2 text-xs text-muted animate-in fade-in duration-200"
    >
      <div class="flex items-center gap-1">
        <span class="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce"></span>
        <span class="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:0.2s]"></span>
        <span class="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:0.4s]"></span>
      </div>
      <span class="text-[11px] italic">{{ typingNotificationText }}</span>
    </div>

    <!-- Botão flutuante de Novas Mensagens -->
    <button
      v-if="showNewMessagesPill"
      @click="scrollToBottom"
      class="sticky bottom-4 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg hover:bg-primary/90 transition-all flex items-center gap-1.5 z-20"
    >
      <span>Novas mensagens</span>
      <span>↓</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useChatStore } from '../stores/chat.js';
import { useAuthStore } from '../stores/auth.js';
import type { MessageDto, MessageReactionDto } from '@corp-messenger/shared';

const chatStore = useChatStore();
const authStore = useAuthStore();
const containerRef = ref<HTMLElement | null>(null);
const showNewMessagesPill = ref(false);

const quickEmojis = ['👍', '❤️', '🚀', '👀'];

// Controle de Edição e Exclusão In-line
const editingMessageId = ref<string | null>(null);
const editDraftText = ref('');
const deletingMessageId = ref<string | null>(null);

// Indicador de digitação na sala atual
const typingNotificationText = computed(() => {
  if (!chatStore.activeRoom) return '';
  const currentTypers = (chatStore.typingMap[chatStore.activeRoom.id] || []).filter(
    u => u.userId !== authStore.user?.id
  );

  if (currentTypers.length === 0) return '';
  if (currentTypers.length === 1) {
    return `${currentTypers[0].userName} está digitando...`;
  }
  if (currentTypers.length === 2) {
    return `${currentTypers[0].userName} e ${currentTypers[1].userName} estão digitando...`;
  }
  return `Várias pessoas estão digitando...`;
});

function formatTime(isoDate: string) {
  try {
    const date = new Date(isoDate);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

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

function hasUserReacted(reaction: MessageReactionDto) {
  if (!authStore.user) return false;
  return reaction.users.includes(authStore.user.id);
}

async function toggleReaction(messageId: string, emoji: string) {
  await chatStore.reactToMessage(messageId, emoji);
}

function startEditing(msg: MessageDto) {
  cancelDelete();
  editingMessageId.value = msg.id;
  editDraftText.value = msg.text;
}

function cancelEdit() {
  editingMessageId.value = null;
  editDraftText.value = '';
}

async function saveEdit(messageId: string) {
  if (!editDraftText.value.trim()) return;
  await chatStore.editMessage(messageId, editDraftText.value.trim());
  cancelEdit();
}

function promptDelete(messageId: string) {
  cancelEdit();
  deletingMessageId.value = messageId;
}

function cancelDelete() {
  deletingMessageId.value = null;
}

async function executeDelete(messageId: string) {
  await chatStore.removeMessage(messageId);
  deletingMessageId.value = null;
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
    cancelEdit();
    cancelDelete();
    scrollToBottom();
  }
);
</script>
