// description: Buz Kule görsel katmanı: aurora gökyüzü, kristal siluetleri, taş duvarlar ve mesaleCizler, temaya göre detaylı basamaklar (buz, ametist, ahşap, yosunlu taş), kristal toplanabilirleri, parçacıklar (prosedürel vektör çizim; yüksek çözünürlükte keskin). sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
import { AYAR } from './ayar.js';
export const TEMALAR = [
  { ad: 'buz', ust: '#050a1f', alt: '#12356a', serit: ['#38f2c8', '#5aa8ff'], plat: '#7fe9ff', koyu: '#1b6f9a', kristal: '#0b2a55', duvar: '#2a3f66', harc: '#16233f', mesale: '#8fe3ff' },
  { ad: 'ametist', ust: '#12062b', alt: '#4a1a80', serit: ['#c76bff', '#ff6bd5'], plat: '#e0b3ff', koyu: '#7a3fb8', kristal: '#2a0f52', duvar: '#43296b', harc: '#251440', mesale: '#ff9bf0' },
  { ad: 'tahta', ust: '#1f0a1c', alt: '#6b1f45', serit: ['#ff8a5a', '#ffd24a'], plat: '#ffc2a0', koyu: '#c4553a', kristal: '#3d1230', duvar: '#5b3042', harc: '#321723', mesale: '#ffb347' },
  { ad: 'yosun', ust: '#04161a', alt: '#0b5a50', serit: ['#3dffa8', '#3dd0ff'], plat: '#9affd8', koyu: '#1d8f78', kristal: '#07343a', duvar: '#2a4a46', harc: '#122624', mesale: '#9dff8f' },
];
const hash = (n) => { let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };
const temaNo = (kat) => Math.floor(kat / 100) % TEMALAR.length;
const tema = (kat) => TEMALAR[temaNo(kat)];
let zaman = 0;

function yuvarlak(c, x, y, g, h, r) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + g, y, x + g, y + h, r); c.arcTo(x + g, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + g, y, r); c.closePath();
}
const karisim = (hex, k) => { // hex rengi k (-1..1) kadar koyulaştır/açıklaştır
  const n = parseInt(hex.slice(1), 16), f = (v) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
};

export function arkaPlan(c, W, H, kamY, kat) {
  if (!AYAR.azaltilmisHareket) zaman++; // azaltılmış harekette aurora ve yıldız titremesi donar
  const t = tema(kat), g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, t.ust); g.addColorStop(1, t.alt); c.fillStyle = g; c.fillRect(0, 0, W, H);
  // aurora şeritleri (ekleme karışımı, yavaş dalgalanma)
  c.save(); c.globalCompositeOperation = 'lighter';
  t.serit.forEach((renk, k) => {
    const y0 = 120 + k * 130 - (kamY * 0.05) % 260;
    const gr = c.createLinearGradient(0, y0 - 70, 0, y0 + 70); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, renk); gr.addColorStop(1, 'rgba(0,0,0,0)');
    c.globalAlpha = 0.16 * Math.min(1.5, AYAR.parilti); c.fillStyle = gr; c.beginPath(); c.moveTo(0, y0 + 80);
    for (let x = 0; x <= W; x += 10) c.lineTo(x, y0 + Math.sin(x * 0.012 + zaman * 0.012 + k * 2) * 34 + Math.sin(x * 0.03 - zaman * 0.02) * 10);
    c.lineTo(W, y0 + 160); c.lineTo(0, y0 + 160); c.closePath(); c.fill();
  });
  c.restore();
  // uzak kristal siluetleri (paralaks)
  for (const [say, hiz, yuk, a] of [[7, 0.12, 190, 0.55], [9, 0.25, 130, 0.8]]) {
    c.globalAlpha = a; c.fillStyle = t.kristal;
    const periyot = 480;
    for (let i = 0; i < say; i++) {
      const x = 95 + hash(i * 17 + yuk) * 450, taban = ((hash(i * 5 + hiz * 100) * periyot * 2 - kamY * hiz) % (periyot * 2) + periyot * 2) % (periyot * 2) - 60;
      const gen = 28 + hash(i * 3 + yuk) * 34, boy = yuk * (0.5 + hash(i * 11) * 0.5);
      c.beginPath(); c.moveTo(x - gen, taban + boy); c.lineTo(x - gen * 0.3, taban); c.lineTo(x + gen * 0.2, taban + boy * 0.25); c.lineTo(x + gen, taban + boy); c.closePath(); c.fill();
    }
  }
  c.globalAlpha = 1;
  // kule içi: uzak kemerli pencereler (paralaks), içinden gökyüzü görünür
  const aralik = 260, ph = ((kamY * 0.4) % aralik + aralik) % aralik;
  for (let k = -1; k < H / aralik + 2; k++) {
    const y = k * aralik + ph - 60 + (aralik - 0); const px = 320 - 38;
    c.fillStyle = 'rgba(0,0,0,0.28)'; c.beginPath(); c.moveTo(px, y + 100); c.lineTo(px, y + 38); c.arc(px + 38, y + 38, 38, Math.PI, 0); c.lineTo(px + 76, y + 100); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.06)'; c.lineWidth = 3; c.stroke();
  }
  // kar/yıldız tozu: parıldayan
  for (const [say, hiz, boy] of [[40, 0.18, 1], [18, 0.4, 2]]) {
    for (let i = 0; i < say; i++) {
      const x = 90 + hash(i * 7 + hiz * 100) * 460, y0 = hash(i * 13 + boy) * H * 2;
      const y = ((y0 - kamY * hiz) % (H * 2) + H * 2) % (H * 2) - H * 0.5, p = 0.5 + 0.5 * Math.sin(zaman * 0.05 + i * 1.7);
      c.globalAlpha = 0.35 + 0.55 * p; c.fillStyle = '#ffffff'; c.fillRect(Math.round(x), Math.round(y), boy, boy);
    }
  }
  c.globalAlpha = 1;
}

function mesaleCiz(c, x, y, t, yon) {
  const titrek = 0.85 + 0.15 * Math.sin(zaman * 0.3 + y), parlak = AYAR.parilti;
  c.save(); c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, y, 2, x, y, 70 * titrek); g.addColorStop(0, t.mesale + 'cc'); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.globalAlpha = 0.45 * parlak; c.fillStyle = g; c.fillRect(x - 80, y - 80, 160, 160); c.restore();
  c.fillStyle = '#3b2f2a'; c.fillRect(x - 3, y + 4, 6, 18); yuvarlak(c, x - 8, y + 2, 16, 6, 3); c.fill();               // tutucu
  c.fillStyle = t.mesale; c.beginPath(); c.moveTo(x - 6, y + 2); c.quadraticCurveTo(x - 8 * titrek, y - 10, x, y - 20 * titrek); c.quadraticCurveTo(x + 8, y - 8, x + 6, y + 2); c.closePath(); c.fill(); // alev
  c.fillStyle = '#fff6d0'; c.beginPath(); c.moveTo(x - 3, y + 2); c.quadraticCurveTo(x - 3, y - 6, x, y - 11 * titrek); c.quadraticCurveTo(x + 4, y - 4, x + 3, y + 2); c.closePath(); c.fill();
}

export function duvarlar(c, W, H, kamY, kat) {
  const t = tema(kat);
  for (const x0 of [0, 555]) {
    const gen = x0 === 0 ? 85 : W - 555;
    c.save(); c.beginPath(); c.rect(x0, 0, gen, H); c.clip();
    c.fillStyle = t.harc; c.fillRect(x0, 0, gen, H);
    // taş duvar: kaydırmayla birlikte hareket eden sıralar, her taş kendi tonunda
    const bh = 22, bw = 42;
    for (let r = Math.floor(kamY / bh) - 1; r < Math.floor((kamY + H) / bh) + 1; r++) {
      const y = r * bh - kamY, kay = (r & 1) * (bw / 2);
      for (let b = -1; b < gen / bw + 2; b++) {
        const bx = x0 + b * bw - kay, h = hash(r * 131 + b * 17 + (x0 ? 7 : 3)), ton = (h - 0.5) * 0.28;
        c.fillStyle = karisim(t.duvar, ton);
        yuvarlak(c, bx + 1.5, y + 1.5, bw - 3, bh - 3, 3); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.07)'; c.fillRect(bx + 3, y + 2, bw - 8, 2);          // üst kenar ışığı
        if (h > 0.82) { c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(bx + 8 + h * 10, y + 8, 7, 3); } // kırağı lekesi
      }
    }
    // kenara doğru derinlik gölgesi (kule içine bakış)
    const gr = c.createLinearGradient(x0, 0, x0 + gen, 0);
    if (x0 === 0) { gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(0.6, 'rgba(0,0,0,0.12)'); gr.addColorStop(1, 'rgba(0,0,0,0.5)'); }
    else { gr.addColorStop(0, 'rgba(0,0,0,0.5)'); gr.addColorStop(0.4, 'rgba(0,0,0,0.12)'); gr.addColorStop(1, 'rgba(0,0,0,0.55)'); }
    c.fillStyle = gr; c.fillRect(x0, 0, gen, H);
    c.restore();
    // mesaleCizler: her 280 px'te bir, iki duvar dönüşümlü
    for (let r = Math.floor(kamY / 280) - 1; r < Math.floor((kamY + H) / 280) + 1; r++) {
      if (((r & 1) === 0) !== (x0 === 0)) continue;
      mesaleCiz(c, x0 === 0 ? 60 : 580, r * 280 + 100 - kamY, t, x0 === 0 ? 1 : -1);
    }
    // iç kenar: parlak taş silmesi
    c.save(); c.shadowColor = t.plat; c.shadowBlur = 10 * AYAR.parilti; c.fillStyle = karisim(t.plat, -0.2); c.fillRect(x0 === 0 ? 83 : 555, 0, 2, H); c.restore();
  }
}

// ---- Basamaklar: tema başına ayrı malzeme ----
const kabarik = (c, x0, x1, yUst, h, tohum) => { // yumuşak kabarık üst kenar çizgisi (kar/yosun başlığı)
  c.moveTo(x0, yUst + h);
  c.lineTo(x0, yUst + h * 0.4);
  for (let x = x0; x < x1; x += 14) { const a = hash(tohum + x * 3) * h * 0.5; c.quadraticCurveTo(x + 7, yUst - a, Math.min(x + 14, x1), yUst + h * 0.4); }
  c.lineTo(x1, yUst + h);
  c.closePath();
};

function platformBuz(c, x, y, gen, n, no, t) {
  const kal = 22;
  c.save(); c.shadowColor = no ? '#ffd24a' : t.plat; c.shadowBlur = 14 * AYAR.parilti;
  const g = c.createLinearGradient(0, y, 0, y + kal); g.addColorStop(0, '#e8fbff'); g.addColorStop(0.3, '#a9e6fb'); g.addColorStop(1, '#3c8fc9');
  c.fillStyle = g; yuvarlak(c, x, y, gen, kal, 8); c.fill(); c.restore();
  c.save(); c.beginPath(); yuvarlak(c, x, y, gen, kal, 8); c.clip();
  // iç yansımalar (çapraz ışık şeritleri) ve çatlaklar
  c.fillStyle = 'rgba(255,255,255,0.28)';
  for (let i = 0; i < Math.max(2, gen / 60); i++) { const px = x + 14 + hash(n * 7 + i) * (gen - 40); c.beginPath(); c.moveTo(px, y + kal); c.lineTo(px + 10, y + kal); c.lineTo(px + 24, y); c.lineTo(px + 14, y); c.closePath(); c.fill(); }
  c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 1;
  for (let i = 0; i < 2; i++) { const px = x + 20 + hash(n * 3 + i * 5) * (gen - 40); c.beginPath(); c.moveTo(px, y + 6); c.lineTo(px + 5, y + 11); c.lineTo(px + 2, y + 15); c.lineTo(px + 8, y + 20); c.stroke(); }
  c.restore();
  // kar başlığı
  c.fillStyle = '#ffffff'; c.beginPath(); kabarik(c, x + 2, x + gen - 2, y - 6, 12, n * 13); c.fill();
  c.fillStyle = 'rgba(130,190,240,0.35)'; c.fillRect(x + 6, y + 5, gen - 12, 2);
  // buz saçakları
  const adet = Math.max(3, Math.floor(gen / 18));
  for (let i = 0; i < adet; i++) {
    const px = x + 8 + (gen - 16) * (i + hash(n * 11 + i) * 0.6) / adet, boy = 8 + hash(n * 5 + i * 3) * 18, w = 4 + hash(n + i) * 3;
    const gr = c.createLinearGradient(0, y + kal - 2, 0, y + kal + boy); gr.addColorStop(0, '#9ddcf8'); gr.addColorStop(1, 'rgba(210,245,255,0.95)');
    c.fillStyle = gr; c.beginPath(); c.moveTo(px - w, y + kal - 2); c.lineTo(px + w, y + kal - 2); c.lineTo(px + w * 0.15, y + kal + boy); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(px - w * 0.5, y + kal - 1, 1.2, boy * 0.6);
  }
}

function platformAmetist(c, x, y, gen, n, no, t) {
  const kal = 22;
  c.save(); c.shadowColor = no ? '#ffd24a' : t.plat; c.shadowBlur = 14 * AYAR.parilti;
  c.fillStyle = '#5a2d99'; yuvarlak(c, x, y + 2, gen, kal - 2, 6); c.fill(); c.restore();
  // yüzeyler: üst yüz açık, ön yüz koyu, köşeler eğik
  const g1 = c.createLinearGradient(x, 0, x + gen, 0); g1.addColorStop(0, '#d9a8ff'); g1.addColorStop(0.5, '#f3dcff'); g1.addColorStop(1, '#c08bf5');
  c.fillStyle = g1; c.beginPath(); c.moveTo(x + 6, y); c.lineTo(x + gen - 6, y); c.lineTo(x + gen, y + 7); c.lineTo(x, y + 7); c.closePath(); c.fill();
  const g2 = c.createLinearGradient(0, y + 7, 0, y + kal); g2.addColorStop(0, '#9b5be0'); g2.addColorStop(1, '#4d2488');
  c.fillStyle = g2; c.fillRect(x, y + 7, gen, kal - 7);
  c.fillStyle = 'rgba(255,255,255,0.18)'; for (let i = 0; i < gen / 34; i++) { const px = x + 6 + i * 34; c.beginPath(); c.moveTo(px, y + 7); c.lineTo(px + 14, y + 7); c.lineTo(px + 6, y + kal); c.lineTo(px - 8, y + kal); c.closePath(); c.fill(); }
  // üstte büyüyen kristal sivri uçlar
  for (let i = 0; i < Math.max(2, gen / 40); i++) {
    const px = x + 14 + hash(n * 17 + i) * (gen - 28), h = 10 + hash(n * 3 + i * 7) * 16, w = 5 + hash(i + n) * 4;
    c.fillStyle = '#f0d4ff'; c.beginPath(); c.moveTo(px - w, y + 1); c.lineTo(px, y - h); c.lineTo(px + w, y + 1); c.closePath(); c.fill();
    c.fillStyle = 'rgba(120,60,200,0.35)'; c.beginPath(); c.moveTo(px, y - h); c.lineTo(px + w, y + 1); c.lineTo(px, y + 1); c.closePath(); c.fill();
  }
}

function platformTahta(c, x, y, gen, n, no, t) {
  const kal = 20;
  c.save(); c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 8; c.shadowOffsetY = 4;
  const g = c.createLinearGradient(0, y, 0, y + kal); g.addColorStop(0, '#d79a62'); g.addColorStop(0.15, '#b9743f'); g.addColorStop(1, '#6f3f20');
  c.fillStyle = g; yuvarlak(c, x, y, gen, kal, 4); c.fill(); c.restore();
  c.save(); c.beginPath(); yuvarlak(c, x, y, gen, kal, 4); c.clip();
  // tahta aralıkları ve damarlar
  for (let px = x + 46; px < x + gen - 10; px += 46 + hash(n + px) * 24) { c.fillStyle = 'rgba(40,20,8,0.55)'; c.fillRect(px, y, 2, kal); }
  c.strokeStyle = 'rgba(60,30,10,0.35)'; c.lineWidth = 1;
  for (let i = 0; i < gen / 22; i++) { const px = x + 6 + i * 22 + hash(n * 3 + i) * 8, py = y + 6 + hash(n + i * 9) * 9; c.beginPath(); c.moveTo(px, py); c.quadraticCurveTo(px + 9, py - 2 + hash(i) * 4, px + 18, py); c.stroke(); }
  c.fillStyle = 'rgba(255,230,190,0.35)'; c.fillRect(x, y + 1, gen, 3);
  c.restore();
  // çiviler ve alt halat bağı
  c.fillStyle = '#3a2a22'; for (const px of [x + 8, x + gen - 8]) { c.beginPath(); c.arc(px, y + 10, 2.3, 0, 7); c.fill(); }
  c.strokeStyle = '#c9a56a'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + gen * 0.3, y + kal); c.quadraticCurveTo(x + gen * 0.4, y + kal + 10, x + gen * 0.5, y + kal); c.quadraticCurveTo(x + gen * 0.6, y + kal + 10, x + gen * 0.7, y + kal); c.stroke();
  if (no) { c.fillStyle = 'rgba(255,210,74,0.45)'; c.fillRect(x, y, gen, 4); }
}

function platformYosun(c, x, y, gen, n, no, t) {
  const kal = 22;
  c.save(); c.shadowColor = no ? '#ffd24a' : 'rgba(0,0,0,0.5)'; c.shadowBlur = no ? 14 * AYAR.parilti : 8; c.shadowOffsetY = no ? 0 : 4;
  c.fillStyle = '#6d7f78'; yuvarlak(c, x, y + 4, gen, kal - 4, 5); c.fill(); c.restore();
  c.save(); c.beginPath(); yuvarlak(c, x, y + 4, gen, kal - 4, 5); c.clip();
  // taş blokları + harç
  for (let px = x; px < x + gen; px += 38) {
    const h = hash(n * 7 + px * 3); c.fillStyle = karisim('#7a8d85', (h - 0.5) * 0.3); c.fillRect(px + 1, y + 5, 36, kal - 7);
    c.fillStyle = 'rgba(255,255,255,0.14)'; c.fillRect(px + 3, y + 6, 30, 2);
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(px + 36, y + 4, 2, kal);
  }
  c.restore();
  // yosun başlığı + sarkan sarmaşıklar
  c.fillStyle = '#4fae5a'; c.beginPath(); kabarik(c, x + 1, x + gen - 1, y - 4, 12, n * 29); c.fill();
  c.fillStyle = '#7fe08a'; c.beginPath(); kabarik(c, x + 8, x + gen - 14, y - 2, 6, n * 5); c.fill();
  c.strokeStyle = '#3f9a4c'; c.lineWidth = 2; c.lineCap = 'round';
  for (let i = 0; i < Math.max(2, gen / 36); i++) {
    const px = x + 10 + hash(n * 9 + i) * (gen - 20), boy = 10 + hash(n + i * 5) * 16;
    c.beginPath(); c.moveTo(px, y + kal - 2); c.quadraticCurveTo(px + 4, y + kal + boy * 0.5, px - 1, y + kal + boy); c.stroke();
    c.fillStyle = '#6fdc7c'; c.beginPath(); c.ellipse(px - 3, y + kal + boy * 0.7, 3.5, 2, -0.6, 0, 7); c.fill();
  }
  c.lineCap = 'butt';
}

export function platform(c, x, y, gen, kat, no, n) {
  const t = tema(kat), tn = temaNo(kat);
  if (tn === 0) platformBuz(c, x, y, gen, n, no, t); else if (tn === 1) platformAmetist(c, x, y, gen, n, no, t); else if (tn === 2) platformTahta(c, x, y, gen, n, no, t); else platformYosun(c, x, y, gen, n, no, t);
  if (no) { // her 10. kat: zincirle asılı numara levhası
    c.strokeStyle = 'rgba(30,20,10,0.8)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + 14, y + 20); c.lineTo(x + 14, y + 27); c.moveTo(x + 38, y + 20); c.lineTo(x + 38, y + 27); c.stroke();
    const g = c.createLinearGradient(0, y + 26, 0, y + 42); g.addColorStop(0, '#ffe39a'); g.addColorStop(1, '#d9a02a');
    c.fillStyle = g; yuvarlak(c, x + 6, y + 26, 40, 16, 4); c.fill(); c.strokeStyle = '#8a5a10'; c.lineWidth = 1; c.stroke();
    c.fillStyle = '#4a2e00'; c.font = '800 12px "Segoe UI", system-ui, sans-serif'; c.textAlign = 'center'; c.fillText(String(n), x + 26, y + 38.5); c.textAlign = 'left';
  }
}

// Toplanabilir buz kristali (puan bonusu); hafifçe süzülür ve parlar.
export function kristalCiz(c, x, y, kat) {
  const t = tema(kat), sal = Math.sin(zaman * 0.08 + x) * 3, cy = y + sal;
  c.save(); c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, cy, 1, x, cy, 24 * Math.min(1.5, AYAR.parilti + 0.2)); g.addColorStop(0, t.plat + 'aa'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - 30, cy - 30, 60, 60);
  c.restore();
  c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(x, cy - 12); c.lineTo(x + 8, cy); c.lineTo(x, cy + 12); c.lineTo(x - 8, cy); c.closePath(); c.fill();
  c.fillStyle = t.plat; c.beginPath(); c.moveTo(x, cy - 12); c.lineTo(x + 8, cy); c.lineTo(x, cy + 2); c.closePath(); c.fill();
  c.fillStyle = karisim(t.koyu, 0.1); c.beginPath(); c.moveTo(x, cy + 12); c.lineTo(x - 8, cy); c.lineTo(x, cy + 2); c.closePath(); c.fill();
}

// Kozmetik parçacık sistemi (parıltılı, oyun mantığını etkilemez).
const par = [];
export function parcacikEkle(x, y, adet, renk, hiz = 3) {
  const say = Math.floor(adet * AYAR.parcacik) + (Math.random() < adet * AYAR.parcacik % 1 ? 1 : 0); // ayar çarpanı; kesirli kısım olasılıkla
  for (let i = 0; i < say; i++) par.push({ x, y, vx: (Math.random() - 0.5) * hiz * 2, vy: -Math.random() * hiz, om: 24 + Math.random() * 20, renk, boy: 2 + Math.random() * 3 });
}
export function parcacikCiz(c, kamY) {
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = par.length - 1; i >= 0; i--) {
    const p = par[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.18; p.om--;
    if (p.om <= 0) { par.splice(i, 1); continue; }
    c.globalAlpha = Math.min(1, p.om / 16); c.fillStyle = p.renk; c.beginPath(); c.arc(p.x, p.y - kamY, p.boy * (p.om / 40 + 0.4), 0, 7); c.fill();
  }
  c.restore(); c.globalAlpha = 1;
}
export const parcacikSifirla = () => { par.length = 0; };
