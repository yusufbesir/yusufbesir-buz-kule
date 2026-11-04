// description: piksel.js önbelleği testleri: önbellekli yol ile eski yolun piksel çıktısı aynı, LRU sınırı, 1:1 olmayan dönüşümde eski yola düşüş. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı, TEZDENEME#CLONE)
import test from 'node:test';
import assert from 'node:assert/strict';
import { pikselYaz, pikselGenislik, pikselOnbellekAyarla, pikselOnbellekBoyut } from '../src/piksel.js';

// sahte bağlam: fillRect çağrılarını kaydeder; drawImage tuvalin kayıtlarını x,y kaydırmasıyla yeniden oynatır
const SABIT = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
const sahte = (m = SABIT) => {
  const kayit = [];
  return { kayit, fillStyle: '', globalAlpha: 1, globalCompositeOperation: 'source-over', getTransform: () => m, fillRect(x, y, w, h) { kayit.push([this.fillStyle, x, y, w, h]); }, drawImage(t, x, y) { for (const [s, a, b, w, h] of t.kayit) kayit.push([s, a + x, b + y, w, h]); } };
};
const fabrika = () => (w, h) => { const t = sahte(); t.getContext = () => t; return t; };
const yuzey = (k) => { const s = new Map(); for (const [r, x, y, w, h] of k) for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) s.set(`${x + i},${y + j}`, r); return [...s].sort(); };

test('önbellekli çıktı eski yolla aynı pikselleri üretir (kontur+gölge, orta hiza)', () => {
  const sec = { hiza: 'orta', cizgi: '#150a3a', golge: '#000001' };
  pikselOnbellekAyarla(() => null);
  const eski = sahte(); pikselYaz(eski, 'KAT 12!', 320, 100, 3, '#fff', sec);
  pikselOnbellekAyarla(fabrika());
  const yeni = sahte(); const w = pikselYaz(yeni, 'KAT 12!', 320, 100, 3, '#fff', sec);
  assert.equal(w, pikselGenislik('KAT 12!', 3));
  assert.equal(pikselOnbellekBoyut(), 1);
  assert.deepEqual(yuzey(yeni.kayit), yuzey(eski.kayit));
});

test('LRU en çok 64 girişi tutar; 1:1 olmayan dönüşümde önbellek kullanılmaz', () => {
  pikselOnbellekAyarla(fabrika());
  for (let i = 0; i < 100; i++) pikselYaz(sahte(), 'S' + i, 0, 0, 2, '#fff');
  assert.equal(pikselOnbellekBoyut(), 64);
  pikselOnbellekAyarla(fabrika());
  pikselYaz(sahte({ ...SABIT, a: 2, d: 2 }), 'AB', 0, 0, 2, '#fff');
  assert.equal(pikselOnbellekBoyut(), 0);
  pikselOnbellekAyarla(() => null);
});
