# AKISTEL Mobile Client

## Amaç

Güvenli, sade mesajlaşma istemcisi. Tüm E2EE operasyonları burada gerçekleşir.

## Sorumluluklar

- **Key Management**: Device keypair üretimi, pre-key yönetimi
- **E2EE**: X3DH + Double Ratchet benzeri protokol implementasyonu
- **Local Storage**: Encrypted local database
- **UI**: Minimal, WhatsApp benzeri ama daha sade

## Planlanan Ekranlar

1. **Onboarding**: Cihaz kaydı, key generation
2. **Chat List**: Konuşma listesi
3. **Chat Screen**: Mesajlaşma ekranı
4. **Settings**: Güvenlik ayarları, key verification

## Güvenlik

- Local storage OS keystore/secure enclave ile korunur
- Clipboard policy (opsiyonel)
- Screenshot policy (opsiyonel)
- Biometric auth (opsiyonel)

## Teknoloji (TBD)

- [ ] React Native veya Flutter
- [ ] Encrypted local storage
- [ ] libsignal veya benzeri crypto library
