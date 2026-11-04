// description: Buz Kule yerel skor tabloları: her oyun kipi (yeni, hayalet, günün kulesi) için ayrı ilk 5, kalıcı. Eski tek tablo "yeni" kipine devredilir. Oyun kurallarını etkilemez. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
import { zSonek } from './ayar.js';
export const SKOR_SAYISI = 5;
const SKOR_ESKI_ANAHTAR = 'buzkule.skorlar'; // 0.10-0.14: tek tablo; artık "yeni" kipinin tablosu
const bugun = () => { const t = new Date(); return t.getFullYear() + '-' + (t.getMonth() + 1) + '-' + t.getDate(); };
export const skorAnahtari = (mod, z = 1) => (mod === 'hayalet' ? 'buzkule.skorlar.hayalet' : mod === 'gunun' ? 'buzkule.skorlar.gunun.' + bugun() : SKOR_ESKI_ANAHTAR) + zSonek(z);

const gecerli = (x) => x && Number.isFinite(x.skor) && x.skor > 0 && Number.isFinite(x.kat) && Number.isFinite(x.t);
// Kipin tablosunu okur (sıralı, en çok 5, geçersiz satırlar atılır); bozuk kayıtta boş tablo döner.
export function skorListesi(mod, z = 1) {
  try {
    const k = JSON.parse(localStorage.getItem(skorAnahtari(mod, z)) || '[]');
    return Array.isArray(k) ? k.filter(gecerli).sort((a, b) => b.skor - a.skor || a.t - b.t).slice(0, SKOR_SAYISI) : [];
  } catch { return []; }
}
// Skoru kipin tablosuna ekler; sırasını (1'den başlar) döndürür, ilk 5'e giremediyse 0. Sıfır skor eklenmez.
export function skorEkle(mod, skor, kat, z = 1) {
  if (!(skor > 0)) return 0;
  const kayit = { skor, kat, t: Date.now() }, liste = skorListesi(mod, z);
  liste.push(kayit); liste.sort((a, b) => b.skor - a.skor || a.t - b.t);
  const kesik = liste.slice(0, SKOR_SAYISI);
  try { localStorage.setItem(skorAnahtari(mod, z), JSON.stringify(kesik)); } catch { /* sessiz */ }
  return kesik.indexOf(kayit) + 1;
}
