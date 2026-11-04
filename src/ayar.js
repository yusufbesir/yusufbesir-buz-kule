// description: Buz Kule kullanıcı ayarları (parıltı, parçacık, sarsıntı, ses, karakter) ve azaltılmış hareket desteği. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
// Fizik ve oyun kuralları bu ayarlardan etkilenmez; yalnız görünüm ve ses.
const AZ = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export const VARSAYILAN = Object.freeze({ parilti: 1, parcacik: AZ ? 0.25 : 1, sarsinti: AZ ? 0 : 1, ses: 0.8, karakter: 0, hud: 1, efektAcik: 1, muzikAcik: 0, zorluk: 1, dil: 0 }); // efektler açık, müzik kapalı başlar
export const ARALIK = Object.freeze({ parilti: [0, 2], parcacik: [0, 2], sarsinti: [0, 2], ses: [0, 1], karakter: [0, 4], hud: [0, 1.5], efektAcik: [0, 1], muzikAcik: [0, 1], zorluk: [0, 3], dil: [0, 10] });
export const KARAKTERLER = Object.freeze(['player', 'adventurer', 'female', 'soldier', 'zombie']);
// Zorluk: 0 kolay, 1 orta (varsayılan), 2 zor, 3 çok zor. Orta dışındaki seviyelerin skor ve hayalet kayıtları ayrı anahtarlarda tutulur.
export const zSonek = (z) => (z === 1 || !Number.isInteger(z) ? '' : '.z' + z);
export const AYAR = { ...VARSAYILAN, azaltilmisHareket: AZ };
const ANAHTAR = 'buzkule.ayar';

export function ayarYukle() {
  try {
    const k = JSON.parse(localStorage.getItem(ANAHTAR) || 'null');
    if (k) for (const a of Object.keys(VARSAYILAN)) if (typeof k[a] === 'number' && k[a] >= ARALIK[a][0] && k[a] <= ARALIK[a][1]) AYAR[a] = k[a];
  } catch { /* kayıt yoksa varsayılanlar */ }
}
export function ayarKaydet() {
  try { localStorage.setItem(ANAHTAR, JSON.stringify(Object.fromEntries(Object.keys(VARSAYILAN).map(a => [a, AYAR[a]])))); } catch { /* sessiz */ }
}
export function ayarSifirla() { Object.assign(AYAR, VARSAYILAN); ayarKaydet(); }
