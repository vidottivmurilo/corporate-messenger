import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '../services/api.js';
import { wsClient } from '../services/websocket.js';
import type { RoomDto, MessageDto, OnlineUserDto } from '@corp-messenger/shared';

export const useChatStore = defineStore('chat', () => {
  const rooms = ref<RoomDto[]>([]);
  const activeRoom = ref<RoomDto | null>(null);
  const messages = ref<MessageDto[]>([]);
  const onlineUsers = ref<OnlineUserDto[]>([]);
  const connectionStatus = ref<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const isLoadingMessages = ref(false);
  const nextCursor = ref<string | null>(null);
  const hasMore = ref(false);

  // Escuta status e presença do WebSocket
  wsClient.onStatus((status) => {
    connectionStatus.value = status;
  });

  wsClient.onPresence((users) => {
    onlineUsers.value = users;
  });

  wsClient.onMessage((newMsg) => {
    if (activeRoom.value && newMsg.roomId === activeRoom.value.id) {
      // Adiciona mensagem se ainda não existir
      if (!messages.value.some(m => m.id === newMsg.id)) {
        messages.value.push(newMsg);
      }
    }
  });

  async function loadRooms() {
    try {
      const data = await api.listRooms();
      rooms.value = data;
      if (!activeRoom.value && data.length > 0) {
        selectRoom(data[0]);
      }
    } catch (err) {
      console.error('Erro ao carregar salas:', err);
    }
  }

  async function selectRoom(room: RoomDto) {
    activeRoom.value = room;
    messages.value = [];
    nextCursor.value = null;
    isLoadingMessages.value = true;

    try {
      const history = await api.getMessages(room.id);
      // As mensagens da API vêm do mais recente para o mais antigo; invertemos para o chat
      messages.value = [...history.messages].reverse();
      hasMore.value = history.hasMore;
      nextCursor.value = history.nextCursor || null;
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
    } finally {
      isLoadingMessages.value = false;
    }
  }

  async function loadMoreMessages() {
    if (!activeRoom.value || !hasMore.value || isLoadingMessages.value || !nextCursor.value) return;

    try {
      const history = await api.getMessages(activeRoom.value.id, nextCursor.value);
      const older = [...history.messages].reverse();
      messages.value = [...older, ...messages.value];
      hasMore.value = history.hasMore;
      nextCursor.value = history.nextCursor || null;
    } catch (err) {
      console.error('Erro ao paginar mensagens:', err);
    }
  }

  async function openDm(targetUserId: string) {
    try {
      const dmRoom = await api.getOrCreateDm(targetUserId);
      if (!rooms.value.some(r => r.id === dmRoom.id)) {
        rooms.value.push(dmRoom);
      }
      await selectRoom(dmRoom);
    } catch (err) {
      console.error('Erro ao abrir DM:', err);
    }
  }

  function sendMessage(text: string) {
    if (!activeRoom.value || !text.trim()) return;
    wsClient.sendMessage(activeRoom.value.id, text.trim());
  }

  return {
    rooms,
    activeRoom,
    messages,
    onlineUsers,
    connectionStatus,
    isLoadingMessages,
    hasMore,
    loadRooms,
    selectRoom,
    loadMoreMessages,
    openDm,
    sendMessage
  };
});
