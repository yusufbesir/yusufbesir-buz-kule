// description: Buz Kule kat üretimi altın vektör testi: JS çıktısı test/altin/kat.json ile birebir aynı olmalı; uygulama/src/varlik/core.wasm varsa Rust çekirdeği de aynı sonucu vermeli (sözleşme PLAN-buz-kule.md). Sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { katRnd } from '../src/hayalet.js';
import { katUret } from '../src/kat.js';

const altin = JSON.parse(fs.readFileSync(new URL('./altin/kat.json', import.meta.url), 'utf8'));
const GUC = ['', 'saat', 'miknatis'], TUR = ['normal', 'kirilgan', 'yay'];
const satir = (k) => [k.kat, k.xKaro, k.genislikKaro, k.no ? 1 : 0, k.tema, k.kristal ? 1 : 0, +k.kristalX.toFixed(12), k.guc || '', k.tur];

test('JS kat üretimi altın vektörle birebir aynı (200 tohum x 300 kat)', () => {
  for (const { tohum, katlar } of altin.tohumlar) for (let n = 0; n < katlar.length; n++)
    assert.deepEqual(satir(katUret(n, katRnd(tohum, n))), katlar[n], `tohum ${tohum} kat ${n}`);
});

const wasmYolu = new URL('../uygulama/src/varlik/core.wasm', import.meta.url);
test('Rust çekirdeği (core.wasm varsa) altın vektörle birebir aynı', { skip: !fs.existsSync(wasmYolu) && 'core.wasm yok (aşama 1 bekliyor)' }, async () => {
  const { instance } = await WebAssembly.instantiate(fs.readFileSync(wasmYolu), {});
  const { bellek, kat_uret, cikis_adresi } = instance.exports; // sözleşme: kat_uret(tohum:u32, n:u32) çıkış tamponuna 9 f64 yazar
  for (const { tohum, katlar } of altin.tohumlar) for (let n = 0; n < katlar.length; n++) {
    kat_uret(tohum >>> 0, n);
    const v = new Float64Array(bellek.buffer, cikis_adresi(), 9);
    assert.deepEqual([v[0], v[1], v[2], v[3], v[4], v[5], +v[6].toFixed(12), GUC[v[7]], TUR[v[8]]], katlar[n], `tohum ${tohum} kat ${n}`);
  }
});
