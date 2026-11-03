// description: Buz Kule yerel skor tablosu (ilk 10, kalıcı). Oyun kurallarını etkilemez. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
const SKOR_ANAHTAR = 'buzkule.skorlar';
export const SKORLAR = [];

export function skorlariYukle() {
  try {
    const k = JSON.parse(localStorage.getItem(SKOR_ANAHTAR) || '[]');
    if (Array.isArray(k)) SKORLAR.splice(0, SKORLAR.length, ...k.filter(x => x && Number.isFinite(x.skor) && Number.isFinite(x.kat)).slice(0, 10));
  } catch { /* kayıt yoksa boş tablo */ }
}
// Skoru tabloya ekler; tablodaki sırasını (1'den başlar) döndürür, ilk 10'a giremediyse 0. Sıfır skor eklenmez.
export function skorEkle(skor, kat) {
  if (!(skor > 0)) return 0;
  const kayit = { skor, kat, t: Date.now() };
  SKORLAR.push(kayit); SKORLAR.sort((a, b) => b.skor - a.skor || a.t - b.t);
  if (SKORLAR.length > 10) SKORLAR.length = 10;
  try { localStorage.setItem(SKOR_ANAHTAR, JSON.stringify(SKORLAR)); } catch { /* sessiz */ }
  return SKORLAR.indexOf(kayit) + 1;
}
