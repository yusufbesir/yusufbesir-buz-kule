// description: Buz Kule oyun içi HUD: klasik arcade makinesi görünümü (piksel yazı, neon çerçeve, parçalı çubuklar, yanıp sönen uyarılar); oyuncu üst kenara yaklaşınca solar. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
// Menü, duraklatma ve bitiş ekranları HTML katmanındadır (index.html + arayuz.js); burada yalnız canvas HUD'u var.
import { W, SAAT, skor, katY } from './oyun.js';
import { AYAR } from './ayar.js';
import { BILDIRIM } from './basarim.js';
import { pikselYaz, pikselGenislik } from './piksel.js';

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

export function hudCiz(c, o, en, hayalet = null) {
  const kare = o.kare, yanip = (Math.floor(kare / 12) % 2) === 0;
  // Oyuncu ekranın üst kısmındayken (yukarı zıplama) ana şerit neredeyse görünmez olur, görüşü kapatmaz.
  const ekranY = o.y - o.kamY, gorunur = Math.max(0.14, Math.min(1, (ekranY - 70) / 150)) * Math.min(1.1, AYAR.hud);
  if (AYAR.hud > 0.02) {
    c.save(); c.globalAlpha = Math.min(1, gorunur);
    // ana şerit: SKOR | REKOR | KAT
    panelArcade(c, 92, 6, 456, 34, NEON1);
    vur(c, '1UP', 100, 10, 1, yanip ? KIRMIZI : '#7a2b2b'); vur(c, sifirli(skor(o), 7), 100, 20, 2, SARI);
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
    if (ry > 20 && ry < 470) {
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
  if (o.rozet) { // 50 katta kilometre taşı
    const s = o.rozet.olcek || 9, t = o.rozet.metin; c.save(); c.globalAlpha = Math.min(1, o.rozet.guc / 20);
    if (Math.floor(o.rozet.guc / 5) % 2 === 0) pikselYaz(c, t, W / 2, 210, s, SARI, { hiza: 'orta', cizgi: '#7a1fff', golge: 'rgba(0,0,0,0.9)' }); else pikselYaz(c, t, W / 2, 210, s, BEYAZ, { hiza: 'orta', cizgi: NEON1, golge: 'rgba(0,0,0,0.9)' });
    c.restore();
  }
  if (o.mesaj && o.mesaj.guc > 0) { // kombo ödülü: büyük yanıp sönen renkli yazı
    const renk = [SARI, NEON2, NEON1, YESIL][Math.floor(kare / 5) % 4], t = o.mesaj.ad + '!', s = pikselGenislik(t, 5) > 380 ? 3 : 5;
    c.save(); c.globalAlpha = Math.min(1, o.mesaj.guc / 15); pikselYaz(c, t, W / 2, 140 - (60 - o.mesaj.guc) * 0.35, s, renk, { hiza: 'orta', cizgi: '#150a3a', golge: 'rgba(0,0,0,0.9)' }); c.restore();
  }
}
