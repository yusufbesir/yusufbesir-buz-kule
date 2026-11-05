// description: Buz Kule kule konseptleri testi: açılış kuralları (başlangıç açık, başarımla, kristalle), satın alma, kilit sistemini kapatma, seçili kulenin doğrulanması, kayıt anahtarının kuleye göre ayrılması. Sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı).
import test from 'node:test';
import assert from 'node:assert/strict';
import { KULELER, KULE, kuleYukle, kuleAcikMi, kuleAl, kuleSec, kuleDogrula } from '../src/kule.js';
import { AYAR, VARSAYILAN, ARALIK, zSonek } from '../src/ayar.js';
import { ACIK } from '../src/basarim.js';
import { CUZDAN } from '../src/magaza.js';

function sifirla() {
  const d = new Map(); globalThis.localStorage = { getItem: (k) => (d.has(k) ? d.get(k) : null), setItem: (k, v) => d.set(k, v) };
  ACIK.clear(); CUZDAN.kristal = 0; KULE.satin = []; AYAR.kule = 0; AYAR.kuleKilidi = 1; return d;
}
test('kule listesi: 5 kule, ilki açık ve tintsiz; varsayılanlar kilit açık / Buz kulesi', () => {
  assert.equal(KULELER.length, 5); assert.equal(KULELER[0].tint, null); assert.equal(KULELER[0].acik.tur, 'acik');
  assert.equal(VARSAYILAN.kule, 0); assert.equal(VARSAYILAN.kuleKilidi, 1); assert.deepEqual(ARALIK.kule, [0, 4]);
});
test('açılış: başlangıç kulesi açık; başarımlı kuleler başarımla; kristallı kuleler satın alınca', () => {
  sifirla(); assert.equal(kuleAcikMi(0), true);
  assert.equal(kuleAcikMi(1), false, 'kor: kat50 başarımı yok'); ACIK.add('kat50'); assert.equal(kuleAcikMi(1), true);
  assert.equal(kuleAcikMi(4), false); ACIK.add('kat100'); assert.equal(kuleAcikMi(4), true);
  assert.equal(kuleAcikMi(2), false); assert.equal(kuleAcikMi(9), false);
});
test('satın alma: yetersiz kristalde alınmaz, yeterliyse düşer ve kalıcı olur, başarımlı kule satın alınamaz', () => {
  const d = sifirla(); CUZDAN.kristal = 100;
  assert.equal(kuleAl(2), 'yetersiz'); assert.equal(CUZDAN.kristal, 100);
  CUZDAN.kristal = 400; assert.equal(kuleAl(2), 'alindi'); assert.equal(CUZDAN.kristal, 250); assert.equal(kuleAcikMi(2), true);
  assert.equal(kuleAl(2), 'acik'); assert.equal(CUZDAN.kristal, 250);
  assert.equal(kuleAl(1), 'gecersiz'); assert.equal(kuleAl(0), 'gecersiz');
  KULE.satin = []; kuleYukle(); assert.deepEqual(KULE.satin, [2]); assert.ok(d.has('buzkule.kuleler'));
});
test('bozuk kayıt: geçersiz numaralar atılır, çökmez', () => {
  const d = sifirla(); d.set('buzkule.kuleler', JSON.stringify({ satin: [2, 2, 99, -1, 'x', 0.5] })); kuleYukle(); assert.deepEqual(KULE.satin, [2]);
  d.set('buzkule.kuleler', '{bozuk'); kuleYukle(); assert.deepEqual(KULE.satin, []);
});
test('kilit sistemi kapalıyken hepsi açık; seçim ve doğrulama', () => {
  sifirla(); assert.equal(kuleSec(3), false); assert.equal(AYAR.kule, 0);
  AYAR.kuleKilidi = 0; for (let i = 0; i < 5; i++) assert.equal(kuleAcikMi(i), true);
  assert.equal(kuleSec(3), true); assert.equal(AYAR.kule, 3);
  AYAR.kuleKilidi = 1; kuleDogrula(); assert.equal(AYAR.kule, 0, 'kilit açılınca kilitli seçili kule başlangıca döner');
});
test('skor ve hayalet anahtarı kuleye göre ayrılır; Buz kulesi eski anahtarları korur', () => {
  assert.equal(zSonek(1), ''); assert.equal(zSonek(1 + 100), '.z101'); assert.equal(zSonek(0 + 10 + 300), '.z310');
});

import { kuleEfektCiz } from '../src/gorsel.js';
function sahteTuval() { const say = { fillRect: 0, stroke: 0 }; const c = new Proxy({}, { get: (_, k) => (k === 'fillRect' ? () => { say.fillRect++; } : k === 'stroke' ? () => { say.stroke++; } : () => {}), set: () => true }); return { c, say }; }
test('kule efektleri: Buz Kulesi efektsiz; diğerleri çizim yapar; parçacık ayarı 0 ise hiçbiri çizmez', () => {
  for (const id of ['kor', 'kum', 'yildiz', 'run']) { const { c, say } = sahteTuval(); kuleEfektCiz(c, 640, 480, id, 100); assert.ok(say.fillRect > 5, id + ' çizmedi'); }
  { const { c, say } = sahteTuval(); kuleEfektCiz(c, 640, 480, 'buz', 100); assert.equal(say.fillRect + say.stroke, 0); }
  const eski = AYAR.parcacik; AYAR.parcacik = 0; { const { c, say } = sahteTuval(); kuleEfektCiz(c, 640, 480, 'kor', 100); assert.equal(say.fillRect, 0); } AYAR.parcacik = eski;
  assert.equal(VARSAYILAN.kuleEfekt, 1);
});
