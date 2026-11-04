// description: puan.js kenar durumları (kombo kesilmesi, ödül eşikleri). sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı, TEZDENEME#CLONE). Yalnız ekleme; src'ye dokunmaz.
import test from 'node:test';
import assert from 'node:assert/strict';
import { yeniPuan, inis, kare, odulAdi, toplam, KOMBO_KARE } from '../src/puan.js';

test('kombo kesilmesi: tek zıplamalı kombo sonra 1 kat bonus vermez', () => {
  const p = yeniPuan();
  assert.equal(inis(p, 3), null);
  assert.equal(inis(p, 1), null);
  assert.equal(p.bonus, 0); assert.equal(p.kombo, null);
});

test('inis(2),inis(3),inis(0): toplam 5, bonus 25, zip 2', () => {
  const p = yeniPuan();
  inis(p, 2); inis(p, 3);
  assert.deepEqual(inis(p, 0), { ad: 'İYİ', toplam: 5, zip: 2 });
  assert.equal(p.bonus, 25); assert.equal(p.kombo, null);
});

test('düşüş (negatif kat farkı) komboyu bitirir', () => {
  const p = yeniPuan(); inis(p, 2); inis(p, 2);
  assert.equal(inis(p, -3).zip, 2); assert.equal(p.bonus, 16);
});

test('ödül eşik sınırları: 6/7, 199/200 ve diğer eşikler', () => {
  assert.equal(odulAdi(6), 'İYİ'); assert.equal(odulAdi(7), 'GÜZEL');
  assert.equal(odulAdi(199), 'DESTAN'); assert.equal(odulAdi(200), 'KUSURSUZ');
  for (const [e, ad] of [[14, 'GÜZEL'], [15, 'HARİKA'], [24, 'HARİKA'], [25, 'SÜPER'], [34, 'SÜPER'], [35, 'MUHTEŞEM'], [49, 'MUHTEŞEM'], [50, 'İNANILMAZ'], [69, 'İNANILMAZ'], [70, 'OLAĞANÜSTÜ'], [99, 'OLAĞANÜSTÜ'], [100, 'EFSANE'], [139, 'EFSANE'], [140, 'DESTAN']]) assert.equal(odulAdi(e), ad, 'eşik ' + e);
});

test('kombo süresi dolunca kare() komboyu bitirir; tek zıplamada bonus yok, iki zıplamada var', () => {
  const p = yeniPuan(); inis(p, 2);
  for (let i = 0; i < KOMBO_KARE - 1; i++) assert.equal(kare(p), null);
  assert.equal(kare(p), null); assert.equal(p.kombo, null); assert.equal(p.bonus, 0);
  const q = yeniPuan(); inis(q, 2); inis(q, 2);
  let od = null; for (let i = 0; i < KOMBO_KARE && !od; i++) od = kare(q);
  assert.deepEqual(od, { ad: 'İYİ', toplam: 4, zip: 2 }); assert.equal(toplam(q, 3), 30 + 16);
});
