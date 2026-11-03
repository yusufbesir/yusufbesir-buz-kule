(() => {
"use strict";
// ---- ayar ----
// description: Buz Kule kullanıcı ayarları (parıltı, parçacık, sarsıntı, ses) ve azaltılmış hareket desteği. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
// Fizik ve oyun kuralları bu ayarlardan etkilenmez; yalnız görünüm ve ses.
const AZ = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const VARSAYILAN = Object.freeze({ parilti: 1, parcacik: AZ ? 0.25 : 1, sarsinti: AZ ? 0 : 1, ses: 0.8 });
const AYAR = { ...VARSAYILAN, azaltilmisHareket: AZ };
const ANAHTAR = 'buzkule.ayar';

function ayarYukle() {
  try {
    const k = JSON.parse(localStorage.getItem(ANAHTAR) || 'null');
    if (k) for (const a of Object.keys(VARSAYILAN)) if (typeof k[a] === 'number' && k[a] >= 0 && k[a] <= 2) AYAR[a] = k[a];
  } catch { /* kayıt yoksa varsayılanlar */ }
}
function ayarKaydet() {
  try { localStorage.setItem(ANAHTAR, JSON.stringify({ parilti: AYAR.parilti, parcacik: AYAR.parcacik, sarsinti: AYAR.sarsinti, ses: AYAR.ses })); } catch { /* sessiz */ }
}
function ayarSifirla() { Object.assign(AYAR, VARSAYILAN); ayarKaydet(); }

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
// description: WebAudio ile üretilen özgün ses efektleri (dosya yok); ses düzeyi ayar.js'den. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)

let ctx = null;
function bip(f0, f1, sure, tur = 'square', ses = 0.06) {
  if (AYAR.ses <= 0) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime, v = Math.max(0.0002, ses * AYAR.ses / 0.8);
    o.type = tur; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + sure);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
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
    c.save(); c.shadowColor = t.plat; c.shadowBlur = 12 * AYAR.parilti; c.fillStyle = t.plat; c.globalAlpha = 0.85; c.fillRect(ic - (x0 === 0 ? 2 : 0), 0, 2, H); c.restore();
  }
}

function platform(c, x, y, gen, kat, no, n) {
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
function parcacikEkle(x, y, adet, renk, hiz = 3) {
  const say = Math.floor(adet * AYAR.parcacik) + (Math.random() < adet * AYAR.parcacik % 1 ? 1 : 0); // ayar çarpanı; kesirli kısım olasılıkla
  for (let i = 0; i < say; i++) par.push({ x, y, vx: (Math.random() - 0.5) * hiz * 2, vy: -Math.random() * hiz, om: 24 + Math.random() * 20, renk, boy: 2 + Math.random() * 3 });
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
  const titre = o.mesaj && o.mesaj.guc > 48 ? (o.mesaj.guc - 48) * 0.35 * AYAR.sarsinti : 0; // büyük kombo ödülünde kısa ekran sarsıntısı
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
    c.shadowColor = 'rgba(140,230,255,0.9)'; c.shadowBlur = (Math.abs(o.vx) > 8 ? 14 : 6) * AYAR.parilti; c.translate(-o.x, -ayakY);
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
// description: Buz Kule oyun içi HUD (yumuşak açık cam kartlar; tasarım dili arayuz-modernlesme/TASARIM-DILI.css). sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
// Menü, duraklatma ve bitiş ekranları HTML katmanındadır (index.html + arayuz.js); burada yalnız canvas HUD'u var.

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

function hudCiz(c, o, en) {
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
  if (o.mesaj && o.mesaj.guc > 0) { // ödül adı: cam hap
    const a = Math.min(1, o.mesaj.guc / 20), y = 140 - (60 - o.mesaj.guc) * 0.4, ad = o.mesaj.ad + '!';
    c.globalAlpha = a; c.font = 'italic 400 40px ' + SERIF; const g = c.measureText(ad).width + 44;
    kartHud(c, W / 2 - g / 2, y - 40, g, 56); metinHud(c, ad, W / 2, y, 'italic 400 40px ' + SERIF, YESIL, 'center'); c.globalAlpha = 1;
  }
}

// ---- arayuz ----
// description: Tarayıcı girişi, durum makinesi (menü/oyun/duraklat/bitiş), HTML katmanları (sekmeler, canlı ayar paneli) ve oyun döngüsü. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)



const kimlik = (a) => document.getElementById(a);
const c = kimlik('c').getContext('2d'); const k = {};
let o = yeniOyun(), durum = 'baslik', en = 0, yeniRekor = false, sekme = 'oyna';
ayarYukle();
try { en = Number(localStorage.getItem('buzkule.en')) || 0; } catch { /* kayıt yoksa sorun değil */ }

kimlik('m-en').textContent = String(en);
// ---- HTML katmanları ----
const katmanlar = { menu: kimlik('menu'), duraklat: kimlik('duraklat'), sonuc: kimlik('sonuc') };
function katmanGoster(ad) {
  for (const [a, el] of Object.entries(katmanlar)) { const ac = a === ad; el.classList.toggle('acik', ac); el.setAttribute('aria-hidden', String(!ac)); }
}
const durumKatman = { baslik: 'menu', duraklat: 'duraklat', bitti: 'sonuc', oyun: null };
function durumDegistir(d) {
  durum = d; katmanGoster(durumKatman[d]);
  if (d === 'baslik') { kimlik('m-en').textContent = String(en); }
  if (d === 'bitti') {
    kimlik('s-skor').textContent = String(skor(o)); kimlik('s-kat').textContent = String(o.enYuksek); kimlik('s-en').textContent = String(en);
    kimlik('s-rekor').hidden = !yeniRekor;
  }
}
function basla() {
  o = yeniOyun(); yeniRekor = false; durumDegistir('oyun');
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); // Space odaktaki düğmeyi tekrar tıklamasın
}
function oyunBitti() {
  const s = skor(o);
  if (s > en) { en = s; yeniRekor = s > 0; try { localStorage.setItem('buzkule.en', String(s)); } catch { /* sessiz */ } }
  durumDegistir('bitti');
}

// ---- Sekmeler (gösterge: ön kenar önce, arka kenar gecikmeli) ----
const sekmeAdlari = ['oyna', 'ayar', 'nasil'];
const gosterge = kimlik('gosterge');
function gostergeKonumla(hedef, yonSag) {
  const sol = hedef.offsetLeft, sag = hedef.offsetParent ? hedef.offsetParent.clientWidth - hedef.offsetLeft - hedef.offsetWidth : 0;
  gosterge.style.transition = AYAR.azaltilmisHareket ? 'none'
    : yonSag ? 'left 300ms cubic-bezier(.2,.9,.25,1.05) 70ms, right 220ms cubic-bezier(.2,.9,.25,1.05)'
             : 'left 220ms cubic-bezier(.2,.9,.25,1.05), right 300ms cubic-bezier(.2,.9,.25,1.05) 70ms';
  gosterge.style.left = sol + 'px'; gosterge.style.right = sag + 'px'; gosterge.style.width = 'auto';
}
function sekmeSec(ad, odakla) {
  const eskiIdx = sekmeAdlari.indexOf(sekme), yeniIdx = sekmeAdlari.indexOf(ad); sekme = ad;
  for (const a of sekmeAdlari) {
    const dugme = kimlik('t-' + a), sec = a === ad;
    dugme.setAttribute('aria-selected', String(sec)); dugme.tabIndex = sec ? 0 : -1; kimlik('p-' + a).hidden = !sec;
    if (sec) { gostergeKonumla(dugme, yeniIdx >= eskiIdx); if (odakla) dugme.focus(); }
  }
}
for (const a of sekmeAdlari) kimlik('t-' + a).addEventListener('click', () => sekmeSec(a, false));
kimlik('basla').addEventListener('click', basla);
kimlik('tekrar').addEventListener('click', basla);
gostergeKonumla(kimlik('t-oyna'), true);

// ---- Canlı ayar paneli ----
const ayarAnahtarlari = ['parilti', 'parcacik', 'sarsinti', 'ses'];
function ayarYaz() {
  for (const a of ayarAnahtarlari) { kimlik('a-' + a).value = String(AYAR[a]); kimlik('o-' + a).textContent = Math.round(AYAR[a] * 100) + '%'; }
}
for (const a of ayarAnahtarlari) {
  kimlik('a-' + a).addEventListener('input', (e) => { AYAR[a] = Number(e.target.value); kimlik('o-' + a).textContent = Math.round(AYAR[a] * 100) + '%'; ayarKaydet(); });
}
kimlik('a-sifirla').addEventListener('click', () => { ayarSifirla(); ayarYaz(); });
ayarYaz();
kimlik('a-not').textContent = AYAR.azaltilmisHareket ? 'Sistem "hareketi azalt" ayarın açık: sarsıntı kapalı, parçacık azaltıldı, animasyonlar donuk.' : 'Ayarlar canlı uygulanır ve kaydedilir; oyun kuralları değişmez.';

// ---- Klavye ----
addEventListener('keydown', e => {
  const hedef = e.target && e.target.tagName;
  if (e.code === 'Space' && hedef !== 'BUTTON' && hedef !== 'INPUT') e.preventDefault();
  if (e.code.startsWith('Arrow') && hedef !== 'INPUT') e.preventDefault();
  if (e.repeat) return;
  k[e.code] = 1;
  if (durum === 'baslik' && hedef !== 'INPUT' && (e.code === 'ArrowLeft' || e.code === 'ArrowRight')) { // menüde oklar sekme değiştirir
    const i = sekmeAdlari.indexOf(sekme) + (e.code === 'ArrowRight' ? 1 : -1); sekmeSec(sekmeAdlari[(i + 3) % 3], true); return;
  }
  if (e.code === 'Space' && hedef !== 'BUTTON' && hedef !== 'INPUT' && (durum === 'bitti' || (durum === 'baslik' && sekme === 'oyna'))) basla();
  if (e.code === 'KeyR' && hedef !== 'INPUT') basla();
  if (e.code === 'KeyP' && hedef !== 'INPUT') { if (durum === 'oyun') durumDegistir('duraklat'); else if (durum === 'duraklat') durumDegistir('oyun'); }
  if (e.code === 'Escape' && durum === 'duraklat') durumDegistir('baslik');
});
addEventListener('keyup', e => { k[e.code] = 0; });

// ---- Döngü ----
let onceki = 0, acc = 0; const DT = 20;
function dongu(ms) {
  acc += Math.min(100, ms - onceki); onceki = ms;
  while (acc >= DT) {
    if (durum === 'oyun') { adim(o, { sol: k.ArrowLeft, sag: k.ArrowRight, zipla: k.Space }); if (o.bitti) oyunBitti(); }
    acc -= DT;
  }
  ciz(c, o);
  if (durum !== 'baslik') hudCiz(c, o, en);
  requestAnimationFrame(dongu);
}
requestAnimationFrame(ms => { onceki = ms; dongu(ms); });

})();