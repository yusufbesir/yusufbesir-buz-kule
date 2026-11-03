(() => {
"use strict";
// ---- fizik ----
// description: Buz Kule fizik çekirdeği (özgün kod). sahip: Claude (Buz Kule iş parçacığı)
// Sabitler mekanikler.md dosyasındaki gözlemlerden; orijinal kod kopyalanmadı.
const SABIT = Object.freeze({
  MAKS_VX: 12.2, MAKS_DUSME: 12.2, YERCEKIMI: 0.8,
  SURTUNME: 0.9, IVME: 0.3, TERS_YON_CARPAN: 0.7,
  DUVAR_SOL: 85, DUVAR_SAG: 555, SEKME: -0.9, FPS: 50,
});

function yatayGuncelle(vx, sol, sag) {
  const dir = (sag ? 1 : 0) - (sol ? 1 : 0);
  if (dir === 0) return vx * SABIT.SURTUNME;
  if (vx * dir < 0) vx *= SABIT.TERS_YON_CARPAN;
  vx += dir * SABIT.IVME;
  return Math.max(-SABIT.MAKS_VX, Math.min(SABIT.MAKS_VX, vx));
}

function zipla(vx) {
  return Math.min(-2 * Math.abs(vx), -SABIT.MAKS_VX);
}

function duvarSekmesi(x, vx) {
  if (x < SABIT.DUVAR_SOL) return { x: SABIT.DUVAR_SOL, vx: vx * SABIT.SEKME };
  if (x > SABIT.DUVAR_SAG) return { x: SABIT.DUVAR_SAG, vx: vx * SABIT.SEKME };
  return { x, vx };
}

function dikeyGuncelle(vy) {
  return Math.min(vy + SABIT.YERCEKIMI, SABIT.MAKS_DUSME);
}

// ---- kat ----
// description: Prosedürel kat üretimi (özgün kod). sahip: Claude (Buz Kule iş parçacığı)
const KARO = 16, KAT_ARALIK = 80, SATIR_KARO = 30;
function genislik(kat, rnd) {
  if (kat > 0 && kat % 50 === 0) return SATIR_KARO;
  const aralik = Math.max(1, Math.round((300 - kat) / 30));
  const w = 6 + Math.floor(rnd() * aralik);
  const ust = kat < 100 ? SATIR_KARO : Math.max(2, 6 - Math.floor(kat / 100));
  return Math.max(2, Math.min(w, ust));
}
function katUret(kat, rnd = Math.random) {
  const w = genislik(kat, rnd);
  const bas = 5 + (w === SATIR_KARO ? 0 : Math.floor(rnd() * (SATIR_KARO - w + 1)));
  return { kat, y: -kat * KAT_ARALIK, xKaro: bas, genislikKaro: w, no: kat % 10 === 0, tema: Math.floor(kat / 100) };
}

// ---- puan ----
// description: Puan ve kombo kuralları (özgün kod). sahip: Claude (Buz Kule iş parçacığı)
const KOMBO_KARE = 100;
const ODULLER = [[200,'KUSURSUZ'],[140,'DESTAN'],[100,'EFSANE'],[70,'OLAĞANÜSTÜ'],[50,'İNANILMAZ'],[35,'MUHTEŞEM'],[25,'SÜPER'],[15,'HARİKA'],[7,'GÜZEL'],[0,'İYİ']];
const odulAdi = (toplamKat) => ODULLER.find(([e]) => toplamKat >= e)[1];

function yeniPuan() { return { katPuani: 0, bonus: 0, kombo: null }; }

// Her inişte çağır: katFarki = bu zıplamada çıkılan kat (düşüşte <=0).
function inis(p, katFarki, yeniEnYuksekKat = 0) {
  if (katFarki >= 2) {
    p.kombo = p.kombo ? { toplam: p.kombo.toplam + katFarki, sayac: KOMBO_KARE, zip: p.kombo.zip + 1 }
                      : { toplam: katFarki, sayac: KOMBO_KARE, zip: 1 };
    return null;
  }
  return bitir(p);
}
function kare(p) {
  if (!p.kombo) return null;
  return --p.kombo.sayac <= 0 ? bitir(p) : null;
}
function bitir(p) {
  const k = p.kombo; p.kombo = null;
  if (!k || k.zip < 2) return null;
  p.bonus += k.toplam * k.toplam;
  return { ad: odulAdi(k.toplam), toplam: k.toplam };
}
const toplam = (p, enYuksekKat) => enYuksekKat * 10 + p.bonus;

// ---- ses ----
// description: WebAudio ile üretilen özgün ses efektleri (dosya yok). sahip: Claude (Buz Kule iş parçacığı)
let ctx = null;
function bip(f0, f1, sure, tur = 'square', ses = 0.06) {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
    o.type = tur; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + sure);
    g.gain.setValueAtTime(ses, t); g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + sure);
  } catch { /* ses yoksa oyun sessiz sürer */ }
}
const zipSesi = (hiz) => bip(260 + Math.abs(hiz) * 18, 600 + Math.abs(hiz) * 30, 0.14);
const odulSesi = (toplamKat) => { bip(500, 1000, 0.25, 'triangle', 0.09); if (toplamKat >= 25) setTimeout(() => bip(800, 1600, 0.3, 'triangle', 0.09), 120); };
const olumSesi = () => bip(400, 60, 0.6, 'sawtooth', 0.08);

// ---- gorsel ----
// description: Buz Kule özgün görsel katmanı (prosedürel çizim; harici varlık yok). sahip: Claude (Buz Kule iş parçacığı)
const TEMALAR = [
  { ust: '#0b1b3a', alt: '#27527f', duvar: '#2c4a73', tugla: '#1f3556', plat: '#a8e4ff', parilti: '#ffffff' }, // buz mağarası
  { ust: '#1b0f3a', alt: '#5b2e7a', duvar: '#4a2d73', tugla: '#33204f', plat: '#d9b3ff', parilti: '#ffe9ff' }, // mor gece
  { ust: '#2a0f1a', alt: '#8a3350', duvar: '#6b2840', tugla: '#4a1b2d', plat: '#ffc0b3', parilti: '#fff0e0' }, // gün batımı
  { ust: '#062a2a', alt: '#1f7a6a', duvar: '#1b5c52', tugla: '#134039', plat: '#b3ffe9', parilti: '#eafff9' }, // zümrüt
];
const hash = (n) => { let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };
const tema = (kat) => TEMALAR[Math.floor(kat / 100) % TEMALAR.length];

function arkaPlan(c, W, H, kamY, kat) {
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

function duvarlar(c, W, H, kamY, kat) {
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

function platform(c, x, y, gen, kat, no, n) {
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
function parcacikEkle(x, y, adet, renk, hiz = 3) {
  for (let i = 0; i < adet; i++) par.push({ x, y, vx: (Math.random() - 0.5) * hiz * 2, vy: -Math.random() * hiz, om: 24 + Math.random() * 16, renk });
}
function parcacikCiz(c, kamY) {
  for (let i = par.length - 1; i >= 0; i--) {
    const p = par[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.om--;
    if (p.om <= 0) { par.splice(i, 1); continue; }
    c.globalAlpha = Math.min(1, p.om / 14); c.fillStyle = p.renk; c.fillRect(Math.round(p.x), Math.round(p.y - kamY), 3, 3);
  }
  c.globalAlpha = 1;
}
const parcacikSifirla = () => { par.length = 0; };

// ---- oyun ----
// description: Oyun döngüsü, kamera ve çizim (özgün kod, kendi çizimleri). sahip: Claude (Buz Kule iş parçacığı)





const W = 640, H = 480, SAAT = 1500; // 30 sn @ 50 kare/sn
const ZEMIN_Y = 440;

function yeniOyun(rnd = Math.random) {
  const katlar = new Map();
  const kat = (n) => (katlar.has(n) || katlar.set(n, katUret(n, rnd)), katlar.get(n));
  return { rnd, kat, x: 320, y: ZEMIN_Y, vx: 0, vy: 0, havada: false, katNo: 0, enYuksek: 0, kamY: 0, kayma: 0, kaymaBasladi: false, kare: 0, puan: yeniPuan(), mesaj: null, bitti: false, sonInisKat: 0, oncekiSpace: false };
}

// y ekranda aşağı artar; kat n platformunun dünya y'si = ZEMIN_Y - n*KAT_ARALIK
const katY = (n) => ZEMIN_Y - n * KAT_ARALIK;

function adim(o, giris) {
  if (o.bitti) return;
  o.kare++; if (o.mesaj && o.mesaj.guc > 0) o.mesaj.guc--;
  o.vx = yatayGuncelle(o.vx, giris.sol, giris.sag);
  if (!o.havada && giris.zipla) { o.vy = zipla(o.vx); o.havada = true; zipSesi(o.vx); parcacikEkle(o.x, o.y, 6, '#ffffff', 2); }
  o.x += o.vx;
  ({ x: o.x, vx: o.vx } = duvarSekmesi(o.x, o.vx));
  const eskiY = o.y;
  if (o.havada) { o.vy = dikeyGuncelle(o.vy); o.y += o.vy; }
  // Yalnız düşerken platforma konulur.
  if (o.havada && o.vy >= 0) {
    for (let n = Math.max(0, Math.floor((ZEMIN_Y - o.y) / KAT_ARALIK) - 1); n <= Math.floor((ZEMIN_Y - eskiY) / KAT_ARALIK) + 1; n++) {
      const f = o.kat(n), py = katY(n);
      const kx0 = 85 + (f.xKaro - 5) * KARO, kx1 = kx0 + f.genislikKaro * KARO;
      if (n === 0 ? true : (eskiY <= py && o.y >= py && o.x >= kx0 && o.x <= kx1)) {
        if (n === 0 && o.y < py) continue;
        o.y = py; o.vy = 0; o.havada = false;
        const fark = n - o.sonInisKat; o.sonInisKat = n; o.katNo = n;
        o.enYuksek = Math.max(o.enYuksek, n);
        if (fark >= 2) parcacikEkle(o.x, o.y, 10, '#ffd24a', 3);
        const od = inis(o.puan, fark); if (od) { o.mesaj = { ...od, guc: 60 }; odulSesi(od.toplam); }
        break;
      }
    }
  }
  if (!o.havada) { // platformun altından çıktıysa düş
    const f = o.kat(o.katNo), kx0 = 85 + (f.xKaro - 5) * KARO, kx1 = kx0 + f.genislikKaro * KARO;
    if (o.katNo > 0 && (o.x < kx0 || o.x > kx1)) o.havada = true;
  }
  { const od = kare(o.puan); if (od) { o.mesaj = { ...od, guc: 60 }; odulSesi(od.toplam); } }
  // Kamera
  const hedef = o.y - 160;
  if (hedef < o.kamY) o.kamY = hedef; // oyuncu çok yükselince yukarı çek
  if (!o.kaymaBasladi && o.enYuksek >= 5) o.kaymaBasladi = true; // kat 5'ten sonra kayma başlar
  if (o.kaymaBasladi) { o.kayma = o.kare < SAAT ? 0.5 : Math.min(5, Math.floor(o.kare / SAAT)); o.kamY -= o.kayma; }
  if (o.y - o.kamY > H) { o.bitti = true; olumSesi(); }
}

function skor(o) { return toplam(o.puan, o.enYuksek); }

function ciz(c, o) {
  arkaPlan(c, W, H, o.kamY, o.enYuksek); duvarlar(c, W, H, o.kamY, o.enYuksek);
  const ilk = Math.max(0, Math.floor((ZEMIN_Y - (o.kamY + H)) / KAT_ARALIK)), son = Math.ceil((ZEMIN_Y - o.kamY) / KAT_ARALIK) + 1;
  for (let n = ilk; n <= son; n++) {
    const f = o.kat(n), sy = katY(n) - o.kamY;
    if (n === 0) platform(c, 85, sy, 470, 0, true, 0); else platform(c, 85 + (f.xKaro - 5) * KARO, sy, f.genislikKaro * KARO, n, f.no, n);
  }
  karakterCiz(c, o); parcacikCiz(c, o.kamY);
}

// Özgün 10x12 piksel karakter (bere takan, kırmızı eşofmanlı); dönüş yönüne göre aynalanır.
const SPR = ['..bbbbbb..','.bbbbbbbb.','.bbyyyybb.','..yyeyeyy.','..yyyyyy..','...rrrr...','.rrrrrrrr.','yyrrrrrryy','..rrrrrr..','..rr..rr..','..rr..rr..','.kkk..kkk.'];
const RENK = { b: '#3a7bd5', y: '#f5c9a0', e: '#222', r: '#d94a4a', k: '#333' };
const RESIMLER = {};
if (typeof Image !== 'undefined') for (const ad of ['dur', 'kos', 'zipla']) { const r = new Image(); r.src = './varlik/karakter_' + ad + '.png'; RESIMLER[ad] = r; }
function karakterCiz(c, o) {
  const poz = o.havada ? 'zipla' : Math.abs(o.vx) > 2 ? 'kos' : 'dur', r = RESIMLER[poz], ters = o.vx < -0.5;
  if (r && r.complete && r.naturalWidth > 0) { // Blender'dan render edilen özgün karakter
    const g = 42, y = 56, x = Math.round(o.x - g / 2), yy = Math.round(o.y - o.kamY - y + 4);
    c.save(); if (ters) { c.translate(x + g, 0); c.scale(-1, 1); c.drawImage(r, 0, yy, g, y); } else c.drawImage(r, x, yy, g, y); c.restore();
    return;
  }
  const x0 = Math.round(o.x - 15), y0 = Math.round(o.y - o.kamY - 36), m = 3;
  for (let r2 = 0; r2 < SPR.length; r2++) for (let q = 0; q < 10; q++) {
    const ch = SPR[r2][ters ? 9 - q : q]; if (ch === '.') continue;
    c.fillStyle = RENK[ch]; c.fillRect(x0 + q * m, y0 + r2 * m, m, m);
  }
}

// ---- hud ----
// description: Buz Kule arayüzü: HUD, başlık, duraklatma ve bitiş ekranları (prosedürel çizim). sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)

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

function hudCiz(c, o, en) {
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

function baslikCiz(c, en, t) {
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

function duraklatCiz(c) {
  perde(c); yazi(c, 'DURAKLATILDI', W / 2, 230, 44, '#fff', 'center', 900);
  yazi(c, 'P ile devam   R ile yeniden', W / 2, 272, 18, '#bfe6ff', 'center', 600);
}

function bitisCiz(c, o, en, yeniRekor) {
  perde(c); panel(c, 150, 120, 340, 250);
  yazi(c, 'KULE SENİ YENDİ', W / 2, 165, 30, '#ff8a6a', 'center', 900);
  yazi(c, 'SKOR', W / 2, 205, 13, '#8fd0ff', 'center', 700); yazi(c, String(skor(o)), W / 2, 245, 44, '#fff', 'center', 900);
  yazi(c, 'KAT ' + o.enYuksek + '   •   EN İYİ ' + en, W / 2, 280, 18, '#ffd24a', 'center', 700);
  if (yeniRekor) yazi(c, '★ YENİ REKOR ★', W / 2, 315, 20, '#7dffb0', 'center', 900);
  yazi(c, 'SPACE ile tekrar dene', W / 2, 352, 18, '#bfe6ff', 'center', 700);
}

// ---- arayuz ----
// description: Tarayıcı girişi, durum makinesi (başlık/oyun/duraklat/bitiş) ve oyun döngüsü. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)


const c = document.getElementById('c').getContext('2d'); const k = {};
let o = yeniOyun(), durum = 'baslik', en = 0, yeniRekor = false, t = 0;
try { en = Number(localStorage.getItem('buzkule.en')) || 0; } catch { /* kayıt yoksa sorun değil */ }
const basla = () => { o = yeniOyun(); durum = 'oyun'; yeniRekor = false; };
addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
  if (e.repeat) return;
  k[e.code] = 1;
  if (e.code === 'Space' && (durum === 'baslik' || durum === 'bitti')) basla();
  if (e.code === 'KeyR') basla();
  if (e.code === 'KeyP') durum = durum === 'oyun' ? 'duraklat' : durum === 'duraklat' ? 'oyun' : durum;
});
addEventListener('keyup', e => { k[e.code] = 0; });
function bitir() {
  durum = 'bitti'; const s = skor(o);
  if (s > en) { en = s; yeniRekor = s > 0; try { localStorage.setItem('buzkule.en', String(s)); } catch { /* sessiz */ } }
}
let onceki = 0, acc = 0; const DT = 20;
function dongu(ms) {
  acc += Math.min(100, ms - onceki); onceki = ms; t++;
  while (acc >= DT) {
    if (durum === 'oyun') { adim(o, { sol: k.ArrowLeft, sag: k.ArrowRight, zipla: k.Space }); if (o.bitti) bitir(); }
    acc -= DT;
  }
  ciz(c, o);
  if (durum !== 'baslik') hudCiz(c, o, en);
  if (durum === 'baslik') baslikCiz(c, en, t); else if (durum === 'duraklat') duraklatCiz(c); else if (durum === 'bitti') bitisCiz(c, o, en, yeniRekor);
  requestAnimationFrame(dongu);
}
requestAnimationFrame(ms => { onceki = ms; dongu(ms); });

})();