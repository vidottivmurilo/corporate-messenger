import { FastifyInstance } from 'fastify';
import { updateMessageSchema, toggleReactionSchema } from '@corp-messenger/shared';
import { messageService } from './messageService.js';
import { authService } from '../auth/authService.js';
import { wsManager } from '../../websocket/wsServer.js';

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

  app.patch('/:messageId', async (request, reply) => {
    const { messageId } = request.params as { messageId: string };
    const parseResult = updateMessageSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Dados inválidos',
        details: parseResult.error.errors.map(e => e.message)
      });
    }

    const currentUserId = (request as any).user.userId;

    try {
      const updated = await messageService.updateMessage(messageId, currentUserId, parseResult.data.text);
      // Notifica via WebSocket
      wsManager.broadcastMessageUpdate(updated);
      return reply.status(200).send(updated);
    } catch (err: any) {
      const status = err.statusCode || 500;
      return reply.status(status).send({ error: err.message });
    }
  });

  app.delete('/:messageId', async (request, reply) => {
    const { messageId } = request.params as { messageId: string };
    const currentUserId = (request as any).user.userId;

    try {
      const { roomId } = await messageService.deleteMessage(messageId, currentUserId);
      // Notifica via WebSocket
      wsManager.broadcastMessageDelete(messageId, roomId);
      return reply.status(200).send({ success: true });
    } catch (err: any) {
      const status = err.statusCode || 500;
      return reply.status(status).send({ error: err.message });
    }
  });

  app.post('/:messageId/reactions', async (request, reply) => {
    const { messageId } = request.params as { messageId: string };
    const parseResult = toggleReactionSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Emoji inválido' });
    }

    const currentUserId = (request as any).user.userId;

    try {
      const reactions = await messageService.toggleReaction(messageId, currentUserId, parseResult.data.emoji);
      return reply.status(200).send(reactions);
    } catch (err: any) {
      const status = err.statusCode || 500;
      return reply.status(status).send({ error: err.message });
    }
  });
}
