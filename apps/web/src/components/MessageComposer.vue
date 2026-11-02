<template>
  <div class="p-4 border-t border-border bg-[#0B0F19]">
    <form @submit.prevent="handleSend" class="relative bg-surface border border-border rounded-lg focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
      <textarea
        ref="textareaRef"
        v-model="text"
        rows="1"
        @keydown="handleKeyDown"
        :placeholder="`Enviar mensagem para ${roomName}...`"
        class="w-full bg-transparent px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted/60 focus:outline-none resize-none max-h-36 overflow-y-auto"
      ></textarea>

      <div class="flex items-center justify-between px-3 py-1.5 border-t border-border/40">
        <span class="text-[10px] text-muted">
          Pressione <kbd class="px-1 py-0.5 rounded bg-background border border-border">Enter</kbd> para enviar
        </span>

        <button
          type="submit"
          :disabled="!text.trim()"
          class="px-3 py-1 bg-primary hover:bg-primary/90 text-white text-xs font-medium rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Enviar
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useChatStore } from '../stores/chat.js';

const chatStore = useChatStore();
const text = ref('');
const textareaRef = ref<HTMLTextAreaElement | null>(null);

const roomName = computed(() => {
  if (!chatStore.activeRoom) return '';
  return chatStore.activeRoom.isDirect ? chatStore.activeRoom.name : `#${chatStore.activeRoom.name}`;
});

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
}

function handleSend() {
  if (!text.value.trim()) return;
  chatStore.sendMessage(text.value);
  text.value = '';
}
</script>
