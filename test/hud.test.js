// description: Kombo kapanış patlaması testleri (yalnız görünüm): tetikleme bir kez, parçacık sayısı AYAR.parcacik ve azaltılmış harekete uyar, simülasyon durumu değişmez. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
import test from 'node:test';
import assert from 'node:assert/strict';
import { yeniOyun } from '../src/oyun.js';
import { hudCiz, kapanisGorunum } from '../src/hud.js';
import { kapanisEkle, kapanisAdim, kapanisSay, kapanisSifirla, kapanisNokta, KAPANIS_OMUR } from '../src/gorsel.js';
import { AYAR } from '../src/ayar.js';

// sahte canvas bağlamı: her yöntem boş, gradyanlar sahte
const ctx = new Proxy({}, { get: (_, k) => ((k === 'createLinearGradient' || k === 'createRadialGradient') ? () => ({ addColorStop() {} }) : () => {}), set: () => true });
const anlik = (o) => JSON.stringify([o.x, o.y, o.vx, o.vy, o.kamY, o.kare, o.puan, o.ek, o.enYuksek, o.mesaj]);
const hazirla = (parcacik = 1, az = false) => { kapanisSifirla(); AYAR.parcacik = parcacik; AYAR.azaltilmisHareket = az; AYAR.parilti = 1; AYAR.hud = 1; };

test('kapanış parçacıkları: eklenir, ömrü dolunca biter; parcacik 0 ise hiç üretilmez', () => {
  hazirla(1);
  assert.ok(kapanisEkle(320, 186, 142, 27, 16, '#ffd62e') > 0); assert.ok(kapanisSay() > 0);
  for (let i = 0; i < KAPANIS_OMUR * 2; i++) kapanisAdim();
  assert.equal(kapanisSay(), 0);
  hazirla(0); assert.equal(kapanisEkle(320, 186, 142, 27, 16, '#ffd62e'), 0); assert.equal(kapanisSay(), 0);
});

test('kapanış yolu: t=0 kaynakta, t=1 hedefte', () => {
  const p = { x0: 320, y0: 186, cx: 360, cy: 96, x1: 142, y1: 27 };
  assert.deepEqual(kapanisNokta(p, 0), { x: 320, y: 186 }); assert.deepEqual(kapanisNokta(p, 1), { x: 142, y: 27 });
});

test('kombo bitince patlama bir kez tetiklenir, etiket skora uçar, simülasyon durumu değişmez', () => {
  hazirla(1);
  const o = yeniOyun(7); o.mesaj = { ad: 'HARİKA', toplam: 5, zip: 2, guc: 60 };
  const once = anlik(o); hudCiz(ctx, o, 0);
  assert.equal(anlik(o), once, 'HUD simülasyon durumunu değiştirmemeli');
  const say = kapanisSay(); assert.ok(say > 0, 'parçacık üretilmeli'); assert.equal(kapanisGorunum().etiket, true);
  hudCiz(ctx, o, 0); assert.ok(kapanisSay() <= say, 'aynı mesajla yeniden tetiklenmemeli');
  let vurgu = false; for (let i = 0; i < 80; i++) { hudCiz(ctx, o, 0); if (kapanisGorunum().vurgu > 0) vurgu = true; }
  assert.equal(kapanisSay(), 0); assert.equal(kapanisGorunum().etiket, false); assert.ok(vurgu, 'etiket varınca skor vurgusu yanmalı');
  assert.equal(anlik(o), once);
});

test('azaltılmış harekette uçuş ve parçacık yok, yalnız skor vurgusu', () => {
  hazirla(1, true);
  const o = yeniOyun(7); o.mesaj = { ad: 'SÜPER', toplam: 6, zip: 3, guc: 60 };
  hudCiz(ctx, o, 0);
  assert.equal(kapanisSay(), 0); assert.equal(kapanisGorunum().etiket, false); assert.ok(kapanisGorunum().vurgu > 0);
  hazirla(1, false);
});
