// description: Buz Kule Rust çekirdeği yükleyici (aşama 1: kat üretimi). core.wasm baytları birleştirilmiş betiğe base64 olarak gömülür (CEKIRDEK_B64, arac/birlestir.py); yüklenemezse ya da kendi kendine sınavda JS ile uyuşmazsa eski JS kat üretimi kullanılır. Sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı). Sözleşme: PLAN-buz-kule.md.
import { katUret, KAT_ARALIK, KARO, ZEMIN_Y, AYAK } from './kat.js';
import { katRnd } from './hayalet.js';
import { yatayGuncelle, zipla, duvarSekmesi, dikeyGuncelle } from './fizik.js';
import { yeniPuan, inis, kare, odulAdi } from './puan.js';

let cekirdekIc = null;
const GUC_AD = [null, 'saat', 'miknatis'], TUR_AD = ['normal', 'kirilgan', 'yay'];
const rustKat = (tohum, n) => {
  cekirdekIc.kat_uret(tohum >>> 0, n);
  const v = new Float64Array(cekirdekIc.bellek.buffer, cekirdekIc.cikis_adresi(), 9);
  return { kat: v[0], y: -v[0] * KAT_ARALIK, xKaro: v[1], genislikKaro: v[2], no: v[3] === 1, tema: v[4], kristal: v[5] === 1, kristalX: v[6], guc: GUC_AD[v[7]], tur: TUR_AD[v[8]] };
};
const ayni = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// Aşama 2: fizik. Rust çekirdeği varsa onunla, yoksa src/fizik.js ile (aynı sonuç).
export const yatayGuncelleC = (vx, sol, sag) => (cekirdekIc ? cekirdekIc.yatay_guncelle(vx, sol ? 1 : 0, sag ? 1 : 0) : yatayGuncelle(vx, sol, sag));
export const ziplaC = (vx) => (cekirdekIc ? cekirdekIc.zipla(vx) : zipla(vx));
export const dikeyGuncelleC = (vy) => (cekirdekIc ? cekirdekIc.dikey_guncelle(vy) : dikeyGuncelle(vy));
export function duvarSekmesiC(x, vx) {
  if (!cekirdekIc) return duvarSekmesi(x, vx);
  cekirdekIc.duvar_sekmesi(x, vx);
  const v = new Float64Array(cekirdekIc.bellek.buffer, cekirdekIc.cikis_adresi(), 2);
  return { x: v[0], vx: v[1] };
}
// Aşama 2b: puan/kombo. Durum JS nesnesinde (p.kombo, p.bonus) kalır; Rust yalnız kuralı hesaplar.
function puanUygula(p) {
  const v = new Float64Array(cekirdekIc.bellek.buffer, cekirdekIc.cikis_adresi(), 8);
  p.kombo = v[0] === 1 ? { toplam: v[1], sayac: v[2], zip: v[3] } : null;
  if (v[4] !== 0) p.bonus += v[4];
  return v[5] === 1 ? { ad: odulAdi(v[6]), toplam: v[6], zip: v[7] } : null;
}
export function puanInisC(p, katFarki) {
  if (!cekirdekIc) return inis(p, katFarki);
  const k = p.kombo; cekirdekIc.puan_inis(k ? 1 : 0, k ? k.toplam : 0, k ? k.sayac : 0, k ? k.zip : 0, katFarki);
  return puanUygula(p);
}
export function puanKareC(p) {
  if (!cekirdekIc) return kare(p);
  const k = p.kombo; if (!k) return null;
  cekirdekIc.puan_kare(1, k.toplam, k.sayac, k.zip);
  return puanUygula(p);
}
function puanSinav() {
  let s = 777; const r = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  const a = yeniPuan(), b = yeniPuan();
  for (let i = 0; i < 20000; i++) {
    const kareMi = r() < 0.5, fark = Math.floor(r() * 8) - 2;
    const ra = kareMi ? puanKareC(a) : puanInisC(a, fark), rb = kareMi ? kare(b) : inis(b, fark);
    if (!ayni(ra, rb) || !ayni(a, b)) return false;
  }
  return true;
}
// Aşama 3a: iniş araması (basamak çarpışması). JS sürümü: ilk inilen kat ya da -1.
export function inisBulJS(katFn, kirikHas, x, y, eskiX, eskiY) {
  for (let n = Math.max(0, Math.floor((ZEMIN_Y - y) / KAT_ARALIK) - 1); n <= Math.floor((ZEMIN_Y - eskiY) / KAT_ARALIK) + 1; n++) {
    const f = katFn(n), py = ZEMIN_Y - n * KAT_ARALIK, kx0 = 85 + (f.xKaro - 5) * KARO, kx1 = kx0 + f.genislikKaro * KARO;
    if (kirikHas(n)) continue;
    const t = y > eskiY ? Math.min(1, Math.max(0, (py - eskiY) / (y - eskiY))) : 1, xk = eskiX + (x - eskiX) * t;
    const uzerinde = (v) => v >= kx0 - AYAK && v <= kx1 + AYAK;
    if (n === 0 ? true : (eskiY <= py && y >= py && (uzerinde(xk) || uzerinde(x)))) {
      if (n === 0 && y < py) continue;
      return n;
    }
  }
  return -1;
}
// Rust çekirdeği varsa ve oyun tohumluysa Rust, yoksa JS. kirik: kırık katların Set'i, katFn: o.kat.
export function inisBulC(tohum, kirik, katFn, x, y, eskiX, eskiY) {
  const n0 = Math.max(0, Math.floor((ZEMIN_Y - y) / KAT_ARALIK) - 1), n1 = Math.floor((ZEMIN_Y - eskiY) / KAT_ARALIK) + 1;
  if (!cekirdekIc || tohum === null || n1 < n0 || n1 - n0 >= 32) return inisBulJS(katFn, (n) => kirik.has(n), x, y, eskiX, eskiY);
  let maske = 0; for (let i = 0; i <= n1 - n0; i++) if (kirik.has(n0 + i)) maske |= 1 << i;
  return cekirdekIc.inis_ara(tohum >>> 0, x, y, eskiX, eskiY, n0, n1, maske >>> 0);
}
function inisSinav() {
  let s = 4242; const r = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 6000; i++) {
    const tohum = (r() * 4294967296) >>> 0, katFn = (n) => katUret(n, katRnd(tohum, n));
    const eskiY = ZEMIN_Y - r() * (i % 3 === 0 ? 400 : 20000), y = eskiY + r() * 12.2, eskiX = 60 + r() * 520, x = eskiX + (r() - 0.5) * 24;
    const kirik = new Set(); for (let k = 0; k < 4; k++) if (r() < 0.3) kirik.add(Math.max(0, Math.floor((ZEMIN_Y - y) / KAT_ARALIK) - 1 + Math.floor(r() * 4)));
    if (inisBulC(tohum, kirik, katFn, x, y, eskiX, eskiY) !== inisBulJS(katFn, (n) => kirik.has(n), x, y, eskiX, eskiY)) return false;
  }
  return true;
}
// Kendi kendine sınav (fizik): sabit tohumlu sahte rastgele girdilerle JS ile bit düzeyinde aynı olmalı.
function fizikSinav() {
  let s = 12345; const r = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 3000; i++) {
    const vx = (r() - 0.5) * 30, vy = (r() - 0.5) * 40, x = 60 + r() * 520, sol = r() < 0.4, sag = r() < 0.4;
    if (!Object.is(yatayGuncelleC(vx, sol, sag), yatayGuncelle(vx, sol, sag)) || !Object.is(ziplaC(vx), zipla(vx)) || !Object.is(dikeyGuncelleC(vy), dikeyGuncelle(vy))) return false;
    const a = duvarSekmesiC(x, vx), b = duvarSekmesi(x, vx);
    if (!Object.is(a.x, b.x) || !Object.is(a.vx, b.vx)) return false;
  }
  return true;
}

// Baytlardan çekirdeği kurar (küçük modül, eşzamanlı derlenir). Kendi kendine sınav: 8 tohum x 120 kat JS ile birebir aynı olmalı, değilse kapatılır.
export function cekirdekYukle(b64) {
  cekirdekIc = null;
  try {
    const bayt = Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));
    cekirdekIc = new WebAssembly.Instance(new WebAssembly.Module(bayt), {}).exports;
    for (const t of [0, 1, 7, 42, 1234, 99999, 2147483647, 4294967295]) for (let n = 0; n < 120; n++)
      if (!ayni(rustKat(t, n), katUret(n, katRnd(t, n)))) throw new Error('çekirdek uyuşmazlığı');
    if (!fizikSinav()) throw new Error('fizik uyuşmazlığı');
    if (!puanSinav()) throw new Error('puan uyuşmazlığı');
    if (!inisSinav()) throw new Error('iniş uyuşmazlığı');
  } catch { cekirdekIc = null; }
  return cekirdekIc !== null;
}
export const cekirdekVar = () => cekirdekIc !== null;
// Tohumlu kat üretimi: Rust çekirdeği varsa onunla, yoksa JS ile (aynı sonuç).
export const katUretTohum = (n, tohum) => (cekirdekIc ? rustKat(tohum, n) : katUret(n, katRnd(tohum, n)));

if (typeof CEKIRDEK_B64 !== 'undefined') cekirdekYukle(CEKIRDEK_B64);
