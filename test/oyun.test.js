import test from 'node:test';
import assert from 'node:assert/strict';
import { yeniOyun, adim } from '../src/oyun.js';
test('1000 kare rastgele girdiyle çökmeden döner, değerler sonlu', () => {
  let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const o = yeniOyun(rnd);
  for (let i = 0; i < 1000; i++) adim(o, { sol: rnd() < .4, sag: rnd() < .4, zipla: rnd() < .3 });
  for (const v of [o.x, o.y, o.vx, o.vy, o.kamY]) assert.ok(Number.isFinite(v));
  assert.ok(o.x >= 85 && o.x <= 555);
});
test('yerden zıplayınca havaya kalkar', () => {
  const o = yeniOyun(); adim(o, { sag: true, zipla: true }); assert.ok(o.havada && o.vy < 0);
});

test('takla: hızlı zıplamada gövde döner, inince sıfırlanır; yavaş zıplamada dönmez', () => {
  const hizli = yeniOyun(() => 0.4);
  hizli.vx = 12; hizli.x = 300; // tam hızda koşuyor
  adim(hizli, { sag: true, sol: false, zipla: true });
  assert.ok(hizli.donuyor && hizli.aciHiz !== 0, 'hızlı zıplama takla atmadı');
  for (let i = 0; i < 10; i++) adim(hizli, { sag: true, sol: false, zipla: false });
  assert.ok(Math.abs(hizli.aci) > 0.3, 'açı artmıyor');
  for (let i = 0; i < 200 && hizli.havada; i++) adim(hizli, { sag: false, sol: false, zipla: false });
  assert.equal(hizli.aci, 0, 'inince açı sıfırlanmadı');
  const yavas = yeniOyun(() => 0.4); adim(yavas, { sag: false, sol: false, zipla: true });
  assert.equal(yavas.donuyor, false);
});

test('kristal: üstünden geçince +25 puan, tekrar alınmaz', () => {
  const o = yeniOyun(() => 0.1); // rnd 0.1 < 0.3: her katta kristal var
  const f = o.kat(1); assert.ok(f.kristal);
  o.x = 85 + (f.xKaro - 5) * 16 + f.genislikKaro * 16 * (0.15 + 0.7 * f.kristalX); o.y = 440 - 80 + 30 - 4; o.havada = true; o.vy = -1;
  const once = o.ek; adim(o, { sag: false, sol: false, zipla: false });
  assert.equal(o.ek - once, 25); assert.ok(o.alinan.has(1));
  const sonra = o.ek; adim(o, { sag: false, sol: false, zipla: false }); assert.equal(o.ek, sonra);
});

test('hızlanma uyarısı: kayma başlayınca her 1500 karede açılır', () => {
  const o = yeniOyun(() => 0.4); o.kaymaBasladi = true; o.kare = 1499; o.enYuksek = 6;
  adim(o, { sag: false, sol: false, zipla: false });
  assert.ok(o.hizlan > 0);
});
