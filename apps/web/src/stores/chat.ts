import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '../services/api.js';
import { wsClient } from '../services/websocket.js';
import { notifyMessage, requestNotificationPermission } from '../utils/notifications.js';
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

  // v2: Unread badges e Notificações
  const unreadCounts = ref<Record<string, number>>({});
  // v2: Indicador de digitação
  const typingMap = ref<Record<string, { userId: string; userName: string; timer: any }[]>>({});

  // Pede permissão de notificação nativa ao inicializar o store
  requestNotificationPermission();

  const totalUnreads = computed(() => {
    return Object.values(unreadCounts.value).reduce((acc, count) => acc + count, 0);
  });

  function updateDocumentTitle() {
    const total = totalUnreads.value;
    document.title = (total > 0 ? `(${total}) ` : '') + 'Corporate Messenger';
  }

  // WebSocket Listeners
  wsClient.onStatus((status) => {
    connectionStatus.value = status;
  });

  wsClient.onPresence((users) => {
    onlineUsers.value = users;
  });

  wsClient.onMessage((newMsg) => {
    const isCurrentRoom = activeRoom.value && newMsg.roomId === activeRoom.value.id;

    if (isCurrentRoom) {
      if (!messages.value.some(m => m.id === newMsg.id)) {
        messages.value.push(newMsg);
      }
    } else {
      // Incrementa badge de não lidas se estiver em outra sala
      unreadCounts.value[newMsg.roomId] = (unreadCounts.value[newMsg.roomId] || 0) + 1;
      updateDocumentTitle();
    }

    // Dispara som e notificação desktop caso esteja em segundo plano ou em outra sala
    notifyMessage(
      `Nova mensagem de ${newMsg.senderName}`,
      newMsg.text,
      () => {
        const targetRoom = rooms.value.find(r => r.id === newMsg.roomId);
        if (targetRoom) selectRoom(targetRoom);
      }
    );
  });

  wsClient.onTyping((data) => {
    const currentList = typingMap.value[data.roomId] || [];
    // Limpa timer anterior se houver
    const existing = currentList.find(t => t.userId === data.userId);
    if (existing) {
      clearTimeout(existing.timer);
    }

    const timer = setTimeout(() => {
      typingMap.value[data.roomId] = (typingMap.value[data.roomId] || []).filter(t => t.userId !== data.userId);
    }, 3000);

    const filtered = currentList.filter(t => t.userId !== data.userId);
    filtered.push({ userId: data.userId, userName: data.userName, timer });
    typingMap.value[data.roomId] = filtered;
  });

  wsClient.onMessageUpdated((updatedMsg) => {
    const idx = messages.value.findIndex(m => m.id === updatedMsg.id);
    if (idx !== -1) {
      messages.value[idx] = updatedMsg;
    }
  });

  wsClient.onMessageDeleted(({ messageId }) => {
    const target = messages.value.find(m => m.id === messageId);
    if (target) {
      target.isDeleted = true;
      target.text = 'Esta mensagem foi apagada';
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

    // Zera badge de não lidas da sala
    if (unreadCounts.value[room.id]) {
      unreadCounts.value[room.id] = 0;
      updateDocumentTitle();
    }

    try {
      const history = await api.getMessages(room.id);
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

  function emitTyping() {
    if (!activeRoom.value) return;
    wsClient.sendTyping(activeRoom.value.id);
  }

  async function editMessage(messageId: string, newText: string) {
    try {
      const updated = await api.updateMessage(messageId, newText);
      const idx = messages.value.findIndex(m => m.id === messageId);
      if (idx !== -1) {
        messages.value[idx] = updated;
      }
    } catch (err) {
      console.error('Erro ao editar mensagem:', err);
    }
  }

  async function removeMessage(messageId: string) {
    try {
      await api.deleteMessage(messageId);
      const target = messages.value.find(m => m.id === messageId);
      if (target) {
        target.isDeleted = true;
        target.text = 'Esta mensagem foi apagada';
      }
    } catch (err) {
      console.error('Erro ao excluir mensagem:', err);
    }
  }

  async function reactToMessage(messageId: string, emoji: string) {
    try {
      const reactions = await api.toggleReaction(messageId, emoji);
      const target = messages.value.find(m => m.id === messageId);
      if (target) {
        target.reactions = reactions;
      }
    } catch (err) {
      console.error('Erro ao reagir à mensagem:', err);
    }
  }

  return {
    rooms,
    activeRoom,
    messages,
    onlineUsers,
    connectionStatus,
    isLoadingMessages,
    hasMore,
    unreadCounts,
    typingMap,
    loadRooms,
    selectRoom,
    loadMoreMessages,
    openDm,
    sendMessage,
    emitTyping,
    editMessage,
    removeMessage,
    reactToMessage
  };
});
