import test from 'node:test';
import assert from 'node:assert/strict';
import { yeniPuan, inis, kare, odulAdi, toplam, KOMBO_KARE } from '../src/puan.js';
import { katUret, genislik } from '../src/kat.js';

test('ödül eşikleri', () => {
  assert.equal(odulAdi(6),'İYİ'); assert.equal(odulAdi(7),'GÜZEL'); assert.equal(odulAdi(50),'İNANILMAZ'); assert.equal(odulAdi(200),'KUSURSUZ');
});
test('iki kombo zıplaması sonra tek kat bonus verir', () => {
  const p = yeniPuan(); inis(p, 3); inis(p, 4);
  const o = inis(p, 1);
  assert.deepEqual(o, { ad: 'GÜZEL', toplam: 7, zip: 2 });
  assert.equal(toplam(p, 10), 100 + 49);
});
test('tek zıplamalı kombo bonus vermez', () => {
  const p = yeniPuan(); inis(p, 3); assert.equal(inis(p, 1), null); assert.equal(p.bonus, 0);
});
test('sayaç dolunca kombo biter', () => {
  const p = yeniPuan(); inis(p, 2); inis(p, 2);
  let o = null; for (let i = 0; i < KOMBO_KARE && !o; i++) o = kare(p);
  assert.equal(o.toplam, 4);
});
test('kat üretimi sınırlar içinde', () => {
  let s = 1; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let k = 1; k < 600; k++) { const f = katUret(k, rnd); assert.ok(f.xKaro >= 5 && f.xKaro + f.genislikKaro <= 35); assert.ok(f.genislikKaro >= 2); }
  assert.equal(genislik(50, rnd), 30);
});
