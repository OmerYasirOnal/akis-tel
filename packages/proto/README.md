# MCP (Message Confidentiality Protocol) - Draft

## Amaç

E2EE mesajlaşma için istemci tarafı anahtar yönetimi protokolü.

**Sunucu sadece yönlendirici** (telsiz gibi) - içerik görmez.

## Sürüm

`0.1.0` (taslak)

## Temel Prensipler

1. **Forward Secrecy**: Bir anahtar ele geçse bile geçmiş mesajlar okunamaz
2. **Post-Compromise Security**: Ele geçirilmiş bir cihaz iyileştikten sonra güvenlik yeniden sağlanır
3. **Asenkron**: Karşı taraf offline olsa bile mesaj gönderilebilir
4. **Metadata Minimizasyonu**: Sunucu minimum metadata görür

## Protokol Bileşenleri

### X3DH Benzeri Key Agreement

- Identity Key (uzun ömürlü)
- Signed Pre-Key (orta ömürlü)
- One-Time Pre-Keys (tek kullanımlık)

### Double Ratchet Benzeri Message Keys

- Her mesaj için yeni symmetric key
- DH ratchet + symmetric ratchet

## Referanslar

- [Signal X3DH Specification](https://signal.org/docs/specifications/x3dh/)
- [Signal Double Ratchet Specification](https://signal.org/docs/specifications/doubleratchet/)

## Notlar

> **ÖNEMLİ**: Kripto sıfırdan yazılmayacak. Denetlenmiş kütüphaneler (libsignal vb.) entegre edilecek.
