<template>
  <aside class="w-64 bg-[#0B0F19] border-r border-border flex flex-col h-full select-none">
    <!-- Header com nome da empresa e status -->
    <div class="h-14 border-b border-border px-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 rounded bg-primary/20 border border-primary/30 flex items-center justify-center text-xs text-primary font-bold">
          C
        </div>
        <span class="text-sm font-semibold tracking-tight text-foreground truncate">Corporate Chat</span>
      </div>

      <!-- Badge de status WebSocket -->
      <div class="flex items-center gap-1.5" :title="`WebSocket: ${chatStore.connectionStatus}`">
        <span
          :class="[
            'w-2 h-2 rounded-full',
            chatStore.connectionStatus === 'connected' ? 'bg-success' :
            chatStore.connectionStatus === 'connecting' ? 'bg-amber-400 animate-pulse' : 'bg-destructive'
          ]"
        ></span>
      </div>
    </div>

    <!-- Botão de Acesso Rápido ao Command Palette (Ctrl+K) -->
    <div class="px-3 pt-3">
      <button
        @click="$emit('open-palette')"
        class="w-full flex items-center justify-between px-2.5 py-1.5 bg-surface/50 border border-border/70 rounded-md text-xs text-muted hover:text-foreground hover:bg-surface/80 transition-colors"
      >
        <span class="flex items-center gap-1.5">
          <span>🔍</span>
          <span class="text-[11px]">Buscar ou ir para...</span>
        </span>
        <kbd class="text-[9px] font-mono bg-background border border-border px-1.5 py-0.5 rounded text-muted">
          Ctrl+K
        </kbd>
      </button>
    </div>

    <!-- Lista de canais e DMs -->
    <div class="flex-1 overflow-y-auto px-2 py-3 space-y-6">
      <ChannelList />
      <DmList />
    </div>

    <!-- Perfil do usuário logado -->
    <div class="border-t border-border p-3 flex items-center justify-between bg-surface/40">
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 text-primary flex items-center justify-center text-xs font-semibold">
          {{ authStore.user?.name?.charAt(0).toUpperCase() || 'U' }}
        </div>
        <div class="min-w-0">
          <div class="text-xs font-medium text-foreground truncate">{{ authStore.user?.name }}</div>
          <div class="text-[10px] text-muted truncate">{{ authStore.user?.email }}</div>
        </div>
      </div>

      <button
        @click="handleLogout"
        title="Sair"
        class="text-muted hover:text-destructive p-1 rounded transition-colors text-xs"
      >
        Sair
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { useChatStore } from '../stores/chat.js';
import ChannelList from './ChannelList.vue';
import DmList from './DmList.vue';

defineEmits<{
  (e: 'open-palette'): void;
}>();

const router = useRouter();
const authStore = useAuthStore();
const chatStore = useChatStore();

function handleLogout() {
  authStore.logout();
  router.push('/login');
}
</script>
