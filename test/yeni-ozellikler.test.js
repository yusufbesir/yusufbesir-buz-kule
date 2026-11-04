// description: Buz Kule akşam turu özellikleri testi: ISO hafta kimliği, haftalık tohum, kule kodu çözme, mükemmel iniş serisi sayacı, ayar varsayılanları. Sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı).
import test from 'node:test';
import assert from 'node:assert/strict';
import { haftaKimlik, VARSAYILAN, ARALIK } from '../src/ayar.js';
import { haftalikTohum, haftalikAnahtar, kodAnahtar, kodCoz, gunlukTohum } from '../src/hayalet.js';
import { skorAnahtari } from '../src/skorlar.js';
import { yeniOyun, adim } from '../src/oyun.js';

test('hafta kimliği (ISO): yıl başı ve sonu sınırları doğru', () => {
  assert.equal(haftaKimlik(new Date(2026, 10, 5)), '2026-H45');
  assert.equal(haftaKimlik(new Date(2026, 0, 1)), '2026-H01');
  assert.equal(haftaKimlik(new Date(2024, 11, 30)), '2025-H01');
  assert.equal(haftaKimlik(new Date(2021, 0, 3)), '2020-H53');
});
test('haftalık tohum: aynı hafta aynı, farklı hafta farklı; anahtarlar ayrı', () => {
  assert.equal(haftalikTohum(new Date(2026, 10, 2)), haftalikTohum(new Date(2026, 10, 8)));
  assert.notEqual(haftalikTohum(new Date(2026, 10, 2)), haftalikTohum(new Date(2026, 10, 9)));
  assert.notEqual(haftalikTohum(new Date(2026, 10, 5)), gunlukTohum(new Date(2026, 10, 5)));
  assert.equal(haftalikAnahtar(new Date(2026, 10, 5), 2), 'buzkule.hayalet.hafta.2026-H45.z2');
  assert.equal(skorAnahtari('kod', 1), 'buzkule.skorlar.kod'); assert.match(skorAnahtari('hafta', 1), /^buzkule\.skorlar\.hafta\.\d{4}-H\d\d$/);
});
test('kule kodu: 1-8 onaltılık hane geçerli, diğerleri reddedilir; anahtar tohuma bağlı', () => {
  assert.equal(kodCoz('1a2b3c'), 0x1a2b3c); assert.equal(kodCoz(' FF '), 255); assert.equal(kodCoz('ffffffff'), 4294967295);
  for (const k of ['', 'xyz', '123456789', '12 34', '-1', null]) assert.equal(kodCoz(k), null);
  assert.equal(kodAnahtar(255, 1), 'buzkule.hayalet.kod.ff'); assert.equal(kodAnahtar(255, 3), 'buzkule.hayalet.kod.ff.z3');
});
test('mükemmel iniş serisi: basamağın ortasına inişler seriyi artırır, kenara iniş sıfırlar', () => {
  const o = yeniOyun(5), f = o.kat(1), x0 = 85 + (f.xKaro - 5) * 16, gen = f.genislikKaro * 16;
  const ini = (x) => { o.x = x; o.y = 440 - 80 - 1; o.vy = 2; o.havada = true; o.vx = 0; adim(o, { sol: false, sag: false, zipla: false }); };
  ini(x0 + gen / 2); assert.equal(o.mukSeri, 1);
  o.havada = true; o.katNo = 0; o.sonInisKat = 0; ini(x0 + gen / 2 + 1); assert.equal(o.mukSeri, 2, 'ikinci orta iniş seriyi artırır');
  assert.equal(o.enMukSeri, 2);
  o.havada = true; o.katNo = 0; o.sonInisKat = 0; ini(x0 + gen * 0.05); assert.equal(o.mukSeri, 0, 'kenar inişi seriyi sıfırlar'); assert.equal(o.enMukSeri, 2);
});
test('yeni ayarlar: hayalet açık, kontrast kapalı, mükemmel seri açık, müzik düzeyi 0.8; aralıklar tanımlı', () => {
  assert.deepEqual([VARSAYILAN.hayaletGoster, VARSAYILAN.kontrast, VARSAYILAN.mukemmel, VARSAYILAN.muzikSes], [1, 0, 1, 0.8]);
  for (const a of ['hayaletGoster', 'kontrast', 'mukemmel', 'muzikSes']) assert.deepEqual(ARALIK[a], [0, 1]);
});
