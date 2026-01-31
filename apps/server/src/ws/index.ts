import type { FastifyInstance } from 'fastify';
import type { WebSocket } from '@fastify/websocket';

// Bağlı cihazların WebSocket bağlantıları
const connections = new Map<string, WebSocket>();

export function setupWebSocket(app: FastifyInstance) {
  app.get('/ws/:deviceId', { websocket: true }, (socket, request) => {
    const deviceId = (request.params as { deviceId: string }).deviceId;
    
    app.log.info({ deviceId }, 'WebSocket connected');
    
    // Bağlantıyı kaydet
    connections.set(deviceId, socket);

    // Ping/pong for keep-alive
    const pingInterval = setInterval(() => {
      if (socket.readyState === 1) {
        socket.ping();
      }
    }, 30000);

    socket.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        app.log.debug({ deviceId, type: data.type }, 'WebSocket message received');
        
        // Heartbeat
        if (data.type === 'ping') {
          socket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        }
      } catch (error) {
        app.log.warn({ deviceId, error }, 'Invalid WebSocket message');
      }
    });

    socket.on('close', () => {
      app.log.info({ deviceId }, 'WebSocket disconnected');
      connections.delete(deviceId);
      clearInterval(pingInterval);
    });

    socket.on('error', (error) => {
      app.log.error({ deviceId, error }, 'WebSocket error');
      connections.delete(deviceId);
      clearInterval(pingInterval);
    });

    // Hoş geldin mesajı
    socket.send(JSON.stringify({
      type: 'connected',
      deviceId,
      timestamp: Date.now()
    }));
  });
}

// Alıcıya bildirim gönder
export function notifyRecipient(deviceId: string, payload: object) {
  const socket = connections.get(deviceId);
  if (socket && socket.readyState === 1) {
    socket.send(JSON.stringify(payload));
    return true;
  }
  return false;
}

// Bağlı cihaz sayısı
export function getConnectionCount(): number {
  return connections.size;
}

// Cihaz bağlı mı?
export function isDeviceOnline(deviceId: string): boolean {
  const socket = connections.get(deviceId);
  return socket !== undefined && socket.readyState === 1;
}
