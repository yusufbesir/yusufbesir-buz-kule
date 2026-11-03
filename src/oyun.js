// description: Oyun döngüsü, kamera, takla, kristaller ve çizim (özgün kod). sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
import { yatayGuncelle, zipla, duvarSekmesi, dikeyGuncelle } from './fizik.js';
import { katUret, KARO, KAT_ARALIK } from './kat.js';
import { yeniPuan, inis, kare, toplam } from './puan.js';
import { zipSesi, odulSesi, olumSesi, kristalSesi, hizSesi } from './ses.js';
import { AYAR, KARAKTERLER } from './ayar.js';
import { arkaPlan, duvarlar, platform, kristalCiz, parcacikEkle, parcacikCiz } from './gorsel.js';

export const W = 640, H = 480, SAAT = 1500; // 30 sn @ 50 kare/sn
const ZEMIN_Y = 440, KRISTAL_PUAN = 25, TAKLA_HIZI = 16; // |ilk dikey hız| >= 16: en az 2 kat yükselen zıplama takla atar

export function yeniOyun(rnd = Math.random) {
  const katlar = new Map();
  const kat = (n) => (katlar.has(n) || katlar.set(n, katUret(n, rnd)), katlar.get(n));
  return {
    rnd, kat, x: 320, y: ZEMIN_Y, vx: 0, vy: 0, yon: 1, havada: false, katNo: 0, enYuksek: 0, kamY: 0, kamTaban: 0, kayma: 0, kaymaBasladi: false,
    kare: 0, puan: yeniPuan(), mesaj: null, bitti: false, sonInisKat: 0,
    aci: 0, aciHiz: 0, donuyor: false, alinan: new Set(), ek: 0, hizlan: 0, rozet: null,
  };
}

// y ekranda aşağı artar; kat n platformunun dünya y'si = ZEMIN_Y - n*KAT_ARALIK
const katY = (n) => ZEMIN_Y - n * KAT_ARALIK;
const kristalKonum = (f) => ({ x: 85 + (f.xKaro - 5) * KARO + f.genislikKaro * KARO * (0.15 + 0.7 * f.kristalX), y: katY(f.kat) - 38 });

export function adim(o, giris) {
  if (o.bitti) return;
  o.kare++; if (o.mesaj && o.mesaj.guc > 0) o.mesaj.guc--;
  if (o.hizlan > 0) o.hizlan--; if (o.rozet && --o.rozet.guc <= 0) o.rozet = null;
  o.vx = yatayGuncelle(o.vx, giris.sol, giris.sag); if (Math.abs(o.vx) > 0.5) o.yon = o.vx > 0 ? 1 : -1;
  if (!o.havada && giris.zipla) {
    o.vy = zipla(o.vx); o.havada = true; zipSesi(o.vx); parcacikEkle(o.x, o.y, 6, '#ffffff', 2);
    o.donuyor = Math.abs(o.vy) >= TAKLA_HIZI; o.aci = 0;
    o.aciHiz = o.donuyor ? o.yon * 2 * Math.PI / (2.5 * Math.abs(o.vy)) : 0; // havada kalma süresi ≈ 2.5·|vy| kare: tam bir takla
  }
  o.x += o.vx;
  ({ x: o.x, vx: o.vx } = duvarSekmesi(o.x, o.vx));
  const eskiY = o.y;
  if (o.havada) { o.vy = dikeyGuncelle(o.vy); o.y += o.vy; if (o.donuyor) o.aci += o.aciHiz; }
  // Yalnız düşerken platforma konulur.
  if (o.havada && o.vy >= 0) {
    for (let n = Math.max(0, Math.floor((ZEMIN_Y - o.y) / KAT_ARALIK) - 1); n <= Math.floor((ZEMIN_Y - eskiY) / KAT_ARALIK) + 1; n++) {
      const f = o.kat(n), py = katY(n);
      const kx0 = 85 + (f.xKaro - 5) * KARO, kx1 = kx0 + f.genislikKaro * KARO;
      if (n === 0 ? true : (eskiY <= py && o.y >= py && o.x >= kx0 && o.x <= kx1)) {
        if (n === 0 && o.y < py) continue;
        o.y = py; o.vy = 0; o.havada = false; o.donuyor = false; o.aci = 0;
        const fark = n - o.sonInisKat; o.sonInisKat = n; o.katNo = n;
        const yeniRekor = n > o.enYuksek; o.enYuksek = Math.max(o.enYuksek, n);
        if (yeniRekor && n % 50 === 0) o.rozet = { metin: 'KAT ' + n, guc: 110 };
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
  // Kristal toplama: yakındaki katlarda yüzen kristallere değince +25 puan
  const taban = Math.floor((ZEMIN_Y - o.y) / KAT_ARALIK);
  for (let n = Math.max(1, taban - 1); n <= taban + 2; n++) {
    const f = o.kat(n); if (!f.kristal || o.alinan.has(n)) continue;
    const p = kristalKonum(f);
    if (Math.abs(o.x - p.x) < 26 && Math.abs((o.y - 30) - p.y) < 34) { o.alinan.add(n); o.ek += KRISTAL_PUAN; kristalSesi(); parcacikEkle(p.x, p.y, 14, '#bff6ff', 3.5); }
  }
  // Kamera: taban en yüksek kata göre yükselir (ve kayma başlayınca kendiliğinden); zıplama anında oyuncu üst kenara
  // yaklaşırsa kamera geçici olarak yukarı çıkar, inince tabana yumuşakça döner (tepe noktasına kilitlenmez).
  o.kamTaban = Math.min(o.kamTaban, katY(o.enYuksek) - 200);
  if (!o.kaymaBasladi && o.enYuksek >= 5) o.kaymaBasladi = true; // kat 5'ten sonra kayma başlar
  if (o.kaymaBasladi) {
    o.kayma = o.kare < SAAT ? 0.5 : Math.min(5, Math.floor(o.kare / SAAT)); o.kamTaban -= o.kayma;
    if (o.kare % SAAT === 0) { o.hizlan = 110; hizSesi(); } // her 30 sn'de hızlanma uyarısı
  }
  const kamHedef = Math.min(o.kamTaban, o.y - 100);
  if (kamHedef < o.kamY) o.kamY = kamHedef; else o.kamY += Math.min(8, kamHedef - o.kamY);
  if (o.y - o.kamY > H) { o.bitti = true; olumSesi(); }
}

export function skor(o) { return toplam(o.puan, o.enYuksek) + o.ek; }

export function ciz(c, o) {
  const titre = o.mesaj && o.mesaj.guc > 48 ? (o.mesaj.guc - 48) * 0.35 * AYAR.sarsinti : 0; // büyük kombo ödülünde kısa ekran sarsıntısı
  c.save(); if (titre) c.translate((Math.random() - 0.5) * titre, (Math.random() - 0.5) * titre);
  arkaPlan(c, W, H, o.kamY, o.enYuksek); duvarlar(c, W, H, o.kamY, o.enYuksek);
  const ilk = Math.max(0, Math.floor((ZEMIN_Y - (o.kamY + H)) / KAT_ARALIK) - 1), son = Math.ceil((ZEMIN_Y - o.kamY) / KAT_ARALIK) + 1;
  for (let n = ilk; n <= son; n++) {
    const f = o.kat(n), sy = katY(n) - o.kamY;
    if (n === 0) platform(c, 85, sy, 470, 0, true, 0); else platform(c, 85 + (f.xKaro - 5) * KARO, sy, f.genislikKaro * KARO, n, f.no, n);
    if (f.kristal && !o.alinan.has(n)) { const p = kristalKonum(f); kristalCiz(c, p.x, p.y - o.kamY, n); }
  }
  karakterCiz(c, o); parcacikCiz(c, o.kamY);
  c.restore();
}

// Kenney "Platformer Characters" (CC0) pozları; kaynak varlik/kenney/LICENSE-Kenney-CC0.txt. Karakter ayar panelinden seçilir.
const POZLAR = ['stand', 'walk1', 'walk2', 'jump', 'fall', 'skid', 'cheer1', 'hurt'];
const RESIMLER = {};
function resimler(ad) {
  if (!RESIMLER[ad] && typeof Image !== 'undefined') {
    RESIMLER[ad] = {};
    for (const p of POZLAR) { const r = new Image(); r.src = './varlik/kenney/karakter/' + ad + '/' + p + '.png'; RESIMLER[ad][p] = r; }
  }
  return RESIMLER[ad];
}
function pozSec(o) {
  if (o.bitti) return 'hurt';
  if (o.havada) return o.donuyor ? 'cheer1' : o.vy < 0 ? 'jump' : 'fall';
  if (Math.abs(o.vx) > 2) return (o.kare >> 3) & 1 ? 'walk1' : 'walk2';
  return 'stand';
}
function karakterCiz(c, o) {
  const takim = resimler(KARAKTERLER[AYAR.karakter] || KARAKTERLER[0]), r = takim && takim[pozSec(o)], ters = o.yon < 0;
  const ayakY = o.y - o.kamY;
  if (!(r && r.complete && r.naturalWidth > 0)) { // yüklenemezse sade yedek
    c.fillStyle = '#ff7a3d'; c.beginPath(); c.roundRect ? c.roundRect(o.x - 12, ayakY - 40, 24, 40, 8) : c.rect(o.x - 12, ayakY - 40, 24, 40); c.fill(); return;
  }
  // squash & stretch: havada hıza göre uzar; hızlı koşuda hafif eğilir ve parıltılı iz bırakır; takla zıplamasında gövde döner
  const uzama = o.havada && !o.donuyor ? Math.max(-0.12, Math.min(0.14, -o.vy * 0.006)) : 0;
  const g = 48 * (1 - uzama * 0.6), y = 66 * (1 + uzama);
  if (Math.abs(o.vx) > 8 || (o.havada && Math.abs(o.vy) > 14)) parcacikEkle(o.x, o.y - 24, 1, o.donuyor ? 'rgba(255,210,120,0.9)' : 'rgba(120,220,255,0.8)', 0.6);
  c.fillStyle = 'rgba(0,0,0,' + (o.havada ? 0.12 : 0.3) + ')'; c.beginPath(); c.ellipse(o.x, ayakY + 2, o.havada ? 11 : 17, 4, 0, 0, 7); c.fill();
  c.save();
  const merkezY = ayakY - 33; // dönüş ve eğilme gövde/ayak noktasından
  if (o.havada && o.donuyor) { c.translate(o.x, merkezY); c.rotate(o.aci); c.translate(-o.x, -merkezY); }
  else { c.translate(o.x, ayakY); c.rotate(o.havada ? 0 : Math.max(-0.18, Math.min(0.18, o.vx * 0.012))); c.translate(-o.x, -ayakY); }
  c.shadowColor = o.donuyor ? 'rgba(255,215,130,0.95)' : 'rgba(140,230,255,0.9)'; c.shadowBlur = (Math.abs(o.vx) > 8 || o.donuyor ? 14 : 6) * AYAR.parilti;
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  const x = o.x - g / 2, yy = ayakY - y + 3;
  if (ters) { c.translate(o.x * 2, 0); c.scale(-1, 1); }
  c.drawImage(r, x, yy, g, y);
  c.restore();
}
