<template>
  <div class="space-y-3">
    <!-- Conversas Diretas Abertas -->
    <div class="space-y-1">
      <div class="px-2 py-1 text-[11px] font-semibold text-muted tracking-wider uppercase flex items-center justify-between">
        <span>Conversas Diretas</span>
      </div>

      <div v-if="directRooms.length === 0" class="px-2 py-1.5 text-xs text-muted/60">
        Nenhuma conversa aberta
      </div>

      <button
        v-for="room in directRooms"
        :key="room.id"
        @click="chatStore.selectRoom(room)"
        :class="[
          'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors text-left',
          chatStore.activeRoom?.id === room.id
            ? 'bg-primary/15 text-primary'
            : 'text-foreground/80 hover:bg-surface/80 hover:text-foreground'
        ]"
      >
        <div class="flex items-center gap-2 truncate">
          <span class="w-2 h-2 rounded-full bg-border shrink-0"></span>
          <span class="truncate">{{ room.name }}</span>
        </div>

        <!-- Badge de Mensagens Não Lidas -->
        <span
          v-if="chatStore.unreadCounts[room.id]"
          class="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none shrink-0"
        >
          {{ chatStore.unreadCounts[room.id] }}
        </span>
      </button>
    </div>

    <!-- Colegas Online para Iniciar Conversa -->
    <div class="space-y-1 pt-1 border-t border-border/40">
      <div class="px-2 py-1 text-[11px] font-semibold text-muted tracking-wider uppercase flex items-center justify-between">
        <span>Colegas Online</span>
        <span class="text-[10px] bg-surface border border-border px-1.5 py-0.5 rounded text-muted">
          {{ onlineUsersWithoutSelf.length }}
        </span>
      </div>

      <div v-if="onlineUsersWithoutSelf.length === 0" class="px-2 py-1.5 text-xs text-muted/60">
        Nenhum outro colega online
      </div>

      <button
        v-for="user in onlineUsersWithoutSelf"
        :key="user.userId"
        @click="chatStore.openDm(user.userId)"
        class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-foreground/80 hover:bg-surface/80 hover:text-foreground transition-colors text-left"
        title="Iniciar conversa direta"
      >
        <span class="relative flex h-2 w-2 shrink-0">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
        </span>
        <span class="truncate">{{ user.name }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useChatStore } from '../stores/chat.js';
import { useAuthStore } from '../stores/auth.js';

const chatStore = useChatStore();
const authStore = useAuthStore();

const directRooms = computed(() => {
  return chatStore.rooms.filter(r => r.isDirect);
});

const onlineUsersWithoutSelf = computed(() => {
  return chatStore.onlineUsers.filter(u => u.userId !== authStore.user?.id);
});
</script>
