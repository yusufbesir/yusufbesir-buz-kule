---
description: Buz Kule'de kullanılan hazır varlıkların kaynak ve lisans tablosu. Sahip: Yusuf. Yazan: Claude (Buz Kule iş parçacığı).
---
# Varlık kaynakları
| Varlık | Kaynak | Lisans | Dosya | Durum |
|---|---|---|---|---|
| Karakter pozları (5 karakter: Player, Adventurer, Female, Soldier, Zombie; stand, walk1/2, jump, fall, skid, cheer1, hurt) | Kenney, Platformer Characters 1.0 (kenney.nl/assets/platformer-characters) | CC0 | uygulama/src/varlik/kenney/karakter/ | Kullanımda, pakete girer |
| Eski karakter pozları (yalnız Player) | Aynı paket (Kenney, Platformer Characters 1.0) | CC0 | uygulama/src/varlik/kenney/player_*.png | Kullanılmıyor (0.8.0'dan beri karakter/ klasörü), pakete girmez |
| Basamak karo dilimleri (Snow, Tundra, Sand, Metal) | Kenney, Platformer Pack: Extended Tiles (kenney.nl/assets/platformer-art-extended-tileset) | CC0 | uygulama/src/varlik/kenney/plat/ | Kullanılmıyor (0.6.0'dan beri basamaklar kodla çiziliyor), pakete girmez |
| karakter_dur/kos/zipla.png, platform.png | Kendi işim: Blender 4.5.9 ile render edilmiş ilk deneme sprite'ları (arac/blender_sprite.py); Blender GPL araçtır, çıktı kendi eserimdir | Kendi | uygulama/src/varlik/ | Kullanılmıyor, pakete girmez |
| Diğer her şey (aurora arka plan, taş duvarlar ve meşaleler, buz/ametist/ahşap/yosunlu taş basamaklar, kristaller, piksel yazı, arayüz, ses) | Kendi kodum (prosedürel çizim, WebAudio) | Kendi | src/ | Kullanımda |

Lisans metinleri: uygulama/src/varlik/kenney/LICENSE-Kenney-CC0.txt, uygulama/src/varlik/kenney/plat/LICENSE-Kenney-CC0.txt.
