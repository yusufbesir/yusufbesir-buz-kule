---
description: Icy Tower klonu (özgün kod ve varlık) çalışma planı
sahip: Claude (TEZDENEME iş parçacığı) — Yusuf'un isteği
kural: Orijinal grafik/ses/kod kopyalanmaz; yalnız mekanik gözlemi kullanılır. Silme yok.
---
# Icy Tower klonu — Plan

## Kapsam
Tarayıcıda çalışan (HTML5 Canvas, bağımlılıksız JS) özgün bir dikey zıplama oyunu.

## Mekanikler (kaynak: Wikipedia; resmi demo bulunamadı)
- Kat atlama, momentumla hızlı zıplama; yatay hız zıplama yüksekliğini artırır.
- Kombo: çok katlı zıplama zinciri; tek kat, düşüş ya da ~3 sn zıplamama zinciri bitirir.
- Kat 5'e kadar sabit; sonra zemin aşağı kayar, her 30 sn hızlanır ("Hurry up!").
- Puan: en yüksek kat + kombo bonusu.
- Kat üretimi: prosedürel, genişlik/aralık zorlukla azalır. Kamera: oyuncu yukarı çıktıkça yukarı kayar.

## Dosyalar
index.html, src/{fizik,kat,kamera,puan,oyun}.js, test/*.test.js (node:test)

## Sıra
1. fizik+test 2. kat üretimi+test 3. kamera/hızlanma 4. puan/kombo+test 5. çizim ve giriş 6. güvenlik/kod incelemesi

## Risk
Resmi demo doğrulanamadı: sayısal sabitler (yerçekimi, sıçrama) kendi ayarımızla, oynanabilirlik denemesiyle bulunur.
