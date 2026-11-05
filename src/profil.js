// description: Buz Kule oyuncu profili (yerel, kalıcı): oynanan oyun sayısı, en yüksek kat, en büyük kombo. Yalnız görüntü; oyun kurallarını etkilemez. Bozuk kayıt varsayılana döner. Sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı).
import { depoOku, depoYaz } from './depo.js';
const PROFIL_ANAHTAR = 'buzkule.profil';
export const PROFIL = { oyun: 0, enKat: 0, enKombo: 0 };
const profilDegeriGecerli = (x) => Number.isInteger(x) && x >= 0 && x <= 1e9;

export function profilYukle() {
  PROFIL.oyun = PROFIL.enKat = PROFIL.enKombo = 0;
  const k = depoOku(PROFIL_ANAHTAR); // kayıt yoksa ya da bozuksa sıfırdan başlar
  if (k && typeof k === 'object') for (const a of Object.keys(PROFIL)) if (profilDegeriGecerli(k[a])) PROFIL[a] = k[a];
}
// Oyun bittiğinde çağrılır: o = bitmiş oyun durumu (enYuksek, enIyiKombo).
export function profilGuncelle(o) {
  PROFIL.oyun++; PROFIL.enKat = Math.max(PROFIL.enKat, o.enYuksek | 0); PROFIL.enKombo = Math.max(PROFIL.enKombo, o.enIyiKombo | 0);
  depoYaz(PROFIL_ANAHTAR, PROFIL);
}
