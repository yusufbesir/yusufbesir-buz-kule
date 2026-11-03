---
description: Buz Kule, özgün dikey zıplama oyunu. Sahip: Yusuf. Yazan: Claude (Buz Kule iş parçacığı).
---
# Buz Kule
Düz JS + Canvas oyunu (Electron ile Windows kurulumu). Orijinal ad, grafik, ses, metin ve kod kullanılmadı.

**Yalnız kişisel kullanım; dağıtılmaz.** Lisans: Tüm hakları saklıdır (bkz. LICENSE). Ticari bir oyunun gözleminden çıkarılan mekanik sabit notları depoda tutulmaz, yalnız yerelde saklanır.

## Komutlar
- `npm test` — tüm testler (`node --test test/*.test.js`)
- `npm run derle` — modülleri tek betiğe birleştirir (`uygulama/src/buz-kule.js`, ad çakışmasında durur)
- `npm run bot` — planlayıcı botla zorluk ölçümü
- Kurulum paketi: `uygulama/` içinde `npm install` ve `npm run dist` (Electron 45, electron-builder 26)
- Geliştirme önizlemesi: `arac/onizleme.html` (kökten bir yerel sunucuyla açılır)

## Yapı
`src/` oyun kaynakları (modüller), `test/` testler, `arac/` yardımcı araçlar, `uygulama/` Electron kabuğu ve paket çıktısı, `KAYNAKLAR.md` varlık kaynakları, `ARASTIRMA.md` fizik hissi notları.
