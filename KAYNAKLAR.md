---
description: Buz Kule'de kullanılan hazır varlıkların kaynak ve lisans tablosu. Sahip: Yusuf. Yazan: Claude (Buz Kule iş parçacığı).
---
# Varlık kaynakları
| Varlık | Kaynak | Lisans | Dosya | Durum |
|---|---|---|---|---|
| Karakter pozları (5 özgün karakter: Penguen, Kutup ayısı, Tilki, Yeti, Kardan adam; stand, walk1/2, jump, fall, skid, cheer1, hurt) | Kendi işim: arac/karakter_ciz.py ile kodla çizildi, dış varlık yok | Kendi | uygulama/src/varlik/buzkule/karakter/ | Kullanımda, pakete girer |
| Eski Kenney karakter pozları (Player, Adventurer, Female, Soldier, Zombie) | Kenney, Platformer Characters 1.0 (kenney.nl/assets/platformer-characters) | CC0 | uygulama/src/varlik/kenney/karakter/ | Kullanılmıyor (özgün karakterlerle değişti), pakete girmez |
| Eski karakter pozları (yalnız Player) | Aynı paket (Kenney, Platformer Characters 1.0) | CC0 | uygulama/src/varlik/kenney/player_*.png | Kullanılmıyor (0.8.0'dan beri karakter/ klasörü), pakete girmez |
| Basamak karo dilimleri (Snow, Tundra, Sand, Metal) | Kenney, Platformer Pack: Extended Tiles (kenney.nl/assets/platformer-art-extended-tileset) | CC0 | uygulama/src/varlik/kenney/plat/ | Kullanılmıyor (0.6.0'dan beri basamaklar kodla çiziliyor), pakete girmez |
| karakter_dur/kos/zipla.png, platform.png | Kendi işim: Blender 4.5.9 ile render edilmiş ilk deneme sprite'ları (arac/blender_sprite.py); Blender GPL araçtır, çıktı kendi eserimdir | Kendi | uygulama/src/varlik/ | Kullanılmıyor, pakete girmez |
| Ses efektleri (12 kısa OGG: phaseJump1/3/5, powerUp1/5/8, pepSound3, lowDown, phaserUp3, lowRandom, threeTone1, highUp) | Kenney, Digital Audio (kenney.nl/assets/digital-audio) | CC0 | uygulama/src/varlik/ses/*.ogg | Kullanımda, pakete girer |
| Müzik "Venus" (muzik.wav) ve "Win Jingle" (kazanma.wav) | SketchyLogic, "NES Shooter Music (5 tracks, 3 jingles)" (opengameart.org/content/nes-shooter-music-5-tracks-3-jingles) | CC0 | uygulama/src/varlik/ses/muzik.wav, kazanma.wav | Kullanımda, pakete girer; müzik varsayılan kapalı |
| Diğer her şey (aurora arka plan, taş duvarlar ve meşaleler, buz/ametist/ahşap/yosunlu taş basamaklar, kristaller, piksel yazı, arayüz) | Kendi kodum (prosedürel çizim) | Kendi | src/ | Kullanımda |

Lisans metinleri: uygulama/src/varlik/kenney/LICENSE-Kenney-CC0.txt, uygulama/src/varlik/kenney/plat/LICENSE-Kenney-CC0.txt.
