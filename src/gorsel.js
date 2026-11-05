// description: Buz Kule görsel katmanı: aurora gökyüzü, kristal siluetleri, taş duvarlar ve mesaleCizler, temaya göre detaylı basamaklar (buz, ametist, ahşap, yosunlu taş), kristal toplanabilirleri, parçacıklar, akış hali (kombo x5+: ton kayması ve kenar hız çizgileri; yalnız görünüm) (prosedürel vektör çizim; yüksek çözünürlükte keskin). sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
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

// Çizim önbellekleri (yalnız görünüm): sabit gradyanlar tema+boyut anahtarıyla, duvar taş şeridi OffscreenCanvas'ta bir kez çizilir.
// Bağlam değişirse (yeni tuval/test) gradyan önbelleği sıfırlanır; OffscreenCanvas yoksa eski çizim yoluna düşülür.
let gkCtx = null; const gk = new Map();
function gradyan(c, anahtar, uret) {
  if (gkCtx !== c) { gk.clear(); gkCtx = c; }
  let g = gk.get(anahtar); if (!g) { g = uret(); gk.set(anahtar, g); } return g;
}
const SERIT_SATIR = 64, DUV_BH = 22, DUV_BW = 42; // taş şeridi 64 sıra (1408 px) sonra tekrarlanır
const duvarSeritleri = new Map();
function olusTuval(g, h) {
  try { if (typeof OffscreenCanvas !== 'function') return null; const o = new OffscreenCanvas(g, h), k = o.getContext('2d'); return k ? { tuval: o, k } : null; } catch (e) { return null; }
}

function yuvarlak(c, x, y, g, h, r) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + g, y, x + g, y + h, r); c.arcTo(x + g, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + g, y, r); c.closePath();
}
const karisim = (hex, k) => { // hex rengi k (-1..1) kadar koyulaştır/açıklaştır
  const n = parseInt(hex.slice(1), 16), f = (v) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
};

// "Akış hali" (yalnız görünüm): kombo x5 ve üstünde hedef 1, yoksa 0; değer her karede yumuşakça hedefe yaklaşır.
let akis = 0;
export const akisDegeri = () => akis;
export const akisSifirla = () => { akis = 0; };

// Kule konsepti tonu (yalnız görünüm): tüm sahneye 'color' karışımı + isteğe bağlı koyulaştırma; tint null ise (Buz Kulesi) hiçbir şey yapmaz.
export function kuleTint(c, W, H, tint) {
  if (!tint) return;
  c.save(); c.globalCompositeOperation = 'color'; c.globalAlpha = tint.a; c.fillStyle = 'hsl(' + tint.h + ',' + tint.s + '%,' + tint.l + '%)'; c.fillRect(0, 0, W, H);
  if (tint.karart) { c.globalCompositeOperation = 'multiply'; c.globalAlpha = tint.karart; c.fillStyle = '#14102a'; c.fillRect(0, 0, W, H); }
  c.restore();
}
// Kule konseptine özel arka plan efektleri (yalnız görünüm, kapatılabilir): Kor'da yükselen kıvılcımlar, Kum'da savrulan taneler,
// Yıldız'da parlayan yıldızlar ve ara sıra kayan yıldız, Rün'de süzülen parlak elmaslar. Buz Kulesi'nde efekt yoktur.
const kh = (i, k) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); }; // 0..1 sahte rastgele (deterministik)
export function kuleEfektCiz(c, W, H, id, kare = zaman) {
  const yog = Math.min(1, Math.max(0, AYAR.parcacik)); if (!yog || id === 'buz') return;
  c.save();
  if (id === 'kor') {
    const n = Math.round(26 * yog); c.fillStyle = '#ffb347';
    for (let i = 0; i < n; i++) { const y = H - ((kare * (0.35 + kh(i, 2) * 0.9) + kh(i, 3) * H) % H), x = kh(i, 1) * W + Math.sin(kare * 0.02 + i) * 10, b = 1 + Math.floor(kh(i, 4) * 3); c.globalAlpha = 0.25 + 0.5 * (y / H); c.fillRect(x, y, b, b); }
  } else if (id === 'kum') {
    const n = Math.round(30 * yog); c.fillStyle = '#ffe8aa';
    for (let i = 0; i < n; i++) { const gen = W * 1.3, x = ((kare * (1.4 + kh(i, 2) * 2.2) + kh(i, 3) * gen) % gen) - W * 0.15, y = kh(i, 1) * H + Math.sin(kare * 0.03 + i) * 3; c.globalAlpha = 0.18 + kh(i, 5) * 0.25; c.fillRect(x, y, 5 + kh(i, 4) * 10, 1); }
  } else if (id === 'yildiz') {
    const n = Math.round(34 * yog); c.fillStyle = '#ffffff';
    for (let i = 0; i < n; i++) { c.globalAlpha = 0.2 + 0.6 * (0.5 + 0.5 * Math.sin(kare * 0.05 * (0.5 + kh(i, 3)) + i * 3)); const b = kh(i, 4) > 0.8 ? 2 : 1; c.fillRect(kh(i, 1) * W, kh(i, 2) * H, b, b); }
    const t = (kare % 420) / 60; // her ~8 sn bir kayan yıldız (1 sn sürer)
    if (t < 1) { const x = W * 0.92 - t * W * 0.55, y = H * 0.06 + t * H * 0.32; c.globalAlpha = 0.9 * (1 - t); c.strokeStyle = '#ffffff'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 46, y - 17); c.stroke(); }
  } else if (id === 'run') {
    const n = Math.round(16 * yog); c.strokeStyle = '#d2aaff'; c.fillStyle = '#e9d4ff'; c.lineWidth = 1;
    for (let i = 0; i < n; i++) {
      const y = H - ((kare * (0.2 + kh(i, 2) * 0.35) + kh(i, 3) * H) % H), x = kh(i, 1) * W, s = 4 + kh(i, 4) * 5; c.globalAlpha = Math.max(0, 0.22 + 0.3 * Math.sin(kare * 0.04 + i));
      c.beginPath(); c.moveTo(x, y - s); c.lineTo(x + s, y); c.lineTo(x, y + s); c.lineTo(x - s, y); c.closePath(); c.stroke(); c.fillRect(x - 1, y - 1, 2, 2);
    }
  }
  c.restore();
}
export function arkaPlan(c, W, H, kamY, kat, akisHedef = 0) {
  if (!AYAR.azaltilmisHareket) zaman++; // azaltılmış harekette aurora ve yıldız titremesi donar
  akis += (akisHedef - akis) * (akisHedef > akis ? 0.04 : 0.025); // giriş biraz hızlı, çıkış daha yumuşak
  if (Math.abs(akisHedef - akis) < 0.004) akis = akisHedef;
  const t = tema(kat), tn = temaNo(kat);
  const g = gradyan(c, 'bg|' + tn + '|' + H, () => { const q = c.createLinearGradient(0, 0, 0, H); q.addColorStop(0, t.ust); q.addColorStop(1, t.alt); return q; });
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  if (akis > 0.01 && AYAR.parilti > 0.05) { // akış hali: arka plan tonu yavaşça kayar (ekleme karışımıyla tek dikdörtgen)
    const guc = akis * Math.min(1, AYAR.parilti), ton = (zaman * 0.4 + kat * 0.5) % 360;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.14 * guc;
    const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, `hsl(${ton},80%,55%)`); gr.addColorStop(1, `hsl(${(ton + 70) % 360},80%,45%)`);
    c.fillStyle = gr; c.fillRect(0, 0, W, H); c.restore();
  }
  // aurora şeritleri (ekleme karışımı, yavaş dalgalanma)
  c.save(); c.globalCompositeOperation = 'lighter';
  t.serit.forEach((renk, k) => {
    const y0 = 120 + k * 130 - (kamY * 0.05) % 260;
    const gr = gradyan(c, 'au|' + tn + '|' + k, () => { const q = c.createLinearGradient(0, -70, 0, 70); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(0.5, renk); q.addColorStop(1, 'rgba(0,0,0,0)'); return q; });
    c.save(); c.translate(0, y0); // gradyan y0'a göre göreli kurulur; böylece kamera kayarken yeniden üretilmez
    c.globalAlpha = 0.16 * Math.min(1.5, AYAR.parilti); c.fillStyle = gr; c.beginPath(); c.moveTo(0, 80);
    for (let x = 0; x <= W; x += 10) c.lineTo(x, Math.sin(x * 0.012 + zaman * 0.012 + k * 2) * 34 + Math.sin(x * 0.03 - zaman * 0.02) * 10);
    c.lineTo(W, 160); c.lineTo(0, 160); c.closePath(); c.fill(); c.restore();
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
  // akış hali: oyun alanı kenarlarında aşağı akan ince dikey hız çizgileri (azaltılmış harekette çizilmez; kare başına 16 küçük dikdörtgen)
  if (akis > 0.01 && !AYAR.azaltilmisHareket && AYAR.parilti > 0.05) {
    const guc = akis * Math.min(1, AYAR.parilti), periyot = H + 120;
    c.fillStyle = '#ffffff';
    for (let i = 0; i < 16; i++) {
      const sol = i < 8, x = (sol ? 92 : 514) + hash(i * 23 + 5) * 36, boy = 40 + hash(i * 31) * 70;
      const y = ((((hash(i * 41) * periyot + zaman * (6 + hash(i * 7) * 8) - kamY * 0.3) % periyot) + periyot) % periyot) - 60; // kamera yükselirken aşağı akar
      c.globalAlpha = (0.12 + hash(i * 3) * 0.18) * guc; c.fillRect(Math.round(x), Math.round(y), 1, Math.round(boy * (0.4 + 0.6 * akis)));
    }
    c.globalAlpha = 1;
  }
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

// Taş sıraları [r0, r1) aralığı için çizilir; ox yatay başlangıç, ky kamera kayması (şerit için 0). Hash sıra numarasının mod 64'ünü kullanır.
function taslar(c, t, ox, gen, r0, r1, ky, sag) {
  const bh = DUV_BH, bw = DUV_BW;
  for (let r = r0; r < r1; r++) {
    const y = r * bh - ky, kay = (r & 1) * (bw / 2), rm = r & (SERIT_SATIR - 1);
    for (let b = -1; b < gen / bw + 2; b++) {
      const bx = ox + b * bw - kay, h = hash(rm * 131 + b * 17 + (sag ? 7 : 3)), ton = (h - 0.5) * 0.28;
      c.fillStyle = karisim(t.duvar, ton);
      yuvarlak(c, bx + 1.5, y + 1.5, bw - 3, bh - 3, 3); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.07)'; c.fillRect(bx + 3, y + 2, bw - 8, 2);          // üst kenar ışığı
      if (h > 0.82) { c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(bx + 8 + h * 10, y + 8, 7, 3); } // kırağı lekesi
    }
  }
}
function duvarSerit(t, tn, x0, gen) { // tema+kenar+genişlik anahtarlı taş şeridi; yoksa null (eski yol)
  const anahtar = tn + '|' + x0 + '|' + gen; let o = duvarSeritleri.get(anahtar);
  if (!o) {
    o = olusTuval(gen, SERIT_SATIR * DUV_BH);
    if (o) { o.k.fillStyle = t.harc; o.k.fillRect(0, 0, gen, SERIT_SATIR * DUV_BH); taslar(o.k, t, 0, gen, 0, SERIT_SATIR, 0, x0 !== 0); }
    if (o) duvarSeritleri.set(anahtar, o); // null saklanmaz: OffscreenCanvas sonradan gelirse kullanılır
  }
  return o || null;
}

export function duvarlar(c, W, H, kamY, kat) {
  const t = tema(kat), tn = temaNo(kat), P = SERIT_SATIR * DUV_BH;
  for (const x0 of [0, 555]) {
    const gen = x0 === 0 ? 85 : W - 555;
    c.save(); c.beginPath(); c.rect(x0, 0, gen, H); c.clip();
    const serit = duvarSerit(t, tn, x0, gen);
    if (serit) { // önbellekli yol: şerit kamY'ye göre kaydırılarak (en fazla iki blit) çizilir
      const off = ((kamY % P) + P) % P;
      for (let y = -off; y < H; y += P) c.drawImage(serit.tuval, x0, y);
    } else {
      c.fillStyle = t.harc; c.fillRect(x0, 0, gen, H);
      taslar(c, t, x0, gen, Math.floor(kamY / DUV_BH) - 1, Math.floor((kamY + H) / DUV_BH) + 1, kamY, x0 !== 0);
    }
    // kenara doğru derinlik gölgesi (kule içine bakış)
    const gr = gradyan(c, 'dv|' + x0 + '|' + gen, () => {
      const q = c.createLinearGradient(x0, 0, x0 + gen, 0);
      if (x0 === 0) { q.addColorStop(0, 'rgba(0,0,0,0.55)'); q.addColorStop(0.6, 'rgba(0,0,0,0.12)'); q.addColorStop(1, 'rgba(0,0,0,0.5)'); }
      else { q.addColorStop(0, 'rgba(0,0,0,0.5)'); q.addColorStop(0.4, 'rgba(0,0,0,0.12)'); q.addColorStop(1, 'rgba(0,0,0,0.55)'); }
      return q;
    });
    c.fillStyle = gr; c.fillRect(x0, 0, gen, H);
    c.restore();
    // mesaleCizler: her 280 px'te bir, iki duvar dönüşümlü
    for (let r = Math.floor(kamY / 280) - 1; r < Math.floor((kamY + H) / 280) + 1; r++) {
      if (((r & 1) === 0) !== (x0 === 0)) continue;
      mesaleCiz(c, x0 === 0 ? 60 : 580, r * 280 + 100 - kamY, t, x0 === 0 ? 1 : -1);
    }
    // iç kenar: parlak taş silmesi; shadowBlur yerine önbellekli yatay parıltı gradyanı (tek dikdörtgen) + 2 px çizgi
    const ex = x0 === 0 ? 83 : 555;
    if (AYAR.parilti > 0.02) {
      const pg = gradyan(c, 'pr|' + tn + '|' + ex, () => { const q = c.createLinearGradient(ex - 11, 0, ex + 13, 0);
        q.addColorStop(0, t.plat + '00'); q.addColorStop(0.3, t.plat + '22'); q.addColorStop(0.46, t.plat + '5a'); q.addColorStop(0.54, t.plat + '5a'); q.addColorStop(0.7, t.plat + '22'); q.addColorStop(1, t.plat + '00'); return q; });
      c.save(); c.globalAlpha = Math.min(1, AYAR.parilti); c.fillStyle = pg; c.fillRect(ex - 11, 0, 24, H); c.restore();
    }
    c.fillStyle = karisim(t.plat, -0.2); c.fillRect(ex, 0, 2, H);
  }
}

// ---- Basamaklar: tema başına ayrı malzeme ----
// shadowBlur yerine ucuz eşdeğer: yuvarlak gövdenin genişleyen, düşük alfalı birkaç katmanı (dy: gölge kayması).
function hale(c, x, y, gen, kal, r, renk, alfa, dy = 0) {
  c.save(); c.fillStyle = renk;
  for (let d = 2; d <= 8; d += 3) { c.globalAlpha = alfa * (1 - d / 11); yuvarlak(c, x - d, y - d + dy, gen + 2 * d, kal + 2 * d, r + d); c.fill(); }
  c.restore();
}
const kabarik = (c, x0, x1, yUst, h, tohum) => { // yumuşak kabarık üst kenar çizgisi (kar/yosun başlığı)
  c.moveTo(x0, yUst + h);
  c.lineTo(x0, yUst + h * 0.4);
  for (let x = x0; x < x1; x += 14) { const a = hash(tohum + x * 3) * h * 0.5; c.quadraticCurveTo(x + 7, yUst - a, Math.min(x + 14, x1), yUst + h * 0.4); }
  c.lineTo(x1, yUst + h);
  c.closePath();
};

function platformBuz(c, x, y, gen, n, no, t) {
  const kal = 22;
  if (AYAR.parilti > 0.02) hale(c, x, y, gen, kal, 8, no ? '#ffd24a' : t.plat, 0.16 * Math.min(1.5, AYAR.parilti));
  const g = c.createLinearGradient(0, y, 0, y + kal); g.addColorStop(0, '#e8fbff'); g.addColorStop(0.3, '#a9e6fb'); g.addColorStop(1, '#3c8fc9');
  c.fillStyle = g; yuvarlak(c, x, y, gen, kal, 8); c.fill();
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
  if (AYAR.parilti > 0.02) hale(c, x, y + 2, gen, kal - 2, 6, no ? '#ffd24a' : t.plat, 0.16 * Math.min(1.5, AYAR.parilti));
  c.fillStyle = '#5a2d99'; yuvarlak(c, x, y + 2, gen, kal - 2, 6); c.fill();
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
  hale(c, x, y, gen, kal, 4, '#000000', 0.26, 4);
  const g = c.createLinearGradient(0, y, 0, y + kal); g.addColorStop(0, '#d79a62'); g.addColorStop(0.15, '#b9743f'); g.addColorStop(1, '#6f3f20');
  c.fillStyle = g; yuvarlak(c, x, y, gen, kal, 4); c.fill();
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
  if (no) { if (AYAR.parilti > 0.02) hale(c, x, y + 4, gen, kal - 4, 5, '#ffd24a', 0.16 * Math.min(1.5, AYAR.parilti)); } else hale(c, x, y + 4, gen, kal - 4, 5, '#000000', 0.26, 4);
  c.fillStyle = '#6d7f78'; yuvarlak(c, x, y + 4, gen, kal - 4, 5); c.fill();
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

// Basamak türü ayrıntısı: kırılgan (çatlak, titreme) ve yay (kırmızı yaylı pedal).
function turDetay(c, x, y, gen, n, tur, kirilma) {
  if (tur === 'kirilgan') {
    c.save(); c.strokeStyle = 'rgba(20,50,90,' + (0.45 + 0.5 * kirilma) + ')'; c.lineWidth = 1.5 + kirilma * 1.5; c.lineCap = 'round';
    const adet = 3 + Math.floor(kirilma * 5);
    for (let i = 0; i < adet; i++) {
      const px = x + 12 + hash(n * 19 + i * 7) * (gen - 24); c.beginPath(); c.moveTo(px, y + 1); c.lineTo(px - 4, y + 8); c.lineTo(px + 3, y + 14); c.lineTo(px - 2, y + 21); c.stroke();
    }
    c.restore();
    if (kirilma > 0.2) { c.fillStyle = 'rgba(255,120,80,' + Math.min(0.9, kirilma) + ')'; c.font = '800 12px "Segoe UI", system-ui, sans-serif'; c.textAlign = 'center'; c.fillText('!', x + gen / 2, y - 8); c.textAlign = 'left'; }
  } else if (tur === 'yay') {
    const mx = x + gen / 2, sik = 0;
    c.fillStyle = '#c62828'; yuvarlak(c, mx - 22, y - 9, 44, 10, 5); c.fill();               // kırmızı pedal
    c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(mx - 16, y - 7, 32, 2);
    c.strokeStyle = '#eceff1'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(mx - 12, y + 1 + sik);
    for (let i = 0; i < 4; i++) { c.lineTo(mx + (i % 2 ? -12 : 12), y + 1 + sik + i * 1.5 + 3); } c.stroke();                // yay zikzağı
  }
}

export function platform(c, x, y, gen, kat, no, n, tur = 'normal', kirilma = 0) {
  const t = tema(kat), tn = temaNo(kat);
  if (kirilma > 0) { c.save(); c.translate((hash(zaman + n) - 0.5) * 3 * kirilma, 0); } // basılınca titrer
  if (tn === 0) platformBuz(c, x, y, gen, n, no, t); else if (tn === 1) platformAmetist(c, x, y, gen, n, no, t); else if (tn === 2) platformTahta(c, x, y, gen, n, no, t); else platformYosun(c, x, y, gen, n, no, t);
  turDetay(c, x, y, gen, n, tur, kirilma);
  if (kirilma > 0) c.restore();
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

// Güç öğeleri: 'saat' (alarm saati, kaymayı yavaşlatır) ve 'miknatis' (at nalı mıknatıs, kristalleri çeker).
export function gucCiz(c, x, y, tur, kat) {
  const sal = Math.sin(zaman * 0.07 + x) * 3, cy = y + sal, renk = tur === 'saat' ? '#ffd24a' : '#ff6b6b';
  c.save(); c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, cy, 2, x, cy, 26); g.addColorStop(0, renk + 'aa'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - 30, cy - 30, 60, 60);
  c.restore();
  if (tur === 'saat') {
    c.fillStyle = '#fff6e0'; c.strokeStyle = '#b8860b'; c.lineWidth = 2; c.beginPath(); c.arc(x, cy, 11, 0, 7); c.fill(); c.stroke();
    c.fillStyle = '#d9a02a'; c.beginPath(); c.arc(x - 8, cy - 11, 4, 0, 7); c.arc(x + 8, cy - 11, 4, 0, 7); c.fill();               // zil kubbeleri
    c.strokeStyle = '#3a2a00'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(x, cy); c.lineTo(x, cy - 7); c.moveTo(x, cy); c.lineTo(x + 5, cy + 2); c.stroke();
  } else {
    c.strokeStyle = '#d32f2f'; c.lineWidth = 6; c.lineCap = 'butt'; c.beginPath(); c.arc(x, cy + 2, 9, Math.PI, 0); c.lineTo(x + 9, cy + 11); c.moveTo(x - 9, cy + 2); c.lineTo(x - 9, cy + 11); c.stroke();
    c.strokeStyle = '#f5f5f5'; c.lineWidth = 6; c.beginPath(); c.moveTo(x - 9, cy + 8); c.lineTo(x - 9, cy + 12); c.moveTo(x + 9, cy + 8); c.lineTo(x + 9, cy + 12); c.stroke();
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

// Kombo kapanış uçuşu (yalnız görünüm): kombo bitince biriken bonusu temsil eden parçacıklar ekran uzayında (kameradan bağımsız)
// önce dışa saçılır, sonra eğri bir yolla skor alanına uçar. Sayı AYAR.parcacik ile ölçeklenir; azaltılmış harekette hiç üretilmez.
// Oyun durumunu okumaz ve değiştirmez; hud.js tetikler ve çizer.
const kapanisPar = [];
export const KAPANIS_OMUR = 34; // bir parçacığın uçuş süresi (çizim karesi)
export function kapanisEkle(x0, y0, x1, y1, adet, renk) {
  if (AYAR.azaltilmisHareket) return 0;
  const say = Math.round(adet * AYAR.parcacik);
  for (let i = 0; i < say; i++) {
    const a = Math.random() * Math.PI * 2, r = 40 + Math.random() * 70; // kontrol noktası dışarıda: saçıl, sonra topla
    kapanisPar.push({ x0, y0, cx: x0 + Math.cos(a) * r, cy: y0 + Math.sin(a) * r - 20, x1, y1, t: -Math.random() * 0.35, renk, boy: 2 + Math.random() * 2.5 });
  }
  return say;
}
export function kapanisAdim() { // bir çizim karesi ilerletir; kalan parçacık sayısını döner
  for (let i = kapanisPar.length - 1; i >= 0; i--) { const p = kapanisPar[i]; p.t += 1 / KAPANIS_OMUR; if (p.t >= 1) kapanisPar.splice(i, 1); }
  return kapanisPar.length;
}
export const kapanisSay = () => kapanisPar.length;
export const kapanisSifirla = () => { kapanisPar.length = 0; };
export function kapanisNokta(p, t) { // yumuşatılmış kuadratik Bezier: (x0,y0) → (cx,cy) → (x1,y1)
  const u = Math.max(0, Math.min(1, t)), s = u * u * (3 - 2 * u), v = 1 - s;
  return { x: v * v * p.x0 + 2 * v * s * p.cx + s * s * p.x1, y: v * v * p.y0 + 2 * v * s * p.cy + s * s * p.y1 };
}
export function kapanisCiz(c) {
  kapanisAdim();
  if (!kapanisPar.length) return;
  c.save(); c.globalCompositeOperation = 'lighter';
  for (const p of kapanisPar) {
    if (p.t < 0) continue; // gecikmeli başlar
    const n = kapanisNokta(p, p.t), a = p.t < 0.15 ? p.t / 0.15 : 1 - Math.max(0, (p.t - 0.8) / 0.2);
    c.globalAlpha = Math.max(0, Math.min(1, a)) * 0.95; c.fillStyle = p.renk; c.beginPath(); c.arc(n.x, n.y, p.boy * (1.2 - p.t * 0.6), 0, 7); c.fill();
  }
  c.restore(); c.globalAlpha = 1;
}
