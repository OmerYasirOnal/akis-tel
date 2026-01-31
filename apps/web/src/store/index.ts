import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, type Device, type Envelope } from '../lib/api';
import { wsClient } from '../lib/websocket';
import { 
  generateKeyPair, 
  generateSigningKeyPair, 
  encryptMessage, 
  decryptMessage,
  signMessage,
  type KeyPair 
} from '../lib/crypto';

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  isOutgoing: boolean;
}

export interface Chat {
  odildi: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

interface StoreState {
  // Auth state
  device: Device | null;
  userId: string | null;
  keyPair: KeyPair | null;
  signingKeyPair: KeyPair | null;
  initialized: boolean;

  // Chat state
  chats: Map<string, Chat>;
  messages: Map<string, Message[]>;
  contacts: Map<string, { name: string; publicKey: string; deviceId: string }>;

  // Actions
  initialize: () => Promise<void>;
  register: (userId: string, displayName: string) => Promise<void>;
  logout: () => void;
  
  // Messaging
  sendMessage: (recipientUserId: string, content: string) => Promise<void>;
  fetchInbox: () => Promise<void>;
  addContact: (userId: string, name: string) => Promise<void>;
  
  // Internal
  addMessage: (userId: string, message: Message) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      device: null,
      userId: null,
      keyPair: null,
      signingKeyPair: null,
      initialized: false,
      chats: new Map(),
      messages: new Map(),
      contacts: new Map(),

      initialize: async () => {
        const state = get();
        
        if (state.device && state.keyPair) {
          // WebSocket bağlantısı kur
          wsClient.connect(state.device.deviceId);
          
          // Yeni mesaj bildirimi dinle
          wsClient.on('new_message', async () => {
            await get().fetchInbox();
          });
        }
        
        set({ initialized: true });
      },

      register: async (userId: string, displayName: string) => {
        // Anahtar çiftleri oluştur
        const keyPair = generateKeyPair();
        const signingKeyPair = generateSigningKeyPair();
        
        // Cihazı sunucuya kaydet
        const device = await api.registerDevice(userId, keyPair.publicKey);
        
        // Pre-key imzası
        const signature = signMessage(keyPair.publicKey, signingKeyPair.secretKey);
        
        // Key bundle yayınla
        await api.publishKeyBundle({
          deviceId: device.deviceId,
          identityKey: signingKeyPair.publicKey,
          signedPreKey: keyPair.publicKey,
          signature,
          oneTimePreKeys: [], // Basitlik için boş bırakıyoruz
        });

        // State güncelle
        set({
          device,
          userId,
          keyPair,
          signingKeyPair,
        });

        // WebSocket bağlantısı
        wsClient.connect(device.deviceId);
        
        wsClient.on('new_message', async () => {
          await get().fetchInbox();
        });

        // Kendi bilgisini contacts'a ekle
        const contacts = new Map(get().contacts);
        contacts.set(userId, {
          name: displayName,
          publicKey: keyPair.publicKey,
          deviceId: device.deviceId,
        });
        set({ contacts });
      },

      logout: () => {
        wsClient.disconnect();
        set({
          device: null,
          userId: null,
          keyPair: null,
          signingKeyPair: null,
          chats: new Map(),
          messages: new Map(),
        });
      },

      addContact: async (userId: string, name: string) => {
        // Kullanıcının cihazlarını ve key bundle'ını al
        const { bundles } = await api.getUserKeyBundles(userId);
        
        if (bundles.length === 0) {
          throw new Error('Kullanıcı bulunamadı');
        }

        const bundle = bundles[0]; // İlk cihazı kullan
        
        const contacts = new Map(get().contacts);
        contacts.set(userId, {
          name,
          publicKey: bundle.signedPreKey,
          deviceId: bundle.deviceId,
        });
        
        // Yeni chat oluştur
        const chats = new Map(get().chats);
        if (!chats.has(userId)) {
          chats.set(userId, {
            odildi: userId,
            unreadCount: 0,
          });
        }
        
        set({ contacts, chats });
      },

      sendMessage: async (recipientUserId: string, content: string) => {
        const state = get();
        if (!state.device || !state.keyPair) {
          throw new Error('Not authenticated');
        }

        const contact = state.contacts.get(recipientUserId);
        if (!contact) {
          throw new Error('Contact not found');
        }

        // Mesajı şifrele
        const encrypted = encryptMessage(
          content,
          contact.publicKey,
          state.keyPair.secretKey
        );

        // Sunucuya gönder
        const result = await api.sendMessage({
          senderId: state.device.deviceId,
          recipientId: contact.deviceId,
          ciphertext: encrypted.ciphertext,
          nonce: encrypted.nonce,
        });

        // Local state güncelle
        const message: Message = {
          id: result.envelopeId,
          senderId: state.device.deviceId,
          recipientId: contact.deviceId,
          content,
          timestamp: result.createdAt,
          status: 'sent',
          isOutgoing: true,
        };

        get().addMessage(recipientUserId, message);
      },

      fetchInbox: async () => {
        const state = get();
        if (!state.device || !state.keyPair) return;

        const { envelopes } = await api.getInbox(state.device.deviceId);
        
        if (envelopes.length === 0) return;

        const envelopeIds: string[] = [];

        for (const envelope of envelopes) {
          try {
            // Mesajı çöz
            const content = decryptMessage(
              { ciphertext: envelope.ciphertext, nonce: envelope.nonce },
              envelope.senderPublicKey,
              state.keyPair.secretKey
            );

            const message: Message = {
              id: envelope.id,
              senderId: envelope.senderId,
              recipientId: state.device.deviceId,
              content,
              timestamp: envelope.createdAt,
              status: 'delivered',
              isOutgoing: false,
            };

            // Contact ekle (yoksa)
            const contacts = new Map(state.contacts);
            if (!contacts.has(envelope.senderUserId)) {
              contacts.set(envelope.senderUserId, {
                name: envelope.senderUserId.substring(0, 8),
                publicKey: envelope.senderPublicKey,
                deviceId: envelope.senderId,
              });
              set({ contacts });
            }

            get().addMessage(envelope.senderUserId, message);
            envelopeIds.push(envelope.id);
          } catch (error) {
            console.error('Failed to decrypt message:', envelope.id, error);
          }
        }

        // ACK gönder
        if (envelopeIds.length > 0) {
          await api.ackMessages(envelopeIds);
        }
      },

      addMessage: (userId: string, message: Message) => {
        set((state) => {
          const messages = new Map(state.messages);
          const userMessages = [...(messages.get(userId) || []), message];
          messages.set(userId, userMessages);

          // Chat güncelle
          const chats = new Map(state.chats);
          const existingChat = chats.get(userId);
          chats.set(userId, {
            odildi: userId,
            lastMessage: message.content,
            lastMessageTime: message.timestamp,
            unreadCount: message.isOutgoing ? (existingChat?.unreadCount || 0) : (existingChat?.unreadCount || 0) + 1,
          });

          return { messages, chats };
        });
      },
    }),
    {
      name: 'akistel-storage',
      partialize: (state) => ({
        device: state.device,
        userId: state.userId,
        keyPair: state.keyPair,
        signingKeyPair: state.signingKeyPair,
        contacts: Array.from(state.contacts.entries()),
      }),
      // Map'leri düzgün serialize/deserialize et
      merge: (persisted, current) => {
        const p = persisted as Partial<StoreState> & { contacts?: [string, unknown][] };
        return {
          ...current,
          ...p,
          contacts: new Map(p.contacts || []),
          chats: new Map(),
          messages: new Map(),
        };
      },
    }
  )
);
