const API_BASE = '/api';

export interface Device {
  deviceId: string;
  userId: string;
  publicKey: string;
  createdAt: string;
}

export interface KeyBundle {
  deviceId: string;
  userId: string;
  identityKey: string;
  signedPreKey: string;
  signature: string;
  oneTimePreKey?: string;
}

export interface Envelope {
  id: string;
  senderId: string;
  senderUserId: string;
  senderPublicKey: string;
  ciphertext: string;
  nonce: string;
  ephemeralKey?: string;
  createdAt: string;
}

class ApiClient {
  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Device endpoints
  async registerDevice(userId: string, publicKey: string): Promise<Device> {
    return this.request('/devices/register', {
      method: 'POST',
      body: JSON.stringify({ userId, publicKey }),
    });
  }

  async getDevices(userId: string): Promise<{ userId: string; devices: Device[] }> {
    return this.request(`/devices?userId=${encodeURIComponent(userId)}`);
  }

  async getDevice(deviceId: string): Promise<Device> {
    return this.request(`/devices/${deviceId}`);
  }

  // Key bundle endpoints
  async publishKeyBundle(data: {
    deviceId: string;
    identityKey: string;
    signedPreKey: string;
    signature: string;
    oneTimePreKeys?: string[];
  }): Promise<{ keyBundleId: string }> {
    return this.request('/keys/publish', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getKeyBundle(deviceId: string): Promise<KeyBundle> {
    return this.request(`/keys/${deviceId}`);
  }

  async getUserKeyBundles(userId: string): Promise<{ userId: string; bundles: KeyBundle[] }> {
    return this.request(`/keys/user/${encodeURIComponent(userId)}`);
  }

  // Message endpoints
  async sendMessage(data: {
    senderId: string;
    recipientId: string;
    ciphertext: string;
    nonce: string;
    ephemeralKey?: string;
  }): Promise<{ envelopeId: string; createdAt: string }> {
    return this.request('/messages/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getInbox(deviceId: string): Promise<{ deviceId: string; count: number; envelopes: Envelope[] }> {
    return this.request(`/messages/inbox/${deviceId}`);
  }

  async ackMessages(envelopeIds: string[]): Promise<{ acknowledged: number }> {
    return this.request('/messages/ack', {
      method: 'POST',
      body: JSON.stringify({ envelopeIds }),
    });
  }
}

export const api = new ApiClient();
