// description: WebAudio ile üretilen özgün ses efektleri (dosya yok). sahip: Claude (Icy Tower iş parçacığı)
let ctx = null;
function bip(f0, f1, sure, tur = 'square', ses = 0.06) {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
    o.type = tur; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + sure);
    g.gain.setValueAtTime(ses, t); g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + sure);
  } catch { /* ses yoksa oyun sessiz sürer */ }
}
export const zipSesi = (hiz) => bip(260 + Math.abs(hiz) * 18, 600 + Math.abs(hiz) * 30, 0.14);
export const odulSesi = (toplamKat) => { bip(500, 1000, 0.25, 'triangle', 0.09); if (toplamKat >= 25) setTimeout(() => bip(800, 1600, 0.3, 'triangle', 0.09), 120); };
export const olumSesi = () => bip(400, 60, 0.6, 'sawtooth', 0.08);
