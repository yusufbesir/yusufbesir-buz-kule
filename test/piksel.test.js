// description: piksel.js önbelleği testleri: önbellekli yol ile eski yolun aygıt pikseli çıktısı aynı (ölçek 1, 1.5, 2), LRU sınırı, düzgün ölçekli olmayan dönüşümde eski yola düşüş. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı, TEZDENEME#CLONE)
import test from 'node:test';
import assert from 'node:assert/strict';
import { pikselYaz, pikselGenislik, pikselOnbellekAyarla, pikselOnbellekBoyut } from '../src/piksel.js';

// sahte bağlam: dönüşümü izler, fillRect'i aygıt koordinatında kaydeder; drawImage tuvalin kayıtlarını (x,y) kaydırıp çoğaltır
const sahte = (s = 1, e = 0, f = 0, b = 0) => {
  let m = { a: s, b, c: 0, d: s, e, f }; const yigin = [], kayit = [];
  return {
    kayit, fillStyle: '', globalAlpha: 1, globalCompositeOperation: 'source-over',
    getTransform: () => ({ ...m }), setTransform(a, bb, cc, d, ee, ff) { m = { a, b: bb, c: cc, d, e: ee, f: ff }; },
    save() { yigin.push({ ...m }); }, restore() { m = yigin.pop(); },
    fillRect(x, y, w, h) { kayit.push([this.fillStyle, x * m.a + m.e, y * m.d + m.f, w * m.a, h * m.d]); },
    drawImage(t, x, y) { for (const [r, a, bb, w, h] of t.kayit) kayit.push([r, a + x, bb + y, w, h]); },
  };
};
const fabrika = () => () => { const t = sahte(); t.getContext = () => t; return t; };
// aygıt piksel kümesi: yarım piksel çözünürlüğünde örnekle
const yuzey = (k) => { const s = new Map(); for (const [r, x, y, w, h] of k) for (let i = x + 0.25; i < x + w; i += 0.5) for (let j = y + 0.25; j < y + h; j += 0.5) s.set(`${Math.floor(i * 2)},${Math.floor(j * 2)}`, r); return [...s].sort(); };

for (const s of [1, 1.5, 2]) {
  test(`önbellekli çıktı eski yolla aynı aygıt pikselleri (ölçek ${s}, kontur+gölge, orta hiza)`, () => {
    const sec = { hiza: 'orta', cizgi: '#150a3a', golge: '#000001' }, ox = s === 1.5 ? 4 : 0;
    pikselOnbellekAyarla(() => null);
    const eski = sahte(s, ox, 0); pikselYaz(eski, 'KAT 12!', 320, 100, 2, '#fff', sec);
    pikselOnbellekAyarla(fabrika());
    const yeni = sahte(s, ox, 0); const w = pikselYaz(yeni, 'KAT 12!', 320, 100, 2, '#fff', sec);
    assert.equal(w, pikselGenislik('KAT 12!', 2));
    assert.equal(pikselOnbellekBoyut(), 1);
    assert.deepEqual(yuzey(yeni.kayit), yuzey(eski.kayit));
    pikselOnbellekAyarla(() => null);
  });
}

test('LRU en çok 64 girişi tutar; eğik dönüşümde önbellek kullanılmaz', () => {
  pikselOnbellekAyarla(fabrika());
  for (let i = 0; i < 100; i++) pikselYaz(sahte(1.5), 'S' + i, 0, 0, 2, '#fff');
  assert.equal(pikselOnbellekBoyut(), 64);
  pikselOnbellekAyarla(fabrika());
  pikselYaz(sahte(2, 0, 0, 0.5), 'AB', 0, 0, 2, '#fff');
  assert.equal(pikselOnbellekBoyut(), 0);
  pikselOnbellekAyarla(() => null);
});
