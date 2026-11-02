import type {
  WsClientMessage,
  WsServerMessage,
  MessageDto,
  OnlineUserDto,
  ReactionDto
} from '@corp-messenger/shared';

type MessageHandler = (message: MessageDto) => void;
type PresenceHandler = (users: OnlineUserDto[]) => void;
type StatusHandler = (status: 'connected' | 'connecting' | 'disconnected') => void;
type TypingHandler = (data: { roomId: string; userId: string; userName: string }) => void;
type MessageUpdateHandler = (message: MessageDto) => void;
type MessageDeleteHandler = (data: { messageId: string; roomId: string }) => void;
type ReactionUpdateHandler = (data: { messageId: string; roomId: string; reactions: ReactionDto[] }) => void;

class WebSocketClient {
  private socket: WebSocket | null = null;
  private token: string | null = null;
  private reconnectTimeout: any = null;
  private reconnectDelay = 1000;
  private messageHandlers: Set<MessageHandler> = new Set();
  private presenceHandlers: Set<PresenceHandler> = new Set();
  private statusHandlers: Set<StatusHandler> = new Set();
  private typingHandlers: Set<TypingHandler> = new Set();
  private messageUpdateHandlers: Set<MessageUpdateHandler> = new Set();
  private messageDeleteHandlers: Set<MessageDeleteHandler> = new Set();
  private reactionUpdateHandlers: Set<ReactionUpdateHandler> = new Set();

  connect(token: string) {
    this.token = token;
    this.cleanup();
    this.notifyStatus('connecting');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      this.send({ type: 'AUTH', token: this.token! });
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WsServerMessage;

        if (data.type === 'AUTH_SUCCESS') {
          this.notifyStatus('connected');
          this.reconnectDelay = 1000;
          return;
        }

        if (data.type === 'ONLINE_USERS') {
          this.presenceHandlers.forEach(h => h(data.users));
          return;
        }

        if (data.type === 'NEW_MESSAGE') {
          this.messageHandlers.forEach(h => h(data.message));
          return;
        }

        if (data.type === 'USER_TYPING') {
          this.typingHandlers.forEach(h => h(data));
          return;
        }

        if (data.type === 'MESSAGE_UPDATED') {
          this.messageUpdateHandlers.forEach(h => h(data.message));
          return;
        }

        if (data.type === 'MESSAGE_DELETED') {
          this.messageDeleteHandlers.forEach(h => h(data));
          return;
        }

        if (data.type === 'MESSAGE_REACTION_UPDATED') {
          this.reactionUpdateHandlers.forEach(h => h(data));
          return;
        }

        if (data.type === 'AUTH_ERROR') {
          console.error('[WS] Erro de autenticação:', data.message);
          this.disconnect();
          return;
        }
      } catch (err) {
        console.error('[WS] Falha ao processar mensagem do servidor:', err);
      }
    };

    this.socket.onclose = () => {
      this.notifyStatus('disconnected');
      this.scheduleReconnect();
    };

    this.socket.onerror = () => {
      this.socket?.close();
    };
  }

  send(msg: WsClientMessage) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(msg));
    }
  }

  sendMessage(roomId: string, text: string) {
    this.send({ type: 'SEND_MESSAGE', roomId, text });
  }

  sendTyping(roomId: string) {
    this.send({ type: 'TYPING', roomId });
  }

  onMessage(handler: MessageHandler) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onPresence(handler: PresenceHandler) {
    this.presenceHandlers.add(handler);
    return () => this.presenceHandlers.delete(handler);
  }

  onStatus(handler: StatusHandler) {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  onTyping(handler: TypingHandler) {
    this.typingHandlers.add(handler);
    return () => this.typingHandlers.delete(handler);
  }

  onMessageUpdated(handler: MessageUpdateHandler) {
    this.messageUpdateHandlers.add(handler);
    return () => this.messageUpdateHandlers.delete(handler);
  }

  onMessageDeleted(handler: MessageDeleteHandler) {
    this.messageDeleteHandlers.add(handler);
    return () => this.messageDeleteHandlers.delete(handler);
  }

  onReactionUpdated(handler: ReactionUpdateHandler) {
    this.reactionUpdateHandlers.add(handler);
    return () => this.reactionUpdateHandlers.delete(handler);
  }

  private notifyStatus(status: 'connected' | 'connecting' | 'disconnected') {
    this.statusHandlers.forEach(h => h(status));
  }

  private scheduleReconnect() {
    if (!this.token) return;
    clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.connect(this.token!);
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 15000);
    }, this.reconnectDelay);
  }

  disconnect() {
    this.token = null;
    this.cleanup();
    this.notifyStatus('disconnected');
  }

  private cleanup() {
    clearTimeout(this.reconnectTimeout);
    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onclose = null;
      this.socket.onerror = null;
      this.socket.close();
      this.socket = null;
    }
  }
}

export const wsClient = new WebSocketClient();
