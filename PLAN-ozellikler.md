---
description: Buz Kule yeni özellikler planı (sadeleştirilmiş dört madde; kapsam, dosyalar, sıra, test, risk). Sahip: Yusuf. Yazan: Claude (Buz Kule iş parçacığı).
---
# Yeni özellikler planı (0.14.0 sonrası, sade liste)

Ölçüt (Yusuf): özgün olsun, oyunun ruhunu bozmasın, programı karmaşıklaştırmasın. Önceki sekiz maddelik liste geçersiz: Lav/Nors temaları, karakter seçimi, tuş atama, ek güç nesneleri ve şema doğrulaması bu listede yok (Lav/Nors çizim taslağı `git stash`'te bekliyor).

Çalışma `ozellikler` dalında yürür; 0.14.0 (arcade menü) `main` kaydından derlenir, bitince bu dal `main`'e birleştirilir.

## Maddeler (sırayla)
1. **Kombo yazısı.** Kombo sürerken HUD'da büyüyen "xN KOMBO" yazısı (piksel yazı, her zıplamada büyür, süre çubuğuyla birlikte soluklaşır). Küçük kenar parıltısı. (Yavaş çekim yok: ruhu bozabilir ve ek karmaşıklık; istenirse sonra.) Dosyalar: `hud.js` (çizim), küçük değişiklik `oyun.js` (kombo sayısı zaten `o.puan.kombo.zip`). Test: yazı yalnız kombo varken çizilir; oyun durumu değişmez (tekrarlanabilirlik testi aynen geçmeli).
2. **Ses ve müzik, açma-kapama ile.** Mevcut ses efektleri korunur. Eklenen: tema fark etmeden tek, kısa, döngülü prosedürel müzik (WebAudio adım dizici, bas + basit melodi); Ayarlar'da "Müzik" ve "Efekt sesi" için ayrı **aç/kapa** düğmesi ve mevcut ses kaydırıcısı. Varsayılan: müzik kapalı (tarayıcı/oyuncu şaşırmasın), efektler açık. Yılan başlığının ses modülüne dokunulmaz (iş sahipliği); müzik bu oyunda kendi kodumla yazılır. Dosyalar: `ses.js`, `ayar.js` (iki yeni anahtar), `arayuz.js` + `index.html` (iki düğme). Test: kapalıyken ses üretilmez (sahte AudioContext), ayar kalıcı.
3. **Her mod için ilk 5 skor.** `skorlar.js` mod anahtarıyla ayrı liste (yeni / hayalet / günün); menüde seçili modun ilk 5'i, bitiş kartında vurgulu sıra. Eski tek liste "yeni" moda taşınır (göç). Test: mod başına ayrı, en çok 5, eski kayıt göçü.
4. **(En son) Lisans ve Electron bakımı.** Lisans/README/KAYNAKLAR tutarlılığı kontrolü; Electron ve electron-builder en güncel kararlı sürümlere (0.13.0'da 45.2.2 / 26.18.0 yapıldı, yeniden bakılır), `npm audit --omit=dev`. Test: `npm test`, açılmış paket doğrulaması.

## Sıra ve çıktı
1 → 2 → 3 → 4. Her adımdan sonra `npm test`, tarayıcıda ekran görüntüsü kontrolü, `ozellikler` dalına commit. Sonunda `main`'e birleştir, 0.15.0 derle (bilgisayarda derleme sırası koordinatörden gelince), açılmış paketi çalıştırarak doğrula.

## Riskler
- Müzik işitsel olarak rahatsız edebilir: varsayılan kapalı, ayrı açma-kapama.
- Kombo yazısı görüşü kapatabilir: orta-üst alanda, yarı saydam, HUD yoğunluğu ayarına bağlı.
- Skor göçü: eski tablonun kaybolmaması testle sabitlenir.
