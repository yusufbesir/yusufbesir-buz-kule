// description: Çizim süresi ölçümü: sahte tuvalle 1000 kare ciz()+hudCiz() süresi (ortalama, p99, en kötü kare). Gerçek GPU maliyeti değil, yalnız JS tarafı. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı). Çalıştır: node arac/kare-olcum.mjs
import { yeniOyun, adim, ciz } from '../src/oyun.js';
import { hudCiz } from '../src/hud.js';
const sahte = () => new Proxy({}, { get: (_, k) => (k === 'createLinearGradient' || k === 'createRadialGradient') ? () => ({ addColorStop() {} }) : () => {}, set: () => true });
const c = sahte(), o = yeniOyun(() => 0.4);
const giris = (i) => ({ sol: false, sag: i % 40 < 20, zipla: i % 50 === 0 });
for (let i = 0; i < 100; i++) { adim(o, giris(i)); ciz(c, o); hudCiz(c, o, 0, null); } // ısınma
const t = [];
for (let i = 0; i < 1000; i++) {
  if (!o.bitti) adim(o, giris(i));
  const a = performance.now(); ciz(c, o); hudCiz(c, o, 0, null); t.push(performance.now() - a);
}
const topla = t.reduce((s, v) => s + v, 0); t.sort((x, y) => x - y);
console.log(`1000 kare: ortalama ${(topla / 1000).toFixed(4)} ms, p99 ${t[989].toFixed(4)} ms, en kötü ${t[999].toFixed(4)} ms`);
