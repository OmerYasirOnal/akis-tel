import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/db.js';
import { notifyRecipient } from '../ws/index.js';

const SendMessageSchema = z.object({
  senderId: z.string().min(1),
  recipientId: z.string().min(1),
  ciphertext: z.string().min(1), // Base64 encoded encrypted message
  nonce: z.string().min(1),      // Base64 encoded nonce
  ephemeralKey: z.string().optional() // İlk mesajda ephemeral public key
});

const AckMessageSchema = z.object({
  envelopeIds: z.array(z.string().min(1)).min(1).max(100)
});

export async function messageRoutes(app: FastifyInstance) {
  // Şifreli mesaj gönder
  app.post('/send', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = SendMessageSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid request', details: body.error.issues });
    }

    const { senderId, recipientId, ciphertext, nonce, ephemeralKey } = body.data;

    try {
      // Gönderen ve alıcı cihazları kontrol et
      const [sender, recipient] = await Promise.all([
        prisma.device.findUnique({ where: { id: senderId } }),
        prisma.device.findUnique({ where: { id: recipientId } })
      ]);

      if (!sender) {
        return reply.status(404).send({ error: 'Sender device not found' });
      }
      if (!recipient) {
        return reply.status(404).send({ error: 'Recipient device not found' });
      }

      // Şifreli zarfı kaydet
      const envelope = await prisma.envelope.create({
        data: {
          senderId,
          recipientId,
          ciphertext,
          nonce,
          ephemeralKey
        }
      });

      app.log.info({ envelopeId: envelope.id, senderId, recipientId }, 'Message envelope stored');

      // WebSocket ile alıcıya bildirim gönder
      notifyRecipient(recipientId, {
        type: 'new_message',
        envelopeId: envelope.id,
        senderId,
        timestamp: envelope.createdAt.toISOString()
      });

      return reply.status(201).send({
        envelopeId: envelope.id,
        createdAt: envelope.createdAt
      });
    } catch (error) {
      app.log.error(error, 'Failed to send message');
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Inbox'taki mesajları al
  app.get('/inbox/:deviceId', async (request: FastifyRequest<{ Params: { deviceId: string } }>, reply: FastifyReply) => {
    const { deviceId } = request.params;

    try {
      // Teslim edilmemiş mesajları al
      const envelopes = await prisma.envelope.findMany({
        where: {
          recipientId: deviceId,
          deliveredAt: null
        },
        orderBy: { createdAt: 'asc' },
        take: 100, // Max 100 mesaj
        select: {
          id: true,
          senderId: true,
          ciphertext: true,
          nonce: true,
          ephemeralKey: true,
          createdAt: true,
          sender: {
            select: { userId: true, publicKey: true }
          }
        }
      });

      return reply.send({
        deviceId,
        count: envelopes.length,
        envelopes: envelopes.map(e => ({
          id: e.id,
          senderId: e.senderId,
          senderUserId: e.sender.userId,
          senderPublicKey: e.sender.publicKey,
          ciphertext: e.ciphertext,
          nonce: e.nonce,
          ephemeralKey: e.ephemeralKey,
          createdAt: e.createdAt
        }))
      });
    } catch (error) {
      app.log.error(error, 'Failed to get inbox');
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Mesaj teslim onayı (ACK)
  app.post('/ack', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = AckMessageSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid request', details: body.error.issues });
    }

    const { envelopeIds } = body.data;

    try {
      const result = await prisma.envelope.updateMany({
        where: {
          id: { in: envelopeIds },
          deliveredAt: null
        },
        data: {
          deliveredAt: new Date()
        }
      });

      app.log.info({ count: result.count }, 'Messages acknowledged');

      return reply.send({
        acknowledged: result.count
      });
    } catch (error) {
      app.log.error(error, 'Failed to acknowledge messages');
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Eski mesajları temizle (cron job için)
  app.delete('/cleanup', async (request: FastifyRequest, reply: FastifyReply) => {
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 gün
    const cutoff = new Date(Date.now() - maxAge);

    try {
      const result = await prisma.envelope.deleteMany({
        where: {
          OR: [
            { deliveredAt: { lt: cutoff } },
            { createdAt: { lt: cutoff }, deliveredAt: null }
          ]
        }
      });

      app.log.info({ deleted: result.count }, 'Old messages cleaned up');

      return reply.send({ deleted: result.count });
    } catch (error) {
      app.log.error(error, 'Failed to cleanup messages');
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
