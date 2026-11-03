// description: Buz Kule özgün görsel katmanı (prosedürel çizim; harici varlık yok). sahip: Claude (Buz Kule iş parçacığı)
export const TEMALAR = [
  { ust: '#0b1b3a', alt: '#27527f', duvar: '#2c4a73', tugla: '#1f3556', plat: '#a8e4ff', parilti: '#ffffff' }, // buz mağarası
  { ust: '#1b0f3a', alt: '#5b2e7a', duvar: '#4a2d73', tugla: '#33204f', plat: '#d9b3ff', parilti: '#ffe9ff' }, // mor gece
  { ust: '#2a0f1a', alt: '#8a3350', duvar: '#6b2840', tugla: '#4a1b2d', plat: '#ffc0b3', parilti: '#fff0e0' }, // gün batımı
  { ust: '#062a2a', alt: '#1f7a6a', duvar: '#1b5c52', tugla: '#134039', plat: '#b3ffe9', parilti: '#eafff9' }, // zümrüt
];
const hash = (n) => { let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };
const tema = (kat) => TEMALAR[Math.floor(kat / 100) % TEMALAR.length];

export function arkaPlan(c, W, H, kamY, kat) {
  const t = tema(kat), g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, t.ust); g.addColorStop(1, t.alt); c.fillStyle = g; c.fillRect(0, 0, W, H);
  // paralaks yıldız/kar tanesi: iki katman, farklı hız
  for (const [say, hiz, boy, a] of [[45, 0.15, 1, 0.5], [22, 0.35, 2, 0.8]]) {
    c.globalAlpha = a; c.fillStyle = t.parilti;
    for (let i = 0; i < say; i++) {
      const x = 90 + hash(i * 7 + hiz * 100) * 460, y0 = hash(i * 13 + boy) * H * 2;
      const y = ((y0 - kamY * hiz) % (H * 2) + H * 2) % (H * 2) - H * 0.5;
      c.fillRect(Math.round(x), Math.round(y), boy, boy);
    }
  }
  c.globalAlpha = 1;
}

export function duvarlar(c, W, H, kamY, kat) {
  const t = tema(kat);
  for (const x0 of [0, 555]) {
    const gen = x0 === 0 ? 85 : W - 555;
    c.fillStyle = t.duvar; c.fillRect(x0, 0, gen, H);
    c.fillStyle = t.tugla;
    for (let r = Math.floor(kamY / 24) - 1; r < Math.floor((kamY + H) / 24) + 1; r++) {
      const y = r * 24 - kamY, kay = (r & 1) * 20;
      c.fillRect(x0, y + 22, gen, 2);
      for (let x = x0 - kay; x < x0 + gen; x += 40) c.fillRect(Math.max(x, x0), y, 2, 24);
    }
    c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(x0 === 0 ? 83 : 555, 0, 2, H);
  }
}

export function platform(c, x, y, gen, kat, no, n) {
  const t = tema(kat);
  c.fillStyle = no ? '#f2c94c' : t.plat; c.fillRect(x, y, gen, 12);
  c.fillStyle = 'rgba(255,255,255,0.65)'; c.fillRect(x, y, gen, 3);          // üst parıltı
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x, y + 9, gen, 3);             // alt gölge
  c.fillStyle = no ? '#f2c94c' : t.plat;
  for (let sx = x + 6; sx < x + gen - 8; sx += 14) { // buz sarkıtları
    const boy = 3 + Math.floor(hash(n * 31 + sx) * 6); c.fillRect(sx, y + 12, 4, boy); c.fillRect(sx + 1, y + 12 + boy, 2, 2);
  }
  if (no) { c.fillStyle = '#3a2a00'; c.font = 'bold 10px monospace'; c.fillText(String(n), x + 4, y + 10); }
}

// Kozmetik parçacık sistemi (oyun mantığını etkilemez).
const par = [];
export function parcacikEkle(x, y, adet, renk, hiz = 3) {
  for (let i = 0; i < adet; i++) par.push({ x, y, vx: (Math.random() - 0.5) * hiz * 2, vy: -Math.random() * hiz, om: 24 + Math.random() * 16, renk });
}
export function parcacikCiz(c, kamY) {
  for (let i = par.length - 1; i >= 0; i--) {
    const p = par[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.om--;
    if (p.om <= 0) { par.splice(i, 1); continue; }
    c.globalAlpha = Math.min(1, p.om / 14); c.fillStyle = p.renk; c.fillRect(Math.round(p.x), Math.round(p.y - kamY), 3, 3);
  }
  c.globalAlpha = 1;
}
export const parcacikSifirla = () => { par.length = 0; };
