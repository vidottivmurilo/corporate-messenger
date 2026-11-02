import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useChatStore } from '../src/stores/chat.js';
import { api } from '../src/services/api.js';

// Mock de DOM document.title e Notification
if (typeof document === 'undefined') {
  (globalThis as any).document = { title: 'Corporate Messenger' };
}

vi.mock('../src/services/websocket.js', () => ({
  wsClient: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    onStatus: vi.fn(),
    onPresence: vi.fn(),
    onMessage: vi.fn(),
    onTyping: vi.fn(),
    onMessageUpdated: vi.fn(),
    onMessageDeleted: vi.fn(),
    sendMessage: vi.fn(),
    sendTyping: vi.fn()
  }
}));

vi.mock('../src/utils/notifications.js', () => ({
  notifyMessage: vi.fn(),
  requestNotificationPermission: vi.fn(),
  playNotificationSound: vi.fn()
}));

describe('Frontend ChatStore v2 (Notificações, Badges e Reações)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('deve inicializar com listas vazias e sem não-lidas', () => {
    const chatStore = useChatStore();
    expect(chatStore.rooms).toEqual([]);
    expect(chatStore.activeRoom).toBeNull();
    expect(chatStore.messages).toEqual([]);
    expect(chatStore.unreadCounts).toEqual({});
  });

  it('deve zerar badge de não lidas ao selecionar a sala', async () => {
    const chatStore = useChatStore();
    chatStore.unreadCounts['room-1'] = 5;

    vi.spyOn(api, 'getMessages').mockResolvedValue({
      messages: [],
      hasMore: false
    });

    await chatStore.selectRoom({
      id: 'room-1',
      name: 'geral',
      isDirect: false,
      createdAt: '2026-11-02T10:00:00Z'
    });

    expect(chatStore.unreadCounts['room-1']).toBe(0);
    expect(chatStore.activeRoom?.id).toBe('room-1');
  });

  it('deve marcar mensagem como apagada quando removeMessage for acionado', async () => {
    const chatStore = useChatStore();
    chatStore.messages = [
      {
        id: 'msg-1',
        roomId: 'room-1',
        senderId: 'user-1',
        senderName: 'Murilo',
        text: 'Mensagem para apagar',
        createdAt: '2026-11-02T10:00:00Z'
      }
    ];

    vi.spyOn(api, 'deleteMessage').mockResolvedValue({ message: 'Mensagem apagada com sucesso' });

    await chatStore.removeMessage('msg-1');

    expect(chatStore.messages[0].isDeleted).toBe(true);
    expect(chatStore.messages[0].text).toBe('Esta mensagem foi apagada');
  });

  it('deve atualizar reações da mensagem via reactToMessage', async () => {
    const chatStore = useChatStore();
    chatStore.messages = [
      {
        id: 'msg-1',
        roomId: 'room-1',
        senderId: 'user-1',
        senderName: 'Murilo',
        text: 'Mensagem bacana',
        createdAt: '2026-11-02T10:00:00Z',
        reactions: []
      }
    ];

    const mockReactions = [
      { emoji: '🚀', count: 1, users: ['user-2'] }
    ];

    vi.spyOn(api, 'toggleReaction').mockResolvedValue(mockReactions);

    await chatStore.reactToMessage('msg-1', '🚀');

    expect(chatStore.messages[0].reactions).toEqual(mockReactions);
  });
});

