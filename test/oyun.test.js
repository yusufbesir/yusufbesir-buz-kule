import test from 'node:test';
import assert from 'node:assert/strict';
import { yeniOyun, adim } from '../src/oyun.js';
test('1000 kare rastgele girdiyle çökmeden döner, değerler sonlu', () => {
  let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const o = yeniOyun(rnd);
  for (let i = 0; i < 1000; i++) adim(o, { sol: rnd() < .4, sag: rnd() < .4, zipla: rnd() < .3 });
  for (const v of [o.x, o.y, o.vx, o.vy, o.kamY]) assert.ok(Number.isFinite(v));
  assert.ok(o.x >= 85 && o.x <= 555);
});
test('yerden zıplayınca havaya kalkar', () => {
  const o = yeniOyun(); adim(o, { sag: true, zipla: true }); assert.ok(o.havada && o.vy < 0);
});
