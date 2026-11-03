// description: Buz Kule oyun içi HUD (yumuşak açık cam kartlar; tasarım dili arayuz-modernlesme/TASARIM-DILI.css). sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
// Menü, duraklatma ve bitiş ekranları HTML katmanındadır (index.html + arayuz.js); burada yalnız canvas HUD'u var.
import { W, SAAT, skor } from './oyun.js';

const YAZI = '"Inter", "Segoe UI", system-ui, sans-serif', MONO = 'ui-monospace, "JetBrains Mono", Consolas, monospace', SERIF = '"Instrument Serif", Georgia, serif';
const YESIL = '#1F3328', SOLUK = '#6B7A6F';

function yuvarlakHud(c, x, y, g, h, r) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + g, y, x + g, y + h, r); c.arcTo(x + g, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + g, y, r); c.closePath();
}
function kartHud(c, x, y, g, h) {
  c.save(); c.shadowColor = 'rgba(31,51,40,0.22)'; c.shadowBlur = 18; c.shadowOffsetY = 6;
  c.fillStyle = 'rgba(255,255,255,0.90)'; yuvarlakHud(c, x, y, g, h, 16); c.fill(); c.restore();
  c.strokeStyle = 'rgba(31,51,40,0.10)'; c.lineWidth = 1; yuvarlakHud(c, x + 0.5, y + 0.5, g - 1, h - 1, 16); c.stroke();
}
function metinHud(c, t, x, y, font, renk, hiza = 'left') { c.font = font; c.textAlign = hiza; c.fillStyle = renk; c.fillText(t, x, y); c.textAlign = 'left'; }
const etiketHud = (c, t, x, y, hiza) => metinHud(c, t.toUpperCase(), x, y, '600 10px ' + MONO, SOLUK, hiza);

export function hudCiz(c, o, en) {
  kartHud(c, 94, 10, 214, 56);
  etiketHud(c, 'Skor', 110, 30); metinHud(c, String(skor(o)), 110, 56, '700 26px ' + YAZI, YESIL);
  etiketHud(c, 'Kat', 240, 30); metinHud(c, String(o.enYuksek), 240, 56, 'italic 400 30px ' + SERIF, '#7B5CC4');
  kartHud(c, 470, 10, 84, 56); etiketHud(c, 'En iyi', 512, 30, 'center'); metinHud(c, String(Math.max(en, skor(o))), 512, 56, '700 20px ' + YAZI, YESIL, 'center');
  // sonraki hızlanmaya kalan süre (halka)
  const oran = (o.kare % SAAT) / SAAT, cx = 592, cy = 38;
  kartHud(c, 564, 10, 56, 56);
  c.lineWidth = 5; c.lineCap = 'round'; c.strokeStyle = 'rgba(31,51,40,0.12)'; c.beginPath(); c.arc(cx, cy, 17, 0, 7); c.stroke();
  c.strokeStyle = o.kaymaBasladi ? '#E58A5C' : '#7B5CC4'; c.beginPath(); c.arc(cx, cy, 17, -Math.PI / 2, -Math.PI / 2 + Math.max(0.05, oran) * Math.PI * 2); c.stroke(); c.lineCap = 'butt';
  metinHud(c, o.kaymaBasladi ? (Math.floor(o.kare / SAAT) + 1) + 'x' : '–', cx, cy + 5, '700 13px ' + MONO, YESIL, 'center');
  // kombo ölçeri
  if (o.puan.kombo) {
    const k = o.puan.kombo; kartHud(c, 10, 76, 34, 236);
    const h = 188 * (k.sayac / 100), g = c.createLinearGradient(0, 272, 0, 84); g.addColorStop(0, '#F3D5BF'); g.addColorStop(1, '#E58A5C');
    c.fillStyle = 'rgba(31,51,40,0.08)'; yuvarlakHud(c, 18, 84, 18, 188, 6); c.fill();
    c.fillStyle = g; yuvarlakHud(c, 18, 272 - h, 18, Math.max(h, 2), 6); c.fill();
    metinHud(c, 'x' + k.zip, 27, 302, '700 13px ' + MONO, YESIL, 'center');
  }
  // toplanan kristaller
  kartHud(c, 94, 72, 92, 28); c.fillStyle = '#7B5CC4'; c.beginPath(); c.moveTo(110, 79); c.lineTo(116, 86); c.lineTo(110, 93); c.lineTo(104, 86); c.closePath(); c.fill();
  c.fillStyle = '#C9B8F0'; c.beginPath(); c.moveTo(110, 79); c.lineTo(116, 86); c.lineTo(110, 87); c.closePath(); c.fill();
  metinHud(c, '× ' + o.alinan.size, 124, 91, '700 13px ' + MONO, YESIL);
  [['saat', o.saat, 480, 'Saat', '#C98A10'], ['miknatis', o.miknatis, 500, 'Mıknatıs', '#D04040']].filter(g => g[1] > 0).forEach((g, i) => { // etkin güç öğeleri
    const x = 194 + i * 112; kartHud(c, x, 72, 104, 28);
    c.fillStyle = 'rgba(31,51,40,0.10)'; yuvarlakHud(c, x + 10, 91, 84, 5, 2.5); c.fill();
    c.fillStyle = g[4]; yuvarlakHud(c, x + 10, 91, Math.max(3, 84 * g[1] / g[2]), 5, 2.5); c.fill();
    metinHud(c, g[3], x + 10, 86, '700 11px ' + MONO, YESIL);
  });
  if (o.hizlan > 0) { // her 30 sn'de hızlanma uyarısı (alarm saati)
    const a = Math.min(1, o.hizlan / 20), ad = 'HIZLANIYOR  ' + (Math.floor(o.kare / SAAT) + 1) + 'x'; c.globalAlpha = a; c.font = '700 15px ' + MONO;
    const g = c.measureText(ad).width + 40; kartHud(c, W / 2 - g / 2 + 40, 76, g, 34); metinHud(c, ad, W / 2 + 60, 99, '700 15px ' + MONO, '#C2522B', 'center'); c.globalAlpha = 1;
  }
  if (o.rozet) { // 50 katta bir büyük kilometre taşı yazısı
    const a = Math.min(1, o.rozet.guc / 25), s = 1 + 0.12 * Math.sin(o.rozet.guc * 0.2); c.save(); c.globalAlpha = a; c.translate(W / 2, 230); c.scale(s, s);
    c.font = 'italic 400 64px ' + SERIF; const g = c.measureText(o.rozet.metin).width + 60; kartHud(c, -g / 2, -56, g, 84); metinHud(c, o.rozet.metin, 0, 0, 'italic 400 64px ' + SERIF, '#7B5CC4', 'center'); c.restore();
  }
  if (o.mesaj && o.mesaj.guc > 0) { // ödül adı: cam hap
    const a = Math.min(1, o.mesaj.guc / 20), y = 140 - (60 - o.mesaj.guc) * 0.4, ad = o.mesaj.ad + '!';
    c.globalAlpha = a; c.font = 'italic 400 40px ' + SERIF; const g = c.measureText(ad).width + 44;
    kartHud(c, W / 2 - g / 2, y - 40, g, 56); metinHud(c, ad, W / 2, y, 'italic 400 40px ' + SERIF, YESIL, 'center'); c.globalAlpha = 1;
  }
}
