---
description: Buz Kule için Rust + Python geçiş planı (Rust çekirdek WebAssembly olarak Electron içinde, üstte Python araçları). Sahip: Yusuf. Yazan: Claude (Buz Kule iş parçacığı), 2026-11-04. Değiştirmek için Yusuf'a veya yazan yapay zekaya danış.
---
# Rust + Python geçiş planı: Buz Kule (2026-11-04)
Yusuf: ağır hesap ve asıl iş Rust, üstte Python; diğer diller parça parça. Çalışan 0.15.4 bozulmayacak.

## Dürüst başlangıç
Bu oyunda ağır hesap azdır: simülasyon adımı (`adim`) mikrosaniye düzeyinde, kare maliyetinin çoğu Canvas çiziminde (ölçüm: sahte tuvalde ortalama 0,27 ms, çizim dahil). Rust'ın burada asıl kazancı hız değil: (1) simülasyonun tek, belirlenimli (deterministik) bir çekirdekte toplanması, (2) hayalet/günün kulesi tekrarlanabilirliğinin makineler arası aynı çıkması, (3) başka programlarla ortak çekirdek kalıbı. Bu yüzden her aşamadan önce ölçülür; ölçüm kazanç göstermeyen yerde Rust yalnızca belirlenimlilik/ortaklık için alınır ve plana yazılır.

## Mimari karar
- **Rust çekirdek → WebAssembly (wasm32-unknown-unknown)**, Electron içinde çalışır. Ayrı süreç, ayrı exe, imza sorunu yok; CSP'ye `'wasm-unsafe-eval'` eklenir (yalnız `script-src`, başka gevşetme yok).
- **Geri düşme:** her Rust modülünün JS karşılığı kalır (dosya silinmez). wasm yüklenirse Rust, yüklenmezse eski JS. Modül, JS ↔ Rust **eşdeğerlik testi** (aynı tohum + aynı girdi dizisi, kare kare durum karşılaştırması) geçmeden devreye girmez.
- **Çizim, arayüz, ses JS/Canvas kalır** (kullanıcı için görünür fark yok).
- **Python katmanı:** `arac/*.py`: wasm derleme, eşdeğerlik raporu, SHA256 ve paket betikleri, bot ile uzun oyun doğrulama, ölçüm raporu. Son aşamada tek `arac/derle.py` ile birleştirme + test + paket.
- Kayan nokta: JS sayıları f64; Rust'ta f64 kullanılır, sim içinde sin/cos/exp kullanılmaz (yalnız + − × ÷ floor), böylece sonuçlar bit düzeyinde aynı çıkar.

## Aşamalar
0. **Ölçüm (YAPILDI, 2026-11-04, `arac/olcum-asama0.mjs`, Node, JS tabanı):** `katUret` 0,09 µs/çağrı; `adim` 0,6 µs/çağrı (50 FPS kare bütçesi 20.000 µs → %0,003); `kayitCoz` 10.000 koşuluk kayıtta 4,6 ms (yalnız hayalet/günün kulesi başlangıcında bir kez). **Sonuç: simülasyon hız darboğazı değil; Rust'ın hız kazancı ölçülemeyecek kadar küçük. Rust yalnız belirlenimlilik, ortak çekirdek ve Yusuf'un dil tercihi için alınır.** JS'in ürettiği kat verisi `test/altin/kat.json` altın vektörü olarak kaydedildi (200 tohum × 300 kat; `arac/altin-vektor.mjs`); Rust çekirdeği bununla birebir eşleşmeli.
   Eski ölçüm adımı (genişletme): `arac/kare-olcum.mjs` genişletilir: yalnız `adim`, yalnız `katUret`, yalnız `kayitCoz` süreleri, 100.000 kare uzun koşu, bellek. Sonuç bu dosyaya eklenir.
1. **Kat üretimi + PRNG** (`katRnd` mulberry32, `katUret`, genişlik/aralık): en küçük, saf, en kolay doğrulanan kısım. `core/` Rust crate → `core.wasm`; JS yükleyici + geri düşme; 10.000 tohum × 500 kat eşdeğerlik testi.
2. **Fizik + puan** (`fizik.js`, `puan.js`): saf fonksiyonlar; sınır değerlerle ve rastgele girdiyle eşdeğerlik.
3. **Simülasyon adımı** (`oyun.js adim`: iniş, yay, kırılgan, güç nesneleri, kamera, ölüm): durum yapısı wasm belleğinde; JS `o` nesnesine okunur kopya. En riskli aşama: ancak 1 ve 2 oturduktan sonra, kare kare 1 milyon kare eşdeğerlik koşusuyla.
4. **Hayalet kaydı** (`kayitCoz`, run-length, doğrulama sınırları): Rust; bozuk kayıt sınır testleri (güvenlik bulgusuyla uyumlu).
5. Python: her aşamada araç/test betiği; son aşamada tek `derle.py`.

## Kurallar
- Test (95 mevcut + eşdeğerlik) geçmeden aşama birleşmez; her aşama kendi sürümü (0.16.0 = aşama 1, …).
- **Fizik davranışı değişmez**; davranış değişikliği (ör. süpürmeli çarpışma) Yusuf'un kararıdır ve geçişten ayrı yapılır.
- Dosya silinmez: JS kodu geri düşme için kalır.
- Derleme sırası tek ağır derleme kuralına uyar; Rust derlemesi de ağır sayılır.

## Engel / karar bekleyen (Yusuf)
- Bu bilgisayarda Rust (`rustc`, `cargo`, `wasm32-unknown-unknown` hedefi) kurulu değil. Kurmak bir dosya indirmek demektir (rustup-init); Yusuf'un açık izni olmadan indirmem. Alternatif: wasm'ı bulutta derleyip `core.wasm`'ı repoya eklemek (sürüm kilitli, SHA256 kayıtlı).
- Rust araç zinciri sürümü ve `wasm-bindgen`/`wasm-pack` kullanımı: önerim bağımlılıksız (`no_std`'a yakın, `extern "C"` dışa aktarımlı) çekirdek, böylece bağımlılık zinciri ve güvenlik yüzeyi küçük kalır.
