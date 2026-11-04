// description: Buz Kule Rust aşama 4 (hayalet kaydı çözme) eşdeğerlik testi: kayitCozC (Rust) ile kayitCoz (JS) aynı diziyi üretmeli; sınır aşımında JS geri düşmesi çalışmalı. Sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { cekirdekYukle, cekirdekVar, kayitCozC } from '../src/cekirdek.js';
import { kayitCoz } from '../src/hayalet.js';

const wasmYolu = new URL('../uygulama/src/varlik/core.wasm', import.meta.url);
test('kayıt çözme: Rust ve JS birebir aynı (küçük, boş, büyük ve uç kayıtlar)', { skip: !fs.existsSync(wasmYolu) && 'core.wasm yok' }, () => {
  assert.equal(cekirdekYukle(fs.readFileSync(wasmYolu).toString('base64')), true);
  assert.equal(cekirdekVar(), true);
  assert.deepEqual(kayitCozC({ kosu: [] }), []);
  assert.deepEqual(kayitCozC({ kosu: [3, 1] }), [3]);
  assert.deepEqual(kayitCozC({ kosu: [0, 2, 7, 3, 1, 1] }), kayitCoz({ kosu: [0, 2, 7, 3, 1, 1] }));
  const buyuk = []; for (let i = 0; i < 4000; i++) buyuk.push(i % 8, 100 + (i % 37)); // ~500 bin kare
  assert.deepEqual(kayitCozC({ kosu: buyuk }), kayitCoz({ kosu: buyuk }));
  // sınır aşımı: 1 milyon kare üstü Rust'ta reddedilir, JS geri düşmesi çözer (kayitGecerli bunu zaten elemeli)
  const asiri = { kosu: [1, 600000, 2, 600000] };
  assert.equal(kayitCozC(asiri).length, 1200000);
  // 40000 sayıdan uzun koşu dizisi JS yoluna düşer
  const uzun = []; for (let i = 0; i < 20001; i++) uzun.push(1, 1);
  assert.equal(kayitCozC({ kosu: uzun }).length, 20001);
});
