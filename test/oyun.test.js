import test from 'node:test';
import assert from 'node:assert/strict';
import { yeniOyun, adim } from '../src/oyun.js';
import { katUret } from '../src/kat.js';
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

// ---- Fizik hissi: basamağa tutunma, kenar toleransı, coyote süresi, zıplama tamponu ----
function basamakta(rnd = () => 0.4) { // kat 1 basamağının üstünde duran oyun
  const o = yeniOyun(rnd); const f = o.kat(1), x0 = 85 + (f.xKaro - 5) * 16, x1 = x0 + f.genislikKaro * 16;
  o.katNo = 1; o.sonInisKat = 1; o.enYuksek = 1; o.y = 440 - 80; o.havada = false; o.x = (x0 + x1) / 2; return { o, x0, x1 };
}
const bos = { sag: false, sol: false, zipla: false };

test('kenar toleransı: basamaktan 8 px taşan ayak hâlâ basar, 14 px taşan düşer', () => {
  const a = basamakta(); a.o.x = a.x1 + 8; adim(a.o, bos); assert.equal(a.o.havada, false, '8 px taşınca düşmemeli');
  const b = basamakta(); b.o.x = b.x1 + 14; adim(b.o, bos); assert.equal(b.o.havada, true, '14 px taşınca düşmeli');
});

test('iniş: basamak kenarının 8 px dışına düşen oyuncu basamağa konar (tutunma)', () => {
  const { o, x1 } = basamakta(); o.katNo = 0; o.sonInisKat = 0; o.enYuksek = 0; o.y = 440 - 80 - 30; o.havada = true; o.vy = 4; o.x = x1 + 8;
  for (let i = 0; i < 20 && o.havada; i++) adim(o, bos);
  assert.equal(o.katNo, 1); assert.equal(o.havada, false);
});

test('hızlı koşuda basamağı atlamaz: geçiş anı konumuna göre denetlenir', () => {
  const { o, x1 } = basamakta(); o.katNo = 0; o.sonInisKat = 0; o.enYuksek = 0; o.havada = true; o.y = 440 - 80 - 3; o.vy = 6; o.vx = 12; o.x = x1 - 6; // bir karede ~12 px sağa kayar
  adim(o, { sag: true, sol: false, zipla: false });
  assert.equal(o.katNo, 1, 'geçiş anında basamağın üstündeydi, konmalıydı');
});

test('coyote: kenardan yürüyerek çıkınca 6 kare içinde zıplanır, 12 kare sonra zıplanamaz', () => {
  const { o, x1 } = basamakta(); o.x = x1 + 12; adim(o, bos); assert.equal(o.havada, true);
  adim(o, { ...bos, zipla: true }); assert.ok(o.vy < 0, 'coyote süresinde zıplayabilmeli');
  const g = basamakta(); g.o.x = g.x1 + 12; adim(g.o, bos);
  for (let i = 0; i < 12; i++) adim(g.o, bos);
  const vy = g.o.vy; adim(g.o, { ...bos, zipla: true }); assert.ok(g.o.vy > vy - 1, 'coyote süresi bitti, zıplamamalı');
});

test('zıplama tamponu: inişten 4 kare önce basılan tuş, iner inmez zıplatır', () => {
  const { o } = basamakta(); o.katNo = 0; o.sonInisKat = 0; o.enYuksek = 0; o.havada = true; o.y = 440 - 80 - 14; o.vy = 4;
  adim(o, { ...bos, zipla: true }); // havada bas
  adim(o, bos); adim(o, bos); // tuşu bırak; basamağa in
  for (let i = 0; i < 8 && o.havada; i++) adim(o, bos);
  assert.equal(o.havada, false, 'basamağa inmeliydi');
  adim(o, bos); assert.ok(o.vy < 0 || o.havada, 'tampon sayesinde hemen zıplamalıydı');
});

test('mıknatıs kristali uzaktan toplar; saat kaymayı yavaşlatır', () => {
  const o = yeniOyun(() => 0.1); const f = o.kat(1); const kx = 85 + (f.xKaro - 5) * 16 + f.genislikKaro * 16 * (0.15 + 0.7 * f.kristalX);
  o.x = kx + 90; o.miknatis = 100; adim(o, bos); assert.equal(o.ek, 25, 'mıknatıs menzilinden toplamalıydı');
  const a = yeniOyun(() => 0.4), b = yeniOyun(() => 0.4); for (const q of [a, b]) { q.enYuksek = 6; q.kaymaBasladi = true; }
  b.saat = 100; for (let i = 0; i < 30; i++) { adim(a, bos); adim(b, bos); }
  assert.ok(b.kamTaban > a.kamTaban, 'saat varken kule daha yavaş kaymalı');
});

// ---- Basamak türleri ----
test('kırılgan basamak: üstünde 30 kare durunca kırılır ve oyuncu düşer; kırık basamağa tekrar konulmaz', () => {
  const { o } = basamakta(); o.kat(1).tur = 'kirilgan';
  for (let i = 0; i < 29; i++) adim(o, bos);
  assert.equal(o.havada, false, '29. karede hâlâ basmalı'); assert.equal(o.kirik.has(1), false);
  adim(o, bos); adim(o, bos); assert.ok(o.kirik.has(1), '30 karede kırılmalı'); assert.equal(o.havada, true);
  for (let i = 0; i < 60 && o.katNo === 1; i++) adim(o, bos); // aşağı düşer, kırık basamağa konmaz
  assert.equal(o.katNo, 0, 'kırık basamağa konmamalı, zemine inmeli');
});

test('kırılgan basamak: çabuk zıplayıp geçen kırılmaz', () => {
  const { o } = basamakta(); o.kat(1).tur = 'kirilgan';
  for (let i = 0; i < 10; i++) adim(o, bos);
  adim(o, { ...bos, zipla: true }); for (let i = 0; i < 60; i++) adim(o, bos);
  assert.equal(o.kirik.has(1), false);
});

test('yay basamak: iner inmez yukarı fırlatır ve takla attırır', () => {
  const { o, x0, x1 } = basamakta(); o.katNo = 0; o.sonInisKat = 0; o.enYuksek = 0; o.kat(1).tur = 'yay';
  o.havada = true; o.y = 440 - 80 - 10; o.vy = 4; o.x = (x0 + x1) / 2;
  for (let i = 0; i < 6 && o.yaySayisi === 0; i++) adim(o, bos);
  assert.equal(o.yaySayisi, 1); assert.ok(o.vy <= -26 && o.havada && o.donuyor, 'yay fırlatmadı');
});

test('kat üretimi: kırılgan/yay yalnız kat 15 sonrası, numaralı ve tam genişlik katlarda hiç çıkmaz', () => {
  let s = 3; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; let kirilgan = 0, yay = 0;
  for (let k = 1; k < 4000; k++) { const f = katUret(k, rnd); if (f.tur !== 'normal') { assert.ok(k >= 15 && k % 10 !== 0 && f.genislikKaro < 30, 'uygunsuz kat ' + k); f.tur === 'kirilgan' ? kirilgan++ : yay++; } }
  assert.ok(kirilgan > 100 && yay > 100, 'türler hiç çıkmıyor: ' + kirilgan + '/' + yay);
});

test('kombo yazısı: kombo zıplaması artınca vurgu süresi başlar, kombo bitince sıfırlanır', () => {
  const o = yeniOyun(() => 0.4);
  o.puan.kombo = { zip: 2, toplam: 5, sayac: 100 }; adim(o, bos);
  assert.equal(o.sonZip, 2); assert.ok(o.komboPuls > 0 && o.komboPuls <= 18);
  for (let i = 0; i < 25; i++) adim(o, bos); assert.equal(o.komboPuls, 0, 'vurgu süresi bitmeli');
  o.puan.kombo = { zip: 3, toplam: 9, sayac: 100 }; adim(o, bos); assert.equal(o.sonZip, 3); assert.ok(o.komboPuls > 0);
  o.puan.kombo = null; adim(o, bos); assert.equal(o.sonZip, 0);
});

// Kilometre taşı görünümü: 100. kata inince sarsıntı, önceki kat rekoru aşılınca bir kez rozet.
import { katY } from '../src/oyun.js';
function katIn(o, n) { const f = o.kat(n); o.enYuksek = n - 1; o.sonInisKat = n - 1; o.havada = true; o.vy = 2; o.vx = 0; o.x = 85 + (f.xKaro - 5) * 16 + 10; o.y = katY(n) - 1; o.kamY = o.y - 300; adim(o, {}); }
test('100. kata inişte sarsıntı kurulur, 99. katta kurulmaz', () => {
  const a = yeniOyun(7); katIn(a, 100); assert.equal(a.enYuksek, 100); assert.equal(a.sars, 22);
  const b = yeniOyun(7); katIn(b, 99); assert.equal(b.sars, 0);
});
test('önceki kat rekoru aşılınca YENİ KAT REKORU rozeti çıkar; rekor yokken çıkmaz', () => {
  const a = yeniOyun(7); a.rekorKat = 20; katIn(a, 21); assert.equal(a.rozet && a.rozet.metin, 'YENİ KAT REKORU');
  const b = yeniOyun(7); katIn(b, 21); assert.equal(b.rozet, null);
});
