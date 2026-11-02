import { FastifyInstance } from 'fastify';
import { messageService } from './messageService.js';
import { authService } from '../auth/authService.js';

export async function messageRoutes(app: FastifyInstance) {
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

  app.get('/:roomId', async (request, reply) => {
    const { roomId } = request.params as { roomId: string };
    const { beforeMessageId, limit } = request.query as { beforeMessageId?: string; limit?: string };

    const parsedLimit = limit ? parseInt(limit, 10) : 50;

    try {
      const history = await messageService.getMessages(roomId, beforeMessageId, parsedLimit);
      return reply.status(200).send(history);
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });
}
