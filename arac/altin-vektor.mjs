// description: Buz Kule Rust geçişi için "altın vektör" üretici: JS kat üretiminin (katRnd + katUret) çıktısını sabit tohumlar için JSON'a döker; Rust/wasm eşdeğerlik testi bununla karşılaştırır. Sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı). Çalıştır: node arac/altin-vektor.mjs
import fs from 'node:fs';
import { katRnd } from '../src/hayalet.js';
import { katUret } from '../src/kat.js';
const tohumlar = [0, 1, 2, 3, 7, 42, 1234, 99999, 2147483647, 4294967295, ...Array.from({ length: 190 }, (_, i) => (i * 2654435761) >>> 0)];
const cikti = tohumlar.map((t) => ({ tohum: t, katlar: Array.from({ length: 600 }, (_, n) => { const k = katUret(n, katRnd(t, n)); return [k.kat, k.xKaro, k.genislikKaro, k.no ? 1 : 0, k.tema, k.kristal ? 1 : 0, +k.kristalX.toFixed(12), k.guc || '', k.tur]; }) }));
fs.writeFileSync(new URL('../test/altin/kat.json', import.meta.url), JSON.stringify({ alanlar: ['kat', 'xKaro', 'genislikKaro', 'no', 'tema', 'kristal', 'kristalX', 'guc', 'tur'], tohumlar: cikti }));
console.log('yazıldı', cikti.length, 'tohum x 600 kat');
