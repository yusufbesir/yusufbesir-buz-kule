// description: Buz Kule ses ve müzik: hazır CC0 dosyalarını (Kenney Digital Audio efektleri, SketchyLogic NES müziği; kaynak varlik/ses/KAYNAK.txt) HTMLAudio ile çalar. Efekt ve müzik ayrı açılıp kapanır; ses düzeyi ayar.js'den. Orijinal oyunun sesi yok. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
import { AYAR } from './ayar.js';
const YOL = './varlik/ses/', MUZIK_SES = 0.32;
const kaynaklar = {}, havuzlar = {};
const HAVUZ = 3; // ad başına dönüşümlü Audio sayısı: aynı efekt üst üste çalabilir, her çalmada yeni nesne üretilmez
const ses_var = () => typeof Audio !== 'undefined';
const belge = () => (typeof document !== 'undefined' ? document : null);
function dosya(ad) { // ad uzantısız ve ".ogg"; uzantılıysa olduğu gibi
  if (!kaynaklar[ad]) { const a = new Audio(YOL + (ad.includes('.') ? ad : ad + '.ogg')); a.preload = 'auto'; kaynaklar[ad] = a; }
  return kaynaklar[ad];
}
function havuz(ad) { // ilk istekte kurulur; kopyalar yüklenmiş kaynağı paylaşır
  if (!havuzlar[ad]) { const t = dosya(ad); const liste = []; for (let i = 0; i < HAVUZ; i++) liste.push(typeof t.cloneNode === 'function' ? t.cloneNode() : new Audio(t.src)); havuzlar[ad] = { liste, i: 0 }; }
  return havuzlar[ad];
}
// Efekt çalar: efektler kapalıysa ya da ses düzeyi 0 ise hiçbir şey olmaz. Havuzdaki nesneler sırayla kullanılır.
function cal(ad, ses = 1, perde = 1) {
  if (!ses_var() || !AYAR.efektAcik || AYAR.ses <= 0) return;
  try {
    const h = havuz(ad), a = h.liste[h.i]; h.i = (h.i + 1) % h.liste.length;
    try { a.currentTime = 0; } catch { /* henüz yüklenmemiş olabilir */ }
    a.preservesPitch = false; a.playbackRate = perde; // perde: 1 = normal; kombo büyüdükçe yükselir
    a.volume = Math.max(0, Math.min(1, AYAR.ses * ses)); const s = a.play(); if (s && s.catch) s.catch(() => {});
  } catch { /* ses yoksa oyun sessiz sürer */ }
}
const EFEKTLER = ['phaseJump1', 'phaseJump3', 'phaseJump5', 'powerUp5', 'powerUp8', 'lowDown', 'pepSound3', 'threeTone1', 'powerUp1', 'phaserUp3', 'lowRandom', 'kazanma.wav'];
export function efektOnYukle() { // ilk kullanımı beklemeden açılışta yükler; Audio yoksa sessiz geçer
  if (!ses_var()) return;
  try { for (const ad of EFEKTLER) havuz(ad); } catch { /* ses yoksa oyun sessiz sürer */ }
}
efektOnYukle();
export const zipSesi = (hiz, kombo = 0) => cal(Math.abs(hiz) > 9 ? 'phaseJump5' : Math.abs(hiz) > 5 ? 'phaseJump3' : 'phaseJump1', 0.7, 1 + Math.min(Math.max(kombo, 0), 8) * 0.06); // kombo perdesi: her kombo zıplamasında ~%6 yükselir (en çok 8 basamak)
export const odulSesi = (toplamKat) => cal(toplamKat >= 25 ? 'powerUp8' : 'powerUp5', 0.9);
export const olumSesi = () => cal('lowDown', 0.9);
export const kristalSesi = () => cal('pepSound3', 0.8);
export const hizSesi = () => cal('threeTone1', 0.8);
export const gucSesi = () => cal('powerUp1', 0.8);
export const yaySesi = () => cal('phaserUp3', 0.8);
export const kirmaSesi = () => cal('lowRandom', 0.9);
export const basarimSesi = () => cal('kazanma.wav', 0.7);

// Müzik: kısa döngülü bir parça; yalnız oyun sürerken çalar. Açık/kapalı ayardan (varsayılan kapalı), duraklatınca durur.
// Düzey AYAR.ses ile ölçeklenir (0 ise çalmaz). Autoplay reddedilirse ilk tuş/dokunuşta bir kez yeniden denenir; sekme gizlenince duraklar.
let muzik = null, istek = false, bekleyen = false;
const calmali = () => istek && !!AYAR.muzikAcik && AYAR.ses > 0 && !(belge() && belge().hidden);
function dene() {
  if (!muzik) return;
  const s = muzik.play();
  if (s && s.catch) s.catch(() => { if (!bekleyen) { bekleyen = true; kullaniciBekle(); } });
}
function kullaniciBekle() {
  const d = belge(); if (!d || !d.addEventListener) return;
  const tetik = () => { d.removeEventListener('pointerdown', tetik); d.removeEventListener('keydown', tetik); bekleyen = false; try { if (calmali() && muzik && muzik.paused) { const s = muzik.play(); if (s && s.catch) s.catch(() => {}); } } catch { /* sessiz */ } };
  d.addEventListener('pointerdown', tetik); d.addEventListener('keydown', tetik);
}
export function muzikGuncelle(calsin, bastan = false) { // bastan: yeni oyun, parça başa sarılır
  if (!ses_var()) return;
  try {
    istek = !!calsin;
    if (!muzik) { muzik = new Audio(YOL + 'muzik.wav'); muzik.loop = true; }
    muzik.volume = Math.max(0, Math.min(1, MUZIK_SES * AYAR.ses));
    if (bastan) { try { muzik.currentTime = 0; } catch { /* yüklenmemiş olabilir */ } }
    if (calmali()) dene(); else muzik.pause();
  } catch { /* müzik yoksa oyun sessiz sürer */ }
}
const gorunurluk = belge();
if (gorunurluk && gorunurluk.addEventListener) gorunurluk.addEventListener('visibilitychange', () => {
  if (!muzik) return;
  try { if (calmali()) dene(); else muzik.pause(); } catch { /* sessiz */ }
});
export const muzikCaliyor = () => !!muzik && !muzik.paused;
