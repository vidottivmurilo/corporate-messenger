import { FastifyInstance } from 'fastify';
import { registerSchema, loginSchema } from '@corp-messenger/shared';
import { authService } from './authService.js';

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const parseResult = registerSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Dados inválidos',
        details: parseResult.error.errors.map(e => e.message)
      });
    }

    try {
      const user = await authService.register(parseResult.data);
      return reply.status(201).send(user);
    } catch (err: any) {
      console.error('[AUTH REGISTER ERROR]', err);
      const status = err.statusCode || 500;
      return reply.status(status).send({ error: err.message });
    }
  });

  app.post('/login', async (request, reply) => {
    const parseResult = loginSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Dados inválidos',
        details: parseResult.error.errors.map(e => e.message)
      });
    }

    try {
      const result = await authService.login(parseResult.data);
      return reply.status(200).send(result);
    } catch (err: any) {
      const status = err.statusCode || 500;
      return reply.status(status).send({ error: err.message });
    }
  });
}
