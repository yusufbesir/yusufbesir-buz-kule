(() => {
"use strict";
// ---- ayar ----
// description: Buz Kule kullanıcı ayarları (parıltı, parçacık, sarsıntı, ses, karakter) ve azaltılmış hareket desteği. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
// Fizik ve oyun kuralları bu ayarlardan etkilenmez; yalnız görünüm ve ses.
const AZ = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const VARSAYILAN = Object.freeze({ parilti: 1, parcacik: AZ ? 0.25 : 1, sarsinti: AZ ? 0 : 1, ses: 0.8, karakter: 0, hud: 1, efektAcik: 1, muzikAcik: 0 }); // efektler açık, müzik kapalı başlar
const ARALIK = Object.freeze({ parilti: [0, 2], parcacik: [0, 2], sarsinti: [0, 2], ses: [0, 1], karakter: [0, 4], hud: [0, 1.5], efektAcik: [0, 1], muzikAcik: [0, 1] });
const KARAKTERLER = Object.freeze(['player', 'adventurer', 'female', 'soldier', 'zombie']);
const AYAR = { ...VARSAYILAN, azaltilmisHareket: AZ };
const ANAHTAR = 'buzkule.ayar';

function ayarYukle() {
  try {
    const k = JSON.parse(localStorage.getItem(ANAHTAR) || 'null');
    if (k) for (const a of Object.keys(VARSAYILAN)) if (typeof k[a] === 'number' && k[a] >= ARALIK[a][0] && k[a] <= ARALIK[a][1]) AYAR[a] = k[a];
  } catch { /* kayıt yoksa varsayılanlar */ }
}
function ayarKaydet() {
  try { localStorage.setItem(ANAHTAR, JSON.stringify(Object.fromEntries(Object.keys(VARSAYILAN).map(a => [a, AYAR[a]])))); } catch { /* sessiz */ }
}
function ayarSifirla() { Object.assign(AYAR, VARSAYILAN); ayarKaydet(); }

// ---- magaza ----
// description: Buz Kule kristal cüzdanı ve mağaza (iz renkleri); kalıcı kayıt. Oyun kurallarını etkilemez, yalnız görünüm. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
const IZLER = Object.freeze([
  { ad: 'Buz mavisi', renk: 'rgba(120,220,255,0.8)', fiyat: 0 },
  { ad: 'Altın', renk: 'rgba(255,210,120,0.9)', fiyat: 40 },
  { ad: 'Gül', renk: 'rgba(255,150,200,0.9)', fiyat: 90 },
  { ad: 'Zümrüt', renk: 'rgba(120,255,190,0.9)', fiyat: 160 },
  { ad: 'Gökkuşağı', renk: null, fiyat: 300 }, // renk zamanla değişir
]);
const CUZDAN_ANAHTAR = 'buzkule.cuzdan';
const CUZDAN = { kristal: 0, acik: [0], secili: 0, toplam: 0 };

function cuzdanYukle() {
  try {
    const k = JSON.parse(localStorage.getItem(CUZDAN_ANAHTAR) || 'null');
    if (k && Number.isFinite(k.kristal) && k.kristal >= 0) {
      CUZDAN.kristal = Math.floor(k.kristal); CUZDAN.toplam = Number.isFinite(k.toplam) ? Math.max(0, Math.floor(k.toplam)) : 0;
      CUZDAN.acik = Array.isArray(k.acik) ? k.acik.filter(i => Number.isInteger(i) && i >= 0 && i < IZLER.length) : [0];
      if (!CUZDAN.acik.includes(0)) CUZDAN.acik.push(0);
      CUZDAN.secili = CUZDAN.acik.includes(k.secili) ? k.secili : 0;
    }
  } catch { /* kayıt yoksa boş cüzdan */ }
}
function cuzdanKaydet() { try { localStorage.setItem(CUZDAN_ANAHTAR, JSON.stringify(CUZDAN)); } catch { /* sessiz */ } }
function kristalKazan(n) { if (n > 0) { CUZDAN.kristal += n; CUZDAN.toplam += n; cuzdanKaydet(); } }
// Satın alma: yeterli kristal varsa düşer ve açar; sonucu döndürür ('acik' zaten açıksa, 'yetersiz', 'alindi').
function izAl(i) {
  if (!IZLER[i]) return 'gecersiz';
  if (CUZDAN.acik.includes(i)) return 'acik';
  if (CUZDAN.kristal < IZLER[i].fiyat) return 'yetersiz';
  CUZDAN.kristal -= IZLER[i].fiyat; CUZDAN.acik.push(i); cuzdanKaydet(); return 'alindi';
}
function izSec(i) { if (CUZDAN.acik.includes(i)) { CUZDAN.secili = i; cuzdanKaydet(); return true; } return false; }
function izRengi(zaman) {
  const iz = IZLER[CUZDAN.secili] || IZLER[0];
  return iz.renk || 'hsla(' + (zaman * 6 % 360) + ',95%,70%,0.9)';
}

// ---- skorlar ----
// description: Buz Kule yerel skor tabloları: her oyun kipi (yeni, hayalet, günün kulesi) için ayrı ilk 5, kalıcı. Eski tek tablo "yeni" kipine devredilir. Oyun kurallarını etkilemez. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
const SKOR_SAYISI = 5;
const SKOR_ESKI_ANAHTAR = 'buzkule.skorlar'; // 0.10-0.14: tek tablo; artık "yeni" kipinin tablosu
const bugun = () => { const t = new Date(); return t.getFullYear() + '-' + (t.getMonth() + 1) + '-' + t.getDate(); };
const skorAnahtari = (mod) => (mod === 'hayalet' ? 'buzkule.skorlar.hayalet' : mod === 'gunun' ? 'buzkule.skorlar.gunun.' + bugun() : SKOR_ESKI_ANAHTAR);

const gecerli = (x) => x && Number.isFinite(x.skor) && x.skor > 0 && Number.isFinite(x.kat) && Number.isFinite(x.t);
// Kipin tablosunu okur (sıralı, en çok 5, geçersiz satırlar atılır); bozuk kayıtta boş tablo döner.
function skorListesi(mod) {
  try {
    const k = JSON.parse(localStorage.getItem(skorAnahtari(mod)) || '[]');
    return Array.isArray(k) ? k.filter(gecerli).sort((a, b) => b.skor - a.skor || a.t - b.t).slice(0, SKOR_SAYISI) : [];
  } catch { return []; }
}
// Skoru kipin tablosuna ekler; sırasını (1'den başlar) döndürür, ilk 5'e giremediyse 0. Sıfır skor eklenmez.
function skorEkle(mod, skor, kat) {
  if (!(skor > 0)) return 0;
  const kayit = { skor, kat, t: Date.now() }, liste = skorListesi(mod);
  liste.push(kayit); liste.sort((a, b) => b.skor - a.skor || a.t - b.t);
  const kesik = liste.slice(0, SKOR_SAYISI);
  try { localStorage.setItem(skorAnahtari(mod), JSON.stringify(kesik)); } catch { /* sessiz */ }
  return kesik.indexOf(kayit) + 1;
}

// ---- basarim ----
// description: Buz Kule başarımları (kalıcı); açılınca kristal ödülü verir. Oyun kurallarını değiştirmez. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)


const BASARIMLAR = Object.freeze([
  { id: 'kat10', ad: 'İlk basamaklar', acik: 'Kat 10\'a ulaş', odul: 5, sart: (o) => o.enYuksek >= 10 },
  { id: 'kat50', ad: 'Yarı yol', acik: 'Kat 50\'ye ulaş', odul: 20, sart: (o) => o.enYuksek >= 50 },
  { id: 'kat100', ad: 'Bulutların üstü', acik: 'Kat 100\'e ulaş', odul: 50, sart: (o) => o.enYuksek >= 100 },
  { id: 'kristal10', ad: 'Kristal avcısı', acik: 'Tek oyunda 10 kristal topla', odul: 15, sart: (o) => o.alinan.size >= 10 },
  { id: 'kombo20', ad: 'Zincirleme', acik: 'Tek kombo ile 20 kat çık', odul: 25, sart: (o) => o.enIyiKombo >= 20 },
  { id: 'yay3', ad: 'Fırlatıldım', acik: 'Tek oyunda 3 yaydan fırla', odul: 10, sart: (o) => o.yaySayisi >= 3 },
  { id: 'dayanikli', ad: 'Dayanıklı', acik: '2 dakika hayatta kal', odul: 15, sart: (o) => o.kare >= 6000 },
]);
const BASARIM_ANAHTAR = 'buzkule.basarim';
const ACIK = new Set();
const BILDIRIM = []; // ekrandaki bildirimler: { ad, odul, guc }

function basarimYukle() {
  try { const k = JSON.parse(localStorage.getItem(BASARIM_ANAHTAR) || '[]'); if (Array.isArray(k)) for (const id of k) if (BASARIMLAR.some(b => b.id === id)) ACIK.add(id); } catch { /* kayıt yoksa boş */ }
}
// Her karede çağrılır; yalnız kilitli başarımlara bakar. Yeni açılanların kimliklerini döndürür.
function basarimKontrol(o) {
  const yeni = [];
  for (const b of BASARIMLAR) {
    if (ACIK.has(b.id) || !b.sart(o)) continue;
    ACIK.add(b.id); yeni.push(b.id); kristalKazan(b.odul); basarimSesi(); BILDIRIM.push({ ad: b.ad, odul: b.odul, guc: 200 });
  }
  if (yeni.length) { try { localStorage.setItem(BASARIM_ANAHTAR, JSON.stringify([...ACIK])); } catch { /* sessiz */ } }
  return yeni;
}
const bildirimAdim = () => { for (let i = BILDIRIM.length - 1; i >= 0; i--) if (--BILDIRIM[i].guc <= 0) BILDIRIM.splice(i, 1); };

// ---- hayalet ----
// description: Buz Kule hayalet kaydı: tohumlu rastgelelik, giriş kaydı (kosu uzunluğu kodlu) ve kalıcı en iyi oyun kayıtları. Oyun kurallarını değiştirmez. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
const SOL = 1, SAG = 2, ZIPLA = 4;

// mulberry32: küçük, hızlı, tekrarlanabilir rastgele sayı üreteci
function tohumluRnd(tohum) {
  let a = tohum >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// Kat başına ayrı üreteç: katlar hangi sırayla görüntülenirse görüntülensin aynı kalır (oyuncu ve hayalet aynı kuleyi görür).
const katRnd = (tohum, n) => tohumluRnd(((tohum >>> 0) ^ Math.imul(n + 1, 0x9E3779B1)) >>> 0);
const yeniTohum = () => (Math.random() * 4294967296) >>> 0;
function gunlukTohum(tarih = new Date()) { // yerel tarihe göre günlük tohum
  const s = tarih.getFullYear() * 10000 + (tarih.getMonth() + 1) * 100 + tarih.getDate(); return (Math.imul(s, 2654435761) >>> 0) || 1;
}
const gunlukAnahtar = (tarih = new Date()) => 'buzkule.hayalet.' + tarih.getFullYear() + '-' + (tarih.getMonth() + 1) + '-' + tarih.getDate();

const girisBit = (g) => (g.sol ? SOL : 0) | (g.sag ? SAG : 0) | (g.zipla ? ZIPLA : 0);
const bitGiris = (b) => ({ sol: !!(b & SOL), sag: !!(b & SAG), zipla: !!(b & ZIPLA) });

// Kayıt: kare başına 3 bitlik giriş; art arda aynı değerler [değer, sayı] çiftleriyle sıkıştırılır.
function kayitBaslat() { return { kosu: [], son: -1, sayi: 0, kare: 0 }; }
function kayitEkle(k, g) {
  const b = girisBit(g); k.kare++;
  if (b === k.son) k.sayi++; else { if (k.sayi) k.kosu.push(k.son, k.sayi); k.son = b; k.sayi = 1; }
}
const KAYIT_SURUM = 1; // kayıt biçimi sürümü; v alanı olmayan eski kayıtlar sürüm 1 sayılır, bilinmeyen sürüm reddedilir
function kayitBitir(k, tohum, skor, kat) { const kosu = k.kosu.slice(); if (k.sayi) kosu.push(k.son, k.sayi); return { v: KAYIT_SURUM, tohum, kosu, skor, kat, kare: k.kare }; }
function kayitCoz(kayit) { // kare kare giriş bitleri dizisi
  const out = []; for (let i = 0; i + 1 < kayit.kosu.length; i += 2) for (let j = 0; j < kayit.kosu[i + 1]; j++) out.push(kayit.kosu[i]); return out;
}
function kayitGecerli(k) {
  return !!k && (k.v === undefined || k.v === KAYIT_SURUM) && Number.isFinite(k.tohum) && Number.isFinite(k.skor) && Number.isFinite(k.kat) && Array.isArray(k.kosu) && k.kosu.length % 2 === 0 && k.kosu.length < 40000
    && k.kosu.every((v, i) => Number.isInteger(v) && v >= 0 && (i % 2 === 0 ? v <= 7 : v >= 1 && v <= 200000)) // çift: giriş bitleri, tek: tekrar sayısı
    && k.kosu.reduce((t, v, i) => (i % 2 ? t + v : t), 0) <= 1000000; // toplam kare üst sınırı (bozuk kayıt belleği tüketmesin)
}
function kayitOku(anahtar) {
  try { const k = JSON.parse(localStorage.getItem(anahtar) || 'null'); return kayitGecerli(k) ? k : null; } catch { return null; }
}
function kayitYaz(anahtar, kayit) { try { localStorage.setItem(anahtar, JSON.stringify(kayit)); } catch { /* sessiz */ } }
const HAYALET_ANAHTAR = 'buzkule.hayalet';

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
  const kristal = kat > 0 && rnd() < 0.3, kristalX = rnd(); // toplanabilir kristal: katların ~%30'unda, basamağın üstünde yüzer
  // güç öğesi (kristalsiz katların ~%7'sinde): 'saat' kaymayı yavaşlatır, 'miknatis' yakındaki kristalleri çeker
  const gucZar = rnd(), guc = kat > 4 && !kristal && gucZar < 0.07 ? (gucZar < 0.035 ? 'saat' : 'miknatis') : null;
  // basamak türü (kat 15'ten sonra; numaralı ve tam genişlik katlar hep normal): 'kirilgan' basılınca kırılır, 'yay' yukarı fırlatır
  const turZar = rnd(), tur = kat >= 15 && kat % 10 !== 0 && w < SATIR_KARO ? (turZar < 0.08 ? 'kirilgan' : turZar < 0.14 ? 'yay' : 'normal') : 'normal';
  return { kat, y: -kat * KAT_ARALIK, xKaro: bas, genislikKaro: w, no: kat % 10 === 0, tema: Math.floor(kat / 100), kristal, kristalX, guc, tur };
}

const CEKIRDEK_B64 = "AGFzbQEAAAABGwVgAAF/YAF8AXxgAnx8AGACf38AYAN8f38BfAMHBgABAgMEAQUDAQABB14HBmJlbGxlawIADGNpa2lzX2FkcmVzaQAADmRpa2V5X2d1bmNlbGxlAAENZHV2YXJfc2VrbWVzaQACCGthdF91cmV0AAMOeWF0YXlfZ3VuY2VsbGUABAV6aXBsYQAFCrsLBggAQYCggIAACyYAIABEmpmZmZmZ6T+gIgBEZmZmZmZmKEAgAERmZmZmZmYoQGMbC3kBAXxEAAAAAABAVUAhAgJAAkACQCAARAAAAAAAQFVAYw0ARAAAAAAAWIFAIQIgAEQAAAAAAFiBQGQNASAAIQIMAgsgAUTNzMzMzMzsv6IhAQwBCyABRM3MzMzMzOy/oiEBC0EAIAE5A4iggIAAQQAgAjkDgKCAgAALpggFAn8BfAF+An8BfCABQTJwIQIgAUGx893xeWxBsfPd8XlqIABzIQMCQAJAAkACQCABRQ0AIAINAEEeIQJEAAAAAAAAFEAhBAwBC0QAAAAAAADwP0QAAAAAAADwP0QAAAAAAMByQCABuKFEAAAAAAAAPkCjRAAAAAAAAOA/oCIE/AciBbogBVAbIAREAAAAAAAAAABjGyADQfXzrekGaiIAQQ92IABzIABBAXJsIgJBB3YgAnMgAkE9cmwgAmogAnMiAkEOdiACc7hEAAAAAAAA8D2iovwHuvwDQQZqIQZBHiECQR4hBwJAIAFB5ABJDQBBAiEHIAFB8wNLDQBBBiABQf//A3FB5ABuayEHC0QAAAAAAAAUQCEEAkAgBiAHIAYgB0kbIgdBHkYNACADQern29J9aiIAQQ92IABzIABBAXJsIgNBB3YgA3MgA0E9cmwgA2ogA3MiA0EOdiADc7hEAAAAAAAA8D2iIAdBAiAHQQJLGyICQR9zuKL8B7r8A0EFarghBAsgAUUNASAAIQMLIANB9fOt6QZqIgBBD3YgAHMgAEEBcmwiA0EHdiADcyADQT1ybCADaiADcyIDQQ52IANzuEQAAAAAAADwPaJEMzMzMzMz0z9jIQMMAQtBACEDCwJAAkACQCABQQ5LDQAgASABQXZqIAFBCkkbIQcMAQsgAUEKcCIHRQ0AIAJBHUsNAEEAIAQ5A4iggIAAQQAgArg5A5CggIAAQQAgAbg5A4CggIAARAAAAAAAAAAAIQhEAAAAAAAA8D9EAAAAAAAAAEBEAAAAAAAAAAAgAEHf24m8BGoiAkEPdiACcyACQQFybCICQQd2IAJzIAJBPXJsIAJqIAJzIgJBDnYgAnO4RAAAAAAAAPA9oiIEROxRuB6F68E/YxsgBER7FK5H4Xq0P2MbIQQMAQtBACAEOQOIoICAAEEAIAK4OQOQoICAAEEAIAG4OQOAoICAAEQAAAAAAAAAACEERAAAAAAAAAAARAAAAAAAAPA/IAcbIQgLQQAgBDkDwKCAgABBACAIOQOYoICAAEEAIAFB5ABuuDkDoKCAgABBAEQAAAAAAADwP0QAAAAAAAAAACADQQFxIgIbOQOooICAAEEAIABB9fOt6QZqIgNBD3YgA3MgA0EBcmwiA0EHdiADcyADQT1ybCADaiADcyIDQQ52IANzuEQAAAAAAADwPaI5A7CggIAAQQBEAAAAAAAAAABEAAAAAAAAAABEAAAAAAAAAABEAAAAAAAA8D9EAAAAAAAAAEAgAEHq59vSfWoiAEEPdiAAcyAAQQFybCIAQQd2IABzIABBPXJsIABqIABzIgBBDnYgAHO4RAAAAAAAAPA9oiIEROxRuB6F66E/YxsgBETsUbgeheuxP2YbIAIbIAFBBUkbOQO4oICAAAuvAQEBfAJARAAAAAAAAPA/RAAAAAAAAAAAIAIbRAAAAAAAAPA/RAAAAAAAAAAAIAEboSIDRAAAAAAAAAAAYQ0AAkBEZmZmZmZmKEAgA0QzMzMzMzPTP6IgAERmZmZmZmbmP6IgACAAIAOiRAAAAAAAAAAAYxugIgAgAERmZmZmZmYoQGQbIgBEZmZmZmZmKMBjRQ0ARGZmZmZmZijAIQALIAAPCyAARM3MzMzMzOw/ogs2ACAAmiAAIABEAAAAAAAAAABjG0QAAAAAAAAAwKIiAERmZmZmZmYowCAARGZmZmZmZijAYxsL";
// ---- cekirdek ----
// description: Buz Kule Rust çekirdeği yükleyici (aşama 1: kat üretimi). core.wasm baytları birleştirilmiş betiğe base64 olarak gömülür (CEKIRDEK_B64, arac/birlestir.py); yüklenemezse ya da kendi kendine sınavda JS ile uyuşmazsa eski JS kat üretimi kullanılır. Sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı). Sözleşme: PLAN-buz-kule.md.



let cekirdekIc = null;
const GUC_AD = [null, 'saat', 'miknatis'], TUR_AD = ['normal', 'kirilgan', 'yay'];
const rustKat = (tohum, n) => {
  cekirdekIc.kat_uret(tohum >>> 0, n);
  const v = new Float64Array(cekirdekIc.bellek.buffer, cekirdekIc.cikis_adresi(), 9);
  return { kat: v[0], y: -v[0] * KAT_ARALIK, xKaro: v[1], genislikKaro: v[2], no: v[3] === 1, tema: v[4], kristal: v[5] === 1, kristalX: v[6], guc: GUC_AD[v[7]], tur: TUR_AD[v[8]] };
};
const ayni = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// Aşama 2: fizik. Rust çekirdeği varsa onunla, yoksa src/fizik.js ile (aynı sonuç).
const yatayGuncelleC = (vx, sol, sag) => (cekirdekIc ? cekirdekIc.yatay_guncelle(vx, sol ? 1 : 0, sag ? 1 : 0) : yatayGuncelle(vx, sol, sag));
const ziplaC = (vx) => (cekirdekIc ? cekirdekIc.zipla(vx) : zipla(vx));
const dikeyGuncelleC = (vy) => (cekirdekIc ? cekirdekIc.dikey_guncelle(vy) : dikeyGuncelle(vy));
function duvarSekmesiC(x, vx) {
  if (!cekirdekIc) return duvarSekmesi(x, vx);
  cekirdekIc.duvar_sekmesi(x, vx);
  const v = new Float64Array(cekirdekIc.bellek.buffer, cekirdekIc.cikis_adresi(), 2);
  return { x: v[0], vx: v[1] };
}
// Kendi kendine sınav (fizik): sabit tohumlu sahte rastgele girdilerle JS ile bit düzeyinde aynı olmalı.
function fizikSinav() {
  let s = 12345; const r = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 3000; i++) {
    const vx = (r() - 0.5) * 30, vy = (r() - 0.5) * 40, x = 60 + r() * 520, sol = r() < 0.4, sag = r() < 0.4;
    if (!Object.is(yatayGuncelleC(vx, sol, sag), yatayGuncelle(vx, sol, sag)) || !Object.is(ziplaC(vx), zipla(vx)) || !Object.is(dikeyGuncelleC(vy), dikeyGuncelle(vy))) return false;
    const a = duvarSekmesiC(x, vx), b = duvarSekmesi(x, vx);
    if (!Object.is(a.x, b.x) || !Object.is(a.vx, b.vx)) return false;
  }
  return true;
}

// Baytlardan çekirdeği kurar (küçük modül, eşzamanlı derlenir). Kendi kendine sınav: 8 tohum x 120 kat JS ile birebir aynı olmalı, değilse kapatılır.
function cekirdekYukle(b64) {
  cekirdekIc = null;
  try {
    const bayt = Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));
    cekirdekIc = new WebAssembly.Instance(new WebAssembly.Module(bayt), {}).exports;
    for (const t of [0, 1, 7, 42, 1234, 99999, 2147483647, 4294967295]) for (let n = 0; n < 120; n++)
      if (!ayni(rustKat(t, n), katUret(n, katRnd(t, n)))) throw new Error('çekirdek uyuşmazlığı');
    if (!fizikSinav()) throw new Error('fizik uyuşmazlığı');
  } catch { cekirdekIc = null; }
  return cekirdekIc !== null;
}
const cekirdekVar = () => cekirdekIc !== null;
// Tohumlu kat üretimi: Rust çekirdeği varsa onunla, yoksa JS ile (aynı sonuç).
const katUretTohum = (n, tohum) => (cekirdekIc ? rustKat(tohum, n) : katUret(n, katRnd(tohum, n)));

if (typeof CEKIRDEK_B64 !== 'undefined') cekirdekYukle(CEKIRDEK_B64);

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
  return { ad: odulAdi(k.toplam), toplam: k.toplam, zip: k.zip };
}
const toplam = (p, enYuksekKat) => enYuksekKat * 10 + p.bonus;

// ---- ses ----
// description: Buz Kule ses ve müzik: hazır CC0 dosyalarını (Kenney Digital Audio efektleri, SketchyLogic NES müziği; kaynak varlik/ses/KAYNAK.txt) HTMLAudio ile çalar. Efekt ve müzik ayrı açılıp kapanır; ses düzeyi ayar.js'den. Orijinal oyunun sesi yok. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)

const YOL = './varlik/ses/', MUZIK_SES = 0.32;
const kaynaklar = {}, havuzlar = {};
const HAVUZ = 3; // ad başına dönüşümlü Audio sayısı: aynı efekt üst üste çalabilir, her çalmada yeni nesne üretilmez
const ses_var = () => typeof Audio !== 'undefined';
const belge = () => (typeof document !== 'undefined' ? document : null);
function dosya(ad) { // ad uzantısız ve ".ogg"; uzantılıysa olduğu gibi
  if (!kaynaklar[ad]) { const a = new Audio(YOL + (ad.includes('.') ? ad : ad + '.ogg')); a.preload = 'auto'; kaynaklar[ad] = a; }
  return kaynaklar[ad];
}
function havuz(ad) { // ilk istekte kurulur; kopyalar yüklenmiş kaynağı paylaşır
  if (!havuzlar[ad]) { const t = dosya(ad); const liste = []; for (let i = 0; i < HAVUZ; i++) liste.push(typeof t.cloneNode === 'function' ? t.cloneNode() : new Audio(t.src)); havuzlar[ad] = { liste, i: 0 }; }
  return havuzlar[ad];
}
// Efekt çalar: efektler kapalıysa ya da ses düzeyi 0 ise hiçbir şey olmaz. Havuzdaki nesneler sırayla kullanılır.
function cal(ad, ses = 1) {
  if (!ses_var() || !AYAR.efektAcik || AYAR.ses <= 0) return;
  try {
    const h = havuz(ad), a = h.liste[h.i]; h.i = (h.i + 1) % h.liste.length;
    try { a.currentTime = 0; } catch { /* henüz yüklenmemiş olabilir */ }
    a.volume = Math.max(0, Math.min(1, AYAR.ses * ses)); const s = a.play(); if (s && s.catch) s.catch(() => {});
  } catch { /* ses yoksa oyun sessiz sürer */ }
}
const EFEKTLER = ['phaseJump1', 'phaseJump3', 'phaseJump5', 'powerUp5', 'powerUp8', 'lowDown', 'pepSound3', 'threeTone1', 'powerUp1', 'phaserUp3', 'lowRandom', 'kazanma.wav'];
function efektOnYukle() { // ilk kullanımı beklemeden açılışta yükler; Audio yoksa sessiz geçer
  if (!ses_var()) return;
  try { for (const ad of EFEKTLER) havuz(ad); } catch { /* ses yoksa oyun sessiz sürer */ }
}
efektOnYukle();
const zipSesi = (hiz) => cal(Math.abs(hiz) > 9 ? 'phaseJump5' : Math.abs(hiz) > 5 ? 'phaseJump3' : 'phaseJump1', 0.7);
const odulSesi = (toplamKat) => cal(toplamKat >= 25 ? 'powerUp8' : 'powerUp5', 0.9);
const olumSesi = () => cal('lowDown', 0.9);
const kristalSesi = () => cal('pepSound3', 0.8);
const hizSesi = () => cal('threeTone1', 0.8);
const gucSesi = () => cal('powerUp1', 0.8);
const yaySesi = () => cal('phaserUp3', 0.8);
const kirmaSesi = () => cal('lowRandom', 0.9);
const basarimSesi = () => cal('kazanma.wav', 0.7);

// Müzik: kısa döngülü bir parça; yalnız oyun sürerken çalar. Açık/kapalı ayardan (varsayılan kapalı), duraklatınca durur.
// Düzey AYAR.ses ile ölçeklenir (0 ise çalmaz). Autoplay reddedilirse ilk tuş/dokunuşta bir kez yeniden denenir; sekme gizlenince duraklar.
let muzik = null, istek = false, bekleyen = false;
const calmali = () => istek && !!AYAR.muzikAcik && AYAR.ses > 0 && !(belge() && belge().hidden);
function dene() {
  if (!muzik) return;
  const s = muzik.play();
  if (s && s.catch) s.catch(() => { if (!bekleyen) { bekleyen = true; kullaniciBekle(); } });
}
function kullaniciBekle() {
  const d = belge(); if (!d || !d.addEventListener) return;
  const tetik = () => { d.removeEventListener('pointerdown', tetik); d.removeEventListener('keydown', tetik); bekleyen = false; try { if (calmali() && muzik && muzik.paused) { const s = muzik.play(); if (s && s.catch) s.catch(() => {}); } } catch { /* sessiz */ } };
  d.addEventListener('pointerdown', tetik); d.addEventListener('keydown', tetik);
}
function muzikGuncelle(calsin, bastan = false) { // bastan: yeni oyun, parça başa sarılır
  if (!ses_var()) return;
  try {
    istek = !!calsin;
    if (!muzik) { muzik = new Audio(YOL + 'muzik.wav'); muzik.loop = true; }
    muzik.volume = Math.max(0, Math.min(1, MUZIK_SES * AYAR.ses));
    if (bastan) { try { muzik.currentTime = 0; } catch { /* yüklenmemiş olabilir */ } }
    if (calmali()) dene(); else muzik.pause();
  } catch { /* müzik yoksa oyun sessiz sürer */ }
}
const gorunurluk = belge();
if (gorunurluk && gorunurluk.addEventListener) gorunurluk.addEventListener('visibilitychange', () => {
  if (!muzik) return;
  try { if (calmali()) dene(); else muzik.pause(); } catch { /* sessiz */ }
});
const muzikCaliyor = () => !!muzik && !muzik.paused;

// ---- gorsel ----
// description: Buz Kule görsel katmanı: aurora gökyüzü, kristal siluetleri, taş duvarlar ve mesaleCizler, temaya göre detaylı basamaklar (buz, ametist, ahşap, yosunlu taş), kristal toplanabilirleri, parçacıklar, akış hali (kombo x5+: ton kayması ve kenar hız çizgileri; yalnız görünüm) (prosedürel vektör çizim; yüksek çözünürlükte keskin). sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)

const TEMALAR = [
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
const akisDegeri = () => akis;
const akisSifirla = () => { akis = 0; };

function arkaPlan(c, W, H, kamY, kat, akisHedef = 0) {
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

function duvarlar(c, W, H, kamY, kat) {
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

function platform(c, x, y, gen, kat, no, n, tur = 'normal', kirilma = 0) {
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
function kristalCiz(c, x, y, kat) {
  const t = tema(kat), sal = Math.sin(zaman * 0.08 + x) * 3, cy = y + sal;
  c.save(); c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, cy, 1, x, cy, 24 * Math.min(1.5, AYAR.parilti + 0.2)); g.addColorStop(0, t.plat + 'aa'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - 30, cy - 30, 60, 60);
  c.restore();
  c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(x, cy - 12); c.lineTo(x + 8, cy); c.lineTo(x, cy + 12); c.lineTo(x - 8, cy); c.closePath(); c.fill();
  c.fillStyle = t.plat; c.beginPath(); c.moveTo(x, cy - 12); c.lineTo(x + 8, cy); c.lineTo(x, cy + 2); c.closePath(); c.fill();
  c.fillStyle = karisim(t.koyu, 0.1); c.beginPath(); c.moveTo(x, cy + 12); c.lineTo(x - 8, cy); c.lineTo(x, cy + 2); c.closePath(); c.fill();
}

// Güç öğeleri: 'saat' (alarm saati, kaymayı yavaşlatır) ve 'miknatis' (at nalı mıknatıs, kristalleri çeker).
function gucCiz(c, x, y, tur, kat) {
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

// Kombo kapanış uçuşu (yalnız görünüm): kombo bitince biriken bonusu temsil eden parçacıklar ekran uzayında (kameradan bağımsız)
// önce dışa saçılır, sonra eğri bir yolla skor alanına uçar. Sayı AYAR.parcacik ile ölçeklenir; azaltılmış harekette hiç üretilmez.
// Oyun durumunu okumaz ve değiştirmez; hud.js tetikler ve çizer.
const kapanisPar = [];
const KAPANIS_OMUR = 34; // bir parçacığın uçuş süresi (çizim karesi)
function kapanisEkle(x0, y0, x1, y1, adet, renk) {
  if (AYAR.azaltilmisHareket) return 0;
  const say = Math.round(adet * AYAR.parcacik);
  for (let i = 0; i < say; i++) {
    const a = Math.random() * Math.PI * 2, r = 40 + Math.random() * 70; // kontrol noktası dışarıda: saçıl, sonra topla
    kapanisPar.push({ x0, y0, cx: x0 + Math.cos(a) * r, cy: y0 + Math.sin(a) * r - 20, x1, y1, t: -Math.random() * 0.35, renk, boy: 2 + Math.random() * 2.5 });
  }
  return say;
}
function kapanisAdim() { // bir çizim karesi ilerletir; kalan parçacık sayısını döner
  for (let i = kapanisPar.length - 1; i >= 0; i--) { const p = kapanisPar[i]; p.t += 1 / KAPANIS_OMUR; if (p.t >= 1) kapanisPar.splice(i, 1); }
  return kapanisPar.length;
}
const kapanisSay = () => kapanisPar.length;
const kapanisSifirla = () => { kapanisPar.length = 0; };
function kapanisNokta(p, t) { // yumuşatılmış kuadratik Bezier: (x0,y0) → (cx,cy) → (x1,y1)
  const u = Math.max(0, Math.min(1, t)), s = u * u * (3 - 2 * u), v = 1 - s;
  return { x: v * v * p.x0 + 2 * v * s * p.cx + s * s * p.x1, y: v * v * p.y0 + 2 * v * s * p.cy + s * s * p.y1 };
}
function kapanisCiz(c) {
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

// ---- oyun ----
// description: Oyun döngüsü, fizik hissi (kenar toleransı, coyote süresi, zıplama tamponu), kamera, takla, kristaller, güç öğeleri ve çizim (özgün kod). sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)









const W = 640, H = 480, SAAT = 1500; // 30 sn @ 50 kare/sn
const ZEMIN_Y = 440, KRISTAL_PUAN = 25, TAKLA_HIZI = 16; // |ilk dikey hız| >= 16: en az 2 kat yükselen zıplama takla atar
// Oyun hissi (platformer pratikleri): basamağa tutunma ve affedici giriş
const AYAK = 10;     // ayak yarı genişliği: basamak kenarından bu kadar taşan ayak hâlâ basamağa basar
const COYOTE = 6;           // basamaktan yürüyerek çıktıktan sonra hâlâ zıplayabilme süresi (kare)
const TAMPON = 7;           // inişten hemen önce basılan zıplama tuşu bu kadar kare hatırlanır
const SAAT_SURE = 480, MIKNATIS_SURE = 500; // güç öğesi süreleri (kare)
const KIRILMA = 30;         // kırılgan basamak: üstünde bu kadar kare durulursa kırılır (0,6 sn)
const YAY_HIZI = 27;        // yay basamak: inişte yukarı fırlatma hızı (normal zıplamanın en fazla 24,4 hızından yüksek, ~6 kat)
// "Kıl payı" bonusu: oyuncu ekran altına bir kattan az yaklaşıp (düşme sınırı H) sonra bir basamağa konarsa küçük sabit puan.
// Yalnız oyun durumuna bağlıdır (rastgelelik yok): hayalet/günlük kule tekrarlanabilirliği korunur. Fizik ve kat üretimi değişmez.
const KIL_PAYI_PUAN = 25, KIL_PAYI_BEKLE = 300; // bonus puanı; iki bonus arası en az bekleme (kare, 6 sn)
const KIL_PAYI_SINIR = H - KAT_ARALIK;                  // ekranda bu çizginin altı tehlike bölgesi

// rnd bir sayıysa tohumdur: kat n her zaman aynı (katRnd), böylece aynı tohum + aynı girişler = aynı oyun (hayalet, günlük kule).
// rnd bir fonksiyonsa eski davranış (testler): ardışık çağrılarla üretilir.
function yeniOyun(rnd = Math.random) {
  const tohum = typeof rnd === 'number' ? rnd >>> 0 : null, katlar = new Map();
  const kat = (n) => (katlar.has(n) || katlar.set(n, tohum === null ? katUret(n, rnd) : katUretTohum(n, tohum)), katlar.get(n));
  return {
    rnd, tohum, kat, x: 320, y: ZEMIN_Y, vx: 0, vy: 0, yon: 1, havada: false, katNo: 0, enYuksek: 0, kamY: 0, kamTaban: 0, kayma: 0, kaymaBasladi: false,
    kare: 0, puan: yeniPuan(), mesaj: null, bitti: false, sonInisKat: 0,
    aci: 0, aciHiz: 0, donuyor: false, alinan: new Set(), alinanGuc: new Set(), ek: 0, hizlan: 0, rozet: null,
    coyote: 0, tampon: 0, oncekiZ: false, saat: 0, miknatis: 0,
    kirik: new Set(), sayac: 0, sayacKat: -1, yaySayisi: 0, enIyiKombo: 0, // kırık basamaklar, kırılma sayacı, başarım sayaçları
    px: 320, py: ZEMIN_Y, pk: 0, // önceki adım konumu (çizim ara değeri)
    sars: 0, rekorKat: 0, // kilometre taşı sarsıntısı süresi; önceki en iyi kat (arayuz.js yazar, yalnız görünüm)
    sonZip: 0, komboPuls: 0, // kombo yazısı: son görülen kombo zıplama sayısı ve büyüme vurgusu süresi (yalnız görünüm)
    tehlike: false, kilPayi: 0, kilPayiBekle: 0, kilPayiSayisi: 0, // kıl payı: tehlike bölgesine girildi mi, yazı süresi, bekleme süresi, verilen bonus sayısı
  };
}

// y ekranda aşağı artar; kat n platformunun dünya y'si = ZEMIN_Y - n*KAT_ARALIK
const katY = (n) => ZEMIN_Y - n * KAT_ARALIK;
const basamakAralik = (f) => { const x0 = 85 + (f.xKaro - 5) * KARO; return [x0, x0 + f.genislikKaro * KARO]; };
const kristalKonum = (f) => ({ x: 85 + (f.xKaro - 5) * KARO + f.genislikKaro * KARO * (0.15 + 0.7 * f.kristalX), y: katY(f.kat) - 38 });
const gucKonum = (f) => ({ x: 85 + (f.xKaro - 5) * KARO + f.genislikKaro * KARO * (0.15 + 0.7 * f.kristalX), y: katY(f.kat) - 40 });

function zipladi(o) {
  o.vy = ziplaC(o.vx); o.havada = true; o.coyote = 0; o.tampon = 0; zipSesi(o.vx); parcacikEkle(o.x, o.y, 6, '#ffffff', 2);
  o.donuyor = Math.abs(o.vy) >= TAKLA_HIZI; o.aci = 0;
  o.aciHiz = o.donuyor ? o.yon * 2 * Math.PI / (2.5 * Math.abs(o.vy)) : 0; // havada kalma süresi ≈ 2.5·|vy| kare: tam bir takla
}

// Buz kıymığı (yalnız görünüm): açık mavi/beyaz parçacıklar; durumu okumaz/değiştirmez, azaltılmış harekette üretilmez.
function buzKirigi(x, y, adet) {
  if (AYAR.azaltilmisHareket) return;
  parcacikEkle(x, y, adet, '#e8f8ff', 2.2); parcacikEkle(x, y, adet, '#8fd0ff', 2.8);
}
// Her 100. katta kule tabelası metni (yalnız görünüm); diğer katlarda null.
const katTabelasi = (n) => (n > 0 && n % 100 === 0 ? 'KAT ' + n : null);

const KAM_YUMUSAK = 0.22; // yukarı kamera yaklaşma oranı (kare başına)

function adim(o, giris) {
  if (o.bitti) return;
  o.px = o.x; o.py = o.y; o.pk = o.kamY; // önceki kare konumu: çizimde ara değer için (simülasyonu etkilemez)
  o.kare++; if (o.mesaj && o.mesaj.guc > 0) o.mesaj.guc--;
  if (o.sars > 0) o.sars--;
  if (o.hizlan > 0) o.hizlan--; if (o.rozet && --o.rozet.guc <= 0) o.rozet = null;
  if (o.saat > 0) o.saat--; if (o.miknatis > 0) o.miknatis--; if (o.komboPuls > 0) o.komboPuls--;
  if (o.kilPayi > 0) o.kilPayi--; if (o.kilPayiBekle > 0) o.kilPayiBekle--;
  let indi = false; // bu karede bir basamağa konuldu mu (kıl payı denetimi için)
  o.vx = yatayGuncelleC(o.vx, giris.sol, giris.sag); if (Math.abs(o.vx) > 0.5) o.yon = o.vx > 0 ? 1 : -1;
  // zıplama tamponu: tuşa basış (yükselen kenar) kısa süre hatırlanır
  const basildi = !!giris.zipla && !o.oncekiZ; o.oncekiZ = !!giris.zipla;
  if (basildi) o.tampon = TAMPON; else if (o.tampon > 0) o.tampon--;
  if (o.coyote > 0 && o.havada) o.coyote--;
  const yerde = !o.havada, kenardaCoyote = o.havada && o.coyote > 0 && o.vy >= 0 && !o.donuyor;
  if ((yerde || kenardaCoyote) && (giris.zipla || o.tampon > 0)) zipladi(o);
  const eskiX = o.x;
  o.x += o.vx;
  const vxOnce = o.vx;
  ({ x: o.x, vx: o.vx } = duvarSekmesiC(o.x, o.vx));
  if (vxOnce !== 0 && Math.sign(o.vx) !== Math.sign(vxOnce)) buzKirigi(o.x, o.y - 24, 5); // duvar sekmesi
  const eskiY = o.y;
  if (o.havada) { o.vy = dikeyGuncelleC(o.vy); o.y += o.vy; if (o.donuyor) o.aci += o.aciHiz; }
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
        buzKirigi(o.x, o.y, 4); // iniş
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
    if (o.kare % SAAT === 0 && o.kare <= 5 * SAAT) { o.hizlan = 110; hizSesi(); } // her 30 sn'de hızlanma uyarısı
  }
  // Yukarı çıkarken kamera hedefe yumuşakça (üstel) yaklaşır; yükselen oyuncunun biraz önüne bakar (gecikme birikmesin). Aşağı dönüş eskisi gibi sınırlı hızda.
  const kamHedef = Math.min(o.kamTaban, o.y - 100 + (o.vy < 0 ? o.vy * 2.5 : 0));
  if (kamHedef < o.kamY) o.kamY += (kamHedef - o.kamY) * KAM_YUMUSAK; else o.kamY += Math.min(8, kamHedef - o.kamY);
  const ekranY = o.y - o.kamY;
  if (ekranY > H) { o.bitti = true; olumSesi(); return; }
  // Kıl payı: önceki karelerde tehlike bölgesine (ekran altına bir kattan az) girmiş oyuncu bir basamağa konunca bonus; bekleme süresi sık tekrarı önler.
  if (indi && o.tehlike) {
    o.tehlike = false;
    if (o.kilPayiBekle === 0) { o.ek += KIL_PAYI_PUAN; o.kilPayi = 70; o.kilPayiBekle = KIL_PAYI_BEKLE; o.kilPayiSayisi++; parcacikEkle(o.x, o.y, 12, '#5dff6a', 3); }
  }
  if (ekranY > KIL_PAYI_SINIR) o.tehlike = true;
}

function skor(o) { return toplam(o.puan, o.enYuksek) + o.ek; }

function ciz(c, o, hayalet = null) {
  const titre = Math.max(o.mesaj && o.mesaj.guc > 48 ? (o.mesaj.guc - 48) * 0.35 : 0, o.sars * 0.45) * AYAR.sarsinti; // büyük kombo ödülünde ve 100/200/500. katta kısa ekran sarsıntısı (azaltılmış harekette 0)
  c.save(); if (titre) c.translate((Math.random() - 0.5) * titre, (Math.random() - 0.5) * titre);
  arkaPlan(c, W, H, o.kamY, o.enYuksek, o.puan.kombo && o.puan.kombo.zip >= 5 ? 1 : 0); duvarlar(c, W, H, o.kamY, o.enYuksek); // akış hali: kombo x5+ (yalnız görünüm)
  const ilk = Math.max(0, Math.floor((ZEMIN_Y - (o.kamY + H)) / KAT_ARALIK) - 1), son = Math.ceil((ZEMIN_Y - o.kamY) / KAT_ARALIK) + 1;
  for (let n = ilk; n <= son; n++) {
    const f = o.kat(n), sy = katY(n) - o.kamY;
    if (n === 0) platform(c, 85, sy, 470, 0, true, 0);
    else if (!o.kirik.has(n)) platform(c, 85 + (f.xKaro - 5) * KARO, sy, f.genislikKaro * KARO, n, f.no, n, f.tur, o.sayacKat === n ? o.sayac / KIRILMA : 0);
    const tab = katTabelasi(n);
    if (tab) pikselYaz(c, tab, 85 + (f.xKaro - 5) * KARO - 8, sy - 8, 2, '#dff6ff', { hiza: 'sag', golge: 'rgba(0,0,0,0.85)' });
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

// ---- piksel ----
// description: Buz Kule arcade HUD için 5x7 piksel yazı tipi (kendi çizimim, yazı tipi dosyası gerekmez). Türkçe harfler en yakın Latin harfine eşlenir. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
const G = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'], B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'], D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'], F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'], H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'], J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'], L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'], N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'], P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'], R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'], T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'], V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'], X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'], Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  0: ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'], 1: ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'], 3: ['.###.', '#...#', '....#', '..##.', '....#', '#...#', '.###.'],
  4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'], 5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  6: ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'], 7: ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'], 9: ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
  '-': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'], '.': ['.....', '.....', '.....', '.....', '.....', '.##..', '.##..'],
  ':': ['.....', '.##..', '.##..', '.....', '.##..', '.##..', '.....'], '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
  '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'], '/': ['....#', '....#', '...#.', '..#..', '.#...', '#....', '#....'],
  '*': ['.....', '#.#.#', '.###.', '#####', '.###.', '#.#.#', '.....'], ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
};
const TR = { İ: 'I', I: 'I', Ğ: 'G', Ü: 'U', Ş: 'S', Ö: 'O', Ç: 'C' };
const harf = (ch) => { const b = ch.toLocaleUpperCase('tr'); return G[TR[b] || b] || G[' ']; };
const pikselGenislik = (metin, olcek) => Math.max(0, [...metin].length * 6 * olcek - olcek);

// Önbellek: metin+ölçek+renk+kontur+gölge anahtarıyla bir kez çizilip drawImage ile basılır (en çok PBOY giriş, LRU). Düzgün ölçekli olmayan dönüşümde (döndürme/eğme), yarı saydamlık kat çakışması varsa veya tuval yoksa eski yola düşer.
const PBOY = 64, onbellek = new Map();
let tuvalYap = (w, h) => (typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(w, h) : typeof document !== 'undefined' && document.createElement ? Object.assign(document.createElement('canvas'), { width: w, height: h }) : null);
const pikselOnbellekAyarla = (fabrika) => { tuvalYap = fabrika; onbellek.clear(); };
const pikselOnbellekBoyut = () => onbellek.size;
const SAYDAM = /a\(|^#(?:[\da-f]{4}|[\da-f]{8})$/i;
function katlar(metin, olcek, renk, secenek) {
  const k = []; const a = Math.max(1, olcek / 2);
  if (secenek.cizgi) for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1], [-1, 0], [1, 0]]) k.push([dx * a, dy * a, secenek.cizgi]);
  if (secenek.golge) k.push([olcek, olcek, secenek.golge]);
  k.push([0, 0, renk]); return k;
}
function hucreCiz(c, metin, olcek, ox, oy, katList) {
  for (const [dx, dy, r] of katList) {
    c.fillStyle = r; let cx = ox + dx;
    for (const ch of metin) { const g = harf(ch); for (let sat = 0; sat < 7; sat++) for (let sut = 0; sut < 5; sut++) if (g[sat][sut] === '#') c.fillRect(cx + sut * olcek, oy + dy + sat * olcek, olcek, olcek); cx += 6 * olcek; }
  }
}
// m: düzgün ölçekli dönüşüm. Bitmap aygıt pikselinde (ölçek*mantıksal) çizilir; aygıt kaymasının kesri 1/8'e yuvarlanıp anahtara girer, tam sayı kısmına drawImage ile (kimlik dönüşümüyle, yeniden örnekleme yok) basılır.
function onbellekten(metin, olcek, renk, secenek, w, s, fx, fy) {
  const anahtar = [metin, olcek, renk, secenek.cizgi || '', secenek.golge || '', Math.round(s * 1e4), fx, fy].join('\u0001');
  let g = onbellek.get(anahtar);
  if (g) { onbellek.delete(anahtar); onbellek.set(anahtar, g); return g; }
  const pad = Math.ceil(Math.max(1, olcek / 2) + olcek) + 1, bw = Math.ceil((Math.ceil(w) + pad * 2) * s) + 2, bh = Math.ceil((7 * olcek + pad * 2) * s) + 2;
  if (bw > 2048 || bh > 1024) return null;
  const t = tuvalYap(bw, bh), tc = t && t.getContext && t.getContext('2d');
  if (!tc || typeof tc.setTransform !== 'function') return null;
  tc.setTransform(s, 0, 0, s, fx / 8, fy / 8);
  hucreCiz(tc, metin, olcek, pad, pad, katlar(metin, olcek, renk, secenek));
  g = { t, pad }; onbellek.set(anahtar, g);
  if (onbellek.size > PBOY) onbellek.delete(onbellek.keys().next().value);
  return g;
}
// Dönüşüm düzgün ölçekli (a==d>0, b==c==0), kat çakışması varken tam opaklık: aksi halde null (eski yol).
function uygun(c, renk, secenek) {
  if (typeof c.drawImage !== 'function' || typeof c.getTransform !== 'function' || typeof c.setTransform !== 'function' || typeof c.save !== 'function') return null;
  const m = c.getTransform(); if (!m || !(m.a > 0) || Math.abs(m.a - m.d) > 1e-6 || Math.abs(m.b) > 1e-6 || Math.abs(m.c) > 1e-6) return null;
  if (c.globalCompositeOperation && c.globalCompositeOperation !== 'source-over') return null;
  if (c.globalAlpha !== 1 && (secenek.cizgi || secenek.golge)) return null;
  return SAYDAM.test(renk) ? null : m;
}

// Piksel yazı çizer. secenek: { hiza: 'sol'|'orta'|'sag', golge: renk, cizgi: renk }. Her harf 5x7 hücre, hücre = olcek piksel.
function pikselYaz(c, metin, x, y, olcek, renk, secenek = {}) {
  const w = pikselGenislik(metin, olcek), x0 = Math.round(secenek.hiza === 'orta' ? x - w / 2 : secenek.hiza === 'sag' ? x - w : x), y0 = Math.round(y);
  const m = w > 0 && typeof renk === 'string' ? uygun(c, renk, secenek) : null;
  if (m) {
    const pad = Math.ceil(Math.max(1, olcek / 2) + olcek) + 1, dx = m.a * (x0 - pad) + m.e, dy = m.a * (y0 - pad) + m.f, ix = Math.floor(dx), iy = Math.floor(dy);
    const g = onbellekten(metin, olcek, renk, secenek, w, m.a, Math.round((dx - ix) * 8), Math.round((dy - iy) * 8));
    if (g) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(g.t, ix, iy); c.restore(); return w; }
  }
  hucreCiz(c, metin, olcek, x0, y0, katlar(metin, olcek, renk, secenek));
  return w;
}

// ---- hud ----
// description: Buz Kule oyun içi HUD: klasik arcade makinesi görünümü (piksel yazı, neon çerçeve, parçalı çubuklar, yanıp sönen uyarılar); oyuncu üst kenara yaklaşınca solar. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
// Menü, duraklatma ve bitiş ekranları HTML katmanındadır (index.html + arayuz.js); burada yalnız canvas HUD'u var.
// Kombo kapanış patlaması (yalnız görünüm): yeni bir kombo ödülü mesajı görülünce kombo renginde ışınlar ve parçacıklar saçılır,
// "+N" etiketi skor alanına uçar, varınca skor kısa süre beyaz yanar. Azaltılmış harekette uçuş yok, yalnız skor vurgusu. Simülasyona dokunmaz.





const ARKA = 'rgba(8,6,28,0.78)', NEON1 = '#ff3df2', NEON2 = '#2de6ff', SARI = '#ffd62e', KIRMIZI = '#ff4d4d', YESIL = '#5dff6a', BEYAZ = '#ffffff', SOLUK = '#9aa6d6';
const sifirli = (n, adet) => String(Math.max(0, Math.floor(n))).padStart(adet, '0');

// Arcade paneli: koyu zemin, çift çizgili neon çerçeve, kesik köşeler ve ince tarama çizgileri.
function panelArcade(c, x, y, g, h, renk = NEON2) {
  c.fillStyle = ARKA; c.fillRect(x, y, g, h);
  c.fillStyle = 'rgba(255,255,255,0.045)'; for (let i = 2; i < h; i += 4) c.fillRect(x, y + i, g, 1);       // tarama çizgileri
  c.fillStyle = renk; c.fillRect(x, y, g, 2); c.fillRect(x, y + h - 2, g, 2); c.fillRect(x, y, 2, h); c.fillRect(x + g - 2, y, 2, h);
  c.fillStyle = 'rgba(0,0,0,0.9)'; c.fillRect(x, y, 2, 2); c.fillRect(x + g - 2, y, 2, 2); c.fillRect(x, y + h - 2, 2, 2); c.fillRect(x + g - 2, y + h - 2, 2, 2); // kesik köşeler
  c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(x + 2, y + 2, g - 4, 1);
}
// Parçalı (segmentli) çubuk: dolu segmentler renkli, boşlar sönük.
function parcaliCubuk(c, x, y, seg, doluSay, genislik, yukseklik, aralik, renkFn, dikey = false) {
  for (let i = 0; i < seg; i++) {
    const dolu = i < doluSay, px = dikey ? x : x + i * (genislik + aralik), py = dikey ? y - i * (yukseklik + aralik) : y;
    c.fillStyle = dolu ? renkFn(i, seg) : 'rgba(255,255,255,0.12)'; c.fillRect(px, py, genislik, yukseklik);
    if (dolu) { c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(px, py, genislik, 1); }
  }
}
const yesilKirmizi = (i, seg) => (i < seg * 0.5 ? YESIL : i < seg * 0.8 ? SARI : KIRMIZI);
const vur = (c, yazi, x, y, olcek, renk, hiza = 'sol') => pikselYaz(c, yazi, x, y, olcek, renk, { hiza, golge: 'rgba(0,0,0,0.85)' });
const pikselKristal = (c, x, y, s = 2) => { // 7x9 hücrelik elmas
  const satir = ['..#..', '.###.', '#####', '#####', '.###.', '..#..']; c.fillStyle = '#bff6ff';
  satir.forEach((r, j) => [...r].forEach((h, i) => { if (h === '#') { c.fillStyle = i < 2 && j > 1 ? '#7B5CC4' : j < 2 ? '#e8fbff' : '#8de8ff'; c.fillRect(x + i * s, y + j * s, s, s); } }));
};

// ---- Kombo kapanış patlaması durumu (HUD'a özel, çizim karesiyle ilerler) ----
let sonKapanis = null, kapanisEtiket = null, skorVurgu = 0;
const komboRengi = (zip) => (zip >= 6 ? NEON1 : zip >= 4 ? NEON2 : SARI); // kombo yazısıyla aynı renk basamakları
const kapanisGorunum = () => ({ etiket: !!kapanisEtiket, vurgu: skorVurgu }); // testler için
function kapanisBaslat(m) {
  const renk = komboRengi(m.zip), x0 = W / 2, y0 = 186, x1 = 100 + pikselGenislik('0000000', 2) / 2, y1 = 27; // kaynak: "KOMBO BITTI" satırı; hedef: skor sayısı
  if (AYAR.azaltilmisHareket) { skorVurgu = 14; return; }
  kapanisEkle(x0, y0, x1, y1, 16, renk);
  kapanisEtiket = { metin: '+' + m.toplam * m.toplam, renk, t: 0, isin: 12, p: { x0, y0, cx: x0 + 40, cy: y0 - 90, x1, y1 } };
}
function kapanisCizHud(c) {
  kapanisCiz(c);
  const e = kapanisEtiket; if (!e) return;
  e.t += 1 / 40;
  if (e.isin > 0 && AYAR.parilti > 0.05) { // kaynaktan dışa açılan kısa ışınlar
    const k = e.isin / 12; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, AYAR.parilti) * 0.7 * k; c.strokeStyle = e.renk; c.lineWidth = 2;
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + 0.3, r0 = (1 - k) * 60 + 10, r1 = r0 + 26 + 30 * (1 - k); c.beginPath(); c.moveTo(e.p.x0 + Math.cos(a) * r0, e.p.y0 + Math.sin(a) * r0); c.lineTo(e.p.x0 + Math.cos(a) * r1, e.p.y0 + Math.sin(a) * r1); c.stroke(); }
    c.restore(); e.isin--;
  }
  if (e.t >= 1) { kapanisEtiket = null; skorVurgu = 14; return; } // vardı: skor yanar
  const n = kapanisNokta(e.p, e.t); c.save(); c.globalAlpha = e.t > 0.85 ? (1 - e.t) / 0.15 : 1;
  pikselYaz(c, e.metin, n.x, n.y, 2, e.renk, { hiza: 'orta', golge: 'rgba(0,0,0,0.85)' }); c.restore();
}

function hudCiz(c, o, en, hayalet = null) {
  const kare = o.kare, yanip = (Math.floor(kare / 12) % 2) === 0;
  if (o.mesaj !== sonKapanis) { sonKapanis = o.mesaj; if (o.mesaj && o.mesaj.zip) kapanisBaslat(o.mesaj); } // her kombo kapanışında bir kez
  if (skorVurgu > 0) skorVurgu--;
  // Oyuncu ekranın üst kısmındayken (yukarı zıplama) ana şerit neredeyse görünmez olur, görüşü kapatmaz.
  const ekranY = o.y - o.kamY, gorunur = Math.max(0.14, Math.min(1, (ekranY - 70) / 150)) * Math.min(1.1, AYAR.hud);
  if (AYAR.hud > 0.02) {
    c.save(); c.globalAlpha = Math.min(1, gorunur);
    // ana şerit: SKOR | REKOR | KAT
    panelArcade(c, 92, 6, 456, 34, NEON1);
    vur(c, '1UP', 100, 10, 1, yanip ? KIRMIZI : '#7a2b2b'); vur(c, sifirli(skor(o), 7), 100, 20, 2, skorVurgu > 0 ? BEYAZ : SARI);
    vur(c, 'REKOR', 320, 10, 1, SOLUK, 'orta'); vur(c, sifirli(Math.max(en, skor(o)), 7), 320, 20, 2, NEON2, 'orta');
    vur(c, 'KAT', 540, 10, 1, SOLUK, 'sag'); vur(c, sifirli(o.enYuksek, 3), 540, 20, 2, YESIL, 'sag');
    // ikinci satır: kristal sayacı, hayalet, güç öğeleri
    let sx = 94;
    pikselKristal(c, sx, 45, 2); vur(c, 'X' + sifirli(o.alinan.size, 2), sx + 14, 46, 2, BEYAZ); sx += 14 + pikselGenislik('X00', 2) + 14;
    if (hayalet) { const fark = o.enYuksek - hayalet.enYuksek, t = 'HAYALET ' + (hayalet.bitti ? 'BITTI' : 'KAT ' + hayalet.enYuksek); vur(c, t, sx, 48, 1, fark >= 0 ? YESIL : KIRMIZI); sx += pikselGenislik(t, 1) + 14; }
    [['SAAT', o.saat, 480, SARI], ['MIKNATIS', o.miknatis, 500, KIRMIZI]].filter(g => g[1] > 0).forEach((g) => {
      vur(c, g[0], sx, 48, 1, g[3]); const bx = sx + pikselGenislik(g[0], 1) + 5; parcaliCubuk(c, bx, 47, 8, Math.ceil(8 * g[1] / g[2]), 5, 7, 1, () => g[3]); sx = bx + 8 * 6 + 12;
    });
    c.restore();
    // kombo ölçeri: duvar üzerinde dikey parçalı çubuk
    if (o.puan.kombo) {
      const k = o.puan.kombo; c.save(); c.globalAlpha = Math.max(0.55, Math.min(1, gorunur));
      panelArcade(c, 10, 74, 54, 212, NEON2);
      vur(c, 'KOMBO', 37, 79, 1, SOLUK, 'orta');
      parcaliCubuk(c, 20, 262, 14, Math.ceil(14 * k.sayac / 100), 34, 9, 3, (i, seg) => (i < seg * 0.4 ? KIRMIZI : i < seg * 0.7 ? SARI : YESIL), true);
      vur(c, 'X' + k.zip, 37, 268, 2, SARI, 'orta'); c.restore();
    }
  }
  // önceki en iyi kat: kulede ince kesikli çizgi; geçilince kaybolur
  if (o.rekorKat > 0 && o.enYuksek <= o.rekorKat) {
    const ry = Math.round(katY(o.rekorKat) - o.kamY - 6);
    if (ry > 66 && ry < 470) {
      c.save(); c.globalAlpha = 0.8; c.fillStyle = SARI; for (let x = 92; x < 548; x += 12) c.fillRect(x, ry, 7, 2);
      vur(c, 'REKOR KAT ' + o.rekorKat, 546, ry - 9, 1, SARI, 'sag'); c.restore();
    }
  }
  // kombo yazısı: kombo sürerken ortada büyüyen "XN KOMBO"; her kombo zıplamasında vurgulanır, süre bitmeye yaklaşırken yanıp söner
  if (o.puan.kombo && o.puan.kombo.zip >= 2) {
    const k = o.puan.kombo, zip = k.zip, renk = zip >= 6 ? NEON1 : zip >= 4 ? NEON2 : SARI, boyut = Math.min(7, 2 + Math.floor(zip * 0.6)) + (o.komboPuls > 10 ? 1 : 0);
    const yazi = 'X' + zip + ' KOMBO', kalan = k.sayac, soluk = kalan < 30 && Math.floor(kalan / 4) % 2 === 0;
    if (!soluk) {
      c.save(); c.globalAlpha = 0.95;
      const ust = 188 - Math.round(boyut * 3.5);
      pikselYaz(c, yazi, W / 2, ust, boyut, renk, { hiza: 'orta', cizgi: '#150a3a', golge: 'rgba(0,0,0,0.85)' });
      pikselYaz(c, '+' + k.toplam + ' KAT', W / 2, ust + 7 * boyut + 10, 2, BEYAZ, { hiza: 'orta', golge: 'rgba(0,0,0,0.85)' }); c.restore();
    }
    if (AYAR.parilti > 0.05) { // oyun alanı kenarlarında kombo rengiyle kısa parıltı
      const a = Math.min(0.55, 0.12 + o.komboPuls * 0.025 + zip * 0.02) * Math.min(1, AYAR.parilti); c.save(); c.globalAlpha = a;
      for (const [x0, x1] of [[90, 130], [550, 510]]) { const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, renk); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(Math.min(x0, x1), 0, 40, 480); }
      c.restore();
    }
  }
  // geçici uyarılar (her zaman görünür)
  BILDIRIM.slice(0, 2).forEach((b, i) => { // başarım bildirimi
    const a = Math.min(1, b.guc / 20, (200 - b.guc) / 12), g = Math.max(pikselGenislik('BASARIM!', 2), pikselGenislik(b.ad + ' +' + b.odul, 1)) + 24, y = 112 + i * 46;
    c.save(); c.globalAlpha = Math.max(0, a); panelArcade(c, W / 2 - g / 2, y, g, 38, SARI);
    vur(c, 'BASARIM!', W / 2, y + 6, 2, yanip ? SARI : BEYAZ, 'orta'); vur(c, b.ad + ' +' + b.odul, W / 2, y + 24, 1, NEON2, 'orta'); c.restore();
  });
  if (o.hizlan > 0) { // her 30 sn'de hızlanma uyarısı
    const t = 'HIZLANIYOR X' + (Math.floor(kare / SAAT) + 1), g = pikselGenislik(t, 3) + 24;
    if (yanip || o.hizlan < 20) { c.save(); c.globalAlpha = Math.min(1, o.hizlan / 15); panelArcade(c, W / 2 - g / 2, 72, g, 34, KIRMIZI); vur(c, t, W / 2, 80, 3, SARI, 'orta'); c.restore(); }
  }
  if (o.kilPayi > 0) { // kıl payı bonusu: ekran altına çok yaklaşıp kurtulunca kısa yeşil yazı ve küçük puan
    const s = o.kilPayi > 62 ? 4 : 3; c.save(); c.globalAlpha = Math.min(1, o.kilPayi / 15);
    pikselYaz(c, 'KIL PAYI!', W / 2, 300 - (70 - o.kilPayi) * 0.3, s, yanip ? YESIL : BEYAZ, { hiza: 'orta', cizgi: '#0a3a14', golge: 'rgba(0,0,0,0.9)' });
    vur(c, '+' + KIL_PAYI_PUAN, W / 2, 300 - (70 - o.kilPayi) * 0.3 + 7 * s + 6, 2, SARI, 'orta'); c.restore();
  }
  if (o.rozet) { // 50 katta kilometre taşı
    const s = o.rozet.olcek || 9, t = o.rozet.metin; c.save(); c.globalAlpha = Math.min(1, o.rozet.guc / 20);
    if (Math.floor(o.rozet.guc / 5) % 2 === 0) pikselYaz(c, t, W / 2, 210, s, SARI, { hiza: 'orta', cizgi: '#7a1fff', golge: 'rgba(0,0,0,0.9)' }); else pikselYaz(c, t, W / 2, 210, s, BEYAZ, { hiza: 'orta', cizgi: NEON1, golge: 'rgba(0,0,0,0.9)' });
    c.restore();
  }
  if (o.mesaj && o.mesaj.guc > 0) { // kombo ödülü: büyük yanıp sönen renkli yazı, altında kombo özeti
    const renk = [SARI, NEON2, NEON1, YESIL][Math.floor(kare / 5) % 4], t = o.mesaj.ad + '!', s = pikselGenislik(t, 5) > 380 ? 3 : 5;
    c.save(); c.globalAlpha = Math.min(1, o.mesaj.guc / 15);
    if (o.mesaj.zip) vur(c, 'KOMBO BITTI: X' + o.mesaj.zip + '  +' + o.mesaj.toplam * o.mesaj.toplam + ' PUAN', W / 2, 140 - (60 - o.mesaj.guc) * 0.35 + 7 * s + 8, 2, BEYAZ, 'orta'); pikselYaz(c, t, W / 2, 140 - (60 - o.mesaj.guc) * 0.35, s, renk, { hiza: 'orta', cizgi: '#150a3a', golge: 'rgba(0,0,0,0.9)' }); c.restore();
  }
  kapanisCizHud(c); // kombo kapanış patlaması: parçacıklar, ışınlar ve skora uçan "+N" etiketi (en üstte)
}

// ---- arayuz ----
// description: Tarayıcı girişi, durum makinesi (menü/oyun/duraklat/bitiş), HTML katmanları (sekmeler, canlı ayar paneli) ve oyun döngüsü. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)








const kimlik = (a) => document.getElementById(a);
const tuval = kimlik('c'), c = tuval.getContext('2d', { alpha: false }); // arka plan her karede tam opak çizilir (gorsel.js arkaPlan fillRect) -> alfa kanalı gereksiz
const k = {};
// Yüksek çözünürlük: tuval, ekrandaki gerçek boyut × cihaz piksel oranı kadar piksel kullanır; çizim 640×480 mantıksal koordinatta kalır.
let olcek = 1;
function boyutla() {
  // Sahne boyutu CSS vw/vh yerine gerçekten görünen alana (visualViewport) göre hesaplanır: pencere, yakınlaştırma ya da ekran ölçeği
  // farklı olsa bile sahne görünen alana sığar ve ortalanır.
  const sahne = kimlik('sahne'), vv = window.visualViewport;
  const gw = Math.min(window.innerWidth || 640, (vv && vv.width) || 1e9, (document.documentElement && document.documentElement.clientWidth) || 1e9);
  const gh = Math.min(window.innerHeight || 480, (vv && vv.height) || 1e9, (document.documentElement && document.documentElement.clientHeight) || 1e9);
  if (sahne && sahne.style && gw && gh) { const w = Math.max(320, Math.min(gw - 48, (gh - 48) * 4 / 3)); sahne.style.width = Math.floor(w) + 'px'; }
  const r = tuval.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  const w = Math.max(320, Math.min(2560, Math.round(r.width * dpr)));
  if (tuval.width !== w) { tuval.width = w; tuval.height = Math.round(w * 3 / 4); }
  olcek = tuval.width / 640;
  if (sahne && sahne.style && sahne.style.setProperty) sahne.style.setProperty('--olcek', String(Math.max(0.6, Math.min(2, r.width / 960))));
}
boyutla(); addEventListener('resize', boyutla); if (window.visualViewport && window.visualViewport.addEventListener) window.visualViewport.addEventListener('resize', boyutla);
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(boyutla).observe(tuval); // pencere büyütülünce ya da başka ekrana taşınınca yeniden boyutla
let o = yeniOyun(), durum = 'baslik', en = 0, yeniRekor = false, sekme = 'oyna', sonSira = 0;
let mod = 'yeni', sonMod = 'yeni', hayalet = null, hayaletGiris = [], kaydedici = kayitBaslat(), hayaletSonuc = '';
ayarYukle(); cuzdanYukle(); basarimYukle();
try { en = Number(localStorage.getItem('buzkule.en')) || 0; } catch { /* kayıt yoksa sorun değil */ }

kimlik('m-en').textContent = String(en);
// ---- HTML katmanları ----
const katmanlar = { menu: kimlik('menu'), duraklat: kimlik('duraklat'), sonuc: kimlik('sonuc') };
function katmanGoster(ad) {
  for (const [a, el] of Object.entries(katmanlar)) { const ac = a === ad; el.classList.toggle('acik', ac); el.setAttribute('aria-hidden', String(!ac)); }
}
const durumKatman = { baslik: 'menu', duraklat: 'duraklat', bitti: 'sonuc', oyun: null };
// Erişilebilirlik: katman açılınca odak ilk düğmeye (menüde seçili sekme, sonuçta Tekrar dene, duraklatmada kartın kendisi) gider;
// katman kapanıp oyun sürünce odak tuvale (tabindex=-1) döner, böylece Space odaktaki düğmeyi yeniden tıklamaz.
function odakla(el) { if (el && typeof el.focus === 'function') { try { el.focus({ preventScroll: true }); } catch { /* sahte DOM ya da eski tarayıcı */ } } }
const durumOdak = { baslik: () => kimlik('t-' + sekme), duraklat: () => kimlik('d-kart'), bitti: () => kimlik('tekrar'), oyun: () => tuval };
function durumDegistir(d, yeni = false) {
  durum = d; katmanGoster(durumKatman[d]); muzikGuncelle(d === 'oyun', yeni); // müzik yalnız oyun sürerken çalar
  odakla(durumOdak[d]());
  if (d === 'baslik') { basarimYaz(); kimlik('m-en').textContent = String(en); kimlik('m-kristal').textContent = String(CUZDAN.kristal); magazaYaz(); listeYaz(kimlik('m-liste'), 5, 0); modYaz(); }
  if (d === 'bitti') {
    kimlik('s-skor').textContent = String(skor(o)); kimlik('s-kat').textContent = String(o.enYuksek); kimlik('s-en').textContent = String(en); kimlik('s-kombo').textContent = String(o.enIyiKombo); kimlik('s-olum').textContent = o.enYuksek + '. katta düştün' + (o.katNo < o.enYuksek ? ' (' + (o.enYuksek - o.katNo) + ' kat aşağıya)' : '') + '.';
    kimlik('s-tohum').hidden = o.tohum == null; kimlik('s-tohum').textContent = o.tohum == null ? '' : 'kule no: ' + o.tohum.toString(16);
    kimlik('s-rekor').hidden = !yeniRekor; kimlik('s-kristal').textContent = String(o.alinan.size); listeYaz(kimlik('s-liste'), 5, sonSira, sonMod);
    kimlik('s-hayalet').textContent = hayaletSonuc; kimlik('s-hayalet').hidden = !hayaletSonuc;
  }
}
// Oyun kipleri: 'yeni' (rastgele kule), 'hayalet' (en iyi oyunun kulesi ve yarı saydam kaydı), 'gunun' (bugünün sabit kulesi ve günlük en iyi kaydı).
function basla() {
  let tohum = yeniTohum(), kayit = null;
  if (mod === 'hayalet') { kayit = kayitOku(HAYALET_ANAHTAR); if (kayit) tohum = kayit.tohum; }
  else if (mod === 'gunun') { tohum = gunlukTohum(); kayit = kayitOku(gunlukAnahtar()); }
  o = yeniOyun(tohum); o.rekorKat = skorListesi(mod).reduce((m, k) => Math.max(m, k.kat), 0); yeniRekor = false; kaydedici = kayitBaslat();
  hayalet = kayit ? yeniOyun(tohum) : null; hayaletGiris = kayit ? kayitCoz(kayit) : []; hayaletSonuc = '';
  durumDegistir('oyun', true); // odak tuvale geçer; Space odaktaki düğmeyi tekrar tıklamaz
}
function oyunBitti() {
  const s = skor(o);
  if (s > en) { en = s; yeniRekor = s > 0; try { localStorage.setItem('buzkule.en', String(s)); } catch { /* sessiz */ } }
  const anahtar = mod === 'gunun' ? gunlukAnahtar() : HAYALET_ANAHTAR, eski = kayitOku(anahtar);
  if (s > (eski ? eski.skor : 0)) kayitYaz(anahtar, kayitBitir(kaydedici, o.tohum, s, o.enYuksek)); // en iyi oyun hayalet olarak saklanır
  hayaletSonuc = hayalet && eski ? (s > eski.skor ? 'Hayaleti geçtin! (' + eski.skor + ')' : 'Hayalet önde: ' + eski.skor) : '';
  sonSira = skorEkle(mod, s, o.enYuksek); sonMod = mod; kristalKazan(o.alinan.size); // toplanan kristaller kalıcı cüzdana eklenir (mağazada harcanır)
  durumDegistir('bitti');
}

// ---- Sekmeler (gösterge: ön kenar önce, arka kenar gecikmeli) ----
const sekmeAdlari = ['oyna', 'magaza', 'basarim', 'ayar', 'nasil'];
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

// ---- Oyun kipi seçici ----
const modDugmeleri = { yeni: kimlik('mod-yeni'), hayalet: kimlik('mod-hayalet'), gunun: kimlik('mod-gunun') };
function modYaz() {
  const var_ = !!kayitOku(HAYALET_ANAHTAR);
  if (mod === 'hayalet' && !var_) mod = 'yeni';
  modDugmeleri.hayalet.disabled = !var_;
  for (const [ad, b] of Object.entries(modDugmeleri)) { b.setAttribute('aria-pressed', String(mod === ad)); b.className = 'mod' + (mod === ad ? ' secili' : ''); }
}
for (const [ad, b] of Object.entries(modDugmeleri)) b.addEventListener('click', () => { mod = ad; modYaz(); listeYaz(kimlik('m-liste'), 5, 0); });
modYaz();
// ---- Skor tablosu ----
function listeYaz(ol, adet, vurgu, oyunMod = mod) {
  if (!ol) return; ol.textContent = '';
  skorListesi(oyunMod).slice(0, adet).forEach((kayit, i) => {
    const li = document.createElement('li'), a = document.createElement('span'), b = document.createElement('b');
    a.textContent = 'kat ' + kayit.kat; b.textContent = String(kayit.skor); li.appendChild(a); li.appendChild(b);
    li.className = i + 1 === vurgu ? 'yeni' : ''; ol.appendChild(li);
  });
}
// ---- Başarımlar ----
function basarimYaz() {
  const ol = kimlik('b-liste'); if (!ol) return; ol.textContent = ''; kimlik('b-sayi').textContent = ACIK.size + ' / ' + BASARIMLAR.length;
  for (const b of BASARIMLAR) {
    const li = document.createElement('li'), a = document.createElement('span'), r = document.createElement('b'), acik = ACIK.has(b.id);
    a.textContent = (acik ? '★ ' : '☆ ') + b.ad + ' — ' + b.acik; r.textContent = acik ? 'alındı' : '+' + b.odul + ' ◆';
    li.className = acik ? 'yeni' : ''; li.appendChild(a); li.appendChild(r); ol.appendChild(li);
  }
}
// ---- Mağaza: iz renkleri (kristalle açılır, yalnız görünüm) ----
const izDugmeleri = [];
function magazaYaz() {
  kimlik('g-kristal').textContent = String(CUZDAN.kristal); kimlik('m-kristal').textContent = String(CUZDAN.kristal);
  izDugmeleri.forEach(({ b, ek }, i) => {
    const acik = CUZDAN.acik.includes(i), secili = CUZDAN.secili === i;
    b.className = 'iz' + (secili ? ' secili' : ''); b.setAttribute('aria-pressed', String(secili));
    ek.textContent = secili ? 'Seçili' : acik ? 'Seç' : IZLER[i].fiyat + ' ◆';
    b.disabled = !acik && CUZDAN.kristal < IZLER[i].fiyat;
  });
}
IZLER.forEach((iz, i) => {
  const b = document.createElement('button'), ad = document.createElement('span'), ek = document.createElement('span');
  b.type = 'button'; ad.textContent = iz.ad; ad.className = 'iz-ad'; ek.className = 'iz-ek';
  b.appendChild(ad); b.appendChild(ek);
  b.addEventListener('click', () => { if (!CUZDAN.acik.includes(i)) izAl(i); izSec(i); magazaYaz(); });
  kimlik('izler').appendChild(b); izDugmeleri.push({ b, ek });
});
magazaYaz(); listeYaz(kimlik('m-liste'), 5, 0); basarimYaz();

// ---- Ses ve müzik düğmeleri (aç/kapa) ----
function sesDugmeleriYaz() {
  for (const [a, id, ad] of [['efektAcik', 'a-efekt', 'Efektler'], ['muzikAcik', 'a-muzik', 'Müzik']]) {
    const b = kimlik(id), ac = !!AYAR[a]; b.setAttribute('aria-pressed', String(ac)); b.textContent = ad + ': ' + (ac ? 'AÇIK' : 'KAPALI'); b.className = 'dugme ikincil ac' + (ac ? ' secili' : '');
  }
}
kimlik('a-efekt').addEventListener('click', () => { AYAR.efektAcik = AYAR.efektAcik ? 0 : 1; ayarKaydet(); sesDugmeleriYaz(); });
kimlik('a-muzik').addEventListener('click', () => { AYAR.muzikAcik = AYAR.muzikAcik ? 0 : 1; ayarKaydet(); sesDugmeleriYaz(); muzikGuncelle(durum === 'oyun'); });
sesDugmeleriYaz();
// ---- Canlı ayar paneli ----
const ayarAnahtarlari = ['parilti', 'parcacik', 'sarsinti', 'hud', 'ses'];
function ayarYaz() {
  for (const a of ayarAnahtarlari) { kimlik('a-' + a).value = String(AYAR[a]); kimlik('o-' + a).textContent = Math.round(AYAR[a] * 100) + '%'; }
}
for (const a of ayarAnahtarlari) {
  kimlik('a-' + a).addEventListener('input', (e) => { AYAR[a] = Number(e.target.value); kimlik('o-' + a).textContent = Math.round(AYAR[a] * 100) + '%'; ayarKaydet(); });
}
kimlik('a-sifirla').addEventListener('click', () => { ayarSifirla(); ayarYaz(); karakterIsaretle(); sesDugmeleriYaz(); muzikGuncelle(false); });
// Karakter seçici (Kenney CC0 beş karakter)
const karakterAdlari = ['Yeşil', 'Kâşif', 'Kızıl', 'Asker', 'Zombi'], karakterDugmeleri = [];
function karakterIsaretle() { karakterDugmeleri.forEach((b, i) => { b.setAttribute('aria-pressed', String(AYAR.karakter === i)); b.className = 'karakter' + (AYAR.karakter === i ? ' secili' : ''); }); }
KARAKTERLER.forEach((ad, i) => {
  const b = document.createElement('button'), im = document.createElement('img');
  b.type = 'button'; b.setAttribute('aria-label', 'Karakter: ' + karakterAdlari[i]); b.title = karakterAdlari[i];
  im.src = './varlik/kenney/karakter/' + ad + '/stand.png'; im.alt = ''; b.appendChild(im);
  b.addEventListener('click', () => { AYAR.karakter = i; ayarKaydet(); karakterIsaretle(); });
  kimlik('karakterler').appendChild(b); karakterDugmeleri.push(b);
});
karakterIsaretle();
ayarYaz();
if (!document.activeElement || document.activeElement === document.body) odakla(kimlik('t-' + sekme)); // açılışta odak menünün ilk düğmesinde
kimlik('a-not').textContent = AYAR.azaltilmisHareket ? 'Sistem "hareketi azalt" ayarın açık: sarsıntı kapalı, parçacık azaltıldı, animasyonlar donuk.' : 'Ayarlar canlı uygulanır ve kaydedilir; oyun kuralları değişmez.';

// ---- Klavye ----
addEventListener('keydown', e => {
  const hedef = e.target && e.target.tagName;
  if (e.code === 'Space' && hedef !== 'BUTTON' && hedef !== 'INPUT') e.preventDefault();
  if (e.code.startsWith('Arrow') && hedef !== 'INPUT') e.preventDefault();
  if (e.repeat) return;
  k[e.code] = 1;
  // Menüde oklar sekme değiştirir; odak panel içindeki bir düğmedeyse (kip, iz, karakter...) oklar o düğmeye bırakılır, yalnız sekme ya da boş alan odaktayken çalışır.
  const sekmede = !!(e.target && e.target.getAttribute && e.target.getAttribute('role') === 'tab');
  if (durum === 'baslik' && hedef !== 'INPUT' && (hedef !== 'BUTTON' || sekmede)) {
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') { const i = sekmeAdlari.indexOf(sekme) + (e.code === 'ArrowRight' ? 1 : -1); sekmeSec(sekmeAdlari[(i + sekmeAdlari.length) % sekmeAdlari.length], true); return; }
    if (sekmede && (e.code === 'Home' || e.code === 'End')) { e.preventDefault(); sekmeSec(sekmeAdlari[e.code === 'Home' ? 0 : sekmeAdlari.length - 1], true); return; }
  }
  if (e.code === 'Space' && hedef !== 'BUTTON' && hedef !== 'INPUT' && (durum === 'bitti' || (durum === 'baslik' && sekme === 'oyna'))) basla();
  if (e.code === 'KeyR' && hedef !== 'INPUT') basla();
  if (e.code === 'KeyM' && hedef !== 'INPUT') { AYAR.muzikAcik = AYAR.muzikAcik ? 0 : 1; ayarKaydet(); sesDugmeleriYaz(); muzikGuncelle(durum === 'oyun'); } // M: müzik aç/kapa
  if (e.code === 'KeyP' && hedef !== 'INPUT') { if (durum === 'oyun') durumDegistir('duraklat'); else if (durum === 'duraklat') durumDegistir('oyun'); }
  if (e.code === 'Escape' && durum === 'duraklat') durumDegistir('baslik');
});
addEventListener('keyup', e => { k[e.code] = 0; });
// Sekme gizlenince ya da pencere odağı gidince oyun sürüyorsa otomatik duraklat; takılı kalan tuşlar bırakılır (yalnız arayüz, simülasyon kuralı değil).
function otoDuraklat() { for (const a in k) k[a] = 0; if (durum === 'oyun') durumDegistir('duraklat'); }
document.addEventListener('visibilitychange', () => { if (document.hidden) otoDuraklat(); });
addEventListener('blur', otoDuraklat);

// ---- Oyun kolu (gamepad): sol çubuk ya da yön tuşları koşar, A zıplar/başlatır, Start duraklatır ----
let oncekiA = false, oncekiStart = false;
function oyunKolu() {
  const bos = { sol: false, sag: false, zipla: false, a: false, start: false };
  if (typeof navigator === 'undefined' || !navigator.getGamepads) return bos;
  const kol = [...navigator.getGamepads()].find(g => g && g.connected); if (!kol) return bos;
  const eksen = kol.axes[0] || 0, dugme = (i) => !!(kol.buttons[i] && kol.buttons[i].pressed);
  return { sol: eksen < -0.4 || dugme(14), sag: eksen > 0.4 || dugme(15), zipla: dugme(0) || dugme(1) || dugme(2) || dugme(3), a: dugme(0), start: dugme(9) };
}

// ---- Döngü ----
function araDeger(g, a) {
  if (g.bitti || a >= 1 || !Number.isFinite(g.px)) return null;
  const s = { x: g.x, y: g.y, kamY: g.kamY };
  g.x = g.px + (s.x - g.px) * a; g.y = g.py + (s.y - g.py) * a; g.kamY = g.pk + (s.kamY - g.pk) * a; return s;
}
function araGeri(g, s) { if (s) { g.x = s.x; g.y = s.y; g.kamY = s.kamY; } }
let onceki = 0, acc = 0; const DT = 20;
function dongu(ms) {
  acc += Math.min(100, ms - onceki); onceki = ms;
  const kol = oyunKolu();
  if (kol.a && !oncekiA && (durum === 'bitti' || (durum === 'baslik' && sekme === 'oyna'))) basla();
  if (kol.start && !oncekiStart) { if (durum === 'oyun') durumDegistir('duraklat'); else if (durum === 'duraklat') durumDegistir('oyun'); }
  oncekiA = kol.a; oncekiStart = kol.start;
  while (acc >= DT) {
    if (durum === 'oyun') {
      const giris = { sol: k.ArrowLeft || kol.sol, sag: k.ArrowRight || kol.sag, zipla: k.Space || kol.zipla };
      kayitEkle(kaydedici, giris); adim(o, giris);
      if (hayalet && !hayalet.bitti) { const b = hayaletGiris[o.kare - 1]; adim(hayalet, b === undefined ? bitGiris(0) : bitGiris(b)); }
      if (o.bitti) oyunBitti(); else basarimKontrol(o);
    }
    bildirimAdim(); acc -= DT;
  }
  c.setTransform(olcek, 0, 0, olcek, 0, 0); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  // Çizim, 50 Hz adımlar arasında ara değerle yapılır (yüksek yenileme hızında takılma olmaz); durum çizimden sonra geri yüklenir.
  const a = durum === 'oyun' ? Math.max(0, Math.min(1, acc / DT)) : 1, s1 = araDeger(o, a), s2 = hayalet ? araDeger(hayalet, a) : null;
  ciz(c, o, hayalet);
  if (durum !== 'baslik') hudCiz(c, o, en, hayalet);
  araGeri(o, s1); if (s2) araGeri(hayalet, s2);
  requestAnimationFrame(dongu);
}
requestAnimationFrame(ms => { onceki = ms; dongu(ms); });

})();