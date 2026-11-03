// description: Buz Kule hayalet kaydı: tohumlu rastgelelik, giriş kaydı (kosu uzunluğu kodlu) ve kalıcı en iyi oyun kayıtları. Oyun kurallarını değiştirmez. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
export const SOL = 1, SAG = 2, ZIPLA = 4;

// mulberry32: küçük, hızlı, tekrarlanabilir rastgele sayı üreteci
export function tohumluRnd(tohum) {
  let a = tohum >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// Kat başına ayrı üreteç: katlar hangi sırayla görüntülenirse görüntülensin aynı kalır (oyuncu ve hayalet aynı kuleyi görür).
export const katRnd = (tohum, n) => tohumluRnd(((tohum >>> 0) ^ Math.imul(n + 1, 0x9E3779B1)) >>> 0);
export const yeniTohum = () => (Math.random() * 4294967296) >>> 0;
export function gunlukTohum(tarih = new Date()) { // yerel tarihe göre günlük tohum
  const s = tarih.getFullYear() * 10000 + (tarih.getMonth() + 1) * 100 + tarih.getDate(); return (Math.imul(s, 2654435761) >>> 0) || 1;
}
export const gunlukAnahtar = (tarih = new Date()) => 'buzkule.hayalet.' + tarih.getFullYear() + '-' + (tarih.getMonth() + 1) + '-' + tarih.getDate();

export const girisBit = (g) => (g.sol ? SOL : 0) | (g.sag ? SAG : 0) | (g.zipla ? ZIPLA : 0);
export const bitGiris = (b) => ({ sol: !!(b & SOL), sag: !!(b & SAG), zipla: !!(b & ZIPLA) });

// Kayıt: kare başına 3 bitlik giriş; art arda aynı değerler [değer, sayı] çiftleriyle sıkıştırılır.
export function kayitBaslat() { return { kosu: [], son: -1, sayi: 0, kare: 0 }; }
export function kayitEkle(k, g) {
  const b = girisBit(g); k.kare++;
  if (b === k.son) k.sayi++; else { if (k.sayi) k.kosu.push(k.son, k.sayi); k.son = b; k.sayi = 1; }
}
export function kayitBitir(k, tohum, skor, kat) { const kosu = k.kosu.slice(); if (k.sayi) kosu.push(k.son, k.sayi); return { tohum, kosu, skor, kat, kare: k.kare }; }
export function kayitCoz(kayit) { // kare kare giriş bitleri dizisi
  const out = []; for (let i = 0; i + 1 < kayit.kosu.length; i += 2) for (let j = 0; j < kayit.kosu[i + 1]; j++) out.push(kayit.kosu[i]); return out;
}
export function kayitGecerli(k) {
  return !!k && Number.isFinite(k.tohum) && Number.isFinite(k.skor) && Number.isFinite(k.kat) && Array.isArray(k.kosu) && k.kosu.length % 2 === 0 && k.kosu.length < 40000
    && k.kosu.every(v => Number.isInteger(v) && v >= 0);
}
export function kayitOku(anahtar) {
  try { const k = JSON.parse(localStorage.getItem(anahtar) || 'null'); return kayitGecerli(k) ? k : null; } catch { return null; }
}
export function kayitYaz(anahtar, kayit) { try { localStorage.setItem(anahtar, JSON.stringify(kayit)); } catch { /* sessiz */ } }
export const HAYALET_ANAHTAR = 'buzkule.hayalet';
