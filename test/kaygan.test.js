// description: Buz Kule kaygan buz testi (isteğe bağlı ayar, varsayılan kapalı): seçim tohumdan türer, 400. kattan önce yok, yaklaşık %12; açıkken kaygan basamakta hız korunur, kapalıyken eski fizik. Sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı).
import test from 'node:test';
import assert from 'node:assert/strict';
import { yeniOyun, adim, kayganKat } from '../src/oyun.js';
import { katUret } from '../src/kat.js';
import { katRnd } from '../src/hayalet.js';
import { VARSAYILAN } from '../src/ayar.js';

test('kaygan basamak seçimi: deterministik, 400. kattan önce yok, 10 katlarında yok, oran ~%12', () => {
  for (let n = 0; n < 400; n++) assert.equal(kayganKat(77, n), false);
  assert.equal(kayganKat(null, 500), false);
  let say = 0, toplam = 0; for (let n = 401; n < 5401; n++) { if (n % 10 === 0) { assert.equal(kayganKat(77, n), false); continue; } toplam++; if (kayganKat(77, n)) say++; }
  assert.ok(say / toplam > 0.09 && say / toplam < 0.15, 'oran ' + say / toplam);
  assert.equal(kayganKat(77, 521), kayganKat(77, 521));
});
test('ayar varsayılanları: kaygan kapalı, iniş gölgesi ve kombo perdesi açık', () => {
  assert.equal(VARSAYILAN.kaygan, 0); assert.equal(VARSAYILAN.golge, 1); assert.equal(VARSAYILAN.perde, 1);
});
function kayganBasamagaKoy(kaygan) {
  const tohum = 77; let n = 401, f;
  for (; ; n++) { if (!kayganKat(tohum, n)) continue; f = katUret(n, katRnd(tohum, n)); const orta = 85 + (f.xKaro - 5) * 16 + f.genislikKaro * 8; if (orta > 220 && orta < 420) break; } // duvardan uzak bir kaygan basamak
  const o = yeniOyun(tohum, 1, kaygan);
  o.katNo = n; o.sonInisKat = n; o.enYuksek = n; o.havada = false; o.y = 440 - n * 80; o.kamY = o.y - 300; o.kamTaban = o.kamY; o.x = 85 + (f.xKaro - 5) * 16 + f.genislikKaro * 8; o.vx = 2; // basamağın ortasında, yavaş
  return o;
}
test('kaygan buzda tuşsuzken hız normal basamağa göre çok daha yavaş söner; kapalıyken eski fizik', () => {
  const hiz = (kaygan) => { const o = kayganBasamagaKoy(kaygan); for (let i = 0; i < 10; i++) adim(o, { sol: false, sag: false, zipla: false }); return Math.abs(o.vx); };
  const acik = hiz(1), kapali = hiz(0);
  assert.ok(Math.abs(kapali - 2 * Math.pow(0.9, 10)) < 1e-9, 'kapalıyken eski sürtünme ' + kapali);
  assert.ok(acik > kapali * 2, `kaygan ${acik} normal ${kapali}`);
});
