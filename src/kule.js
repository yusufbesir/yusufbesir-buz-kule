// description: Buz Kule kule konseptleri (Buz, Kor, Rün, Kum, Yıldız): yalnız görünüm (renk tonu); açılış kuralları: başlangıç kulesi açık, bazıları başarımla, bazıları kristalle açılır. Kilit sistemi ayardan kapatılabilir (AYAR.kuleKilidi = 0 → hepsi açık). Fizik ve kat üretimi değişmez. Sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı).
import { AYAR } from './ayar.js';
import { CUZDAN, cuzdanKaydet } from './magaza.js';
import { ACIK } from './basarim.js';

// tint: tüm sahneye 'color' karışımıyla uygulanan ton (h: renk açısı, s/l: doygunluk/açıklık %, a: etki, karart: ek koyulaştırma)
export const KULELER = Object.freeze([
  { id: 'buz', acik: { tur: 'acik' }, tint: null },
  { id: 'kor', acik: { tur: 'basarim', id: 'kat50' }, tint: { h: 12, s: 95, l: 48, a: 0.55, karart: 0.16 } },
  { id: 'run', acik: { tur: 'kristal', fiyat: 150 }, tint: { h: 268, s: 70, l: 46, a: 0.5, karart: 0.12 } },
  { id: 'kum', acik: { tur: 'kristal', fiyat: 300 }, tint: { h: 42, s: 85, l: 55, a: 0.55, karart: 0 } },
  { id: 'yildiz', acik: { tur: 'basarim', id: 'kat100' }, tint: { h: 225, s: 75, l: 30, a: 0.62, karart: 0.35 } },
]);
const KULE_ANAHTAR = 'buzkule.kuleler';
export const KULE = { satin: [] }; // kristalla satın alınan kule numaraları

export function kuleYukle() {
  KULE.satin = [];
  try {
    const k = JSON.parse(localStorage.getItem(KULE_ANAHTAR) || 'null');
    if (k && Array.isArray(k.satin)) KULE.satin = [...new Set(k.satin.filter((i) => Number.isInteger(i) && i > 0 && i < KULELER.length))];
  } catch { /* kayıt yoksa ya da bozuksa sıfırdan */ }
}
const kuleKaydet = () => { try { localStorage.setItem(KULE_ANAHTAR, JSON.stringify(KULE)); } catch { /* sessiz */ } };

// Kule seçilebilir mi? Kilit sistemi kapalıysa hepsi açık.
export function kuleAcikMi(i) {
  const k = KULELER[i]; if (!k) return false;
  if (!AYAR.kuleKilidi || k.acik.tur === 'acik') return true;
  return k.acik.tur === 'basarim' ? ACIK.has(k.acik.id) : KULE.satin.includes(i);
}
// Kristalle satın alma: 'alindi' | 'yetersiz' | 'acik' (zaten açık) | 'gecersiz' (başarımla açılan ya da geçersiz numara)
export function kuleAl(i) {
  const k = KULELER[i]; if (!k || k.acik.tur !== 'kristal') return 'gecersiz';
  if (kuleAcikMi(i)) return 'acik';
  if (CUZDAN.kristal < k.acik.fiyat) return 'yetersiz';
  CUZDAN.kristal -= k.acik.fiyat; KULE.satin.push(i); cuzdanKaydet(); kuleKaydet(); return 'alindi';
}
export function kuleSec(i) { if (kuleAcikMi(i)) { AYAR.kule = i; return true; } return false; }
// Seçili kule artık kilitliyse (ör. kilit sistemi açıldı) başlangıç kulesine döner.
export const kuleDogrula = () => { if (!kuleAcikMi(AYAR.kule)) AYAR.kule = 0; };
