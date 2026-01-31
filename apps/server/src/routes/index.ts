import type { FastifyInstance } from 'fastify';
import { deviceRoutes } from './devices.js';
import { keyRoutes } from './keys.js';
import { messageRoutes } from './messages.js';

export function registerRoutes(app: FastifyInstance) {
  app.register(deviceRoutes, { prefix: '/api/devices' });
  app.register(keyRoutes, { prefix: '/api/keys' });
  app.register(messageRoutes, { prefix: '/api/messages' });
}
