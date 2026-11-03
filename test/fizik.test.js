import test from 'node:test';
import assert from 'node:assert/strict';
import { yatayGuncelle, zipla, duvarSekmesi, dikeyGuncelle, SABIT } from '../src/fizik.js';

test('hız maksimumu aşmaz', () => {
  let vx = 0;
  for (let i = 0; i < 200; i++) vx = yatayGuncelle(vx, false, true);
  assert.equal(vx, SABIT.MAKS_VX);
});
test('tuş yokken sürtünme', () => assert.ok(Math.abs(yatayGuncelle(10, false, false) - 9) < 1e-9));
test('ters yönde hız önce 0.7 ile çarpılır', () => assert.ok(Math.abs(yatayGuncelle(10, true, false) - (-3.0 + 0)) > 0 && yatayGuncelle(10, true, false) === 10 * 0.7 - 0.3));
test('zıplama hızla orantılı, alt sınırlı', () => {
  assert.equal(zipla(0), -12.2);
  assert.equal(zipla(12.2), -24.4);
});
test('duvardan sekme', () => {
  const r = duvarSekmesi(560, 8);
  assert.equal(r.x, 555); assert.ok(Math.abs(r.vx + 7.2) < 1e-9);
});
test('düşme hızı sınırlı', () => assert.equal(dikeyGuncelle(12), 12.2));
