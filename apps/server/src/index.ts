import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { PrismaClient } from '@prisma/client';
import { registerRoutes } from './routes/index.js';
import { setupWebSocket } from './ws/index.js';

const prisma = new PrismaClient();

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  }
});

// CORS
await app.register(cors, {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
});

// WebSocket
await app.register(websocket);

// Prisma'yı context'e ekle
app.decorate('prisma', prisma);

// Routes
registerRoutes(app);

// WebSocket handler
setupWebSocket(app);

// Health check
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Graceful shutdown
const shutdown = async () => {
  app.log.info('Shutting down...');
  await prisma.$disconnect();
  await app.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start server
const port = parseInt(process.env.SERVER_PORT || '8080', 10);
const host = process.env.HOST || '0.0.0.0';

try {
  await app.listen({ port, host });
  app.log.info(`🚀 AKISTEL Server running at http://${host}:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

export { app, prisma };
