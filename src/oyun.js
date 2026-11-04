// description: Oyun döngüsü, fizik hissi (kenar toleransı, coyote süresi, zıplama tamponu), kamera, takla, kristaller, güç öğeleri ve çizim (özgün kod). sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
import { yatayGuncelle, zipla, duvarSekmesi, dikeyGuncelle } from './fizik.js';
import { katUret, KARO, KAT_ARALIK } from './kat.js';
import { yeniPuan, inis, kare, toplam } from './puan.js';
import { zipSesi, odulSesi, olumSesi, kristalSesi, hizSesi, gucSesi, yaySesi, kirmaSesi } from './ses.js';
import { AYAR, KARAKTERLER } from './ayar.js';
import { izRengi } from './magaza.js';
import { katRnd } from './hayalet.js';
import { arkaPlan, duvarlar, platform, kristalCiz, gucCiz, parcacikEkle, parcacikCiz } from './gorsel.js';

export const W = 640, H = 480, SAAT = 1500; // 30 sn @ 50 kare/sn
const ZEMIN_Y = 440, KRISTAL_PUAN = 25, TAKLA_HIZI = 16; // |ilk dikey hız| >= 16: en az 2 kat yükselen zıplama takla atar
// Oyun hissi (platformer pratikleri): basamağa tutunma ve affedici giriş
export const AYAK = 10;     // ayak yarı genişliği: basamak kenarından bu kadar taşan ayak hâlâ basamağa basar
const COYOTE = 6;           // basamaktan yürüyerek çıktıktan sonra hâlâ zıplayabilme süresi (kare)
const TAMPON = 7;           // inişten hemen önce basılan zıplama tuşu bu kadar kare hatırlanır
const SAAT_SURE = 480, MIKNATIS_SURE = 500; // güç öğesi süreleri (kare)
const KIRILMA = 30;         // kırılgan basamak: üstünde bu kadar kare durulursa kırılır (0,6 sn)
const YAY_HIZI = 27;        // yay basamak: inişte yukarı fırlatma hızı (normal zıplamanın en fazla 24,4 hızından yüksek, ~6 kat)
// "Kıl payı" bonusu: oyuncu ekran altına bir kattan az yaklaşıp (düşme sınırı H) sonra bir basamağa konarsa küçük sabit puan.
// Yalnız oyun durumuna bağlıdır (rastgelelik yok): hayalet/günlük kule tekrarlanabilirliği korunur. Fizik ve kat üretimi değişmez.
export const KIL_PAYI_PUAN = 25, KIL_PAYI_BEKLE = 300; // bonus puanı; iki bonus arası en az bekleme (kare, 6 sn)
const KIL_PAYI_SINIR = H - KAT_ARALIK;                  // ekranda bu çizginin altı tehlike bölgesi

// rnd bir sayıysa tohumdur: kat n her zaman aynı (katRnd), böylece aynı tohum + aynı girişler = aynı oyun (hayalet, günlük kule).
// rnd bir fonksiyonsa eski davranış (testler): ardışık çağrılarla üretilir.
export function yeniOyun(rnd = Math.random) {
  const tohum = typeof rnd === 'number' ? rnd >>> 0 : null, katlar = new Map();
  const kat = (n) => (katlar.has(n) || katlar.set(n, tohum === null ? katUret(n, rnd) : katUret(n, katRnd(tohum, n))), katlar.get(n));
  return {
    rnd, tohum, kat, x: 320, y: ZEMIN_Y, vx: 0, vy: 0, yon: 1, havada: false, katNo: 0, enYuksek: 0, kamY: 0, kamTaban: 0, kayma: 0, kaymaBasladi: false,
    kare: 0, puan: yeniPuan(), mesaj: null, bitti: false, sonInisKat: 0,
    aci: 0, aciHiz: 0, donuyor: false, alinan: new Set(), alinanGuc: new Set(), ek: 0, hizlan: 0, rozet: null,
    coyote: 0, tampon: 0, oncekiZ: false, saat: 0, miknatis: 0,
    kirik: new Set(), sayac: 0, sayacKat: -1, yaySayisi: 0, enIyiKombo: 0, // kırık basamaklar, kırılma sayacı, başarım sayaçları
    sars: 0, rekorKat: 0, // kilometre taşı sarsıntısı süresi; önceki en iyi kat (arayuz.js yazar, yalnız görünüm)
    sonZip: 0, komboPuls: 0, // kombo yazısı: son görülen kombo zıplama sayısı ve büyüme vurgusu süresi (yalnız görünüm)
    tehlike: false, kilPayi: 0, kilPayiBekle: 0, kilPayiSayisi: 0, // kıl payı: tehlike bölgesine girildi mi, yazı süresi, bekleme süresi, verilen bonus sayısı
  };
}

// y ekranda aşağı artar; kat n platformunun dünya y'si = ZEMIN_Y - n*KAT_ARALIK
export const katY = (n) => ZEMIN_Y - n * KAT_ARALIK;
const basamakAralik = (f) => { const x0 = 85 + (f.xKaro - 5) * KARO; return [x0, x0 + f.genislikKaro * KARO]; };
const kristalKonum = (f) => ({ x: 85 + (f.xKaro - 5) * KARO + f.genislikKaro * KARO * (0.15 + 0.7 * f.kristalX), y: katY(f.kat) - 38 });
const gucKonum = (f) => ({ x: 85 + (f.xKaro - 5) * KARO + f.genislikKaro * KARO * (0.15 + 0.7 * f.kristalX), y: katY(f.kat) - 40 });

function zipladi(o) {
  o.vy = zipla(o.vx); o.havada = true; o.coyote = 0; o.tampon = 0; zipSesi(o.vx); parcacikEkle(o.x, o.y, 6, '#ffffff', 2);
  o.donuyor = Math.abs(o.vy) >= TAKLA_HIZI; o.aci = 0;
  o.aciHiz = o.donuyor ? o.yon * 2 * Math.PI / (2.5 * Math.abs(o.vy)) : 0; // havada kalma süresi ≈ 2.5·|vy| kare: tam bir takla
}

export function adim(o, giris) {
  if (o.bitti) return;
  o.kare++; if (o.mesaj && o.mesaj.guc > 0) o.mesaj.guc--;
  if (o.sars > 0) o.sars--;
  if (o.hizlan > 0) o.hizlan--; if (o.rozet && --o.rozet.guc <= 0) o.rozet = null;
  if (o.saat > 0) o.saat--; if (o.miknatis > 0) o.miknatis--; if (o.komboPuls > 0) o.komboPuls--;
  if (o.kilPayi > 0) o.kilPayi--; if (o.kilPayiBekle > 0) o.kilPayiBekle--;
  let indi = false; // bu karede bir basamağa konuldu mu (kıl payı denetimi için)
  o.vx = yatayGuncelle(o.vx, giris.sol, giris.sag); if (Math.abs(o.vx) > 0.5) o.yon = o.vx > 0 ? 1 : -1;
  // zıplama tamponu: tuşa basış (yükselen kenar) kısa süre hatırlanır
  const basildi = !!giris.zipla && !o.oncekiZ; o.oncekiZ = !!giris.zipla;
  if (basildi) o.tampon = TAMPON; else if (o.tampon > 0) o.tampon--;
  if (o.coyote > 0 && o.havada) o.coyote--;
  const yerde = !o.havada, kenardaCoyote = o.havada && o.coyote > 0 && o.vy >= 0 && !o.donuyor;
  if ((yerde || kenardaCoyote) && (giris.zipla || o.tampon > 0)) zipladi(o);
  const eskiX = o.x;
  o.x += o.vx;
  ({ x: o.x, vx: o.vx } = duvarSekmesi(o.x, o.vx));
  const eskiY = o.y;
  if (o.havada) { o.vy = dikeyGuncelle(o.vy); o.y += o.vy; if (o.donuyor) o.aci += o.aciHiz; }
  // Yalnız düşerken platforma konulur. Yatay konum, geçiş anına doğrusal ara değerle (hızlı koşuda basamağı atlamasın) ve ±AYAK toleransla denetlenir.
  if (o.havada && o.vy >= 0) {
    for (let n = Math.max(0, Math.floor((ZEMIN_Y - o.y) / KAT_ARALIK) - 1); n <= Math.floor((ZEMIN_Y - eskiY) / KAT_ARALIK) + 1; n++) {
      const f = o.kat(n), py = katY(n), [kx0, kx1] = basamakAralik(f);
      if (o.kirik.has(n)) continue; // kırılan basamaktan geçilir
      const t = o.y > eskiY ? Math.min(1, Math.max(0, (py - eskiY) / (o.y - eskiY))) : 1, xk = eskiX + (o.x - eskiX) * t;
      const uzerinde = (x) => x >= kx0 - AYAK && x <= kx1 + AYAK;
      if (n === 0 ? true : (eskiY <= py && o.y >= py && (uzerinde(xk) || uzerinde(o.x)))) {
        if (n === 0 && o.y < py) continue;
        o.y = py; o.vy = 0; o.havada = false; o.donuyor = false; o.aci = 0; o.coyote = 0; indi = true;
        if (!giris.sol && !giris.sag) o.vx *= 0.8; // tutunma: yön tuşu yokken inişte hız hemen sönümlenir
        const fark = n - o.sonInisKat; o.sonInisKat = n; o.katNo = n;
        const yeniRekor = n > o.enYuksek; o.enYuksek = Math.max(o.enYuksek, n);
        if (yeniRekor && n % 50 === 0) o.rozet = { metin: 'KAT ' + n, guc: 110 };
        if (yeniRekor && (n === 100 || n === 200 || n === 500)) o.sars = 22; // büyük kilometre taşı: kısa ekran sarsıntısı
        if (yeniRekor && o.rekorKat > 0 && n === o.rekorKat + 1) o.rozet = { metin: 'YENİ KAT REKORU', guc: 110, olcek: 5 };
        if (fark >= 2) parcacikEkle(o.x, o.y, 10, '#ffd24a', 3);
        const od = inis(o.puan, fark); if (od) { o.mesaj = { ...od, guc: 60 }; odulSesi(od.toplam); o.enIyiKombo = Math.max(o.enIyiKombo, od.toplam); }
        if (f.tur === 'yay') { // yay basamak: otomatik yukarı fırlatır ve takla attırır
          o.vy = -YAY_HIZI; o.havada = true; o.donuyor = true; o.aci = 0; o.aciHiz = o.yon * 2 * Math.PI / (2.5 * YAY_HIZI); o.yaySayisi++;
          yaySesi(); parcacikEkle(o.x, o.y, 16, '#ff9a9a', 4);
        }
        break;
      }
    }
  }
  if (!o.havada && o.katNo > 0 && o.kat(o.katNo).tur === 'kirilgan') { // kırılgan basamakta durdukça sayaç artar, dolunca basamak kırılır
    if (o.sayacKat === o.katNo) o.sayac++; else { o.sayacKat = o.katNo; o.sayac = 1; }
    if (o.sayac >= KIRILMA) { o.kirik.add(o.katNo); o.havada = true; o.coyote = 0; kirmaSesi(); parcacikEkle(o.x, o.y, 22, '#cfeeff', 3.5); }
  } else if (!o.havada) { o.sayac = 0; o.sayacKat = -1; }
  if (!o.havada && o.katNo > 0) { // basamağın dışına tamamen çıktıysa düşer; coyote süresi boyunca hâlâ zıplayabilir
    const [kx0, kx1] = basamakAralik(o.kat(o.katNo));
    if (o.x < kx0 - AYAK || o.x > kx1 + AYAK) { o.havada = true; o.coyote = COYOTE; }
  }
  { const zip = o.puan.kombo ? o.puan.kombo.zip : 0; if (zip !== o.sonZip) { o.sonZip = zip; if (zip > 0) o.komboPuls = 18; } } // kombo yazısı her zıplamada büyür
  { const od = kare(o.puan); if (od) { o.mesaj = { ...od, guc: 60 }; odulSesi(od.toplam); o.enIyiKombo = Math.max(o.enIyiKombo, od.toplam); } }
  // Toplanabilirler: yakındaki katlarda yüzen kristaller (+25 puan) ve güç öğeleri
  const taban = Math.floor((ZEMIN_Y - o.y) / KAT_ARALIK), cekim = o.miknatis > 0 ? 150 : 0;
  for (let n = Math.max(1, taban - 1 - (cekim ? 1 : 0)); n <= taban + 2 + (cekim ? 1 : 0); n++) {
    const f = o.kat(n);
    if (f.kristal && !o.alinan.has(n)) {
      const p = kristalKonum(f);
      if ((Math.abs(o.x - p.x) < 26 + cekim && Math.abs((o.y - 30) - p.y) < 34 + cekim * 0.7)) { o.alinan.add(n); o.ek += KRISTAL_PUAN; kristalSesi(); parcacikEkle(p.x, p.y, 14, '#bff6ff', 3.5); }
    }
    if (f.guc && !o.alinanGuc.has(n)) {
      const p = gucKonum(f);
      if (Math.abs(o.x - p.x) < 28 && Math.abs((o.y - 30) - p.y) < 36) {
        o.alinanGuc.add(n); gucSesi(); parcacikEkle(p.x, p.y, 18, f.guc === 'saat' ? '#ffd24a' : '#ff7a7a', 4);
        if (f.guc === 'saat') o.saat = SAAT_SURE; else o.miknatis = MIKNATIS_SURE;
      }
    }
  }
  // Kamera: taban en yüksek kata göre yükselir (ve kayma başlayınca kendiliğinden); zıplama anında oyuncu üst kenara
  // yaklaşırsa kamera geçici olarak yukarı çıkar, inince tabana yumuşakça döner (tepe noktasına kilitlenmez).
  o.kamTaban = Math.min(o.kamTaban, katY(o.enYuksek) - 200);
  if (!o.kaymaBasladi && o.enYuksek >= 5) o.kaymaBasladi = true; // kat 5'ten sonra kayma başlar
  if (o.kaymaBasladi) {
    o.kayma = o.kare < SAAT ? 0.5 : Math.min(5, Math.floor(o.kare / SAAT)); o.kamTaban -= o.kayma * (o.saat > 0 ? 0.4 : 1); // saat: kayma yavaşlar
    if (o.kare % SAAT === 0) { o.hizlan = 110; hizSesi(); } // her 30 sn'de hızlanma uyarısı
  }
  const kamHedef = Math.min(o.kamTaban, o.y - 100);
  if (kamHedef < o.kamY) o.kamY = kamHedef; else o.kamY += Math.min(8, kamHedef - o.kamY);
  const ekranY = o.y - o.kamY;
  if (ekranY > H) { o.bitti = true; olumSesi(); return; }
  // Kıl payı: önceki karelerde tehlike bölgesine (ekran altına bir kattan az) girmiş oyuncu bir basamağa konunca bonus; bekleme süresi sık tekrarı önler.
  if (indi && o.tehlike) {
    o.tehlike = false;
    if (o.kilPayiBekle === 0) { o.ek += KIL_PAYI_PUAN; o.kilPayi = 70; o.kilPayiBekle = KIL_PAYI_BEKLE; o.kilPayiSayisi++; parcacikEkle(o.x, o.y, 12, '#5dff6a', 3); }
  }
  if (ekranY > KIL_PAYI_SINIR) o.tehlike = true;
}

export function skor(o) { return toplam(o.puan, o.enYuksek) + o.ek; }

export function ciz(c, o, hayalet = null) {
  const titre = Math.max(o.mesaj && o.mesaj.guc > 48 ? (o.mesaj.guc - 48) * 0.35 : 0, o.sars * 0.45) * AYAR.sarsinti; // büyük kombo ödülünde ve 100/200/500. katta kısa ekran sarsıntısı (azaltılmış harekette 0)
  c.save(); if (titre) c.translate((Math.random() - 0.5) * titre, (Math.random() - 0.5) * titre);
  arkaPlan(c, W, H, o.kamY, o.enYuksek, o.puan.kombo && o.puan.kombo.zip >= 5 ? 1 : 0); duvarlar(c, W, H, o.kamY, o.enYuksek); // akış hali: kombo x5+ (yalnız görünüm)
  const ilk = Math.max(0, Math.floor((ZEMIN_Y - (o.kamY + H)) / KAT_ARALIK) - 1), son = Math.ceil((ZEMIN_Y - o.kamY) / KAT_ARALIK) + 1;
  for (let n = ilk; n <= son; n++) {
    const f = o.kat(n), sy = katY(n) - o.kamY;
    if (n === 0) platform(c, 85, sy, 470, 0, true, 0);
    else if (!o.kirik.has(n)) platform(c, 85 + (f.xKaro - 5) * KARO, sy, f.genislikKaro * KARO, n, f.no, n, f.tur, o.sayacKat === n ? o.sayac / KIRILMA : 0);
    if (f.kristal && !o.alinan.has(n)) { const p = kristalKonum(f); kristalCiz(c, p.x, p.y - o.kamY, n); }
    if (f.guc && !o.alinanGuc.has(n)) { const p = gucKonum(f); gucCiz(c, p.x, p.y - o.kamY, f.guc, n); }
  }
  if (hayalet && !hayalet.bitti) { c.save(); c.globalAlpha = 0.42; karakterCiz(c, hayalet, true); c.restore(); }
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
function karakterCiz(c, o, hayaletMi = false) {
  const takim = resimler(KARAKTERLER[AYAR.karakter] || KARAKTERLER[0]), r = takim && takim[pozSec(o)], ters = o.yon < 0;
  const ayakY = o.y - o.kamY;
  if (!(r && r.complete && r.naturalWidth > 0)) { // yüklenemezse sade yedek
    c.fillStyle = '#ff7a3d'; c.beginPath(); c.roundRect ? c.roundRect(o.x - 12, ayakY - 40, 24, 40, 8) : c.rect(o.x - 12, ayakY - 40, 24, 40); c.fill(); return;
  }
  // squash & stretch: havada hıza göre uzar; hızlı koşuda hafif eğilir ve iz bırakır (iz rengi mağazadan); takla zıplamasında gövde döner
  const uzama = o.havada && !o.donuyor ? Math.max(-0.12, Math.min(0.14, -o.vy * 0.006)) : 0;
  const g = 48 * (1 - uzama * 0.6), y = 66 * (1 + uzama);
  if (!hayaletMi && (Math.abs(o.vx) > 8 || (o.havada && Math.abs(o.vy) > 14))) parcacikEkle(o.x, o.y - 24, 1, o.donuyor ? 'rgba(255,210,120,0.9)' : izRengi(o.kare), 0.6);
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
