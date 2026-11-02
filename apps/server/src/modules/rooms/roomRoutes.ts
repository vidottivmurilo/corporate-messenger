import { FastifyInstance } from 'fastify';
import { createDmSchema } from '@corp-messenger/shared';
import { roomService } from './roomService.js';
import { authService } from '../auth/authService.js';

export async function roomRoutes(app: FastifyInstance) {
  // Middleware de guarda JWT
  app.addHook('preHandler', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Token não fornecido' });
    }
    const token = authHeader.split(' ')[1];
    try {
      (request as any).user = authService.verifyToken(token);
    } catch {
      return reply.status(401).send({ error: 'Token inválido ou expirado' });
    }
  });

  app.get('/', async (request, reply) => {
    try {
      const rooms = await roomService.listPublicRooms();
      return reply.status(200).send(rooms);
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  app.post('/dm', async (request, reply) => {
    const parseResult = createDmSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Dados inválidos',
        details: parseResult.error.errors.map(e => e.message)
      });
    }

    const currentUserId = (request as any).user.userId;

    try {
      const room = await roomService.getOrCreateDm(currentUserId, parseResult.data.targetUserId);
      return reply.status(200).send(room);
    } catch (err: any) {
      const status = err.statusCode || 500;
      return reply.status(status).send({ error: err.message });
    }
  });
}
