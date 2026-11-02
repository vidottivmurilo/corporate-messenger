<template>
  <div class="space-y-1">
    <div class="px-2 py-1 text-[11px] font-semibold text-muted tracking-wider uppercase">
      Canais
    </div>
    <div v-if="channels.length === 0" class="px-2 py-2 text-xs text-muted/60">
      Nenhum canal disponível
    </div>
    <button
      v-for="channel in channels"
      :key="channel.id"
      @click="chatStore.selectRoom(channel)"
      :class="[
        'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors text-left',
        chatStore.activeRoom?.id === channel.id
          ? 'bg-primary/15 text-primary'
          : 'text-foreground/80 hover:bg-surface/80 hover:text-foreground'
      ]"
    >
      <span class="text-muted">#</span>
      <span class="truncate">{{ channel.name }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useChatStore } from '../stores/chat.js';

const chatStore = useChatStore();

const channels = computed(() => {
  return chatStore.rooms.filter(r => !r.isDirect);
});
</script>
