// description: Skor tablosu ve mağaza kalıcı kayıt testleri (sahte localStorage ile). sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
import test from 'node:test';
import assert from 'node:assert/strict';

function depo() { const d = {}; globalThis.localStorage = { getItem: (k) => (k in d ? d[k] : null), setItem: (k, v) => { d[k] = String(v); } }; return d; }

test('skor tablosu: sıralı, en çok 10, sıfır eklenmez, sıra döner', async () => {
  const d = depo(); const m = await import('../src/skorlar.js?a=' + Math.random());
  assert.equal(m.skorEkle(0, 0), 0);
  assert.equal(m.skorEkle(50, 3), 1); assert.equal(m.skorEkle(100, 8), 1); assert.equal(m.skorEkle(70, 5), 2);
  for (let i = 1; i <= 12; i++) m.skorEkle(i, 1);
  assert.equal(m.SKORLAR.length, 10); assert.equal(m.SKORLAR[0].skor, 100);
  assert.equal(m.skorEkle(1, 1) <= 10, true);
  assert.ok(JSON.parse(d['buzkule.skorlar']).length === 10, 'kalıcı kayıt yazılmadı');
});

test('skor tablosu: bozuk kayıt yüklenince çökmez ve geçersiz satırlar atılır', async () => {
  const d = depo(); d['buzkule.skorlar'] = JSON.stringify([{ skor: 5, kat: 1 }, { skor: 'x' }, null]);
  const m = await import('../src/skorlar.js?b=' + Math.random()); m.skorlariYukle();
  assert.equal(m.SKORLAR.length, 1); d['buzkule.skorlar'] = '{bozuk'; m.skorlariYukle(); assert.equal(m.SKORLAR.length, 1);
});

test('mağaza: yetersiz kristalle alınmaz, alınca düşer ve seçilir; kayıt geri yüklenir', async () => {
  const d = depo(); const m = await import('../src/magaza.js?c=' + Math.random());
  assert.equal(m.izAl(1), 'yetersiz'); m.kristalKazan(100);
  assert.equal(m.izAl(1), 'alindi'); assert.equal(m.CUZDAN.kristal, 60); assert.equal(m.izSec(1), true); assert.equal(m.izSec(3), false);
  const e = await import('../src/magaza.js?d=' + Math.random()); e.cuzdanYukle();
  assert.equal(e.CUZDAN.kristal, 60); assert.deepEqual(e.CUZDAN.acik.sort(), [0, 1]); assert.equal(e.CUZDAN.secili, 1);
});

test('başarım: koşul sağlanınca bir kez açılır, kristal ödülü verir, kalıcı kaydedilir', async () => {
  const d = depo(); const m = await import('../src/magaza.js?e=' + Math.random()); const b = await import('../src/basarim.js?f=' + Math.random());
  // basarim.js magaza.js'i kendi sorgu parametresiyle yeniden yüklemez; ortak modülü kullanan sürümden ödül okunur
  const { CUZDAN } = await import('../src/magaza.js');
  const once = CUZDAN.kristal; const o = { enYuksek: 12, alinan: new Set(), enIyiKombo: 0, yaySayisi: 0, kare: 10 };
  const yeni = b.basarimKontrol(o); assert.deepEqual(yeni, ['kat10']); assert.equal(CUZDAN.kristal - once, 5);
  assert.deepEqual(b.basarimKontrol(o), [], 'ikinci kez açılmamalı');
  assert.ok(JSON.parse(d['buzkule.basarim']).includes('kat10')); assert.equal(b.BILDIRIM.length, 1);
  o.enYuksek = 120; o.yaySayisi = 3; o.enIyiKombo = 25; o.alinan = new Set(Array.from({ length: 10 }, (_, i) => i)); o.kare = 7000;
  assert.equal(b.basarimKontrol(o).length, 6, 'kalan altı başarım açılmalı');
});
