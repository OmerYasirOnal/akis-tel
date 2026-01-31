import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/db.js';

const PublishKeyBundleSchema = z.object({
  deviceId: z.string().min(1),
  identityKey: z.string().min(32).max(128),
  signedPreKey: z.string().min(32).max(128),
  signature: z.string().min(64).max(256),
  oneTimePreKeys: z.array(z.string().min(32).max(128)).max(100).default([])
});

export async function keyRoutes(app: FastifyInstance) {
  // Key bundle yayınla (X3DH için)
  app.post('/publish', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = PublishKeyBundleSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid request', details: body.error.issues });
    }

    const { deviceId, identityKey, signedPreKey, signature, oneTimePreKeys } = body.data;

    try {
      // Cihazın varlığını kontrol et
      const device = await prisma.device.findUnique({ where: { id: deviceId } });
      if (!device) {
        return reply.status(404).send({ error: 'Device not found' });
      }

      // Key bundle'ı upsert
      const keyBundle = await prisma.keyBundle.upsert({
        where: { deviceId },
        update: {
          identityKey,
          signedPreKey,
          signature,
          oneTimePreKeys
        },
        create: {
          deviceId,
          identityKey,
          signedPreKey,
          signature,
          oneTimePreKeys
        }
      });

      app.log.info({ deviceId, keyBundleId: keyBundle.id }, 'Key bundle published');

      return reply.status(201).send({
        keyBundleId: keyBundle.id,
        deviceId: keyBundle.deviceId,
        updatedAt: keyBundle.updatedAt
      });
    } catch (error) {
      app.log.error(error, 'Failed to publish key bundle');
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Key bundle al (başka bir kullanıcıyla şifreli iletişim başlatmak için)
  app.get('/:deviceId', async (request: FastifyRequest<{ Params: { deviceId: string } }>, reply: FastifyReply) => {
    const { deviceId } = request.params;

    try {
      const keyBundle = await prisma.keyBundle.findUnique({
        where: { deviceId },
        include: {
          device: {
            select: { userId: true, publicKey: true }
          }
        }
      });

      if (!keyBundle) {
        return reply.status(404).send({ error: 'Key bundle not found' });
      }

      // One-time pre-key varsa birini tüket
      let oneTimePreKey: string | null = null;
      if (keyBundle.oneTimePreKeys.length > 0) {
        oneTimePreKey = keyBundle.oneTimePreKeys[0];
        
        // Tüketilen key'i kaldır
        await prisma.keyBundle.update({
          where: { deviceId },
          data: {
            oneTimePreKeys: keyBundle.oneTimePreKeys.slice(1)
          }
        });
      }

      return reply.send({
        deviceId: keyBundle.deviceId,
        userId: keyBundle.device.userId,
        identityKey: keyBundle.identityKey,
        signedPreKey: keyBundle.signedPreKey,
        signature: keyBundle.signature,
        oneTimePreKey // Tek kullanımlık, null olabilir
      });
    } catch (error) {
      app.log.error(error, 'Failed to get key bundle');
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Kullanıcının tüm cihazlarının key bundle'larını al
  app.get('/user/:userId', async (request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
    const { userId } = request.params;

    try {
      const devices = await prisma.device.findMany({
        where: { userId },
        include: {
          keyBundle: {
            select: {
              identityKey: true,
              signedPreKey: true,
              signature: true
            }
          }
        }
      });

      const bundles = devices
        .filter(d => d.keyBundle)
        .map(d => ({
          deviceId: d.id,
          publicKey: d.publicKey,
          identityKey: d.keyBundle!.identityKey,
          signedPreKey: d.keyBundle!.signedPreKey,
          signature: d.keyBundle!.signature
        }));

      return reply.send({ userId, bundles });
    } catch (error) {
      app.log.error(error, 'Failed to get user key bundles');
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
