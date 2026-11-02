import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import dotenv from 'dotenv';
import { authRoutes } from './modules/auth/authRoutes.js';
import { roomRoutes } from './modules/rooms/roomRoutes.js';
import { messageRoutes } from './modules/messages/messageRoutes.js';
import { wsManager } from './websocket/wsServer.js';
import { initDb } from './db/init.js';

dotenv.config();

export function buildApp() {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test'
  });

  app.register(cors, {
    origin: '*'
  });

  app.register(websocket);

  // Healthcheck
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString()
  }));

  // Rotas da API REST
  app.register(authRoutes, { prefix: '/auth' });
  app.register(roomRoutes, { prefix: '/rooms' });
  app.register(messageRoutes, { prefix: '/messages' });

  // Registro de WebSockets após plugins prontos
  app.register(async (instance) => {
    wsManager.setup(instance);
  });

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  const start = async () => {
    try {
      await initDb();
    } catch (err) {
      console.warn('⚠️ Não foi possível conectar ao PostgreSQL ainda. O servidor continuará tentando nas requisições.');
    }

    const app = buildApp();
    const PORT = Number(process.env.PORT) || 3000;

    app.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      console.log(`🚀 Corporate Messenger Server rodando em ${address}`);
    });
  };

  start();
}
