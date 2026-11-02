import { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';
import { authService, JwtPayload } from '../modules/auth/authService.js';
import { messageService } from '../modules/messages/messageService.js';
import { roomService } from '../modules/rooms/roomService.js';
import type { WsClientMessage, WsServerMessage, OnlineUserDto } from '@corp-messenger/shared';

interface AuthenticatedSocket extends WebSocket {
  user?: JwtPayload;
  isAlive?: boolean;
}

export class WebSocketManager {
  private clients = new Map<string, AuthenticatedSocket>();
  private heartbeatInterval: any = null;

  setup(app: FastifyInstance) {
    // Inicia rotina de heartbeat a cada 30 segundos
    if (!this.heartbeatInterval) {
      this.heartbeatInterval = setInterval(() => {
        this.clients.forEach((ws, userId) => {
          if (ws.isAlive === false) {
            console.log(`[WS] Encerrando conexão inativa de ${userId}`);
            ws.terminate();
            this.clients.delete(userId);
            this.broadcastOnlineUsers();
            return;
          }
          ws.isAlive = false;
          ws.ping();
        });
      }, 30000);
    }

    app.get('/ws', { websocket: true }, (connection, _req) => {
      const socket = ((connection as any).socket || connection) as AuthenticatedSocket;
      socket.isAlive = true;

      // Inicia timer de 3 segundos para handshake obrigatório
      const authTimeout = setTimeout(() => {
        if (!socket.user) {
          socket.send(JSON.stringify({
            type: 'AUTH_ERROR',
            message: 'Handshake timeout: token não recebido em 3 segundos'
          } as WsServerMessage));
          socket.close(4001, 'Auth timeout');
        }
      }, 3000);

      socket.on('message', async (raw: Buffer | string) => {
        try {
          const payload = JSON.parse(raw.toString()) as WsClientMessage;

          if (payload.type === 'AUTH') {
            try {
              const user = authService.verifyToken(payload.token);
              clearTimeout(authTimeout);
              socket.user = user;
              this.clients.set(user.userId, socket);

              socket.send(JSON.stringify({
                type: 'AUTH_SUCCESS',
                userId: user.userId,
                name: user.name
              } as WsServerMessage));

              this.broadcastOnlineUsers();
            } catch {
              socket.send(JSON.stringify({
                type: 'AUTH_ERROR',
                message: 'Token inválido ou expirado'
              } as WsServerMessage));
              socket.close(4001, 'Invalid token');
            }
            return;
          }

          if (payload.type === 'PING') {
            socket.send(JSON.stringify({ type: 'PONG' } as WsServerMessage));
            return;
          }

          // Se a mensagem não for AUTH e o socket ainda não estiver autenticado:
          if (!socket.user) {
            socket.send(JSON.stringify({
              type: 'AUTH_ERROR',
              message: 'Não autenticado'
            } as WsServerMessage));
            socket.close(4001, 'Unauthorized');
            return;
          }

          // Trata envio de mensagem em tempo real
          if (payload.type === 'SEND_MESSAGE') {
            const { roomId, text } = payload;
            if (!text || !text.trim()) return;

            // 1. Persiste a mensagem no banco
            const savedMessage = await messageService.saveMessage(roomId, socket.user.userId, text);

            // 2. Busca membros da sala (ou lista vazia se for pública)
            const allowedMemberIds = await roomService.getRoomMembers(roomId);

            const outboundMessage = JSON.stringify({
              type: 'NEW_MESSAGE',
              message: savedMessage
            } as WsServerMessage);

            // 3. Broadcast
            if (allowedMemberIds.length === 0) {
              // Sala pública: envia para todos conectados
              this.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(outboundMessage);
                }
              });
            } else {
              // DM privada: envia apenas para os membros da sala
              allowedMemberIds.forEach(memberId => {
                const targetSocket = this.clients.get(memberId);
                if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
                  targetSocket.send(outboundMessage);
                }
              });
            }
          }
        } catch (err) {
          console.error('[WS] Erro ao processar payload:', err);
        }
      });

      socket.on('close', () => {
        clearTimeout(authTimeout);
        if (socket.user) {
          this.clients.delete(socket.user.userId);
          this.broadcastOnlineUsers();
        }
      });

      socket.on('pong', () => {
        socket.isAlive = true;
      });
    });
  }

  broadcastOnlineUsers() {
    const users: OnlineUserDto[] = Array.from(this.clients.values())
      .filter(s => s.user)
      .map(s => ({
        userId: s.user!.userId,
        name: s.user!.name
      }));

    const message = JSON.stringify({
      type: 'ONLINE_USERS',
      users
    } as WsServerMessage);

    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  getOnlineUsers(): OnlineUserDto[] {
    return Array.from(this.clients.values())
      .filter(s => s.user)
      .map(s => ({
        userId: s.user!.userId,
        name: s.user!.name
      }));
  }

  getSocket(userId: string): AuthenticatedSocket | undefined {
    return this.clients.get(userId);
  }
}

export const wsManager = new WebSocketManager();
