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
// description: Buz Kule modern görsel katmanı: aurora gökyüzü, kristal siluetler, buzlu cam duvarlar, parıltılı platformlar (prosedürel çizim). sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
const TEMALAR = [
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

function arkaPlan(c, W, H, kamY, kat) {
  zaman++;
  const t = tema(kat), g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, t.ust); g.addColorStop(1, t.alt); c.fillStyle = g; c.fillRect(0, 0, W, H);
  // aurora şeritleri (ekleme karışımı, yavaş dalgalanma)
  c.save(); c.globalCompositeOperation = 'lighter';
  t.serit.forEach((renk, k) => {
    const y0 = 120 + k * 130 - (kamY * 0.05) % 260;
    const gr = c.createLinearGradient(0, y0 - 70, 0, y0 + 70); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, renk); gr.addColorStop(1, 'rgba(0,0,0,0)');
    c.globalAlpha = 0.16; c.fillStyle = gr; c.beginPath(); c.moveTo(0, y0 + 80);
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

function duvarlar(c, W, H, kamY, kat) {
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
    c.save(); c.shadowColor = t.plat; c.shadowBlur = 12; c.fillStyle = t.plat; c.globalAlpha = 0.85; c.fillRect(ic - (x0 === 0 ? 2 : 0), 0, 2, H); c.restore();
  }
}

function platform(c, x, y, gen, kat, no, n) {
  const t = tema(kat), r = 7, h = 14, renk = no ? '#ffd24a' : t.plat;
  c.save();
  c.shadowColor = renk; c.shadowBlur = no ? 18 : 12;
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
function parcacikEkle(x, y, adet, renk, hiz = 3) {
  for (let i = 0; i < adet; i++) par.push({ x, y, vx: (Math.random() - 0.5) * hiz * 2, vy: -Math.random() * hiz, om: 24 + Math.random() * 20, renk, boy: 2 + Math.random() * 3 });
}
function parcacikCiz(c, kamY) {
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = par.length - 1; i >= 0; i--) {
    const p = par[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.18; p.om--;
    if (p.om <= 0) { par.splice(i, 1); continue; }
    c.globalAlpha = Math.min(1, p.om / 16); c.fillStyle = p.renk; c.beginPath(); c.arc(p.x, p.y - kamY, p.boy * (p.om / 40 + 0.4), 0, 7); c.fill();
  }
  c.restore(); c.globalAlpha = 1;
}
const parcacikSifirla = () => { par.length = 0; };

// ---- oyun ----
// description: Oyun döngüsü, kamera ve çizim (özgün kod, kendi çizimleri). sahip: Claude (Buz Kule iş parçacığı)





const W = 640, H = 480, SAAT = 1500; // 30 sn @ 50 kare/sn
const ZEMIN_Y = 440;

function yeniOyun(rnd = Math.random) {
  const katlar = new Map();
  const kat = (n) => (katlar.has(n) || katlar.set(n, katUret(n, rnd)), katlar.get(n));
  return { rnd, kat, x: 320, y: ZEMIN_Y, vx: 0, vy: 0, havada: false, katNo: 0, enYuksek: 0, kamY: 0, kamTaban: 0, kayma: 0, kaymaBasladi: false, kare: 0, puan: yeniPuan(), mesaj: null, bitti: false, sonInisKat: 0, oncekiSpace: false };
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
  // Kamera: taban en yüksek kata göre yükselir (ve kayma başlayınca kendiliğinden); zıplama anında oyuncu üst kenara
  // yaklaşırsa kamera geçici olarak yukarı çıkar, inince tabana yumuşakça döner (tepe noktasına kilitlenmez).
  o.kamTaban = Math.min(o.kamTaban, katY(o.enYuksek) - 200);
  if (!o.kaymaBasladi && o.enYuksek >= 5) o.kaymaBasladi = true; // kat 5'ten sonra kayma başlar
  if (o.kaymaBasladi) { o.kayma = o.kare < SAAT ? 0.5 : Math.min(5, Math.floor(o.kare / SAAT)); o.kamTaban -= o.kayma; }
  const kamHedef = Math.min(o.kamTaban, o.y - 100);
  if (kamHedef < o.kamY) o.kamY = kamHedef; else o.kamY += Math.min(8, kamHedef - o.kamY);
  if (o.y - o.kamY > H) { o.bitti = true; olumSesi(); }
}

function skor(o) { return toplam(o.puan, o.enYuksek); }

function ciz(c, o) {
  const titre = o.mesaj && o.mesaj.guc > 48 ? (o.mesaj.guc - 48) * 0.35 : 0; // büyük kombo ödülünde kısa ekran sarsıntısı
  c.save(); if (titre) c.translate((Math.random() - 0.5) * titre, (Math.random() - 0.5) * titre);
  arkaPlan(c, W, H, o.kamY, o.enYuksek); duvarlar(c, W, H, o.kamY, o.enYuksek);
  const ilk = Math.max(0, Math.floor((ZEMIN_Y - (o.kamY + H)) / KAT_ARALIK)), son = Math.ceil((ZEMIN_Y - o.kamY) / KAT_ARALIK) + 1;
  for (let n = ilk; n <= son; n++) {
    const f = o.kat(n), sy = katY(n) - o.kamY;
    if (n === 0) platform(c, 85, sy, 470, 0, true, 0); else platform(c, 85 + (f.xKaro - 5) * KARO, sy, f.genislikKaro * KARO, n, f.no, n);
  }
  karakterCiz(c, o); parcacikCiz(c, o.kamY);
  c.restore();
}

// Özgün 10x12 piksel karakter (bere takan, kırmızı eşofmanlı); dönüş yönüne göre aynalanır.
const SPR = ['..bbbbbb..','.bbbbbbbb.','.bbyyyybb.','..yyeyeyy.','..yyyyyy..','...rrrr...','.rrrrrrrr.','yyrrrrrryy','..rrrrrr..','..rr..rr..','..rr..rr..','.kkk..kkk.'];
const RENK = { b: '#3a7bd5', y: '#f5c9a0', e: '#222', r: '#d94a4a', k: '#333' };
const RESIMLER = {};
if (typeof Image !== 'undefined') for (const ad of ['stand', 'walk1', 'walk2', 'jump', 'fall', 'skid', 'cheer1', 'hurt']) { const r = new Image(); r.src = './varlik/kenney/player_' + ad + '.png'; RESIMLER[ad] = r; }
// Kenney "Platformer Characters" (CC0) Player pozları; kaynak varlik/kenney/LICENSE-Kenney-CC0.txt
function pozSec(o) {
  if (o.bitti) return 'hurt';
  if (o.havada) return o.puan.kombo && o.vy < 0 && o.puan.kombo.zip >= 2 ? 'cheer1' : o.vy < 0 ? 'jump' : 'fall';
  if (Math.abs(o.vx) > 2) return (o.kare >> 3) & 1 ? 'walk1' : 'walk2';
  return 'stand';
}
function karakterCiz(c, o) {
  const r = RESIMLER[pozSec(o)], ters = o.vx < -0.5;
  if (r && r.complete && r.naturalWidth > 0) {
    // squash & stretch: havada hıza göre uzar, hızlı koşuda hafif eğilir; hızlıyken parıltılı iz bırakır
    const uzama = o.havada ? Math.max(-0.12, Math.min(0.14, -o.vy * 0.006)) : 0;
    const g = 48 * (1 - uzama * 0.6), y = 66 * (1 + uzama), x = Math.round(o.x - g / 2), yy = Math.round(o.y - o.kamY - y + 3);
    if (Math.abs(o.vx) > 8 || (o.havada && Math.abs(o.vy) > 14)) parcacikEkle(o.x, o.y - 20, 1, 'rgba(120,220,255,0.8)', 0.6);
    c.fillStyle = 'rgba(0,0,0,' + (o.havada ? 0.12 : 0.3) + ')'; c.beginPath(); c.ellipse(o.x, o.y - o.kamY + 2, o.havada ? 11 : 17, 4, 0, 0, 7); c.fill();
    const ayakY = o.y - o.kamY; // eğilme ayak noktası etrafında olmalı (üst kenar etrafında değil)
    c.save(); c.translate(o.x, ayakY); c.rotate(o.havada ? 0 : Math.max(-0.18, Math.min(0.18, o.vx * 0.012)));
    c.shadowColor = 'rgba(140,230,255,0.9)'; c.shadowBlur = Math.abs(o.vx) > 8 ? 14 : 6; c.translate(-o.x, -ayakY);
    if (ters) { c.translate(x + g, 0); c.scale(-1, 1); c.drawImage(r, 0, yy, g, y); } else c.drawImage(r, x, yy, g, y);
    c.restore();
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

function yuvarlakHud(c, x, y, g, h, r) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + g, y, x + g, y + h, r); c.arcTo(x + g, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + g, y, r); c.closePath();
}
function panel(c, x, y, g, h) {
  // buzlu cam: üstten alta saydam gradyan, ince parlak kenar ve üst ışık çizgisi
  const gr = c.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, 'rgba(255,255,255,0.18)'); gr.addColorStop(1, 'rgba(255,255,255,0.05)');
  c.save(); c.shadowColor = 'rgba(0,0,0,0.45)'; c.shadowBlur = 14; c.fillStyle = 'rgba(6,14,38,0.55)'; yuvarlakHud(c, x, y, g, h, 14); c.fill(); c.restore();
  c.fillStyle = gr; yuvarlakHud(c, x, y, g, h, 14); c.fill();
  c.strokeStyle = 'rgba(190,235,255,0.5)'; c.lineWidth = 1.5; yuvarlakHud(c, x + 0.5, y + 0.5, g - 1, h - 1, 14); c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(x + 14, y + 1, g - 28, 1.5);
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
    c.fillStyle = g; yuvarlakHud(c, 16, 270 - h, 18, Math.max(h, 2), 5); c.fill();
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
  c.save(); c.shadowColor = 'rgba(100,210,255,0.9)'; c.shadowBlur = 28 + 10 * Math.sin(t * 0.06); c.fillStyle = g; c.fillText('BUZ KULE', W / 2, 160 + Math.sin(t * 0.05) * 3); c.restore();
  c.textAlign = 'left';
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
function oyunBitti() {
  durum = 'bitti'; const s = skor(o);
  if (s > en) { en = s; yeniRekor = s > 0; try { localStorage.setItem('buzkule.en', String(s)); } catch { /* sessiz */ } }
}
let onceki = 0, acc = 0; const DT = 20;
function dongu(ms) {
  acc += Math.min(100, ms - onceki); onceki = ms; t++;
  while (acc >= DT) {
    if (durum === 'oyun') { adim(o, { sol: k.ArrowLeft, sag: k.ArrowRight, zipla: k.Space }); if (o.bitti) oyunBitti(); }
    acc -= DT;
  }
  ciz(c, o);
  if (durum !== 'baslik') hudCiz(c, o, en);
  if (durum === 'baslik') baslikCiz(c, en, t); else if (durum === 'duraklat') duraklatCiz(c); else if (durum === 'bitti') bitisCiz(c, o, en, yeniRekor);
  requestAnimationFrame(dongu);
}
requestAnimationFrame(ms => { onceki = ms; dongu(ms); });

})();