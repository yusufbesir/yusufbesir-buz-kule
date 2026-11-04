// description: Buz Kule Rust çekirdeği yükleyici (aşama 1: kat üretimi). core.wasm baytları birleştirilmiş betiğe base64 olarak gömülür (CEKIRDEK_B64, arac/birlestir.py); yüklenemezse ya da kendi kendine sınavda JS ile uyuşmazsa eski JS kat üretimi kullanılır. Sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı). Sözleşme: PLAN-buz-kule.md.
import { katUret, KAT_ARALIK } from './kat.js';
import { katRnd } from './hayalet.js';
import { yatayGuncelle, zipla, duvarSekmesi, dikeyGuncelle } from './fizik.js';

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
  } catch { cekirdekIc = null; }
  return cekirdekIc !== null;
}
export const cekirdekVar = () => cekirdekIc !== null;
// Tohumlu kat üretimi: Rust çekirdeği varsa onunla, yoksa JS ile (aynı sonuç).
export const katUretTohum = (n, tohum) => (cekirdekIc ? rustKat(tohum, n) : katUret(n, katRnd(tohum, n)));

if (typeof CEKIRDEK_B64 !== 'undefined') cekirdekYukle(CEKIRDEK_B64);
