// description: Oyun döngüsü, kamera ve çizim (özgün kod, kendi çizimleri). sahip: Claude (Buz Kule iş parçacığı)
import { SABIT, yatayGuncelle, zipla, duvarSekmesi, dikeyGuncelle } from './fizik.js';
import { katUret, KARO, KAT_ARALIK } from './kat.js';
import { yeniPuan, inis, kare, toplam } from './puan.js';
import { zipSesi, odulSesi, olumSesi } from './ses.js';
import { arkaPlan, duvarlar, platform, parcacikEkle, parcacikCiz } from './gorsel.js';

export const W = 640, H = 480, SAAT = 1500; // 30 sn @ 50 kare/sn
const ZEMIN_Y = 440;

export function yeniOyun(rnd = Math.random) {
  const katlar = new Map();
  const kat = (n) => (katlar.has(n) || katlar.set(n, katUret(n, rnd)), katlar.get(n));
  return { rnd, kat, x: 320, y: ZEMIN_Y, vx: 0, vy: 0, havada: false, katNo: 0, enYuksek: 0, kamY: 0, kayma: 0, kaymaBasladi: false, kare: 0, puan: yeniPuan(), mesaj: null, bitti: false, sonInisKat: 0, oncekiSpace: false };
}

// y ekranda aşağı artar; kat n platformunun dünya y'si = ZEMIN_Y - n*KAT_ARALIK
const katY = (n) => ZEMIN_Y - n * KAT_ARALIK;

export function adim(o, giris) {
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

export function skor(o) { return toplam(o.puan, o.enYuksek); }

export function ciz(c, o) {
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
