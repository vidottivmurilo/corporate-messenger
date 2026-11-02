import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildApp } from '../src/app.js';
import { db } from '../src/db/index.js';
import { authService } from '../src/modules/auth/authService.js';
import { wsManager } from '../src/websocket/wsServer.js';

vi.mock('../src/db/index.js', () => ({
  db: {
    query: {
      rooms: {
        findFirst: vi.fn(),
        findMany: vi.fn()
      },
      roomMembers: {
        findMany: vi.fn()
      },
      messages: {
        findFirst: vi.fn(),
        findMany: vi.fn()
      },
      messageReactions: {
        findFirst: vi.fn(),
        findMany: vi.fn()
      },
      users: {
        findFirst: vi.fn(),
        findMany: vi.fn()
      }
    },
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    execute: vi.fn()
  },
  pool: {
    end: vi.fn()
  }
}));

describe('US-002, US-005, US-006: Salas, Mensagens, Reações e Edição', () => {
  let app: ReturnType<typeof buildApp>;
  let validToken: string;
  const currentUserId = '11111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    vi.clearAllMocks();
    app = buildApp();
    validToken = 'valid-token';
    vi.spyOn(authService, 'verifyToken').mockReturnValue({
      userId: currentUserId,
      name: 'Usuário Teste',
      email: 'teste@empresa.com'
    });
  });

  describe('GET /rooms', () => {
    it('deve listar as salas públicas disponíveis', async () => {
      (db.query.rooms.findFirst as any).mockResolvedValue({
        id: 'geral-room-id',
        name: 'geral',
        isDirect: false,
        createdAt: new Date()
      });

      (db.query.rooms.findMany as any).mockResolvedValue([
        {
          id: 'geral-room-id',
          name: 'geral',
          isDirect: false,
          createdAt: new Date()
        }
      ]);

      const response = await app.inject({
        method: 'GET',
        url: '/rooms',
        headers: { authorization: `Bearer ${validToken}` }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body[0].name).toBe('geral');
    });
  });

  describe('PATCH /messages/:messageId (Edição)', () => {
    it('deve permitir que o autor edite sua mensagem', async () => {
      (db.query.messages.findFirst as any).mockResolvedValue({
        id: 'msg-1',
        senderId: currentUserId,
        roomId: 'room-1',
        text: 'Texto original'
      });

      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{
              id: 'msg-1',
              senderId: currentUserId,
              roomId: 'room-1',
              text: 'Texto atualizado',
              isEdited: true,
              isDeleted: false,
              createdAt: new Date()
            }])
          })
        })
      });

      (db.query.messageReactions.findMany as any).mockResolvedValue([]);

      const response = await app.inject({
        method: 'PATCH',
        url: '/messages/msg-1',
        headers: { authorization: `Bearer ${validToken}` },
        payload: { text: 'Texto atualizado' }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.text).toBe('Texto atualizado');
      expect(body.isEdited).toBe(true);
    });

    it('deve bloquear edição por usuário que não seja o autor (403)', async () => {
      (db.query.messages.findFirst as any).mockResolvedValue({
        id: 'msg-1',
        senderId: 'outro-usuario',
        roomId: 'room-1',
        text: 'Texto original'
      });

      const response = await app.inject({
        method: 'PATCH',
        url: '/messages/msg-1',
        headers: { authorization: `Bearer ${validToken}` },
        payload: { text: 'Tentativa de invasão' }
      });

      expect(response.statusCode).toBe(403);
    });

    it('deve retornar 404 quando a mensagem não existir', async () => {
      (db.query.messages.findFirst as any).mockResolvedValue(null);

      const response = await app.inject({
        method: 'PATCH',
        url: '/messages/msg-inexistente',
        headers: { authorization: `Bearer ${validToken}` },
        payload: { text: 'Texto atualizado' }
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Mensagem não encontrada');
    });
  });

  describe('DELETE /messages/:messageId (Exclusão)', () => {
    it('deve permitir que o autor exclua sua mensagem', async () => {
      (db.query.messages.findFirst as any).mockResolvedValue({
        id: 'msg-1',
        senderId: currentUserId,
        roomId: 'room-1'
      });

      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({})
        })
      });

      const response = await app.inject({
        method: 'DELETE',
        url: '/messages/msg-1',
        headers: { authorization: `Bearer ${validToken}` }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
    });

    it('deve bloquear exclusão por usuário que não seja o autor (403)', async () => {
      (db.query.messages.findFirst as any).mockResolvedValue({
        id: 'msg-1',
        senderId: 'outro-usuario',
        roomId: 'room-1'
      });

      const response = await app.inject({
        method: 'DELETE',
        url: '/messages/msg-1',
        headers: { authorization: `Bearer ${validToken}` }
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Apenas o autor pode excluir esta mensagem');
    });

    it('deve retornar 404 quando a mensagem não existir', async () => {
      (db.query.messages.findFirst as any).mockResolvedValue(null);

      const response = await app.inject({
        method: 'DELETE',
        url: '/messages/msg-inexistente',
        headers: { authorization: `Bearer ${validToken}` }
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Mensagem não encontrada');
    });
  });

  describe('POST /messages/:messageId/reactions', () => {
    it('deve registrar reação com emoji em mensagem e emitir broadcast via WebSocket', async () => {
      const broadcastSpy = vi.spyOn(wsManager, 'broadcastMessageReaction').mockResolvedValue(undefined as any);

      (db.query.messages.findFirst as any).mockResolvedValue({
        id: 'msg-1',
        roomId: 'room-1'
      });
      (db.query.rooms.findFirst as any).mockResolvedValue({
        id: 'room-1',
        name: 'geral',
        isDirect: false
      });
      (db.query.messageReactions.findFirst as any).mockResolvedValue(null);
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockResolvedValue({})
      });
      (db.query.messageReactions.findMany as any).mockResolvedValue([
        { id: 'r-1', messageId: 'msg-1', userId: currentUserId, emoji: '👍' }
      ]);

      const response = await app.inject({
        method: 'POST',
        url: '/messages/msg-1/reactions',
        headers: { authorization: `Bearer ${validToken}` },
        payload: { emoji: '👍' }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.length).toBe(1);
      expect(body[0].emoji).toBe('👍');
      expect(body[0].count).toBe(1);

      expect(broadcastSpy).toHaveBeenCalledWith('msg-1', 'room-1', expect.arrayContaining([
        expect.objectContaining({ emoji: '👍', count: 1 })
      ]));
    });

    it('deve retornar 404 quando a mensagem não existir', async () => {
      (db.query.messages.findFirst as any).mockResolvedValue(null);

      const response = await app.inject({
        method: 'POST',
        url: '/messages/msg-inexistente/reactions',
        headers: { authorization: `Bearer ${validToken}` },
        payload: { emoji: '👍' }
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Mensagem não encontrada');
    });

    it('deve retornar 403 se o usuário não for membro da sala restrita da mensagem', async () => {
      (db.query.messages.findFirst as any).mockResolvedValue({
        id: 'msg-1',
        roomId: 'room-privada'
      });
      (db.query.rooms.findFirst as any).mockResolvedValue(null);
      (db.query.roomMembers.findMany as any).mockResolvedValue([
        { roomId: 'room-privada', userId: 'outro-user' }
      ]);

      const response = await app.inject({
        method: 'POST',
        url: '/messages/msg-1/reactions',
        headers: { authorization: `Bearer ${validToken}` },
        payload: { emoji: '👍' }
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Acesso negado à sala desta mensagem');
    });
  });
});
