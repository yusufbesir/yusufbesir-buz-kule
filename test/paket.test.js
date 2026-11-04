// description: Birleştirilmiş paket betiğini (uygulama/src/buz-kule.js) sahte tarayıcı ortamında çalıştırır; modül birleştirme hatalarını (ad çakışması vb.) ve menü/bitiş akışını yakalar. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const wasmKurulum = { n: 0 }; // Rust çekirdeğinin kaç kez kurulduğu (paketli betik yüklenirken)
function ortam() {
  const dinleyiciler = {}, kareler = [], acik = {}, elemanlar = {};
  const ctx = new Proxy({}, {
    get: (_, k) => ((k === 'createLinearGradient' || k === 'createRadialGradient') ? () => ({ addColorStop() {} }) : k === 'measureText' ? () => ({ width: 100 }) : () => {}),
    set: () => true,
  });
  const eleman = (id) => elemanlar[id] ||= {
    id, hidden: false, value: '', textContent: '', style: {}, offsetLeft: 4, offsetWidth: 80, clientWidth: 300, offsetParent: { clientWidth: 300 }, tabIndex: 0, attrs: {},
    classList: { toggle: (ad, durum) => { if (ad === 'acik') acik[id] = !!durum; }, add() {}, remove() {} },
    setAttribute(a, v) { this.attrs[a] = v; }, addEventListener(ad, f) { (this['_' + ad] ||= []).push(f); }, focus() {}, blur() {},
    getContext: () => ctx, getBoundingClientRect: () => ({ width: 640, height: 480 }), appendChild() {}, width: 640, height: 480,
  };
  const kutu = {
    document: { getElementById: eleman, createElement: () => eleman('yeni' + Object.keys(elemanlar).length), activeElement: null, addEventListener() {}, hidden: false, querySelectorAll: () => [], documentElement: {} },
    addEventListener: (ad, f) => { (dinleyiciler[ad] ||= []).push(f); },
    requestAnimationFrame: (f) => { kareler.push(f); },
    localStorage: { getItem: () => null, setItem() {} },
    atob: globalThis.atob, WebAssembly: { Module: WebAssembly.Module, Instance: class extends WebAssembly.Instance { constructor(...g) { super(...g); wasmKurulum.n++; } } },
    AudioContext: undefined, Image: undefined, setTimeout: () => 0, Math: Object.create(Math), console,
  };
  kutu.globalThis = kutu; kutu.window = kutu;
  return { kutu, dinleyiciler, kareler, acik, eleman };
}

function yukle() {
  const e = ortam(); let s = 11; e.kutu.Math.random = () => (s = (s * 16807) % 2147483647) / 2147483647;
  vm.createContext(e.kutu);
  vm.runInContext(fs.readFileSync(new URL('../uygulama/src/buz-kule.js', import.meta.url), 'utf8'), e.kutu);
  e.tus = (tur, code, hedef = { tagName: 'BODY' }) => (e.dinleyiciler[tur] || []).forEach(f => f({ code, repeat: false, preventDefault() {}, target: hedef }));
  let ms = 0; e.kare = () => { ms += 20; const f = e.kareler.shift(); f(ms); };
  return e;
}

test('paket: Space menüden oyunu başlatır (menü kapanır)', () => {
  const e = yukle(); e.kare();
  assert.notEqual(e.acik.menu, false, 'menü başta açık olmalı');
  e.tus('keydown', 'Space'); e.tus('keyup', 'Space');
  assert.equal(e.acik.menu, false, 'Space menüyü kapatmadı');
});

test('paket: sağ+space basılı tutulunca zıplayıp inmek oyunu bitirmez (modül adı çakışması hatası)', () => {
  const e = yukle(); e.kare();
  e.tus('keydown', 'Space'); e.tus('keyup', 'Space'); e.tus('keydown', 'ArrowRight'); e.tus('keydown', 'Space');
  for (let i = 0; i < 150; i++) e.kare(); // 3 sn
  assert.notEqual(e.acik.sonuc, true, 'paketlenmiş oyun erken bitti (modül adı çakışması?)');
});

test('paket: P duraklatır ve devam ettirir', () => {
  const e = yukle(); e.kare(); e.tus('keydown', 'Space'); e.tus('keyup', 'Space');
  e.tus('keydown', 'KeyP'); assert.equal(e.acik.duraklat, true);
  e.tus('keydown', 'KeyP'); assert.equal(e.acik.duraklat, false);
});

test('paket: oyun kolu A düğmesi menüden oyunu başlatır', () => {
  const e = ortam(); let a = false; e.kutu.navigator = { getGamepads: () => [{ connected: true, axes: [0], buttons: Array.from({ length: 16 }, (_, i) => ({ pressed: i === 0 && a })) }] };
  vm.createContext(e.kutu);
  vm.runInContext(fs.readFileSync(new URL('../uygulama/src/buz-kule.js', import.meta.url), 'utf8'), e.kutu);
  let ms = 0; const kare = () => { ms += 20; e.kareler.shift()(ms); };
  kare(); assert.notEqual(e.acik.menu, false); a = true; kare(); assert.equal(e.acik.menu, false, 'A düğmesi oyunu başlatmadı');
});

test('paket: Rust çekirdeği (core.wasm) paketli betikte kurulur ve oyun yine çalışır', () => {
  wasmKurulum.n = 0;
  const e = yukle(); e.kare();
  assert.equal(wasmKurulum.n, 1, 'çekirdek kurulmadı (CEKIRDEK_B64 gömülü mü, atob/WebAssembly var mı?)');
  e.tus('keydown', 'Space'); e.tus('keyup', 'Space');
  assert.equal(e.acik.menu, false);
});
