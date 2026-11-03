// description: Buz Kule oyun içi HUD (kompakt, yarı saydam yumuşak açık cam kartlar; oyuncu üst kenara yaklaşınca solar). sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
// Menü, duraklatma ve bitiş ekranları HTML katmanındadır (index.html + arayuz.js); burada yalnız canvas HUD'u var.
import { W, SAAT, skor } from './oyun.js';
import { AYAR } from './ayar.js';
import { BILDIRIM } from './basarim.js';

const YAZI = '"Inter", "Segoe UI", system-ui, sans-serif', MONO = 'ui-monospace, "JetBrains Mono", Consolas, monospace', SERIF = '"Instrument Serif", Georgia, serif';
const YESIL = '#1F3328', SOLUK = '#6B7A6F';

function yuvarlakHud(c, x, y, g, h, r) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + g, y, x + g, y + h, r); c.arcTo(x + g, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + g, y, r); c.closePath();
}
function kartHud(c, x, y, g, h, r = 12) {
  c.save(); c.shadowColor = 'rgba(31,51,40,0.18)'; c.shadowBlur = 10; c.shadowOffsetY = 3;
  c.fillStyle = 'rgba(255,255,255,0.88)'; yuvarlakHud(c, x, y, g, h, r); c.fill(); c.restore();
  c.strokeStyle = 'rgba(31,51,40,0.10)'; c.lineWidth = 1; yuvarlakHud(c, x + 0.5, y + 0.5, g - 1, h - 1, r); c.stroke();
}
function metinHud(c, t, x, y, font, renk, hiza = 'left') { c.font = font; c.textAlign = hiza; c.fillStyle = renk; c.fillText(t, x, y); c.textAlign = 'left'; }
const etiketHud = (c, t, x, y, hiza) => metinHud(c, t.toUpperCase(), x, y, '600 9px ' + MONO, SOLUK, hiza);

export function hudCiz(c, o, en) {
  // Oyuncu ekranın üst kısmındayken (yukarı zıplama) HUD neredeyse görünmez olur, görüşü kapatmaz.
  const ekranY = o.y - o.kamY, gorunur = Math.max(0.16, Math.min(1, (ekranY - 70) / 150)) * 0.92 * Math.min(1.2, AYAR.hud); // HUD yoğunluğu ayardan (0 = sürekli bilgi kapalı)
  if (AYAR.hud <= 0.02) return;
  c.save(); c.globalAlpha = gorunur;
  // sol hap: skor, kat, kristal
  kartHud(c, 92, 8, 214, 32);
  etiketHud(c, 'Skor', 104, 19); metinHud(c, String(skor(o)), 104, 35, '700 16px ' + YAZI, YESIL);
  etiketHud(c, 'Kat', 188, 19); metinHud(c, String(o.enYuksek), 188, 35, 'italic 400 20px ' + SERIF, '#7B5CC4');
  c.fillStyle = '#7B5CC4'; c.beginPath(); c.moveTo(250, 17); c.lineTo(255, 24); c.lineTo(250, 31); c.lineTo(245, 24); c.closePath(); c.fill();
  c.fillStyle = '#C9B8F0'; c.beginPath(); c.moveTo(250, 17); c.lineTo(255, 24); c.lineTo(250, 25); c.closePath(); c.fill();
  metinHud(c, '× ' + o.alinan.size, 261, 29, '700 12px ' + MONO, YESIL);
  // sağ hap: en iyi + hızlanma halkası
  kartHud(c, 438, 8, 117, 32);
  etiketHud(c, 'En iyi', 449, 19); metinHud(c, String(Math.max(en, skor(o))), 449, 35, '700 14px ' + YAZI, YESIL);
  const oran = (o.kare % SAAT) / SAAT, cx = 530, cy = 24;
  c.lineWidth = 4; c.lineCap = 'round'; c.strokeStyle = 'rgba(31,51,40,0.12)'; c.beginPath(); c.arc(cx, cy, 10, 0, 7); c.stroke();
  c.strokeStyle = o.kaymaBasladi ? '#E58A5C' : '#7B5CC4'; c.beginPath(); c.arc(cx, cy, 10, -Math.PI / 2, -Math.PI / 2 + Math.max(0.05, oran) * Math.PI * 2); c.stroke(); c.lineCap = 'butt';
  if (o.kaymaBasladi) metinHud(c, (Math.floor(o.kare / SAAT) + 1) + 'x', cx, cy + 3.5, '700 9px ' + MONO, YESIL, 'center');
  // etkin güç öğeleri: küçük süre çubukları
  [['saat', o.saat, 480, 'Saat', '#C98A10'], ['miknatis', o.miknatis, 500, 'Mıknatıs', '#D04040']].filter(g => g[1] > 0).forEach((g, i) => {
    const x = 92 + i * 96; kartHud(c, x, 44, 90, 20, 10);
    c.fillStyle = 'rgba(31,51,40,0.10)'; yuvarlakHud(c, x + 8, 55, 74, 4, 2); c.fill();
    c.fillStyle = g[4]; yuvarlakHud(c, x + 8, 55, Math.max(3, 74 * g[1] / g[2]), 4, 2); c.fill();
    metinHud(c, g[3], x + 8, 52, '700 9px ' + MONO, YESIL);
  });
  c.restore();
  // kombo ölçeri (duvar üzerinde ince bir çubuk)
  if (o.puan.kombo) {
    const k = o.puan.kombo; c.save(); c.globalAlpha = Math.max(0.5, gorunur); kartHud(c, 12, 80, 26, 190, 10);
    const h = 150 * (k.sayac / 100), g = c.createLinearGradient(0, 252, 0, 100); g.addColorStop(0, '#F3D5BF'); g.addColorStop(1, '#E58A5C');
    c.fillStyle = 'rgba(31,51,40,0.08)'; yuvarlakHud(c, 19, 100, 12, 150, 5); c.fill();
    c.fillStyle = g; yuvarlakHud(c, 19, 250 - h, 12, Math.max(h, 2), 5); c.fill();
    metinHud(c, 'x' + k.zip, 25, 92, '700 10px ' + MONO, YESIL, 'center'); c.restore();
  }
  BILDIRIM.slice(0, 2).forEach((b, i) => { // başarım bildirimi (yukarıdan kayan cam hap)
    const a = Math.min(1, b.guc / 20, (200 - b.guc) / 12); c.save(); c.globalAlpha = Math.max(0, a); c.font = '700 12px ' + MONO;
    const ad = '★ ' + b.ad + '  +' + b.odul + ' ◆', g = c.measureText(ad).width + 36; kartHud(c, W / 2 - g / 2, 112 + i * 34, g, 28, 14);
    metinHud(c, ad, W / 2, 130 + i * 34, '700 12px ' + MONO, '#7B5CC4', 'center'); c.restore();
  });
  if (o.hizlan > 0) { // her 30 sn'de hızlanma uyarısı (alarm saati)
    const a = Math.min(1, o.hizlan / 20), ad = 'HIZLANIYOR  ' + (Math.floor(o.kare / SAAT) + 1) + 'x'; c.globalAlpha = a; c.font = '700 13px ' + MONO;
    const g = c.measureText(ad).width + 32; kartHud(c, W / 2 - g / 2, 76, g, 28, 14); metinHud(c, ad, W / 2, 95, '700 13px ' + MONO, '#C2522B', 'center'); c.globalAlpha = 1;
  }
  if (o.rozet) { // 50 katta bir büyük kilometre taşı yazısı
    const a = Math.min(1, o.rozet.guc / 25), s = 1 + 0.12 * Math.sin(o.rozet.guc * 0.2); c.save(); c.globalAlpha = a * 0.92; c.translate(W / 2, 230); c.scale(s, s);
    c.font = 'italic 400 64px ' + SERIF; const g = c.measureText(o.rozet.metin).width + 60; kartHud(c, -g / 2, -56, g, 84, 18); metinHud(c, o.rozet.metin, 0, 0, 'italic 400 64px ' + SERIF, '#7B5CC4', 'center'); c.restore();
  }
  if (o.mesaj && o.mesaj.guc > 0) { // ödül adı: cam hap (kısa süreli, ortada)
    const a = Math.min(1, o.mesaj.guc / 20), y = 150 - (60 - o.mesaj.guc) * 0.4, ad = o.mesaj.ad + '!';
    c.globalAlpha = a * 0.92; c.font = 'italic 400 36px ' + SERIF; const g = c.measureText(ad).width + 40;
    kartHud(c, W / 2 - g / 2, y - 36, g, 50, 16); metinHud(c, ad, W / 2, y, 'italic 400 36px ' + SERIF, YESIL, 'center'); c.globalAlpha = 1;
  }
}
