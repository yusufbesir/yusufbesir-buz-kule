// description: Zorluk ölçümü için planlayıcı bot (özgün). sahip: Claude (Icy Tower iş parçacığı)
import { yeniOyun, adim } from '../src/oyun.js';
const kopya = (o) => ({ ...o, puan: { ...o.puan, kombo: o.puan.kombo && { ...o.puan.kombo } } });
function dene(o, plan) {
  const s = kopya(o); const basKat = s.katNo;
  const { yon, kosu, havaYon, havaYon2, degis } = plan;
  for (let i = 0; i < kosu && !s.bitti; i++) adim(s, { sol: yon < 0, sag: yon > 0, zipla: false });
  adim(s, { sol: havaYon < 0, sag: havaYon > 0, zipla: true });
  for (let i = 1; i < 200 && !s.bitti && s.havada; i++) { const y = i < degis ? havaYon : havaYon2; adim(s, { sol: y < 0, sag: y > 0, zipla: false }); }
  return { s, kazanc: s.katNo - basKat, olu: s.bitti || s.havada };
}
export function oyna(seed, maxKare = 20000) {
  let a = seed * 7919 + 1; const rnd = () => (a = (a * 16807) % 2147483647) / 2147483647;
  const o = yeniOyun(rnd); let eylem = [], ucuyor = false;
  while (!o.bitti && o.kare < maxKare) {
    if (!o.havada && eylem.length === 0) {
      let en = null;
      for (const yon of [-1, 0, 1]) for (const kosu of [0, 6, 12, 20, 30, 40]) for (const havaYon of [-1, 0, 1]) for (const havaYon2 of [-1, 0, 1]) for (const degis of havaYon === havaYon2 ? [1] : [8, 16, 24]) {
        const r = dene(o, { yon, kosu, havaYon, havaYon2, degis }); if (r.olu) continue;
        const puan = r.kazanc * 10 + (r.kazanc >= 2 ? 15 : 0) - kosu * 0.02;
        if (!en || puan > en.puan) en = { puan, yon, kosu, havaYon, havaYon2, degis };
      }
      if (!en) en = { yon: 0, kosu: 0, havaYon: 0, havaYon2: 0, degis: 1 };
      for (let i = 0; i < en.kosu; i++) eylem.push({ sol: en.yon < 0, sag: en.yon > 0, zipla: false });
      eylem.push({ sol: en.havaYon < 0, sag: en.havaYon > 0, zipla: true });
      for (let i = 1; i < 60; i++) { const y = i < en.degis ? en.havaYon : en.havaYon2; eylem.push({ sol: y < 0, sag: y > 0, zipla: false }); }
    }
    const e = eylem.length ? eylem.shift() : { sol: false, sag: false, zipla: false };
    adim(o, e);
    if (e.zipla) ucuyor = true;
    if (ucuyor && !o.havada && !e.zipla) { eylem = []; ucuyor = false; }
    if (o.havada && eylem.length === 0) { /* havada son yönü korumak için */ }
  }
  return o;
}
if (process.argv[1]?.endsWith('bot.mjs')) {
  const n = +process.argv[2] || 10; let toplam = 0, en = 0;
  for (let s = 1; s <= n; s++) { const o = oyna(s); toplam += o.enYuksek; en = Math.max(en, o.enYuksek); console.log(s, 'kat', o.enYuksek, o.bitti ? 'öldü' : 'hayatta', 'kare', o.kare); }
  console.log('ortalama', (toplam / n).toFixed(1), 'en iyi', en);
}
