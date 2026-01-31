# AKISTEL

**Türkiye odaklı, sade, güvenli mesajlaşma uygulaması.**

AKIS ekosisteminin güvenli iletişim ürünü.

## Temel Prensipler

- **Uçtan uca şifreleme**: Sunucu mesaj içeriğini **asla** görmez
- **Sunucu = Telsiz**: Sadece şifreli paketleri iletir
- **Minimal metadata**: Gizlilik öncelikli tasarım
- **Açık standartlar**: Signal protokolü benzeri, kanıtlanmış kriptografi

---

## Working MVP ✅

MVP akışı çalışıyor: `register → publish → send → inbox → ack`

### Gereksinimler

- Docker Desktop (running)
- Node.js 20+
- npm

### Hızlı Başlangıç

```bash
# 1. Docker servislerini başlat (PostgreSQL + Redis)
make up

# 2. Bağımlılıkları yükle (ilk seferde)
make install

# 3. Terminal 1: Backend server (port 3000)
make dev-server

# 4. Terminal 2: Frontend (port 5173)
make dev-web
```

### Port Yapılandırması

| Servis | Port | Not |
|--------|------|-----|
| Backend API | 3000 | `apps/server` |
| Frontend | 5173 | `apps/web` (Vite) |
| PostgreSQL | 5432 | Docker |
| Redis | 6379 | Docker |
| Adminer | 8080 | Docker (DB yönetimi) |

> ⚠️ Port 8080 Adminer tarafından kullanılıyor. Backend 3000 portunda çalışır.

### Health Check

```bash
curl http://localhost:3000/health
# {"status":"ok","timestamp":"..."}
```

### Smoke Test

Tüm MVP akışını test et:

```bash
cd apps/server && npm run smoke
```

veya root'tan:

```bash
make smoke
```

### MVP API Endpoints

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/health` | GET | Health check |
| `/api/devices/register` | POST | Cihaz kaydı |
| `/api/keys/publish` | POST | Key bundle yayınla |
| `/api/keys/:deviceId` | GET | Key bundle al |
| `/api/messages/send` | POST | Şifreli mesaj gönder |
| `/api/messages/inbox/:deviceId` | GET | Inbox'ı al |
| `/api/messages/ack` | POST | Mesaj teslim onayı |

### MVP Akışı

```
┌─────────┐                              ┌─────────┐
│  Alice  │                              │   Bob   │
└────┬────┘                              └────┬────┘
     │                                        │
     │ 1. POST /devices/register              │
     │────────────────────────────────────►   │
     │                                        │
     │ 2. POST /keys/publish                  │
     │────────────────────────────────────►   │
     │                                        │
     │                     1. POST /devices/register
     │   ◄────────────────────────────────────│
     │                                        │
     │                       2. POST /keys/publish
     │   ◄────────────────────────────────────│
     │                                        │
     │ 3. POST /messages/send (encrypted)     │
     │────────────────────────────────────►   │
     │                                        │
     │              4. GET /messages/inbox/:id│
     │   ◄────────────────────────────────────│
     │                                        │
     │                  5. POST /messages/ack │
     │   ◄────────────────────────────────────│
     │                                        │
```

---

## Mimari

```
┌─────────────────┐         ┌─────────────────┐
│  Mobile/Web     │◄───────►│  Relay Server   │
│  Client         │ encrypted│  (blind relay)  │
│  (E2EE here)    │ envelope └─────────────────┘
└─────────────────┘                 │
        │                           ▼
        ▼                      PostgreSQL
   Local Store                 (encrypted
   (encrypted)                  envelopes only)
```

## Proje Yapısı

```
akistel/
├── apps/
│   ├── server/         # Backend API (Fastify + Prisma)
│   │   ├── src/
│   │   ├── prisma/
│   │   └── scripts/    # smoke.mjs
│   └── web/            # Web client (React + Vite)
├── packages/
│   ├── proto/          # MCP protocol definitions
│   └── shared/         # Shared types & utilities
├── docker-compose.yml  # PostgreSQL + Redis + Adminer
├── Makefile            # Development commands
└── .cursor/rules/      # Cursor AI kuralları
```

## Ortamlar

| Ortam | Amaç | Tetikleyici |
|-------|------|-------------|
| dev | Local development | `make dev-server` |
| test | CI tests | PR/push |
| staging | QA/demo | `staging` branch |
| preprod | Prod mirror | `release/*` branch |
| prod | Production | `vX.Y.Z` tag |

## Makefile Komutları

```bash
make up          # Docker servislerini başlat
make down        # Docker servislerini durdur
make install     # npm install (server + web)
make dev-server  # Backend başlat (port 3000)
make dev-web     # Frontend başlat (port 5173)
make smoke       # Smoke test çalıştır
make db-shell    # PostgreSQL shell
make db-studio   # Prisma Studio
make build       # Production build
```

## Güvenlik Notları

⚠️ **Önemli**: Bu proje güvenlik kritik bir uygulamadır.

- Kripto kodu sıfırdan yazılmaz - denetlenmiş kütüphaneler kullanılır
- Sunucu mesaj içeriğini **asla** görmez
- Loglarda plaintext/ciphertext yazdırılmaz

## Katkıda Bulunma

1. Feature branch oluştur: `git checkout -b feature/amazing-feature`
2. Değişiklikleri commit et: `git commit -m 'feat: add amazing feature'`
3. Branch'i push et: `git push origin feature/amazing-feature`
4. Pull Request aç

## Lisans

TBD

## Referanslar

- [Signal Protocol Specifications](https://signal.org/docs/)
- [X3DH Key Agreement](https://signal.org/docs/specifications/x3dh/)
- [Double Ratchet Algorithm](https://signal.org/docs/specifications/doubleratchet/)
