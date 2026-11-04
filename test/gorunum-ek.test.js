// description: Görünüm özellikleri testleri: 100. kat tabelası, buz kıymığı simülasyonu etkilemez. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı, TEZDENEME#CLONE). Yalnız ekleme.
import test from 'node:test';
import assert from 'node:assert/strict';
import { yeniOyun, adim, skor, katTabelasi, buzKirigi } from '../src/oyun.js';

function kos(tohum, kirik) {
  const o = yeniOyun(tohum);
  for (let i = 0; i < 400; i++) { adim(o, { sag: (i >> 5) % 2 === 0, sol: (i >> 5) % 2 === 1, zipla: i % 23 === 0 }); if (kirik) buzKirigi(o.x, o.y, 30); }
  return JSON.stringify([o.x, o.y, o.vx, o.vy, o.kamY, o.enYuksek, skor(o)]);
}

test('kat tabelası yalnız 100 katlarında', () => {
  assert.equal(katTabelasi(100), 'KAT 100'); assert.equal(katTabelasi(300), 'KAT 300');
  assert.equal(katTabelasi(0), null); assert.equal(katTabelasi(99), null); assert.equal(katTabelasi(150), null);
});

test('buz kıymığı parçacıkları simülasyon durumunu değiştirmez', () => {
  assert.equal(kos(1234, false), kos(1234, true));
});
