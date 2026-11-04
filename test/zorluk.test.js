// description: Buz Kule zorluk seviyeleri testi: kamera kayma tavanı seviyeye göre artar, orta eski anahtarları korur, diğer seviyelerin skor ve hayalet anahtarları ayrıdır. Sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı).
import test from 'node:test';
import assert from 'node:assert/strict';
import { yeniOyun, adim } from '../src/oyun.js';
import { skorAnahtari } from '../src/skorlar.js';
import { gunlukAnahtar, hayaletAnahtar, HAYALET_ANAHTAR } from '../src/hayalet.js';
import { zSonek } from '../src/ayar.js';

test('kamera kayma tavanı: kolay 2.5, orta 4, zor 5, çok zor 6.5; bilinmeyen seviye orta sayılır', () => {
  const tavan = (z) => { const o = yeniOyun(5, z); o.enYuksek = 6; o.kaymaBasladi = true; let m = 0; for (let i = 0; i < 12000; i++) { o.bitti = false; adim(o, { sol: false, sag: false, zipla: false }); m = Math.max(m, o.kayma); } return m; };
  assert.deepEqual([0, 1, 2, 3].map(tavan), [2.5, 4, 5, 6.5]);
  assert.equal(tavan(9), 4);
});
test('orta zorluk eski kayıt anahtarlarını korur; diğerleri ayrı anahtar alır', () => {
  assert.equal(zSonek(1), ''); assert.equal(zSonek(0), '.z0'); assert.equal(zSonek(3), '.z3'); assert.equal(zSonek(1.5), '');
  assert.equal(hayaletAnahtar(1), HAYALET_ANAHTAR); assert.equal(hayaletAnahtar(2), HAYALET_ANAHTAR + '.z2');
  assert.equal(skorAnahtari('yeni', 1), 'buzkule.skorlar'); assert.equal(skorAnahtari('yeni', 3), 'buzkule.skorlar.z3');
  assert.equal(gunlukAnahtar(new Date(2026, 10, 4), 0), 'buzkule.hayalet.2026-11-4.z0');
  assert.notEqual(skorAnahtari('hayalet', 0), skorAnahtari('hayalet', 2));
});
