// description: Buz Kule profil testi: oyun bitince sayaçlar artar ve kalıcıdır, bozuk/sınır dışı kayıt varsayılana döner. Sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı).
import test from 'node:test';
import assert from 'node:assert/strict';
import { PROFIL, profilYukle, profilGuncelle } from '../src/profil.js';

function depo(ilk) { const d = new Map(ilk ? [['buzkule.profil', ilk]] : []); globalThis.localStorage = { getItem: (k) => (d.has(k) ? d.get(k) : null), setItem: (k, v) => d.set(k, v) }; return d; }

test('profil: oyunlar sayılır, en yüksekler korunur ve yeniden yüklenince aynı kalır', () => {
  const d = depo(); profilYukle(); assert.deepEqual({ ...PROFIL }, { oyun: 0, enKat: 0, enKombo: 0 });
  profilGuncelle({ enYuksek: 40, enIyiKombo: 12 }); profilGuncelle({ enYuksek: 25, enIyiKombo: 30 });
  assert.deepEqual({ ...PROFIL }, { oyun: 2, enKat: 40, enKombo: 30 });
  profilYukle(); assert.deepEqual({ ...PROFIL }, { oyun: 2, enKat: 40, enKombo: 30 }); assert.ok(d.has('buzkule.profil'));
});
test('profil: bozuk JSON, negatif ve kesirli değerler varsayılana döner', () => {
  depo('{bozuk'); profilYukle(); assert.deepEqual({ ...PROFIL }, { oyun: 0, enKat: 0, enKombo: 0 });
  depo(JSON.stringify({ oyun: -3, enKat: 2.5, enKombo: 7 })); profilYukle(); assert.deepEqual({ ...PROFIL }, { oyun: 0, enKat: 0, enKombo: 7 });
});
