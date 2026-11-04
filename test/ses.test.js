// description: Ses ve müzik testleri (sahte Audio ile): efekt ve müzik ayrı açılıp kapanır, ses düzeyi uygulanır, ses yokken çökmez. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
import test from 'node:test';
import assert from 'node:assert/strict';

function sahteAudio() {
  const olay = { calan: [], muzikCalan: 0, muzikDurak: 0, yuklenen: [] };
  globalThis.Audio = class { constructor(yol) { this.yol = yol; this.volume = 1; this.paused = true; olay.yuklenen.push(yol); }
    cloneNode() { const k = new globalThis.Audio(this.yol); k.klon = true; return k; }
    play() { this.paused = false; if (this.klon) olay.calan.push([this.yol, this.volume]); else olay.muzikCalan++; return Promise.resolve(); }
    pause() { this.paused = true; olay.muzikDurak++; } };
  return olay;
}

test('efektler: açıkken doğru dosya ve düzeyle çalar, kapalıyken ya da düzey 0 iken çalmaz', async () => {
  const olay = sahteAudio(); const ayar = await import('../src/ayar.js'); const ses = await import('../src/ses.js?e=' + Math.random());
  ayar.AYAR.efektAcik = 1; ayar.AYAR.ses = 0.5;
  ses.zipSesi(12); ses.zipSesi(2); ses.kristalSesi();
  const dosyalar = olay.calan.map(c => c[0]); assert.deepEqual(dosyalar, ['./varlik/ses/phaseJump5.ogg', './varlik/ses/phaseJump1.ogg', './varlik/ses/pepSound3.ogg']);
  assert.ok(olay.calan.every(c => c[1] > 0 && c[1] <= 0.5), 'ses düzeyi ayara uymalı');
  const once = olay.calan.length; ayar.AYAR.efektAcik = 0; ses.zipSesi(12); assert.equal(olay.calan.length, once, 'kapalıyken çalmamalı');
  ayar.AYAR.efektAcik = 1; ayar.AYAR.ses = 0; ses.zipSesi(12); assert.equal(olay.calan.length, once, 'düzey 0 iken çalmamalı');
});

test('müzik: varsayılan kapalı, açılınca yalnız oyun sürerken çalar, durdurulunca durur', async () => {
  const olay = sahteAudio(); const ayar = await import('../src/ayar.js'); const ses = await import('../src/ses.js?m=' + Math.random());
  assert.equal(ayar.VARSAYILAN.muzikAcik, 0, 'müzik varsayılan kapalı olmalı'); assert.equal(ayar.VARSAYILAN.efektAcik, 1);
  ayar.AYAR.muzikAcik = 0; ses.muzikGuncelle(true); assert.equal(ses.muzikCaliyor(), false, 'kapalıyken çalmamalı');
  ayar.AYAR.muzikAcik = 1; ses.muzikGuncelle(true); assert.equal(ses.muzikCaliyor(), true);
  ses.muzikGuncelle(false); assert.equal(ses.muzikCaliyor(), false, 'oyun dışında durmalı');
  assert.ok(olay.yuklenen.includes('./varlik/ses/muzik.wav'));
});

test('ses yokken (Audio tanımsız) hiçbir çağrı çökmez', async () => {
  delete globalThis.Audio; const ses = await import('../src/ses.js?y=' + Math.random());
  assert.doesNotThrow(() => { ses.zipSesi(10); ses.olumSesi(); ses.muzikGuncelle(true); ses.basarimSesi(); });
});
