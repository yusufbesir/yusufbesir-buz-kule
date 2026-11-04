// description: basarim.js başarım açma, ödül ve bildirim testleri (sahte localStorage; Audio yok, ses.js sessiz kalır). sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı, TEZDENEME#CLONE). Yalnız ekleme; src'ye dokunmaz.
import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { CUZDAN } from '../src/magaza.js';
import { ACIK, BILDIRIM, BASARIMLAR, basarimKontrol, bildirimAdim, basarimYukle } from '../src/basarim.js';

let depo;
globalThis.localStorage = { getItem: (k) => (k in depo ? depo[k] : null), setItem: (k, v) => { depo[k] = String(v); } };
const bosO = (d = {}) => ({ enYuksek: 0, alinan: new Set(), enIyiKombo: 0, yaySayisi: 0, kare: 0, ...d });
beforeEach(() => { depo = {}; ACIK.clear(); BILDIRIM.length = 0; Object.assign(CUZDAN, { kristal: 0, acik: [0], secili: 0, toplam: 0 }); });

test('enYuksek 10: kat10 açılır, kristal +5; ikinci çağrıda boş', () => {
  assert.deepEqual(basarimKontrol(bosO({ enYuksek: 10 })), ['kat10']);
  assert.equal(CUZDAN.kristal, 5); assert.ok(ACIK.has('kat10'));
  assert.deepEqual(basarimKontrol(bosO({ enYuksek: 10 })), []);
  assert.equal(CUZDAN.kristal, 5, 'ödül tekrar verilmemeli'); assert.equal(BILDIRIM.length, 1);
});

test('hiçbir şart sağlanmazsa boş, kayıt yazılmaz', () => {
  assert.deepEqual(basarimKontrol(bosO()), []); assert.equal('buzkule.basarim' in depo, false);
});

test('aynı karede birden çok başarım: kat10+kat50, ödüller toplanır ve kayıt yazılır', () => {
  assert.deepEqual(basarimKontrol(bosO({ enYuksek: 50 })), ['kat10', 'kat50']);
  assert.equal(CUZDAN.kristal, 25); assert.deepEqual(JSON.parse(depo['buzkule.basarim']), ['kat10', 'kat50']);
});

test('basarimYukle: bilinmeyen kimlik atlanır, bozuk kayıt çökertmez', () => {
  depo['buzkule.basarim'] = JSON.stringify(['kat10', 'yok-boyle-bir-id', 7]); basarimYukle();
  assert.deepEqual([...ACIK], ['kat10']);
  assert.deepEqual(basarimKontrol(bosO({ enYuksek: 10 })), [], 'yüklenen başarım tekrar açılmaz');
  ACIK.clear(); depo['buzkule.basarim'] = '{bozuk'; assert.doesNotThrow(() => basarimYukle()); assert.equal(ACIK.size, 0);
  depo['buzkule.basarim'] = '{"a":1}'; basarimYukle(); assert.equal(ACIK.size, 0);
});

test('diğer şartlar: kristal10, kombo20, yay3, dayanıklı', () => {
  const k = basarimKontrol(bosO({ alinan: new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), enIyiKombo: 20, yaySayisi: 3, kare: 6000 }));
  assert.deepEqual(k.sort(), ['dayanikli', 'kombo20', 'kristal10', 'yay3']);
  ACIK.clear();
  assert.deepEqual(basarimKontrol(bosO({ alinan: new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]), enIyiKombo: 19, yaySayisi: 2, kare: 5999 })), []);
  assert.ok(BASARIMLAR.every(b => Number.isInteger(b.odul) && b.odul > 0));
});

test('bildirimAdim: 200 karede bildirimi siler', () => {
  basarimKontrol(bosO({ enYuksek: 10 })); assert.equal(BILDIRIM.length, 1);
  for (let i = 0; i < 199; i++) bildirimAdim();
  assert.equal(BILDIRIM.length, 1, '199 karede hâlâ var'); bildirimAdim(); assert.equal(BILDIRIM.length, 0);
});
