---
description: Buz Kule fizik hissi ve yeni özellikler için araştırma notu (2026-11-03). Sahip: Yusuf. Yazan: Claude (Buz Kule iş parçacığı).
---
# Araştırma notu: oyun hissi ve özgün özellikler

## Kaynak durumu (dürüst not)
Web aramaları ikincil kaynaklar (eğitim yazıları, forumlar, itch.io blogları) çıkardı; otoriter bir tasarım referansı bulamadım. Rakamları kesin standart değil, başlangıç değeri olarak aldım ve oyun içinde test ederek ayarladım.
- Coyote süresi: kenardan çıktıktan birkaç kare sonra hâlâ zıplayabilme (kaynaklar ~0,1-0,2 sn, birkaç kare).
- Zıplama tamponu: inişten hemen önce basılan tuşu birkaç kare hatırlama (örnek ~10 kare).
- İkisi de "affedici ama süzülme hissi vermeyecek kadar kısa" olmalı.
- Orijinalin devamında (Icy Tower 2) altın, mağaza, giysi ve güç öğeleri olduğu bildiriliyor (resmî özellik listesi bulunamadı; kopyalamadım, yalnız ilham aldım).

## Kodlanan fizik düzeltmeleri (oyun.js)
- Kenar toleransı: ayak yarı genişliği 10 px; basamağın 10 px dışındaki ayak da basar (iniş ve yürüyerek kenara varış).
- Geçiş anına ara değerleme: hızlı koşuda (kare başına ~12 px) basamak kenarını "atlamak" engellendi.
- Coyote: basamaktan yürüyerek çıkınca 6 kare zıplanabilir. Zıplama tamponu: 7 kare.
- İniş tutunması: yön tuşu yokken inişte yatay hız ×0,8.
- Ölçüm (kombosuz planlayıcı bot, 3 deneme): ortalama kat ~105'ten ~149'a çıktı; "sağ+space basılı tut" taktiği zaten ilerlemiyor (ort. kat <1), yani oyun hâlâ düşünmeyi ödüllendiriyor.

## Yeni özgün özellikler
- Kristal cüzdanı (kalıcı) ve mağaza: toplanan kristallerle iz rengi açılır (yalnız görünüm).
- Güç öğeleri: saat (kayma %60 yavaşlar, 9,6 sn), mıknatıs (kristalleri 150 px'ten çeker, 10 sn).
- Takla, beş karakter, hızlanma alarmı, 50 katta kilometre taşı (önceki sürüm).

## Açık
- Gerçek oyuncu denemesiyle sayıların (coyote 6, tampon 7, tolerans 10) ayarı.
