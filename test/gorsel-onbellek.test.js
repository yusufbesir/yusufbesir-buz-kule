// description: Görsel önbellek testi: duvar taş şeridi OffscreenCanvas'ta bir kez çizilir ve kamY'ye göre kaydırılır; OffscreenCanvas yokken eski yol çalışır; 1000 kare çizim ölçümü (sahte tuval). sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
import test from 'node:test';
import assert from 'node:assert/strict';
import { arkaPlan, duvarlar, platform } from '../src/gorsel.js';

function sayacCtx() {
  const say = { arc: 0, fill: 0, drawImage: 0, shadow: 0, grad: 0, ops: 0 };
  const c = new Proxy({}, {
    get: (_, k) => {
      if (k === '__say') return say;
      if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => { say.grad++; return { addColorStop() {} }; };
      return () => { say.ops++; if (k === 'fill' || k === 'fillRect') say.fill++; if (k === 'arcTo') say.arc++; if (k === 'drawImage') say.drawImage++; };
    },
    set: (_, k) => { if (k === 'shadowBlur') say.shadow++; return true; },
  });
  return c;
}

const kare = (c, i) => { const kam = i * 3.7; arkaPlan(c, 640, 480, kam, i % 800); duvarlar(c, 640, 480, kam, i % 800); for (let p = 0; p < 8; p++) platform(c, 120 + p * 7, 40 + p * 55, 140, i % 800, p === 3 ? 10 : 0, p + i); };

test('OffscreenCanvas yokken duvar eski yolla çizilir (taş başına yuvarlak köşe), önbellek gerekmez', () => {
  assert.equal(typeof OffscreenCanvas, 'undefined');
  const c = sayacCtx(); duvarlar(c, 640, 480, 100, 3);
  assert.ok(c.__say.arc > 400, 'taşlar tek tek çizilmeli'); assert.equal(c.__say.drawImage, 0);
});

test('OffscreenCanvas varken duvar tek şerit blitiyle çizilir; şerit tema/kenar başına bir kez üretilir', () => {
  let uretilen = 0, serit;
  globalThis.OffscreenCanvas = class { constructor(g, h) { uretilen++; this.width = g; this.height = h; serit = sayacCtx(); } getContext() { return serit; } };
  try {
    const c = sayacCtx(); duvarlar(c, 640, 480, 100, 3);
    const ilk = uretilen; assert.equal(ilk, 2, 'iki kenar için iki şerit');
    assert.ok(c.__say.arc < 40, 'karede yuvarlak taş çizilmemeli (yalnız mesale tutucuları kalır)'); assert.ok(c.__say.drawImage >= 2 && c.__say.drawImage <= 4);
    for (let i = 0; i < 50; i++) duvarlar(c, 640, 480, i * 17.3 - 300, 3);
    assert.equal(uretilen, ilk, 'tekrar çizimde şerit yeniden üretilmemeli');
    duvarlar(c, 640, 480, 5, 120); assert.equal(uretilen, ilk + 2, 'yeni temada yeni şerit');
  } finally { delete globalThis.OffscreenCanvas; }
});

test('çizim shadowBlur kullanmaz ve sabit gradyanları karelere yayarak yeniden üretmez; 1000 kare ölçümü', () => {
  const c = sayacCtx(); kare(c, 0); const g0 = c.__say.grad;
  const t0 = process.hrtime.bigint(); for (let i = 1; i <= 1000; i++) kare(c, i); const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  assert.equal(c.__say.shadow, 0, 'shadowBlur atanmamalı');
  console.log(`# 1000 kare (arka plan + duvar + 8 basamak, sahte tuval): ${ms.toFixed(1)} ms; kare başı gradyan ${(c.__say.grad - g0) / 1000}`);
});
