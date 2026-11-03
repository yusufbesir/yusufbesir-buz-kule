// description: Hayalet kaydı, tohumlu kule ve günlük tohum testleri (tekrarlanabilirlik). sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
import test from 'node:test';
import assert from 'node:assert/strict';
import { yeniOyun, adim } from '../src/oyun.js';
import { tohumluRnd, katRnd, gunlukTohum, gunlukAnahtar, kayitBaslat, kayitEkle, kayitBitir, kayitCoz, kayitGecerli, girisBit, bitGiris } from '../src/hayalet.js';

const durumOzeti = (o) => JSON.stringify([o.x, o.y, o.vx, o.vy, o.enYuksek, o.ek, o.kare, o.bitti, o.kirik.size, o.alinan.size]);

test('tohum: aynı tohum aynı sayı dizisini, farklı tohum farklıyı üretir', () => {
  const a = tohumluRnd(42), b = tohumluRnd(42), c = tohumluRnd(43);
  const A = [a(), a(), a()], B = [b(), b(), b()], C = [c(), c(), c()];
  assert.deepEqual(A, B); assert.notDeepEqual(A, C); assert.ok(A.every(x => x >= 0 && x < 1));
});

test('kule: katlar hangi sırayla istenirse istensin aynıdır (oyuncu ve hayalet aynı kuleyi görür)', () => {
  const a = yeniOyun(12345), b = yeniOyun(12345);
  const sa = [a.kat(7), a.kat(2), a.kat(30)], sb = [b.kat(30), b.kat(7), b.kat(2)];
  assert.deepEqual(sa[0], sb[1]); assert.deepEqual(sa[1], sb[2]); assert.deepEqual(sa[2], sb[0]);
  assert.notDeepEqual(yeniOyun(1).kat(9), yeniOyun(2).kat(9));
});

test('tekrarlanabilirlik: aynı tohum ve aynı girişlerle durum kare kare aynıdır', () => {
  const rnd = tohumluRnd(7), girisler = Array.from({ length: 900 }, () => ({ sol: rnd() < 0.3, sag: rnd() < 0.5, zipla: rnd() < 0.5 }));
  const a = yeniOyun(99), b = yeniOyun(99);
  for (const g of girisler) { adim(a, g); adim(b, g); if (a.bitti || b.bitti) break; assert.equal(durumOzeti(a), durumOzeti(b)); }
  assert.equal(durumOzeti(a), durumOzeti(b));
});

test('kayıt: giriş kaydı sıkıştırılır, çözülünce aynı dizi olur ve yeniden oynatma aynı sonucu verir', () => {
  const rnd = tohumluRnd(5), girisler = Array.from({ length: 700 }, () => ({ sol: rnd() < 0.2, sag: rnd() < 0.6, zipla: rnd() < 0.7 }));
  const oyun = yeniOyun(2024), k = kayitBaslat(); let n = 0;
  for (const g of girisler) { kayitEkle(k, g); adim(oyun, g); n++; if (oyun.bitti) break; }
  const kayit = kayitBitir(k, 2024, 123, oyun.enYuksek);
  assert.equal(kayitGecerli(kayit), true); assert.equal(kayit.kare, n);
  const bitler = kayitCoz(kayit); assert.equal(bitler.length, n); assert.deepEqual(bitler, girisler.slice(0, n).map(girisBit));
  const tekrar = yeniOyun(2024); for (const b of bitler) adim(tekrar, bitGiris(b));
  assert.equal(durumOzeti(tekrar), durumOzeti(oyun), 'hayalet yeniden oynatması aynı sonucu vermeli');
});

test('kayıt doğrulama: bozuk kayıtlar reddedilir', () => {
  assert.equal(kayitGecerli(null), false); assert.equal(kayitGecerli({ tohum: 1, skor: 1, kat: 1, kosu: [1] }), false);
  assert.equal(kayitGecerli({ tohum: 1, skor: 1, kat: 1, kosu: [1, -3] }), false); assert.equal(kayitGecerli({ tohum: 'x', skor: 1, kat: 1, kosu: [] }), false);
  assert.equal(kayitGecerli({ tohum: 1, skor: 1, kat: 1, kosu: [] }), true);
});

test('günlük kule: aynı gün aynı tohum ve anahtar, ertesi gün farklı', () => {
  const d1 = new Date(2026, 10, 3, 9), d2 = new Date(2026, 10, 3, 23), d3 = new Date(2026, 10, 4, 0, 5);
  assert.equal(gunlukTohum(d1), gunlukTohum(d2)); assert.notEqual(gunlukTohum(d1), gunlukTohum(d3));
  assert.equal(gunlukAnahtar(d1), gunlukAnahtar(d2)); assert.notEqual(gunlukAnahtar(d1), gunlukAnahtar(d3)); assert.ok(katRnd(1, 2)() !== katRnd(1, 3)());
});
