// description: Buz Kule depo.js testi: güvenli JSON okuma/yazma (kayıt yok, bozuk kayıt, depolama kapalı/kota dolu durumlarında oyun çökmez). Sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı).
import test from 'node:test';
import assert from 'node:assert/strict';
import { depoOku, depoYaz } from '../src/depo.js';

const depo = (ilk = {}, hata = false) => { const d = new Map(Object.entries(ilk)); globalThis.localStorage = { getItem: (k) => { if (hata) throw new Error('kapalı'); return d.has(k) ? d.get(k) : null; }, setItem: (k, v) => { if (hata) throw new Error('kota'); d.set(k, v); } }; return d; };
test('okuma: kayıt yoksa varsayılan, geçerli kayıtta değer, bozuk kayıtta varsayılan', () => {
  depo(); assert.equal(depoOku('x'), null); assert.deepEqual(depoOku('x', []), []);
  depo({ x: '{"a":1}' }); assert.deepEqual(depoOku('x'), { a: 1 });
  depo({ x: '{bozuk' }); assert.deepEqual(depoOku('x', [7]), [7]);
  depo({ x: '' }); assert.equal(depoOku('x', 5), 5);
});
test('yazma: başarıda true ve kalıcı; depolama kapalı ya da kota doluysa false, çökmez', () => {
  const d = depo(); assert.equal(depoYaz('k', { n: 2 }), true); assert.equal(d.get('k'), '{"n":2}'); assert.deepEqual(depoOku('k'), { n: 2 });
  depo({}, true); assert.equal(depoYaz('k', 1), false); assert.equal(depoOku('k', 'v'), 'v');
});
