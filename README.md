# AKISTEL

**Türkiye odaklı, sade, güvenli mesajlaşma uygulaması.**

AKIS ekosisteminin güvenli iletişim ürünü.

## Temel Prensipler

- **Uçtan uca şifreleme**: Sunucu mesaj içeriğini **asla** görmez
- **Sunucu = Telsiz**: Sadece şifreli paketleri iletir
- **Minimal metadata**: Gizlilik öncelikli tasarım
- **Açık standartlar**: Signal protokolü benzeri, kanıtlanmış kriptografi

## Mimari

```
┌─────────────────┐         ┌─────────────────┐
│  Mobile Client  │◄───────►│  Relay Server   │
│  (E2EE here)    │ encrypted│  (blind relay)  │
└─────────────────┘ envelope └─────────────────┘
        │                            │
        ▼                            ▼
   Local Store                  PostgreSQL
   (encrypted)                  (encrypted
                                 envelopes only)
```

## Proje Yapısı

```
akis-tel/
├── apps/
│   ├── server/         # Relay server (Go/Node.js TBD)
│   └── mobile/         # Mobile client (RN/Flutter TBD)
├── packages/
│   ├── proto/          # MCP protocol definitions
│   └── shared/         # Shared types & utilities
├── infra/              # Deployment configs
├── docker/             # Dockerfiles
├── config/             # Environment configs
├── scripts/            # Automation scripts
├── .cursor/rules/      # Cursor AI kuralları
└── .github/workflows/  # CI/CD pipelines
```

## Ortamlar

| Ortam | Amaç | Tetikleyici |
|-------|------|-------------|
| dev | Local development | `make up` |
| test | CI tests | PR/push |
| staging | QA/demo | `staging` branch |
| preprod | Prod mirror | `release/*` branch |
| prod | Production | `vX.Y.Z` tag |

## Local Development

### Gereksinimler

- Docker & Docker Compose
- Make
- (Sonra) Node.js veya Go

### Başlangıç

```bash
# 1. Repo'yu klonla
git clone https://github.com/YOUR_ORG/akis-tel.git
cd akis-tel

# 2. Environment dosyasını oluştur
cp .env.example .env

# 3. Servisleri başlat (PostgreSQL + Redis)
make up

# 4. Durumu kontrol et
docker compose ps

# 5. Logları izle
make logs
```

### Yararlı Komutlar

```bash
make up        # Servisleri başlat
make down      # Servisleri durdur
make down-v    # Servisleri durdur + volume'ları sil
make logs      # Logları izle
make db-shell  # PostgreSQL shell
make redis-cli # Redis CLI
make test      # Testleri çalıştır
make lint      # Linter çalıştır
```

## Güvenlik Notları

⚠️ **Önemli**: Bu proje güvenlik kritik bir uygulamadır.

- Kripto kodu sıfırdan yazılmaz - denetlenmiş kütüphaneler kullanılır
- Her PR güvenlik etkisi açısından değerlendirilir
- Prod deployment'lar onay gerektirir

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
