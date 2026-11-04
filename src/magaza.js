// description: Buz Kule kristal cüzdanı ve mağaza (iz renkleri); kalıcı kayıt. Oyun kurallarını etkilemez, yalnız görünüm. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
export const IZLER = Object.freeze([
  { ad: 'Buz mavisi', renk: 'rgba(120,220,255,0.8)', fiyat: 0 },
  { ad: 'Altın', renk: 'rgba(255,210,120,0.9)', fiyat: 40 },
  { ad: 'Gül', renk: 'rgba(255,150,200,0.9)', fiyat: 90 },
  { ad: 'Zümrüt', renk: 'rgba(120,255,190,0.9)', fiyat: 160 },
  { ad: 'Gökkuşağı', renk: null, fiyat: 300 }, // renk zamanla değişir
]);
const CUZDAN_ANAHTAR = 'buzkule.cuzdan';
export const CUZDAN = { kristal: 0, acik: [0], secili: 0, toplam: 0 };

export function cuzdanYukle() {
  try {
    const k = JSON.parse(localStorage.getItem(CUZDAN_ANAHTAR) || 'null');
    if (k && Number.isFinite(k.kristal) && k.kristal >= 0) {
      CUZDAN.kristal = Math.floor(k.kristal); CUZDAN.toplam = Number.isFinite(k.toplam) ? Math.max(0, Math.floor(k.toplam)) : 0;
      CUZDAN.acik = Array.isArray(k.acik) ? k.acik.filter(i => Number.isInteger(i) && i >= 0 && i < IZLER.length) : [0];
      if (!CUZDAN.acik.includes(0)) CUZDAN.acik.push(0);
      CUZDAN.secili = CUZDAN.acik.includes(k.secili) ? k.secili : 0;
    }
  } catch { /* kayıt yoksa boş cüzdan */ }
}
export function cuzdanKaydet() { try { localStorage.setItem(CUZDAN_ANAHTAR, JSON.stringify(CUZDAN)); } catch { /* sessiz */ } }
export function kristalKazan(n) { if (n > 0) { CUZDAN.kristal += n; CUZDAN.toplam += n; cuzdanKaydet(); } }
// Satın alma: yeterli kristal varsa düşer ve açar; sonucu döndürür ('acik' zaten açıksa, 'yetersiz', 'alindi').
export function izAl(i) {
  if (!IZLER[i]) return 'gecersiz';
  if (CUZDAN.acik.includes(i)) return 'acik';
  if (CUZDAN.kristal < IZLER[i].fiyat) return 'yetersiz';
  CUZDAN.kristal -= IZLER[i].fiyat; CUZDAN.acik.push(i); cuzdanKaydet(); return 'alindi';
}
export function izSec(i) { if (CUZDAN.acik.includes(i)) { CUZDAN.secili = i; cuzdanKaydet(); return true; } return false; }
export function izRengi(zaman) {
  const iz = IZLER[CUZDAN.secili] || IZLER[0];
  return iz.renk || 'hsla(' + (zaman * 6 % 360) + ',95%,70%,0.9)';
}
