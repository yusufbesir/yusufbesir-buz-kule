// description: Buz Kule kullanıcı ayarları (parıltı, parçacık, sarsıntı, ses, karakter) ve azaltılmış hareket desteği. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
// Fizik ve oyun kuralları bu ayarlardan etkilenmez; yalnız görünüm ve ses.
const AZ = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export const VARSAYILAN = Object.freeze({ parilti: 1, parcacik: AZ ? 0.25 : 1, sarsinti: AZ ? 0 : 1, ses: 0.8, karakter: 0, hud: 1, efektAcik: 1, muzikAcik: 0, zorluk: 1, dil: 0, golge: 1, perde: 1, kaygan: 0, hayaletGoster: 1, kontrast: 0, mukemmel: 1, muzikSes: 0.8, kule: 0, kuleKilidi: 1, kuleEfekt: 1, yerelYazi: 1 }); // yerelYazi: 1 = Latin dışı dillerde oyun içi yazılar kendi dilinde (sistem yazı tipi), 0 = İngilizce piksel yazı // kule: seçili kule konsepti (0 Buz); kuleKilidi: 1 = başarım/kristal kilitleri açık, 0 = hepsi serbest // golge/perde/kaygan: ek özellikler; kaygan buz yeni fizik olduğu için varsayılan kapalı // efektler açık, müzik kapalı başlar
export const ARALIK = Object.freeze({ parilti: [0, 2], parcacik: [0, 2], sarsinti: [0, 2], ses: [0, 1], karakter: [0, 4], hud: [0, 1.5], efektAcik: [0, 1], muzikAcik: [0, 1], zorluk: [0, 3], dil: [0, 10], golge: [0, 1], perde: [0, 1], kaygan: [0, 1], hayaletGoster: [0, 1], kontrast: [0, 1], mukemmel: [0, 1], muzikSes: [0, 1], kule: [0, 4], kuleKilidi: [0, 1], kuleEfekt: [0, 1], yerelYazi: [0, 1] });
export const KARAKTERLER = Object.freeze(['player', 'adventurer', 'female', 'soldier', 'zombie']);
// Zorluk: 0 kolay, 1 orta (varsayılan), 2 zor, 3 çok zor. Orta dışındaki seviyelerin skor ve hayalet kayıtları ayrı anahtarlarda tutulur.
export const zSonek = (z) => (z === 1 || !Number.isInteger(z) ? '' : '.z' + z);
// ISO hafta kimliği (yıl-Hnn, yerel tarih): haftalık meydan okuma kulesi ve kayıt anahtarları için.
export function haftaKimlik(tarih = new Date()) {
  const d = new Date(Date.UTC(tarih.getFullYear(), tarih.getMonth(), tarih.getDate())), gun = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - gun); const yil = d.getUTCFullYear(), ilk = new Date(Date.UTC(yil, 0, 1));
  return yil + '-H' + String(Math.ceil(((d - ilk) / 86400000 + 1) / 7)).padStart(2, '0');
}
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
