// description: Birleştirilmiş paket betiğini (uygulama/src/buz-kule.js) sahte tarayıcı ortamında çalıştırır; modül birleştirme hatalarını yakalar. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function ortam() {
  const metinler = [], dinleyiciler = {}, kareler = [];
  const bag = () => new Proxy(function () {}, { get: (_, k) => (k === 'addColorStop' ? () => {} : bag()), apply: () => bag(), set: () => true });
  const ctx = new Proxy({}, {
    get: (_, k) => (k === 'fillText' ? (t) => { metinler.push(String(t)); } : k === 'createLinearGradient' ? () => ({ addColorStop() {} }) : () => {}),
    set: () => true,
  });
  const kanvas = { getContext: () => ctx, width: 640, height: 480 };
  const kutu = {
    document: { getElementById: () => kanvas },
    addEventListener: (ad, f) => { (dinleyiciler[ad] ||= []).push(f); },
    requestAnimationFrame: (f) => { kareler.push(f); },
    localStorage: { getItem: () => null, setItem() {} },
    AudioContext: undefined, Image: undefined, Math: Object.create(Math), console,
  };
  kutu.globalThis = kutu; kutu.window = kutu;
  return { kutu, metinler, dinleyiciler, kareler };
}

test('paket: sağ+space basılı tutulunca zıplayıp inmek oyunu bitirmez', () => {
  const e = ortam(); let s = 11; e.kutu.Math.random = () => (s = (s * 16807) % 2147483647) / 2147483647;
  vm.createContext(e.kutu);
  vm.runInContext(fs.readFileSync(new URL('../uygulama/src/buz-kule.js', import.meta.url), 'utf8'), e.kutu);
  const tus = (tur, code) => (e.dinleyiciler[tur] || []).forEach(f => f({ code, repeat: false, preventDefault() {} }));
  let ms = 0; const kare = () => { ms += 20; const f = e.kareler.shift(); f(ms); };
  kare(); tus('keydown', 'Space'); tus('keyup', 'Space'); // başlık -> oyun
  tus('keydown', 'ArrowRight'); tus('keydown', 'Space');
  for (let i = 0; i < 150; i++) kare(); // 3 sn
  assert.ok(!e.metinler.includes('KULE SENİ YENDİ'), 'paketlenmiş oyun erken bitti (modül adı çakışması?)');
  assert.ok(e.metinler.some(t => t.startsWith('SKOR')) || e.metinler.includes('SKOR'), 'HUD çizilmedi');
});
