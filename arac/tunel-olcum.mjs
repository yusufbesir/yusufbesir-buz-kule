// description: Buz Kule tünelleme ölçümü: basamak çizgisini geçen 200.000 rastgele hızlı hareketi ince adımlı süpürme referansıyla karşılaştırır (oyun basamağı kaçırıyor mu?). Sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı). Çalıştır: node arac/tunel-olcum.mjs
import { inisBulJS } from 'file:///D:/Programlar/IcyTower-klon/src/cekirdek.js';
import { katUret, KARO, KAT_ARALIK, ZEMIN_Y, AYAK } from 'file:///D:/Programlar/IcyTower-klon/src/kat.js';
import { katRnd } from 'file:///D:/Programlar/IcyTower-klon/src/hayalet.js';
let s = 1; const r = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
let toplam = 0, mevcutKacirdi = 0, genisIndi = 0;
for (let i = 0; i < 200000; i++) {
  const tohum = (r() * 4294967296) >>> 0, katFn = (n) => katUret(n, katRnd(tohum, n)), n = 360 + Math.floor(r() * 200); // zor bölge: dar basamaklar
  const f = katFn(n), py = ZEMIN_Y - n * KAT_ARALIK, kx0 = 85 + (f.xKaro - 5) * KARO, kx1 = kx0 + f.genislikKaro * KARO;
  const vy = 4 + r() * 8.2, vx = (r() - 0.5) * 24.4, eskiY = py - r() * vy, y = eskiY + vy, eskiX = kx0 - 40 + r() * (kx1 - kx0 + 80), x = eskiX + vx;
  // referans: yolu 200 küçük adımla süpür; basamak çizgisini geçtiği anda ayak (±AYAK) basamak üstündeyse inmeli
  let ref = false; for (let k = 0; k <= 200; k++) { const t = k / 200, yy = eskiY + (y - eskiY) * t; if (eskiY <= py && yy >= py) { const xx = eskiX + (x - eskiX) * t; if (xx >= kx0 - AYAK && xx <= kx1 + AYAK) ref = true; break; } }
  if (!(eskiY <= py && y >= py)) continue; toplam++;
  const sonuc = inisBulJS(katFn, () => false, x, y, eskiX, eskiY) === n || (inisBulJS(katFn, () => false, x, y, eskiX, eskiY) >= 0 && inisBulJS(katFn, () => false, x, y, eskiX, eskiY) < n);
  if (ref && !sonuc) mevcutKacirdi++;
  if (!ref && sonuc) genisIndi++;
}
console.log('basamak çizgisini geçen senaryo:', toplam, '| ince süpürme inmesi gerekirken oyun kaçırdı:', mevcutKacirdi, '| süpürmeye göre inmemesi gerekirken oyun indirdi (affedici uç payı):', genisIndi);
