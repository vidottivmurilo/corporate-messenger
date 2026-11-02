import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildApp } from '../src/app.js';
import { db } from '../src/db/index.js';
import { authService } from '../src/modules/auth/authService.js';

// Mock do Drizzle DB
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
      users: {
        findFirst: vi.fn(),
        findMany: vi.fn()
      }
    },
    insert: vi.fn(),
    execute: vi.fn()
  },
  pool: {
    end: vi.fn()
  }
}));

describe('US-002 & US-003: Salas, Histórico & DMs', () => {
  let app: ReturnType<typeof buildApp>;
  let validToken: string;
  const currentUserId = '11111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    vi.clearAllMocks();
    app = buildApp();
    validToken = (authService as any).verifyToken ? 'valid-token' : '';
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
        headers: {
          authorization: `Bearer ${validToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.length).toBe(1);
      expect(body[0].name).toBe('geral');
      expect(body[0].isDirect).toBe(false);
    });

    it('deve rejeitar requisição sem token (401)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/rooms'
      });
      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /rooms/dm', () => {
    it('deve criar ou recuperar sala direta (DM)', async () => {
      const targetUserId = '22222222-2222-2222-2222-222222222222';

      (db.query.users.findFirst as any).mockResolvedValue({
        id: targetUserId,
        name: 'Maria Santos'
      });

      // Mock execute (busca sala existente) -> retorna vazio para criar nova
      (db.execute as any).mockResolvedValue({ rows: [] });

      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{
            id: 'dm-room-id',
            name: 'Maria Santos',
            isDirect: true,
            createdAt: new Date()
          }])
        })
      });

      const response = await app.inject({
        method: 'POST',
        url: '/rooms/dm',
        headers: {
          authorization: `Bearer ${validToken}`
        }
      });

      // Erro esperado de validação se targetUserId não for enviado
      expect(response.statusCode).toBe(400);

      // Com payload válido:
      const validResponse = await app.inject({
        method: 'POST',
        url: '/rooms/dm',
        headers: {
          authorization: `Bearer ${validToken}`
        },
        payload: {
          targetUserId
        }
      });

      expect(validResponse.statusCode).toBe(200);
      const body = JSON.parse(validResponse.body);
      expect(body.id).toBe('dm-room-id');
      expect(body.isDirect).toBe(true);
    });

    it('deve proibir criação de DM consigo mesmo (400)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/rooms/dm',
        headers: {
          authorization: `Bearer ${validToken}`
        },
        payload: {
          targetUserId: currentUserId
        }
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('Não é permitido criar DM consigo mesmo');
    });
  });

  describe('GET /messages/:roomId', () => {
    it('deve retornar mensagens paginadas por cursor', async () => {
      (db.query.messages.findMany as any).mockResolvedValue([
        {
          id: 'msg-1',
          roomId: 'room-1',
          senderId: currentUserId,
          text: 'Olá mundo!',
          createdAt: new Date('2026-11-02T12:00:00Z')
        }
      ]);

      (db.query.users.findMany as any).mockResolvedValue([
        {
          id: currentUserId,
          name: 'Usuário Teste'
        }
      ]);

      const response = await app.inject({
        method: 'GET',
        url: '/messages/room-1?limit=50',
        headers: {
          authorization: `Bearer ${validToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.messages.length).toBe(1);
      expect(body.messages[0].text).toBe('Olá mundo!');
      expect(body.messages[0].senderName).toBe('Usuário Teste');
      expect(body.hasMore).toBe(false);
    });
  });
});
