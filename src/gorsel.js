// description: Buz Kule modern görsel katmanı: aurora gökyüzü, kristal siluetler, buzlu cam duvarlar, parıltılı platformlar (prosedürel çizim). sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
import { AYAR } from './ayar.js';
export const TEMALAR = [
  { ust: '#050a1f', alt: '#12356a', serit: ['#38f2c8', '#5aa8ff'], plat: '#7fe9ff', koyu: '#1b6f9a', kristal: '#0b2a55' }, // aurora
  { ust: '#12062b', alt: '#4a1a80', serit: ['#c76bff', '#ff6bd5'], plat: '#e0b3ff', koyu: '#7a3fb8', kristal: '#2a0f52' }, // mor gece
  { ust: '#1f0a1c', alt: '#6b1f45', serit: ['#ff8a5a', '#ffd24a'], plat: '#ffc2a0', koyu: '#c4553a', kristal: '#3d1230' }, // gün batımı
  { ust: '#04161a', alt: '#0b5a50', serit: ['#3dffa8', '#3dd0ff'], plat: '#9affd8', koyu: '#1d8f78', kristal: '#07343a' }, // zümrüt
];
const hash = (n) => { let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };
const tema = (kat) => TEMALAR[Math.floor(kat / 100) % TEMALAR.length];
let zaman = 0;

function yuvarlak(c, x, y, g, h, r) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + g, y, x + g, y + h, r); c.arcTo(x + g, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + g, y, r); c.closePath();
}

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
    for (let x = 0; x <= W; x += 20) c.lineTo(x, y0 + Math.sin(x * 0.012 + zaman * 0.012 + k * 2) * 34 + Math.sin(x * 0.03 - zaman * 0.02) * 10);
    c.lineTo(W, y0 + 160); c.lineTo(0, y0 + 160); c.closePath(); c.fill();
  });
  c.restore();
  // uzak kristal siluetleri (paralaks)
  for (const [say, hiz, yuk, a] of [[7, 0.12, 190, 0.55], [9, 0.25, 130, 0.8]]) {
    c.globalAlpha = a; c.fillStyle = t.kristal;
    const periyot = 480 * 1.0;
    for (let i = 0; i < say; i++) {
      const x = 95 + hash(i * 17 + yuk) * 450, taban = ((hash(i * 5 + hiz * 100) * periyot * 2 - kamY * hiz) % (periyot * 2) + periyot * 2) % (periyot * 2) - 60;
      const gen = 28 + hash(i * 3 + yuk) * 34, boy = yuk * (0.5 + hash(i * 11) * 0.5);
      c.beginPath(); c.moveTo(x - gen, taban + boy); c.lineTo(x - gen * 0.3, taban); c.lineTo(x + gen * 0.2, taban + boy * 0.25); c.lineTo(x + gen, taban + boy); c.closePath(); c.fill();
    }
  }
  c.globalAlpha = 1;
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

export function duvarlar(c, W, H, kamY, kat) {
  const t = tema(kat);
  for (const x0 of [0, 555]) {
    const gen = x0 === 0 ? 85 : W - 555, ic = x0 === 0 ? x0 + gen : x0;
    const gr = c.createLinearGradient(x0, 0, x0 + gen, 0);
    if (x0 === 0) { gr.addColorStop(0, 'rgba(3,8,24,0.96)'); gr.addColorStop(1, 'rgba(10,24,60,0.78)'); } else { gr.addColorStop(0, 'rgba(10,24,60,0.78)'); gr.addColorStop(1, 'rgba(3,8,24,0.96)'); }
    c.fillStyle = gr; c.fillRect(x0, 0, gen, H);
    // kayan ışık çubukları
    c.fillStyle = t.plat;
    for (let r = Math.floor(kamY / 120) - 1; r < Math.floor((kamY + H) / 120) + 1; r++) {
      const y = r * 120 - kamY, p = 0.35 + 0.25 * Math.sin(r * 1.3 + zaman * 0.03);
      c.globalAlpha = p; yuvarlak(c, x0 + (x0 === 0 ? 14 : 14), y + 20, 8, 56, 4); c.fill();
      c.globalAlpha = p * 0.5; yuvarlak(c, x0 + (x0 === 0 ? 44 : 44), y + 36, 5, 24, 3); c.fill();
    }
    c.globalAlpha = 1;
    // neon kenar çizgisi
    c.save(); c.shadowColor = t.plat; c.shadowBlur = 12 * AYAR.parilti; c.fillStyle = t.plat; c.globalAlpha = 0.85; c.fillRect(ic - (x0 === 0 ? 2 : 0), 0, 2, H); c.restore();
  }
}

export function platform(c, x, y, gen, kat, no, n) {
  const t = tema(kat), r = 7, h = 14, renk = no ? '#ffd24a' : t.plat;
  c.save();
  c.shadowColor = renk; c.shadowBlur = (no ? 18 : 12) * AYAR.parilti;
  const g = c.createLinearGradient(0, y - 2, 0, y + h); g.addColorStop(0, no ? '#fff1b0' : '#ffffff'); g.addColorStop(0.35, renk); g.addColorStop(1, no ? '#c98a10' : t.koyu);
  c.fillStyle = g; yuvarlak(c, x, y - 2, gen, h, r); c.fill(); c.shadowBlur = 0;
  c.fillStyle = 'rgba(255,255,255,0.55)'; yuvarlak(c, x + 5, y - 1, Math.max(8, gen - 10), 3, 1.5); c.fill(); // üst parlama
  c.fillStyle = 'rgba(0,10,40,0.28)'; c.fillRect(x + 6, y + h - 5, gen - 12, 3);                             // alt gölge
  c.restore();
  if (no) { // her 10. kat: numara rozeti
    c.fillStyle = 'rgba(40,24,0,0.85)'; yuvarlak(c, x + 6, y, 30, 11, 5); c.fill();
    c.fillStyle = '#ffe9a0'; c.font = '700 9px "Segoe UI", sans-serif'; c.fillText(String(n), x + 12, y + 9);
  }
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
