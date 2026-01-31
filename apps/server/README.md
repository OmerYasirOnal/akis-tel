# AKISTEL Server (Relay + Auth)

## Amaç

Sunucu "dumb relay" olarak çalışır: **mesaj içeriğini görmez, sadece iletir**.

## Sorumluluklar

- **Auth**: Device registration, token yönetimi
- **Device Registry**: Cihaz public key bundle'larını saklar
- **Encrypted Envelope Store**: Şifreli mesajları geçici olarak saklar
- **Push Trigger**: Push notification tetikler (içerik görmeden)

## Kripto Prensibi

Sunucu **asla**:
- Mesaj plaintext'ini görmez
- Mesaj içeriğini indexlemez
- Decryption yapmaz

Tüm kriptografi **istemci tarafında** gerçekleşir (Signal/libsignal yaklaşımı).

## API Endpoints (Planlanan)

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/health` | GET | Health check |
| `/devices/register` | POST | Cihaz kaydı |
| `/keys/publish` | POST | Public key bundle yayınla |
| `/keys/:deviceId` | GET | Cihazın public key bundle'ını al |
| `/messages/send` | POST | Şifreli envelope gönder |
| `/messages/inbox` | GET | Inbox'taki mesajları al |
| `/messages/ack` | POST | Mesaj teslim onayı |

## Teknoloji (TBD)

- [ ] Go veya Node.js/TypeScript
- [ ] PostgreSQL (devices, key_bundles, envelopes)
- [ ] Redis (session, rate limiting)
