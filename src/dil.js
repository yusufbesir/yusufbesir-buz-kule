// description: Buz Kule çok dilli arayüz (Türkçe + 10 yaygın dil). Metinler arac/dil/*.json'dan derlenen dil_veri.js içindedir; HTML'de data-d (metin) ve data-dt (öznitelik: title/aria-label) ile işaretlenir. Oyun içi piksel yazı yalnız Latin harfleri çizdiği için Latin olmayan dillerde kısa oyun içi yazılar İngilizce kalır. Sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı).
import { AYAR } from './ayar.js';
import { DILVERI } from './dil_veri.js';

export const DILLER = Object.freeze([
  { kod: 'tr', ad: 'Türkçe', yon: 'ltr', latin: true }, { kod: 'en', ad: 'English', yon: 'ltr', latin: true },
  { kod: 'zh', ad: '中文', yon: 'ltr', latin: false }, { kod: 'hi', ad: 'हिन्दी', yon: 'ltr', latin: false },
  { kod: 'es', ad: 'Español', yon: 'ltr', latin: true }, { kod: 'fr', ad: 'Français', yon: 'ltr', latin: true },
  { kod: 'ar', ad: 'العربية', yon: 'rtl', latin: false }, { kod: 'bn', ad: 'বাংলা', yon: 'ltr', latin: false },
  { kod: 'pt', ad: 'Português', yon: 'ltr', latin: true }, { kod: 'ru', ad: 'Русский', yon: 'ltr', latin: false },
  { kod: 'id', ad: 'Bahasa Indonesia', yon: 'ltr', latin: true },
]);
const dilNo = () => (Number.isInteger(AYAR.dil) && AYAR.dil >= 0 && AYAR.dil < DILLER.length ? AYAR.dil : 0);
const doldur = (s, d) => (d ? s.replace(/\{(\w+)\}/g, (m, k) => (k in d ? String(d[k]) : m)) : s);
// Menü ve genel metinler: seçili dil, yoksa İngilizce, yoksa Türkçe, yoksa anahtarın kendisi.
export function t(anahtar, degerler) {
  const kod = DILLER[dilNo()].kod;
  return doldur((DILVERI[kod] && DILVERI[kod][anahtar]) ?? (DILVERI.en && DILVERI.en[anahtar]) ?? (DILVERI.tr && DILVERI.tr[anahtar]) ?? anahtar, degerler);
}
// Oyun içi piksel yazı metni: Latin harfli dillerde seçili dil, diğerlerinde İngilizce.
export function th(anahtar, degerler) {
  const kod = DILLER[dilNo()].latin ? DILLER[dilNo()].kod : 'en';
  return doldur((DILVERI[kod] && DILVERI[kod][anahtar]) ?? (DILVERI.tr && DILVERI.tr[anahtar]) ?? anahtar, degerler);
}
// HTML'deki işaretli öğeleri seçili dile çevirir; sayfa dilini ve yönünü ayarlar.
export function dilUygula(kok = document) {
  const d = DILLER[dilNo()];
  if (typeof document !== 'undefined' && document.documentElement) { document.documentElement.lang = d.kod; document.documentElement.dir = d.yon; }
  kok.querySelectorAll('[data-d]').forEach((e) => { e.textContent = t(e.getAttribute('data-d')); });
  kok.querySelectorAll('[data-dt]').forEach((e) => {
    for (const cift of e.getAttribute('data-dt').split(';')) { const [ad, k] = cift.split(':'); if (ad && k) e.setAttribute(ad, t(k)); }
  });
}
