// description: Buz Kule arayüzü: HUD, başlık, duraklatma ve bitiş ekranları (prosedürel çizim). sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
import { W, H, SAAT, skor } from './oyun.js';

function yuvarlak(c, x, y, g, h, r) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + g, y, x + g, y + h, r); c.arcTo(x + g, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + g, y, r); c.closePath();
}
function panel(c, x, y, g, h) {
  c.fillStyle = 'rgba(8,16,40,0.62)'; yuvarlak(c, x, y, g, h, 10); c.fill();
  c.strokeStyle = 'rgba(160,220,255,0.55)'; c.lineWidth = 2; c.stroke();
}
const YAZI = '"Segoe UI", system-ui, sans-serif';
function yazi(c, t, x, y, boy, renk, hiza = 'left', agirlik = 800) {
  c.font = agirlik + ' ' + boy + 'px ' + YAZI; c.textAlign = hiza;
  c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillText(t, x + 2, y + 2); c.fillStyle = renk; c.fillText(t, x, y); c.textAlign = 'left';
}

export function hudCiz(c, o, en) {
  panel(c, 94, 8, 210, 52);
  yazi(c, 'SKOR', 106, 28, 12, '#8fd0ff', 'left', 700); yazi(c, String(skor(o)), 106, 52, 26, '#ffffff');
  yazi(c, 'KAT', 232, 28, 12, '#8fd0ff', 'left', 700); yazi(c, String(o.enYuksek), 232, 52, 26, '#ffd24a');
  panel(c, 478, 8, 76, 52); yazi(c, 'EN İYİ', 516, 28, 11, '#8fd0ff', 'center', 700); yazi(c, String(Math.max(en, skor(o))), 516, 52, 20, '#fff', 'center');
  // sonraki hızlanmaya kalan süre (halka)
  const oran = (o.kare % SAAT) / SAAT, cx = 590, cy = 34;
  c.lineWidth = 6; c.strokeStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.arc(cx, cy, 18, 0, 7); c.stroke();
  c.strokeStyle = o.kaymaBasladi ? '#ff7a5a' : '#6fd3ff'; c.beginPath(); c.arc(cx, cy, 18, -Math.PI / 2, -Math.PI / 2 + oran * Math.PI * 2); c.stroke();
  yazi(c, o.kaymaBasladi ? (Math.floor(o.kare / SAAT) + 1) + 'x' : '-', cx, cy + 5, 14, '#fff', 'center');
  // kombo ölçeri
  if (o.puan.kombo) {
    const k = o.puan.kombo; panel(c, 10, 70, 30, 240);
    const h = 196 * (k.sayac / 100), g = c.createLinearGradient(0, 270, 0, 74); g.addColorStop(0, '#ffd24a'); g.addColorStop(1, '#ff5a3c');
    c.fillStyle = g; yuvarlak(c, 16, 270 - h, 18, Math.max(h, 2), 5); c.fill();
    yazi(c, 'x' + k.zip, 25, 88, 14, '#fff', 'center'); yazi(c, '+' + k.toplam, 25, 300, 13, '#ffd24a', 'center');
  }
  if (o.mesaj && o.mesaj.guc > 0) {
    c.globalAlpha = Math.min(1, o.mesaj.guc / 20);
    yazi(c, o.mesaj.ad + '!', W / 2, 130 - (60 - o.mesaj.guc) * 0.4, 40, '#ffd24a', 'center', 900); c.globalAlpha = 1;
  }
}

function perde(c) { c.fillStyle = 'rgba(4,10,30,0.72)'; c.fillRect(0, 0, W, H); }

export function baslikCiz(c, en, t) {
  perde(c);
  const g = c.createLinearGradient(0, 90, 0, 170); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#7fd0ff');
  c.font = '900 76px ' + YAZI; c.textAlign = 'center';
  c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillText('BUZ KULE', W / 2 + 4, 164); c.fillStyle = g; c.fillText('BUZ KULE', W / 2, 160); c.textAlign = 'left';
  yazi(c, 'Kuleye tırman, kombo yap, düşme!', W / 2, 200, 18, '#bfe6ff', 'center', 600);
  panel(c, 170, 235, 300, 120);
  yazi(c, '← →   koş', 320, 268, 18, '#fff', 'center', 600);
  yazi(c, 'SPACE   zıpla (hız = yükseklik)', 320, 296, 18, '#fff', 'center', 600);
  yazi(c, 'P duraklat   R yeniden', 320, 324, 16, '#9fc7ea', 'center', 600);
  yazi(c, 'EN İYİ SKOR ' + en, 320, 348, 15, '#ffd24a', 'center');
  if (Math.floor(t / 30) % 2 === 0) yazi(c, 'Başlamak için SPACE', W / 2, 410, 26, '#ffd24a', 'center', 900);
}

export function duraklatCiz(c) {
  perde(c); yazi(c, 'DURAKLATILDI', W / 2, 230, 44, '#fff', 'center', 900);
  yazi(c, 'P ile devam   R ile yeniden', W / 2, 272, 18, '#bfe6ff', 'center', 600);
}

export function bitisCiz(c, o, en, yeniRekor) {
  perde(c); panel(c, 150, 120, 340, 250);
  yazi(c, 'KULE SENİ YENDİ', W / 2, 165, 30, '#ff8a6a', 'center', 900);
  yazi(c, 'SKOR', W / 2, 205, 13, '#8fd0ff', 'center', 700); yazi(c, String(skor(o)), W / 2, 245, 44, '#fff', 'center', 900);
  yazi(c, 'KAT ' + o.enYuksek + '   •   EN İYİ ' + en, W / 2, 280, 18, '#ffd24a', 'center', 700);
  if (yeniRekor) yazi(c, '★ YENİ REKOR ★', W / 2, 315, 20, '#7dffb0', 'center', 900);
  yazi(c, 'SPACE ile tekrar dene', W / 2, 352, 18, '#bfe6ff', 'center', 700);
}
