// description: Buz Kule oyuncu profili (yerel, kalıcı): oynanan oyun sayısı, en yüksek kat, en büyük kombo. Yalnız görüntü; oyun kurallarını etkilemez. Bozuk kayıt varsayılana döner. Sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı).
const PROFIL_ANAHTAR = 'buzkule.profil';
export const PROFIL = { oyun: 0, enKat: 0, enKombo: 0 };
const gecerli = (x) => Number.isInteger(x) && x >= 0 && x <= 1e9;

export function profilYukle() {
  PROFIL.oyun = PROFIL.enKat = PROFIL.enKombo = 0;
  try {
    const k = JSON.parse(localStorage.getItem(PROFIL_ANAHTAR) || 'null');
    if (k) for (const a of Object.keys(PROFIL)) if (gecerli(k[a])) PROFIL[a] = k[a];
  } catch { /* kayıt yoksa ya da bozuksa sıfırdan başlar */ }
}
// Oyun bittiğinde çağrılır: o = bitmiş oyun durumu (enYuksek, enIyiKombo).
export function profilGuncelle(o) {
  PROFIL.oyun++; PROFIL.enKat = Math.max(PROFIL.enKat, o.enYuksek | 0); PROFIL.enKombo = Math.max(PROFIL.enKombo, o.enIyiKombo | 0);
  try { localStorage.setItem(PROFIL_ANAHTAR, JSON.stringify(PROFIL)); } catch { /* sessiz */ }
}
