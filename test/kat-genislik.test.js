// description: kat.js genişlik sınırı ve tohumlu determinizm testleri. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı, TEZDENEME#CLONE). Yalnız ekleme; src'ye dokunmaz.
import test from 'node:test';
import assert from 'node:assert/strict';
import { katUret, genislik, SATIR_KARO } from '../src/kat.js';
import { tohumluRnd } from '../src/hayalet.js';

test('basamak oyun alanından taşmaz: xKaro+genislikKaro <= 35 (kat 100/200/300/400+)', () => {
  const rnd = tohumluRnd(12345);
  for (const taban of [100, 200, 300, 400, 1000]) {
    for (let k = taban; k < taban + 300; k++) {
      const f = katUret(k, rnd);
      assert.ok(f.xKaro + f.genislikKaro <= 35, `kat ${k}: ${f.xKaro}+${f.genislikKaro}`);
      assert.ok(f.genislikKaro >= 2 && f.xKaro >= 5, `kat ${k} alt sınır`);
    }
  }
});

test('uç rastgele değerlerde de sınır korunur (rnd hep 0, 0.5, ~1)', () => {
  for (const r of [0, 0.5, 0.999999]) for (const k of [1, 50, 99, 100, 150, 200, 300, 400, 1000]) {
    const f = katUret(k, () => r);
    assert.ok(f.xKaro + f.genislikKaro <= 35, `r=${r} kat ${k}`);
    assert.ok(Number.isFinite(f.y) && f.genislikKaro >= 2);
  }
});

test('her 50. kat tam genişlik', () => {
  for (const k of [50, 100, 150, 300]) { assert.equal(genislik(k, () => 0.5), SATIR_KARO); assert.equal(katUret(k, () => 0.5).xKaro, 5); }
});

test('deterministik: aynı tohum aynı katı üretir, farklı tohum farklı', () => {
  const uret = (t) => { const r = tohumluRnd(t); return Array.from({ length: 50 }, (_, i) => katUret(i + 100, r)); };
  assert.deepEqual(uret(42), uret(42));
  assert.notDeepEqual(uret(42), uret(43));
});
