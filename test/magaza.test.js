// description: magaza.js cüzdan yükleme/kaydetme ve iz satın alma testleri (sahte localStorage). sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı, TEZDENEME#CLONE). Yalnız ekleme; src'ye dokunmaz.
import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { CUZDAN, IZLER, cuzdanYukle, kristalKazan, izAl, izSec } from '../src/magaza.js';

let depo;
globalThis.localStorage = {
  getItem: (k) => (k in depo ? depo[k] : null),
  setItem: (k, v) => { depo[k] = String(v); },
};
const ANAHTAR = 'buzkule.cuzdan';
const SIFIR = { kristal: 0, acik: [0], secili: 0, toplam: 0 };
beforeEach(() => { depo = {}; Object.assign(CUZDAN, { ...SIFIR, acik: [0] }); });

test('kayıt yokken cüzdan değişmez', () => {
  cuzdanYukle(); assert.deepEqual(CUZDAN, SIFIR);
});

test('bozuk JSON, negatif, metin, sonsuz ve null kristal: cüzdan değişmez', () => {
  for (const ham of ['{bozuk', 'x', '"x"', '[]', 'null', JSON.stringify({ kristal: -5 }), JSON.stringify({ kristal: 'x' }), '{"kristal":1e999}', JSON.stringify({ kristal: null })]) {
    depo[ANAHTAR] = ham; cuzdanYukle();
    assert.deepEqual(CUZDAN, SIFIR, 'kayıt: ' + ham);
  }
});

test('geçerli kayıt yüklenir; kesirler yuvarlanır, bozuk izler süzülür, iz 0 hep açık, seçili açık değilse 0', () => {
  depo[ANAHTAR] = JSON.stringify({ kristal: 55.9, toplam: 120.4, acik: [1, 99, -1, 'a', 2.5], secili: 3 });
  cuzdanYukle();
  assert.equal(CUZDAN.kristal, 55); assert.equal(CUZDAN.toplam, 120);
  assert.deepEqual(CUZDAN.acik, [1, 0]); assert.equal(CUZDAN.secili, 0);
});

test('toplam bozuksa 0, acik dizi değilse yalnız [0]', () => {
  depo[ANAHTAR] = JSON.stringify({ kristal: 10, toplam: -4, acik: 'x', secili: 0 }); cuzdanYukle();
  assert.equal(CUZDAN.toplam, 0); assert.equal(CUZDAN.kristal, 10); assert.deepEqual(CUZDAN.acik, [0]);
});

test('izAl: yetersiz, alındı, zaten açık, geçersiz', () => {
  assert.equal(izAl(-1), 'gecersiz'); assert.equal(izAl(IZLER.length), 'gecersiz'); assert.equal(izAl(1.5), 'gecersiz');
  assert.equal(izAl(0), 'acik');
  assert.equal(izAl(1), 'yetersiz'); assert.equal(CUZDAN.kristal, 0);
  kristalKazan(50);
  assert.equal(izAl(1), 'alindi'); assert.equal(CUZDAN.kristal, 10); assert.ok(CUZDAN.acik.includes(1));
  assert.equal(izAl(1), 'acik'); assert.equal(CUZDAN.kristal, 10);
  assert.equal(JSON.parse(depo[ANAHTAR]).kristal, 10, 'kalıcı kayıt güncellendi');
});

test('kristalKazan: pozitif ekler (toplam da), sıfır/negatif yok sayılır; izSec yalnız açık izi seçer', () => {
  kristalKazan(5); kristalKazan(0); kristalKazan(-3);
  assert.equal(CUZDAN.kristal, 5); assert.equal(CUZDAN.toplam, 5);
  assert.equal(izSec(2), false); assert.equal(CUZDAN.secili, 0);
  kristalKazan(40); izAl(1); assert.equal(izSec(1), true); assert.equal(CUZDAN.secili, 1);
});
