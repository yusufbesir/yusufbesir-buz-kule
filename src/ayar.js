// description: Buz Kule kullanıcı ayarları (parıltı, parçacık, sarsıntı, ses) ve azaltılmış hareket desteği. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
// Fizik ve oyun kuralları bu ayarlardan etkilenmez; yalnız görünüm ve ses.
const AZ = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export const VARSAYILAN = Object.freeze({ parilti: 1, parcacik: AZ ? 0.25 : 1, sarsinti: AZ ? 0 : 1, ses: 0.8 });
export const AYAR = { ...VARSAYILAN, azaltilmisHareket: AZ };
const ANAHTAR = 'buzkule.ayar';

export function ayarYukle() {
  try {
    const k = JSON.parse(localStorage.getItem(ANAHTAR) || 'null');
    if (k) for (const a of Object.keys(VARSAYILAN)) if (typeof k[a] === 'number' && k[a] >= 0 && k[a] <= 2) AYAR[a] = k[a];
  } catch { /* kayıt yoksa varsayılanlar */ }
}
export function ayarKaydet() {
  try { localStorage.setItem(ANAHTAR, JSON.stringify({ parilti: AYAR.parilti, parcacik: AYAR.parcacik, sarsinti: AYAR.sarsinti, ses: AYAR.ses })); } catch { /* sessiz */ }
}
export function ayarSifirla() { Object.assign(AYAR, VARSAYILAN); ayarKaydet(); }
