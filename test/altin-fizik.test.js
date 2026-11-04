// description: Buz Kule Rust aşama 2 (fizik) eşdeğerlik testi: aynı tohum + aynı girdi dizisiyle tam oyun, Rust çekirdeğiyle ve JS geri düşmesiyle kare kare birebir aynı durumu üretmeli. Sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { cekirdekYukle, cekirdekVar } from '../src/cekirdek.js';
import { yeniOyun, adim } from '../src/oyun.js';

const wasmYolu = new URL('../uygulama/src/varlik/core.wasm', import.meta.url);
function izle(tohum, kare) {
  const o = yeniOyun(tohum); const iz = []; let s = tohum ^ 0x5bd1e995;
  const r = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  let sol = false, sag = true, zip = true;
  for (let i = 0; i < kare; i++) {
    if (i % 25 === 0) { sol = r() < 0.4; sag = !sol && r() < 0.8; zip = r() < 0.9; }
    if (o.bitti) break;
    adim(o, { sol, sag, zipla: zip });
    iz.push([o.x, o.y, o.vx, o.vy, o.kamY, o.enYuksek, o.kare, o.bitti ? 1 : 0, o.ek, o.puan.bonus, JSON.stringify(o.puan.kombo), o.enIyiKombo, o.mesaj ? o.mesaj.ad : '']);
  }
  return iz;
}

test('fizik: Rust çekirdeği ve JS geri düşmesi 6 tohumda kare kare birebir aynı', { skip: !fs.existsSync(wasmYolu) && 'core.wasm yok' }, () => {
  const b64 = fs.readFileSync(wasmYolu).toString('base64'); let toplam = 0, bonusGorulen = 0;
  for (const tohum of [1, 7, 42, 1234, 99999, 2147483647]) {
    assert.equal(cekirdekYukle(b64), true, 'çekirdek yüklenmeli ve kendi sınavını geçmeli');
    assert.equal(cekirdekVar(), true);
    const rust = izle(tohum, 6000);
    cekirdekYukle('!!geçersiz!!'); assert.equal(cekirdekVar(), false, 'JS geri düşmesi');
    const js = izle(tohum, 6000);
    assert.deepEqual(rust, js, `tohum ${tohum}: Rust ve JS ayrıştı`);
    toplam += rust.length; bonusGorulen += rust.filter((r) => r[9] > 0).length;
  }
  assert.ok(toplam > 3000, 'yeterli kare koşuldu');
  assert.ok(bonusGorulen > 0, 'kombo/puan yolu en az bir tohumda çalıştı');
  cekirdekYukle(b64); // sonraki testler için çekirdek yüklü bırak
});
