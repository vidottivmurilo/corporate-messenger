<template>
  <div class="fixed bottom-5 right-5 z-50 font-sans select-none">
    <!-- Janela de Chat Expansível -->
    <div
      v-if="isOpen"
      class="w-96 h-[500px] bg-[#090D16] border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden text-foreground animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <!-- Cabeçalho do Widget -->
      <header class="h-12 bg-surface px-4 flex items-center justify-between border-b border-white/10">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full" :class="isConnected ? 'bg-success' : 'bg-amber-400 animate-pulse'"></div>
          <span class="text-xs font-semibold">Corporate Messenger</span>
        </div>
        <button
          @click="isOpen = false"
          class="text-muted hover:text-foreground text-xs p-1 rounded transition-colors"
        >
          ✕
        </button>
      </header>

      <!-- Lista de Mensagens do Widget -->
      <div ref="msgContainerRef" class="flex-1 overflow-y-auto p-4 space-y-2 text-xs">
        <div v-if="messages.length === 0" class="h-full flex items-center justify-center text-muted/60 text-center">
          Início da conversa no canal corporativo.
        </div>
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="flex flex-col"
        >
          <div class="flex items-baseline gap-1.5 text-[10px] text-muted">
            <span class="font-semibold text-foreground">{{ msg.senderName }}</span>
            <span>{{ formatTime(msg.createdAt) }}</span>
          </div>
          <div class="text-xs text-foreground/90 mt-0.5">
            {{ msg.text }}
          </div>
        </div>
      </div>

      <!-- Composer do Widget -->
      <footer class="p-3 border-t border-white/10 bg-surface/50">
        <form @submit.prevent="handleSend" class="flex items-center gap-2">
          <input
            v-model="inputText"
            type="text"
            placeholder="Digite sua mensagem..."
            class="flex-1 px-3 py-1.5 bg-background border border-white/10 rounded-md text-xs text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            :disabled="!inputText.trim()"
            class="px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            Enviar
          </button>
        </form>
      </footer>
    </div>

    <!-- Botão Flutuante (Launcher) -->
    <button
      v-else
      @click="isOpen = true"
      class="w-12 h-12 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
      title="Abrir Chat Corporativo"
    >
      💬
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import type { MessageDto, WsServerMessage } from '@corp-messenger/shared';

const props = defineProps<{
  apiUrl?: string;
  token?: string;
  roomId?: string;
}>();

const isOpen = ref(false);
const isConnected = ref(false);
const inputText = ref('');
const messages = ref<MessageDto[]>([]);
const msgContainerRef = ref<HTMLElement | null>(null);
let socket: WebSocket | null = null;

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function connectWs() {
  if (!props.token) return;
  const wsHost = props.apiUrl ? props.apiUrl.replace(/^http/, 'ws') : 'ws://localhost:3000';
  socket = new WebSocket(`${wsHost}/ws`);

  socket.onopen = () => {
    socket?.send(JSON.stringify({ type: 'AUTH', token: props.token }));
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as WsServerMessage;
      if (data.type === 'AUTH_SUCCESS') {
        isConnected.value = true;
      }
      if (data.type === 'NEW_MESSAGE') {
        messages.value.push(data.message);
        nextTick(() => {
          if (msgContainerRef.value) {
            msgContainerRef.value.scrollTop = msgContainerRef.value.scrollHeight;
          }
        });
      }
    } catch (err) {
      console.error('[Widget] Erro ao parsear mensagem:', err);
    }
  };

  socket.onclose = () => {
    isConnected.value = false;
  };
}

function handleSend() {
  if (!inputText.value.trim() || !socket || socket.readyState !== WebSocket.OPEN) return;
  const targetRoom = props.roomId || 'default-room';

  socket.send(JSON.stringify({
    type: 'SEND_MESSAGE',
    roomId: targetRoom,
    text: inputText.value.trim()
  }));

  inputText.value = '';
}

onMounted(() => {
  connectWs();
});

onUnmounted(() => {
  socket?.close();
});
</script>
