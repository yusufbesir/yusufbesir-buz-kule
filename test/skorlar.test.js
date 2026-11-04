// description: Skor tablosu ve mağaza kalıcı kayıt testleri (sahte localStorage ile). sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
import test from 'node:test';
import assert from 'node:assert/strict';

function depo() { const d = {}; globalThis.localStorage = { getItem: (k) => (k in d ? d[k] : null), setItem: (k, v) => { d[k] = String(v); } }; return d; }

test('skor tablosu: kip başına ayrı, sıralı, en çok 5, sıfır eklenmez, sıra döner', async () => {
  const d = depo(); const m = await import('../src/skorlar.js?a=' + Math.random());
  assert.equal(m.skorEkle('yeni', 0, 0), 0);
  assert.equal(m.skorEkle('yeni', 50, 3), 1); assert.equal(m.skorEkle('yeni', 100, 8), 1); assert.equal(m.skorEkle('yeni', 70, 5), 2);
  for (let i = 1; i <= 8; i++) m.skorEkle('yeni', i, 1);
  const yeni = m.skorListesi('yeni'); assert.equal(yeni.length, 5); assert.equal(yeni[0].skor, 100); assert.equal(m.SKOR_SAYISI, 5);
  assert.equal(m.skorEkle('hayalet', 999, 40), 1); assert.equal(m.skorListesi('hayalet').length, 1, 'kipler birbirine karışmamalı');
  assert.equal(m.skorListesi('yeni')[0].skor, 100); assert.equal(m.skorListesi('gunun').length, 0);
  assert.ok(JSON.parse(d['buzkule.skorlar']).length === 5, 'yeni kipinin kalıcı kaydı yazılmadı'); assert.ok('buzkule.skorlar.hayalet' in d);
});

test('skor tablosu: eski tek tablo (en çok 10 satırlı) "yeni" kipine devredilir ve ilk 5 satıra kesilir', async () => {
  const d = depo(); d['buzkule.skorlar'] = JSON.stringify(Array.from({ length: 10 }, (_, i) => ({ skor: (i + 1) * 10, kat: i + 1, t: i + 1 })));
  const m = await import('../src/skorlar.js?g=' + Math.random()); const liste = m.skorListesi('yeni');
  assert.equal(liste.length, 5); assert.deepEqual(liste.map(x => x.skor), [100, 90, 80, 70, 60]);
});

test('skor tablosu: günün kulesi bugüne özel anahtar kullanır; bozuk kayıt çökmez ve geçersiz satırlar atılır', async () => {
  const d = depo(); const m = await import('../src/skorlar.js?b=' + Math.random());
  assert.match(m.skorAnahtari('gunun'), /^buzkule\.skorlar\.gunun\.\d{4}-\d{1,2}-\d{1,2}$/);
  d['buzkule.skorlar'] = JSON.stringify([{ skor: 5, kat: 1, t: 1 }, { skor: 'x' }, null, { skor: -3, kat: 1, t: 2 }]);
  assert.equal(m.skorListesi('yeni').length, 1); d['buzkule.skorlar'] = '{bozuk'; assert.deepEqual(m.skorListesi('yeni'), []);
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
