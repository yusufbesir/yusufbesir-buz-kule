---
description: Buz Kule kod düzeni, stabilite ve budama bulguları (denetim planı KOD-DUZENI-BUDAMA-PLANI.md'ye göre). Sahip: Yusuf. Yazan: Claude (Buz Kule iş parçacığı), 2026-11-05. Silme yok; kaldırma önerileri ayrı PR ve Yusuf kararıdır.
---
# Buz Kule: kod düzeni ve budama bulguları (2026-11-05)
Ölçülen taban: `src/` 18 modül, 1787 satır (dil tablosu hariç); test 26 dosya, 121 test geçiyor; çalışma zamanı bağımlılığı yok (yalnız electron 45.2.2 ve electron-builder 26.18.0, `npm audit` 0 açık); paketli uygulama 60 FPS (ortalama 16,69 ms, en kötü 17,4 ms). Kural: önce ölç, test zayıflatılmaz, fizik değişmez.

| # | Yer | Bulgu | Risk | Öneri | Kazanç | Geri alınabilirlik | Karar |
|---|-----|-------|------|-------|--------|--------------------|-------|
| 1 | `src/cekirdek.js` yükleme sınavı | Açılışta Rust çekirdeğinin kendi kendine sınavı ölçüldü: ~82 ms (5 tekrar ortalama, Node). Çoğu `puanSinav` (20.000 adım, her adımda 2 JSON.stringify), sonra iniş (6.000), fizik (3.000) | düşük | Sınav adımlarını azalt (puan 2.000, iniş 1.000, fizik 1.000) ve/veya sayfa boşta kalınca çalıştır; güvenlik ağı (uyuşmazlıkta JS'e düşme) korunur; eşdeğerlik testleri (`altin-*.test.js`) tam sınavı zaten yapıyor | ~70 ms daha hızlı açılış | tek commit geri alınır | **Budamaya değer, ilk iş** |
| 2 | `package.json` (electron-builder) | `electronLanguages` yok: `win-unpacked/locales` 55 dosya, 49 MB | düşük | `electronLanguages: ["tr","en-US"]` (oyun arayüzü HTML'de, Chromium arayüz dili etkilenmez) | kurulum dosyasında ~10 MB (ölçülecek), kurulu boyutta ~47 MB | tek satır | **Budamaya değer, bir sonraki derlemede ölç** |
| 3 | `uygulama/src/varlik/blender-v2` (148 KB), `karakter_dur/kos/zipla.png`, `platform.png` | Hiçbir `src` dosyasından başvurulmuyor, pakete de girmiyor (`build.files` yalnız kullanılanları listeliyor) | düşük | Silme yok: `varlik/KULLANILMIYOR.md` ile işaretle; kaldırma ayrı PR ve Yusuf kararı | ~190 KB depo | işaretleme geri alınır | Dokunma (işaretle) |
| 4 | `arac/yama_*.py` (5 dosya, 218 satır), `arac/blender_sprite*.py` (206 satır) | Tek seferlik, uygulanmış yamalar ve kullanılmayan Blender denemesi | düşük | `arac/eski/` altına taşı + BENIOKU (taşıma Yusuf izniyle, silme yok) | ~420 satır daha temiz araç klasörü | taşıma geri alınır | Yusuf kararı |
| 5 | `ayar.js`, `basarim.js`, `hayalet.js`, `kule.js`, `magaza.js`, `profil.js`, `skorlar.js` | 7 modülde aynı `JSON.parse(localStorage…)` + try/catch + doğrulama kalıbı (~80 satır) | orta | Ortak `depo.js` (`guvenliOku(anahtar, dogrula, varsayilan)`, `guvenliYaz`) ve tek hata günlüğü | ~50 satır azalma, hata yönetimi tek yerde | PR geri alınır, testler var | Budamaya değer (ayrı PR) |
| 6 | Tüm `src` | 90 satır 180 karakterden uzun, en uzunu 672 (`ayar.js` VARSAYILAN/ARALIK) | düşük | Yalnız biçimlendirme PR'ı (anahtar başına satır); davranış değişmez | okunabilirlik | geri alınır | Budamaya değer (en son, çakışma çıkarır) |
| 7 | `oyun.js adim()` | 93 satır (80 sınırını aşıyor): iniş, kamera, toplanabilirler tek fonksiyonda | orta | `inisIsle`, `kameraGuncelle`, `toplanabilirleriAl` olarak böl; **fizik değişmez**, `altin-fizik.test.js` kare kare korur | okunabilirlik | geri alınır | Dikkatli: yalnız eşdeğerlik testi yeşilken |
| 8 | 28 boş `catch {}` | 20'si localStorage okuma/yazma (depolama kapalıysa oyun çalışsın: bilinçli), 7'si `ses.js` (Audio yoksa sessiz) | düşük | Davranış doğru; #5'teki `depo.js` içinde tek yerde (isteğe bağlı) günlüğe yaz | hata görünürlüğü | — | Dokunma |
| 9 | `arayuz.js` (324 satır) | Test kapsamı yalnız sahte DOM'lu paket testleri; durum makinesi (menü→oyun→bitiş→tekrar) doğrudan test edilmiyor | orta | `arayuz.js` içindeki durum geçişlerini küçük bir saf modüle çıkar ve test et | hata yakalama | — | Öneri |
| 10 | `localStorage` kayıtları | Günlük/haftalık/kod başına ayrı hayalet kaydı eski olanlar silinmeden birikiyor; bir kayıt yaklaşık 2 KB (6000 kare), 5 MB kotaya yıllar | düşük | Şimdilik dokunma; ileride "en son N kayıt" kuralı (silme olduğu için Yusuf kararı) | — | — | Dokunma |
| 11 | Oyun sonu yazımları | Skor, profil, cüzdan, hayalet kaydı ayrı anahtarlara ayrı yazılıyor; çökme anında biri yazılıp diğeri yazılmayabilir | düşük | Oyun sonu yazımlarını tek `oyunSonuKaydet` içinde topla | küçük tutarlılık | geri alınır | Öneri |
| 12 | `dil_veri.js` | 78 KB (paketin %36'sı): 11 dilin tümü gömülü | düşük | Yalnız seçili dil + Türkçe yüklemek ~70 KB ve ayrıştırma süresi kazandırır, ama ölçülebilir fark yok (açılış JS ayrıştırması < 2 ms) | ihmal edilebilir | — | Dokunma |
| 13 | Bağımlılıklar | Çalışma zamanı bağımlılığı yok; electron ve electron-builder güncel, 0 açık | — | — | — | — | Dokunma |
| 14 | `core/` Rust | 3,5 KB wasm, `no_std`, bağımlılıksız; yerel derleme `arac/rust-derle.py`; altın vektör ve kare kare eşdeğerlik testleri | — | — | — | — | Dokunma |

## Önerilen sıra (her biri ayrı PR, tam test geçmeden birleşmez)
1. #1 çekirdek sınavını hafiflet (ölçümle önce/sonra).
2. #2 `electronLanguages` (derlemede ölç).
3. #5 `depo.js` ortak kalıp.
4. #11 oyun sonu yazımlarını topla.
5. #7 `adim()` bölme (yalnız yeşil eşdeğerlik testiyle).
6. #6 biçimlendirme (en son).
Yusuf kararı bekleyenler: #3 ve #4 (taşıma/kaldırma).
