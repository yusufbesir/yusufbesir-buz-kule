// description: Görsel katman testi: "akış hali" değeri kombo hedefine yumuşakça yaklaşır ve döner; simülasyon durumuna dokunmaz. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
import test from 'node:test';
import assert from 'node:assert/strict';
import { arkaPlan, akisDegeri, akisSifirla } from '../src/gorsel.js';
import { yeniOyun, adim, ciz } from '../src/oyun.js';

const sahteCtx = () => new Proxy({}, {
  get: (_, k) => (k === 'createLinearGradient' || k === 'createRadialGradient') ? () => ({ addColorStop() {} }) : () => {},
  set: () => true,
});

test('akış hali: hedef 1 iken değer tekdüze artıp 1\'e ulaşır, hedef 0 olunca yumuşakça 0\'a döner', () => {
  akisSifirla(); const c = sahteCtx(); let onceki = 0;
  for (let i = 0; i < 400; i++) { arkaPlan(c, 640, 480, 0, 3, 1); const a = akisDegeri(); assert.ok(a >= onceki && a <= 1, 'tekdüze artmalı'); onceki = a; }
  assert.equal(akisDegeri(), 1);
  arkaPlan(c, 640, 480, 0, 3, 0); assert.ok(akisDegeri() > 0.9, 'bir karede sıfıra düşmemeli (yumuşak dönüş)');
  for (let i = 0; i < 600; i++) arkaPlan(c, 640, 480, 0, 3, 0);
  assert.equal(akisDegeri(), 0);
});

test('akış hali: çizim kombo x5\'te açılır, x4\'te açılmaz ve simülasyon durumunu değiştirmez', () => {
  akisSifirla(); const c = sahteCtx(); const bos = { sag: false, sol: false, zipla: false };
  const o = yeniOyun(() => 0.4); o.puan.kombo = { zip: 4, toplam: 9, sayac: 100 };
  ciz(c, o); assert.equal(akisDegeri(), 0, 'x4 komboda akış açılmamalı');
  o.puan.kombo.zip = 5; const anlik = JSON.stringify({ x: o.x, y: o.y, vx: o.vx, vy: o.vy, kamY: o.kamY, puan: o.puan, ek: o.ek });
  ciz(c, o); assert.ok(akisDegeri() > 0, 'x5 komboda akış açılmalı');
  assert.equal(JSON.stringify({ x: o.x, y: o.y, vx: o.vx, vy: o.vy, kamY: o.kamY, puan: o.puan, ek: o.ek }), anlik, 'çizim durumu değiştirmemeli');
  adim(o, bos); // simülasyon akış değerinden bağımsız ilerler
  akisSifirla();
});
