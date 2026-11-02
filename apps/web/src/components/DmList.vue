<template>
  <div class="space-y-1">
    <div class="px-2 py-1 text-[11px] font-semibold text-muted tracking-wider uppercase flex items-center justify-between">
      <span>Mensagens Diretas</span>
      <span class="text-[10px] bg-surface border border-border px-1.5 py-0.5 rounded text-muted">
        {{ onlineUsersWithoutSelf.length }} online
      </span>
    </div>

    <div v-if="onlineUsersWithoutSelf.length === 0" class="px-2 py-2 text-xs text-muted/60">
      Nenhum outro colega online
    </div>

    <button
      v-for="user in onlineUsersWithoutSelf"
      :key="user.userId"
      @click="chatStore.openDm(user.userId)"
      class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-foreground/80 hover:bg-surface/80 hover:text-foreground transition-colors text-left"
    >
      <span class="relative flex h-2 w-2">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
        <span class="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
      </span>
      <span class="truncate">{{ user.name }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useChatStore } from '../stores/chat.js';
import { useAuthStore } from '../stores/auth.js';

const chatStore = useChatStore();
const authStore = useAuthStore();

const onlineUsersWithoutSelf = computed(() => {
  return chatStore.onlineUsers.filter(u => u.userId !== authStore.user?.id);
});
</script>
