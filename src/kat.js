// description: Prosedürel kat üretimi (özgün kod). sahip: Claude (Buz Kule iş parçacığı)
export const KARO = 16, KAT_ARALIK = 80, SATIR_KARO = 30;
export const ZEMIN_Y = 440, AYAK = 10; // zemin çizgisi; ayak yarı genişliği: basamak kenarından bu kadar taşan ayak hâlâ basamağa basar (Rust çekirdeğiyle ortak)
export function genislik(kat, rnd) {
  if (kat > 0 && kat % 50 === 0) return SATIR_KARO;
  const aralik = Math.max(1, Math.round((300 - kat) / 30));
  const w = 6 + Math.floor(rnd() * aralik);
  const ust = kat < 100 ? SATIR_KARO : Math.max(2, 6 - Math.floor(kat / 100));
  return Math.max(2, Math.min(w, ust));
}
export function katUret(kat, rnd = Math.random) {
  const w = genislik(kat, rnd);
  const bas = 5 + (w === SATIR_KARO ? 0 : Math.floor(rnd() * (SATIR_KARO - w + 1)));
  const kristal = kat > 0 && rnd() < 0.3, kristalX = rnd(); // toplanabilir kristal: katların ~%30'unda, basamağın üstünde yüzer
  // güç öğesi (kristalsiz katların ~%7'sinde): 'saat' kaymayı yavaşlatır, 'miknatis' yakındaki kristalleri çeker
  const gucZar = rnd(), guc = kat > 4 && !kristal && gucZar < 0.07 ? (gucZar < 0.035 ? 'saat' : 'miknatis') : null;
  // basamak türü (kat 15'ten sonra; numaralı ve tam genişlik katlar hep normal): 'kirilgan' basılınca kırılır, 'yay' yukarı fırlatır
  const turZar = rnd(), tur = kat >= 15 && kat % 10 !== 0 && w < SATIR_KARO ? (turZar < 0.08 ? 'kirilgan' : turZar < 0.14 ? 'yay' : 'normal') : 'normal';
  return { kat, y: -kat * KAT_ARALIK, xKaro: bas, genislikKaro: w, no: kat % 10 === 0, tema: Math.floor(kat / 100), kristal, kristalX, guc, tur };
}
