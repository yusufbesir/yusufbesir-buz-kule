---
description: Buz Kule yeni özellikler planı (öneri oturumundan gelen sekiz madde; kapsam, dosyalar, sıra, test, risk). Sahip: Yusuf. Yazan: Claude (Buz Kule iş parçacığı).
---
# Yeni özellikler planı (0.14.0 sonrası, sırayla)

Kural: önce plan, sonra sırayla kodlama; her madde testle ve görsel kontrolle biter, hepsi bitince tek paket (0.15.0). Çalışma `ozellikler` dalında yürür; 0.14.0 (arcade menü) `main` kaydından derlenir.

## Mevcut durum (zaten yapılanlar, tekrar edilmeyecek)
- Günlük tohum "aynı tohum aynı kule" garantisi ve testleri var (hayalet.js, test/hayalet.test.js).
- Saat güç öğesi (kaymayı yavaşlatır) ve HUD sayacı var; mıknatıs var.
- Ses efektleri (WebAudio) ve ses ayarı var; müzik yok.
- Beş Kenney karakteri seçilebilir; oyun kolu desteği var; skor tablosu tek liste.
- 4 tema, 100 katta bir değişiyor.

## Maddeler
1. **Temalar (Buz, Lav, Nors, mevcut ametist ve yosun) her 50 katta döner.** `gorsel.js`: `lav` (bazalt basamak, parlayan çatlaklar, kızıl gökyüzü, ateş parçacıkları) ve `nors` (rün oyulu taş, koyu mavi-altın) tema ve basamak çizimi; dönüş periyodu 50. Test: tema indeksi/periyot, önizleme sayfası ekran görüntüsü. Risk: çizim maliyeti (60 kare/sn korunmalı).
2. **Kombo HUD'u:** büyüyen "xN KOMBO" yazısı (piksel yazı), kenar parıltısı, kombo bitişinde kısa yavaş çekim. Yavaş çekim yalnız döngü zaman ölçeğidir (kare sayısı değişmez), hayalet/tekrar bozulmaz. Dosyalar: hud.js, arayuz.js (döngü), oyun.js (kombo olayı). Test: zaman ölçeği kare sayısını değiştirmez.
3. **Mod başına ilk 5 skor:** `skorlar.js` mod anahtarıyla (yeni/hayalet/günün). Günlük tohum garantisi testi çoğaltılır (farklı erişim sırası, farklı karakter, farklı ayar → aynı kule).
4. **Güç nesneleri:** buz kalkanı (aşağı düşünce bir kez kurtarır: son güvenli basamağa taşır) eklenir; saat güç öğesi "zaman yavaşlatıcı" olarak yeniden adlandırılır; HUD'da üçü de sayaçlı. Dosyalar: kat.js (tür), oyun.js, gorsel.js (çizim), hud.js. Test: kalkan düşmeyi önler ve tüketilir; tekrar üretilebilirlik bozulmaz.
5. **Kodla çizilmiş 3 piksel karakter:** `piksel` çizimiyle (Tilki, Robot, Penguen) seçilebilir; her birinin ayak hissi (esneme/sönümleme) farklıdır, fizik sabitleri aynı kalır (adil ve hayalet uyumlu). Karakter seçimi ayarda 8 karaktere çıkar.
6. **Prosedürel müzik ve ses:** `ses.js`'e adım dizici (tema başına bas+melodi döngüsü), müzik ve efekt için ayrı ses ayarı. Not: öneride "Yılan'daki Web Audio modülü" geçiyor; o başlığın dosyalarına dokunmam (iş sahipliği), müziği bu oyunda kendi kodumla yazarım.
7. **Tuş atama:** Ayarlar'da sol/sağ/zıpla için tuş seçimi (çakışma denetimi, varsayılana dönüş, kalıcı); oyun kolu aynen çalışır. Test: çakışma reddi, kalıcı kayıt.
8. **(En son) Kayıt şema doğrulaması:** `sema.js`: ayar, cüzdan, skorlar, başarım, hayalet, tuşlar kayıtları için tek yerden doğrulama (tür, aralık, uzunluk); bozuk kayıt varsayılana düşer. Test: bozuk/zehirli girdiler.

## Sıra ve çıktı
1 → 2 → 3 → 4 → 5 → 6 → 7 → 8. Her adımdan sonra `npm test`, önizleme/tarayıcı kontrolü, `ozellikler` dalına commit. Sonunda `main`'e birleştir, 0.15.0 derle (bilgisayarda derleme sırası koordinatörden gelince), açılmış paketi çalıştırarak doğrula.

## Riskler
- Çizim ve müzik maliyeti: ayarlardan kapatılabilir (parıltı, parçacık, müzik).
- Kombo yavaş çekimi ve kalkan, tekrarlanabilirliği bozmamalı: testle sabitlenir.
- Tuş atama klavye düzenlerine bağlıdır: `e.code` (fiziksel tuş) kullanılır.
