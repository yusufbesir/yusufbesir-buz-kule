// description: Buz Kule Rust geçişi aşama 0 ölçümü: adim(), katUret() ve kayitCoz() süreleri ile uzun koşu bellek kullanımı (JS tabanı). Sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı). Çalıştır: node arac/olcum-asama0.mjs
import { yeniOyun, adim } from '../src/oyun.js';
import { katUret } from '../src/kat.js';
import { katRnd, kayitCoz } from '../src/hayalet.js';
const sure = (f, n) => { const t = process.hrtime.bigint(); for (let i = 0; i < n; i++) f(i); return Number(process.hrtime.bigint() - t) / 1e3 / n; }; // mikrosaniye/çağrı
console.log('katUret        µs/çağrı:', sure((i) => katUret(i % 300, katRnd(i, i % 300)), 200000).toFixed(3));
let o = yeniOyun(5), yon = 1, kare = 0; const bellek0 = process.memoryUsage().heapUsed;
const adimUs = sure((i) => { if (i % 40 === 0) yon = -yon; if (o.bitti) o = yeniOyun(5 + i); adim(o, { sol: yon < 0, sag: yon > 0, zipla: true }); kare++; }, 100000);
console.log('adim           µs/çağrı:', adimUs.toFixed(3), '(canlı kare:', kare, ', kat:', o.enYuksek, ')');
const kayit = { kosu: Array.from({ length: 20000 }, (_, i) => (i % 2 ? 50 : i % 8)) };
console.log('kayitCoz       µs/çağrı (10000 koşu):', sure(() => kayitCoz(kayit), 200).toFixed(1));
console.log('yığın artışı MB:', ((process.memoryUsage().heapUsed - bellek0) / 1e6).toFixed(1));
console.log('50 FPS kare bütçesi: 20000 µs; adim payı: %' + (adimUs / 200).toFixed(3));
