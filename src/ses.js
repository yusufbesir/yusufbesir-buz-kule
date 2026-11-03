// description: WebAudio ile üretilen özgün ses efektleri (dosya yok); ses düzeyi ayar.js'den. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
import { AYAR } from './ayar.js';
let ctx = null;
function bip(f0, f1, sure, tur = 'square', ses = 0.06) {
  if (AYAR.ses <= 0) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime, v = Math.max(0.0002, ses * AYAR.ses / 0.8);
    o.type = tur; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + sure);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + sure);
  } catch { /* ses yoksa oyun sessiz sürer */ }
}
export const zipSesi = (hiz) => bip(260 + Math.abs(hiz) * 18, 600 + Math.abs(hiz) * 30, 0.14);
export const odulSesi = (toplamKat) => { bip(500, 1000, 0.25, 'triangle', 0.09); if (toplamKat >= 25) setTimeout(() => bip(800, 1600, 0.3, 'triangle', 0.09), 120); };
export const olumSesi = () => bip(400, 60, 0.6, 'sawtooth', 0.08);
export const kristalSesi = () => { bip(900, 1500, 0.12, 'sine', 0.08); setTimeout(() => bip(1300, 2000, 0.14, 'sine', 0.06), 70); };
export const hizSesi = () => { for (let i = 0; i < 4; i++) setTimeout(() => bip(1500, 1500, 0.07, 'square', 0.05), i * 130); }; // alarm saati
