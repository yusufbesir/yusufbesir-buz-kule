// description: Buz Kule ses ve müzik: hazır CC0 dosyalarını (Kenney Digital Audio efektleri, SketchyLogic NES müziği; kaynak varlik/ses/KAYNAK.txt) HTMLAudio ile çalar. Efekt ve müzik ayrı açılıp kapanır; ses düzeyi ayar.js'den. Orijinal oyunun sesi yok. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
import { AYAR } from './ayar.js';
const YOL = './varlik/ses/', MUZIK_SES = 0.32;
const kaynaklar = {};
const ses_var = () => typeof Audio !== 'undefined';
function dosya(ad) { // ad uzantısız ve ".ogg"; uzantılıysa olduğu gibi
  if (!kaynaklar[ad]) { const a = new Audio(YOL + (ad.includes('.') ? ad : ad + '.ogg')); a.preload = 'auto'; kaynaklar[ad] = a; }
  return kaynaklar[ad];
}
// Efekt çalar: efektler kapalıysa ya da ses düzeyi 0 ise hiçbir şey olmaz. Aynı efekt üst üste çalabilsin diye kopya kullanılır.
function cal(ad, ses = 1) {
  if (!ses_var() || !AYAR.efektAcik || AYAR.ses <= 0) return;
  try { const a = dosya(ad).cloneNode(); a.volume = Math.max(0, Math.min(1, AYAR.ses * ses)); const s = a.play(); if (s && s.catch) s.catch(() => {}); } catch { /* ses yoksa oyun sessiz sürer */ }
}
export const zipSesi = (hiz) => cal(Math.abs(hiz) > 9 ? 'phaseJump5' : Math.abs(hiz) > 5 ? 'phaseJump3' : 'phaseJump1', 0.7);
export const odulSesi = (toplamKat) => cal(toplamKat >= 25 ? 'powerUp8' : 'powerUp5', 0.9);
export const olumSesi = () => cal('lowDown', 0.9);
export const kristalSesi = () => cal('pepSound3', 0.8);
export const hizSesi = () => cal('threeTone1', 0.8);
export const gucSesi = () => cal('powerUp1', 0.8);
export const yaySesi = () => cal('phaserUp3', 0.8);
export const kirmaSesi = () => cal('lowRandom', 0.9);
export const basarimSesi = () => cal('kazanma.wav', 0.7);

// Müzik: kısa döngülü bir parça; yalnız oyun sürerken çalar. Açık/kapalı ayardan (varsayılan kapalı), duraklatınca durur.
let muzik = null;
export function muzikGuncelle(calsin) {
  if (!ses_var()) return;
  try {
    if (!muzik) { muzik = new Audio(YOL + 'muzik.wav'); muzik.loop = true; }
    muzik.volume = MUZIK_SES;
    if (calsin && AYAR.muzikAcik) { const s = muzik.play(); if (s && s.catch) s.catch(() => {}); } else muzik.pause();
  } catch { /* müzik yoksa oyun sessiz sürer */ }
}
export const muzikCaliyor = () => !!muzik && !muzik.paused;
