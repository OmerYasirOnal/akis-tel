import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from 'tweetnacl-util';

export interface KeyPair {
  publicKey: string; // Base64
  secretKey: string; // Base64
}

export interface EncryptedMessage {
  ciphertext: string; // Base64
  nonce: string;      // Base64
}

// Yeni anahtar çifti oluştur (X25519 for encryption)
export function generateKeyPair(): KeyPair {
  const keyPair = nacl.box.keyPair();
  return {
    publicKey: encodeBase64(keyPair.publicKey),
    secretKey: encodeBase64(keyPair.secretKey),
  };
}

// İmza anahtarı oluştur (Ed25519 for signing)
export function generateSigningKeyPair(): KeyPair {
  const keyPair = nacl.sign.keyPair();
  return {
    publicKey: encodeBase64(keyPair.publicKey),
    secretKey: encodeBase64(keyPair.secretKey),
  };
}

// Mesajı şifrele (NaCl box - authenticated encryption)
export function encryptMessage(
  message: string,
  recipientPublicKey: string,
  senderSecretKey: string
): EncryptedMessage {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const messageBytes = decodeUTF8(message);
  
  const encrypted = nacl.box(
    messageBytes,
    nonce,
    decodeBase64(recipientPublicKey),
    decodeBase64(senderSecretKey)
  );

  if (!encrypted) {
    throw new Error('Encryption failed');
  }

  return {
    ciphertext: encodeBase64(encrypted),
    nonce: encodeBase64(nonce),
  };
}

// Mesajı çöz
export function decryptMessage(
  encrypted: EncryptedMessage,
  senderPublicKey: string,
  recipientSecretKey: string
): string {
  const decrypted = nacl.box.open(
    decodeBase64(encrypted.ciphertext),
    decodeBase64(encrypted.nonce),
    decodeBase64(senderPublicKey),
    decodeBase64(recipientSecretKey)
  );

  if (!decrypted) {
    throw new Error('Decryption failed - message may be tampered');
  }

  return encodeUTF8(decrypted);
}

// Mesajı imzala
export function signMessage(message: string, secretKey: string): string {
  const messageBytes = decodeUTF8(message);
  const signature = nacl.sign.detached(messageBytes, decodeBase64(secretKey));
  return encodeBase64(signature);
}

// İmzayı doğrula
export function verifySignature(
  message: string,
  signature: string,
  publicKey: string
): boolean {
  const messageBytes = decodeUTF8(message);
  return nacl.sign.detached.verify(
    messageBytes,
    decodeBase64(signature),
    decodeBase64(publicKey)
  );
}

// Random ID oluştur
export function generateId(): string {
  const bytes = nacl.randomBytes(16);
  return encodeBase64(bytes).replace(/[+/=]/g, '').substring(0, 21);
}

// Hash oluştur (basit - userId için)
export function hashUserId(input: string): string {
  const bytes = decodeUTF8(input);
  const hash = nacl.hash(bytes);
  return encodeBase64(hash).substring(0, 32);
}
