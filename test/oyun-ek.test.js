// description: oyun.js ek testleri: kırılgan basamak sayacı + zıplama, aynı tohum+girdi determinizmi. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı, TEZDENEME#CLONE). Yalnız ekleme; src'ye dokunmaz.
import test from 'node:test';
import assert from 'node:assert/strict';
import { yeniOyun, adim, skor } from '../src/oyun.js';

const bos = { sag: false, sol: false, zipla: false };
function basamakta() {
  const o = yeniOyun(() => 0.4); const f = o.kat(1), x0 = 85 + (f.xKaro - 5) * 16, x1 = x0 + f.genislikKaro * 16;
  o.katNo = 1; o.sonInisKat = 1; o.enYuksek = 1; o.y = 440 - 80; o.havada = false; o.x = (x0 + x1) / 2; o.kat(1).tur = 'kirilgan'; return o;
}

test('kırılgan basamak: sayaç her karede artar, 10 karede zıplayan basamağı kırmaz', () => {
  const o = basamakta();
  for (let i = 1; i <= 10; i++) { adim(o, bos); assert.equal(o.sayac, i); assert.equal(o.sayacKat, 1); }
  adim(o, { ...bos, zipla: true });
  assert.equal(o.havada, true); assert.ok(o.vy < 0, 'zıplamalı');
  for (let i = 0; i < 80 && o.havada; i++) adim(o, bos);
  assert.equal(o.kirik.has(1), false);
});

test('kırılgan basamağa yeniden inince sayaç baştan başlar', () => {
  const o = basamakta();
  for (let n = 2; n <= 12; n++) o.kat(n).tur = 'kirilgan'; // zıplama hangi kata inerse insin kırılgan
  for (let i = 0; i < 10; i++) adim(o, bos);
  adim(o, { ...bos, zipla: true });
  for (let i = 0; i < 100 && o.havada; i++) adim(o, bos);
  assert.equal(o.havada, false); assert.ok(o.katNo >= 1);
  assert.equal(o.sayacKat, o.katNo);
  assert.ok(o.sayac >= 1 && o.sayac < 5, 'sayaç sıfırlanıp yeniden başlamalı: ' + o.sayac);
});

test('aynı tohum + aynı girdi dizisi iki örnekte aynı skor ve durum', () => {
  const kos = (tohum) => {
    const o = yeniOyun(tohum); let s = 99;
    const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 1500; i++) adim(o, { sol: r() < .35, sag: r() < .45, zipla: r() < .25 });
    return { skor: skor(o), enYuksek: o.enYuksek, x: o.x, y: o.y, kare: o.kare, bitti: o.bitti, ek: o.ek };
  };
  assert.deepEqual(kos(2024), kos(2024));
  assert.deepEqual(kos(7), kos(7));
});
