import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/db.js';

const RegisterDeviceSchema = z.object({
  userId: z.string().min(1).max(64),
  publicKey: z.string().min(32).max(128), // Base64 encoded Ed25519 public key
});

const DeviceQuerySchema = z.object({
  userId: z.string().min(1).max(64),
});

export async function deviceRoutes(app: FastifyInstance) {
  // Cihaz kaydı
  app.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = RegisterDeviceSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid request', details: body.error.issues });
    }

    const { userId, publicKey } = body.data;

    try {
      // Aynı cihaz varsa güncelle, yoksa oluştur
      const device = await prisma.device.upsert({
        where: {
          userId_publicKey: { userId, publicKey }
        },
        update: {
          lastSeenAt: new Date()
        },
        create: {
          userId,
          publicKey
        }
      });

      app.log.info({ deviceId: device.id, userId }, 'Device registered');
      
      return reply.status(201).send({
        deviceId: device.id,
        userId: device.userId,
        publicKey: device.publicKey,
        createdAt: device.createdAt
      });
    } catch (error) {
      app.log.error(error, 'Failed to register device');
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Kullanıcının cihazlarını listele
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = DeviceQuerySchema.safeParse(request.query);
    if (!query.success) {
      return reply.status(400).send({ error: 'Invalid query', details: query.error.issues });
    }

    const { userId } = query.data;

    try {
      const devices = await prisma.device.findMany({
        where: { userId },
        select: {
          id: true,
          publicKey: true,
          lastSeenAt: true,
          keyBundle: {
            select: { id: true }
          }
        }
      });

      return reply.send({
        userId,
        devices: devices.map(d => ({
          deviceId: d.id,
          publicKey: d.publicKey,
          lastSeenAt: d.lastSeenAt,
          hasKeyBundle: !!d.keyBundle
        }))
      });
    } catch (error) {
      app.log.error(error, 'Failed to list devices');
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Tek cihaz bilgisi
  app.get('/:deviceId', async (request: FastifyRequest<{ Params: { deviceId: string } }>, reply: FastifyReply) => {
    const { deviceId } = request.params;

    try {
      const device = await prisma.device.findUnique({
        where: { id: deviceId },
        select: {
          id: true,
          userId: true,
          publicKey: true,
          lastSeenAt: true
        }
      });

      if (!device) {
        return reply.status(404).send({ error: 'Device not found' });
      }

      return reply.send(device);
    } catch (error) {
      app.log.error(error, 'Failed to get device');
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
