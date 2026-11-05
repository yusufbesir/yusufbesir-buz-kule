// description: Tarayıcı girişi, durum makinesi (menü/oyun/duraklat/bitiş), HTML katmanları (sekmeler, canlı ayar paneli) ve oyun döngüsü. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
import { yeniOyun, adim, ciz, skor } from './oyun.js';
import { hudCiz } from './hud.js';
import { AYAR, KARAKTERLER, ayarYukle, ayarKaydet, ayarSifirla } from './ayar.js';
import { skorListesi, skorEkle } from './skorlar.js';
import { yeniTohum, gunlukTohum, gunlukAnahtar, haftalikTohum, haftalikAnahtar, kodAnahtar, kodCoz, kayitBaslat, kayitEkle, kayitBitir, kayitOku, kayitYaz, bitGiris, hayaletAnahtar } from './hayalet.js';
import { muzikGuncelle } from './ses.js';
import { kayitCozC } from './cekirdek.js';
import { t, dilUygula, DILLER } from './dil.js';
import { PROFIL, profilYukle, profilGuncelle } from './profil.js';
import { KULELER, KULE, kuleYukle, kuleAcikMi, kuleAl, kuleSec, kuleDogrula } from './kule.js';
import { BASARIMLAR, ACIK, basarimYukle, basarimKontrol, bildirimAdim } from './basarim.js';
import { IZLER, CUZDAN, cuzdanYukle, kristalKazan, izAl, izSec } from './magaza.js';

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
// Skor ve hayalet kayıt anahtarı: zorluk (0-3) + kaygan buz açıksa 10. Orta zorluk ve kaygan kapalı = eski anahtarlar.
const zk = () => AYAR.zorluk + (AYAR.kaygan ? 10 : 0) + 100 * AYAR.kule, oz = (g) => g.zorluk + (g.kaygan ? 10 : 0) + 100 * (g.kule | 0);
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
    kimlik('s-skor').textContent = String(skor(o)); kimlik('s-kat').textContent = String(o.enYuksek); kimlik('s-en').textContent = String(en); kimlik('s-kombo').textContent = String(o.enIyiKombo); kimlik('s-olum').textContent = o.katNo < o.enYuksek ? t('j_dustun_asagi', { n: o.enYuksek, k: o.enYuksek - o.katNo }) : t('j_dustun', { n: o.enYuksek });
    kimlik('s-tohum').hidden = o.tohum == null; kimlik('s-tohum').textContent = o.tohum == null ? '' : t('j_kule_no') + ': ' + o.tohum.toString(16);
    kimlik('s-rekor').hidden = !yeniRekor; kimlik('s-kristal').textContent = String(o.alinan.size); listeYaz(kimlik('s-liste'), 5, sonSira, sonMod);
    kimlik('s-hayalet').textContent = hayaletSonuc; kimlik('s-hayalet').hidden = !hayaletSonuc;
  }
}
let kodTohum = 0; // 'kod' kipi: oyuncunun girdiği kule kodu
// Sabit kuleli kipler (günün / haftanın / kod): tohum ve en iyi koşunun (hayalet) kayıt anahtarı.
function kipBilgi(m) {
  if (m === 'hafta') return { tohum: haftalikTohum(), anahtar: haftalikAnahtar(undefined, zk()) };
  if (m === 'kod') return { tohum: kodTohum, anahtar: kodAnahtar(kodTohum, zk()) };
  return { tohum: gunlukTohum(), anahtar: gunlukAnahtar(undefined, zk()) };
}
// Oyun kipleri: 'yeni' (rastgele kule), 'hayalet' (en iyi oyunun kulesi ve yarı saydam kaydı), 'gunun' (bugünün sabit kulesi ve günlük en iyi kaydı).
function basla() {
  let tohum = yeniTohum(), kayit = null;
  if (mod === 'hayalet') { kayit = kayitOku(hayaletAnahtar(zk())); if (kayit) tohum = kayit.tohum; }
  else if (mod === 'gunun' || mod === 'hafta' || mod === 'kod') { const b = kipBilgi(mod); tohum = b.tohum; kayit = kayitOku(b.anahtar); }
  o = yeniOyun(tohum, AYAR.zorluk, AYAR.kaygan); o.kule = AYAR.kule; o.rekorKat = skorListesi(mod, zk()).reduce((m, k) => Math.max(m, k.kat), 0); yeniRekor = false; kaydedici = kayitBaslat();
  hayalet = kayit ? yeniOyun(tohum, AYAR.zorluk, AYAR.kaygan) : null; if (hayalet) hayalet.kule = AYAR.kule; hayaletGiris = kayit ? kayitCozC(kayit) : []; hayaletSonuc = '';
  durumDegistir('oyun', true); // odak tuvale geçer; Space odaktaki düğmeyi tekrar tıklamaz
}
function oyunBitti() {
  const s = skor(o);
  if (s > en) { en = s; yeniRekor = s > 0; try { localStorage.setItem('buzkule.en', String(s)); } catch { /* sessiz */ } }
  const anahtar = mod === 'gunun' || mod === 'hafta' || mod === 'kod' ? kipBilgi(mod).anahtar : hayaletAnahtar(oz(o)), eski = kayitOku(anahtar);
  if (s > (eski ? eski.skor : 0)) kayitYaz(anahtar, kayitBitir(kaydedici, o.tohum, s, o.enYuksek)); // en iyi oyun hayalet olarak saklanır
  hayaletSonuc = hayalet && eski ? (s > eski.skor ? t('j_hayalet_gecti', { n: eski.skor }) : t('j_hayalet_onde', { n: eski.skor })) : '';
  profilGuncelle(o); profilYaz(); sonSira = skorEkle(mod, s, o.enYuksek, oz(o)); sonMod = mod; kristalKazan(o.alinan.size); // toplanan kristaller kalıcı cüzdana eklenir (mağazada harcanır)
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
const modDugmeleri = { yeni: kimlik('mod-yeni'), hayalet: kimlik('mod-hayalet'), gunun: kimlik('mod-gunun'), hafta: kimlik('mod-hafta') };
function modYaz() {
  const var_ = !!kayitOku(hayaletAnahtar(zk()));
  if (mod === 'hayalet' && !var_) mod = 'yeni';
  modDugmeleri.hayalet.disabled = !var_;
  for (const [ad, b] of Object.entries(modDugmeleri)) { b.setAttribute('aria-pressed', String(mod === ad)); b.className = 'mod' + (mod === ad ? ' secili' : ''); }
}
for (const [ad, b] of Object.entries(modDugmeleri)) b.addEventListener('click', () => { mod = ad; modYaz(); listeYaz(kimlik('m-liste'), 5, 0); });
modYaz();
// ---- Kule kodu: oyun sonunda görünen kodla aynı kuleyi oynamak (arkadaşla yarış) ----
kimlik('kod-oyna').addEventListener('click', () => {
  const k = kodCoz(kimlik('kod-giris').value), hata = kimlik('kod-hata');
  hata.textContent = k === null ? t('j_kod_gecersiz') : ''; hata.hidden = k !== null;
  if (k === null) return; kodTohum = k; mod = 'kod'; modYaz(); basla();
});
// ---- Özet kartı: oyun sonu özetini panoya kopyalar ----
kimlik('ozet-kopyala').addEventListener('click', () => {
  const b = kimlik('ozet-kopyala'), metin = t('j_ozet_metin', { k: o.enYuksek, s: skor(o), c: o.enIyiKombo, kod: o.tohum == null ? '-' : o.tohum.toString(16) });
  const bitti = () => { b.textContent = t('j_kopyalandi'); setTimeout(() => { b.textContent = t('j_ozet_kopyala'); }, 1600); };
  // Electron kabuğu tüm izin isteklerini reddeder (navigator.clipboard reddedilebilir): reddedilirse kullanıcı tıklamasıyla eski yöntem (geçici metin alanı + execCommand) denenir.
  const eskiYontem = () => { try { const ta = document.createElement('textarea'); ta.value = metin; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); document.body.removeChild(ta); if (ok) bitti(); } catch { /* pano yoksa sessiz */ } };
  try { if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(metin).then(bitti, eskiYontem); else eskiYontem(); } catch { eskiYontem(); }
});
// ---- Zorluk seçici (kolay / orta / zor / çok zor) ----
const zorlukDugmeleri = [0, 1, 2, 3].map((i) => kimlik('zorluk-' + i));
function zorlukYaz() {
  zorlukDugmeleri.forEach((b, i) => { b.setAttribute('aria-pressed', String(AYAR.zorluk === i)); b.className = 'mod' + (AYAR.zorluk === i ? ' secili' : ''); });
  modYaz();
}
zorlukDugmeleri.forEach((b, i) => b.addEventListener('click', () => { AYAR.zorluk = i; ayarKaydet(); zorlukYaz(); listeYaz(kimlik('m-liste'), 5, 0); }));
zorlukYaz();
// ---- Skor tablosu ----
function listeYaz(ol, adet, vurgu, oyunMod = mod) {
  if (!ol) return; ol.textContent = '';
  skorListesi(oyunMod, zk()).slice(0, adet).forEach((kayit, i) => {
    const li = document.createElement('li'), a = document.createElement('span'), b = document.createElement('b');
    a.textContent = t('j_kat') + ' ' + kayit.kat; b.textContent = String(kayit.skor); li.appendChild(a); li.appendChild(b);
    li.className = i + 1 === vurgu ? 'yeni' : ''; ol.appendChild(li);
  });
}
// ---- Başarımlar ----
function basarimYaz() {
  const ol = kimlik('b-liste'); if (!ol) return; ol.textContent = ''; kimlik('b-sayi').textContent = ACIK.size + ' / ' + BASARIMLAR.length;
  for (const b of BASARIMLAR) {
    const li = document.createElement('li'), a = document.createElement('span'), r = document.createElement('b'), acik = ACIK.has(b.id);
    a.textContent = (acik ? '★ ' : '☆ ') + t('b_' + b.id + '_ad') + ' — ' + t('b_' + b.id + '_acik'); r.textContent = acik ? t('j_alindi') : '+' + b.odul + ' ◆';
    li.className = acik ? 'yeni' : ''; li.appendChild(a); li.appendChild(r); ol.appendChild(li);
  }
}
// ---- Kuleler: konsept seçimi (başarımla ya da kristalle açılır; kilitler Ayarlar'dan kapatılabilir) ----
kuleYukle(); kuleDogrula();
const kuleDugmeleri = [];
function kuleYaz() {
  kuleDogrula();
  kuleDugmeleri.forEach(({ b, ad, ek }, i) => {
    const k = KULELER[i], acik = kuleAcikMi(i), secili = AYAR.kule === i;
    ad.textContent = t('j_kule_' + k.id);
    ek.textContent = secili ? t('j_secili') : acik ? t('j_sec') : k.acik.tur === 'basarim' ? '🔒 ' + t('j_kule_basarim', { ad: t('b_' + k.acik.id + '_ad') }) : '🔒 ' + t('j_kule_fiyat', { n: k.acik.fiyat });
    b.className = 'iz' + (secili ? ' secili' : ''); b.setAttribute('aria-pressed', String(secili));
    b.disabled = !acik && !(k.acik.tur === 'kristal' && CUZDAN.kristal >= k.acik.fiyat);
  });
  const m = kimlik('m-kule'); if (m) m.textContent = t('j_kuleler') + ': ' + t('j_kule_' + KULELER[AYAR.kule].id);
}
KULELER.forEach((k, i) => {
  const b = document.createElement('button'), ad = document.createElement('span'), ek = document.createElement('span');
  b.type = 'button'; ad.className = 'iz-ad'; ek.className = 'iz-ek'; b.appendChild(ad); b.appendChild(ek);
  b.addEventListener('click', () => {
    if (!kuleAcikMi(i)) kuleAl(i);
    if (kuleSec(i)) { ayarKaydet(); } kuleYaz(); magazaYaz(); modYaz(); listeYaz(kimlik('m-liste'), 5, 0);
  });
  kimlik('kuleler').appendChild(b); kuleDugmeleri.push({ b, ad, ek });
});
// ---- Mağaza: iz renkleri (kristalle açılır, yalnız görünüm) ----
const izDugmeleri = [];
function magazaYaz() {
  if (typeof kuleYaz === 'function' && kuleDugmeleri.length) kuleYaz();
  kimlik('g-kristal').textContent = String(CUZDAN.kristal); kimlik('m-kristal').textContent = String(CUZDAN.kristal);
  izDugmeleri.forEach(({ b, ek, ad }, i) => {
    const acik = CUZDAN.acik.includes(i), secili = CUZDAN.secili === i;
    b.className = 'iz' + (secili ? ' secili' : ''); b.setAttribute('aria-pressed', String(secili));
    ek.textContent = secili ? t('j_secili') : acik ? t('j_sec') : IZLER[i].fiyat + ' ◆'; ad.textContent = t('iz_' + i);
    b.disabled = !acik && CUZDAN.kristal < IZLER[i].fiyat;
  });
}
IZLER.forEach((iz, i) => {
  const b = document.createElement('button'), ad = document.createElement('span'), ek = document.createElement('span');
  b.type = 'button'; ad.textContent = iz.ad; ad.className = 'iz-ad'; ek.className = 'iz-ek';
  b.appendChild(ad); b.appendChild(ek);
  b.addEventListener('click', () => { if (!CUZDAN.acik.includes(i)) izAl(i); izSec(i); magazaYaz(); });
  kimlik('izler').appendChild(b); izDugmeleri.push({ b, ek, ad });
});
magazaYaz(); listeYaz(kimlik('m-liste'), 5, 0); basarimYaz();

// ---- Ses ve müzik düğmeleri (aç/kapa) ----
function sesDugmeleriYaz() {
  for (const [a, id, ad] of [['efektAcik', 'a-efekt', t('j_efektler')], ['muzikAcik', 'a-muzik', t('j_muzik')], ['golge', 'a-golge', t('j_golge')], ['perde', 'a-perde', t('j_perde')], ['kaygan', 'a-kaygan', t('j_kaygan')], ['hayaletGoster', 'a-hayaletGoster', t('j_hayalet_goster')], ['kontrast', 'a-kontrast', t('j_kontrast')], ['mukemmel', 'a-mukemmel', t('j_mukemmel')], ['kuleKilidi', 'a-kuleKilidi', t('j_kule_kilidi')], ['kuleEfekt', 'a-kuleEfekt', t('j_kule_efekt')], ['yerelYazi', 'a-yerelYazi', t('j_yerel_yazi')]]) {
    const b = kimlik(id), ac = !!AYAR[a]; b.setAttribute('aria-pressed', String(ac)); b.textContent = ad + ': ' + (ac ? t('j_acik') : t('j_kapali')); b.className = 'dugme ikincil ac' + (ac ? ' secili' : '');
  }
}
kimlik('a-efekt').addEventListener('click', () => { AYAR.efektAcik = AYAR.efektAcik ? 0 : 1; ayarKaydet(); sesDugmeleriYaz(); });
for (const [ayar, id] of [['golge', 'a-golge'], ['perde', 'a-perde'], ['kaygan', 'a-kaygan'], ['hayaletGoster', 'a-hayaletGoster'], ['kontrast', 'a-kontrast'], ['mukemmel', 'a-mukemmel'], ['kuleKilidi', 'a-kuleKilidi'], ['kuleEfekt', 'a-kuleEfekt'], ['yerelYazi', 'a-yerelYazi']]) kimlik(id).addEventListener('click', () => {
  AYAR[ayar] = AYAR[ayar] ? 0 : 1; ayarKaydet(); sesDugmeleriYaz();
  if (ayar === 'kuleKilidi') { kuleYaz(); modYaz(); listeYaz(kimlik('m-liste'), 5, 0); }
  if (ayar === 'kaygan') { modYaz(); listeYaz(kimlik('m-liste'), 5, 0); } // kaygan buz skor ve hayalet kayıtlarını ayırır
});
kimlik('a-muzik').addEventListener('click', () => { AYAR.muzikAcik = AYAR.muzikAcik ? 0 : 1; ayarKaydet(); sesDugmeleriYaz(); muzikGuncelle(durum === 'oyun'); });
sesDugmeleriYaz();
// ---- Canlı ayar paneli ----
const ayarAnahtarlari = ['parilti', 'parcacik', 'sarsinti', 'hud', 'ses', 'muzikSes'];
function ayarYaz() {
  for (const a of ayarAnahtarlari) { kimlik('a-' + a).value = String(AYAR[a]); kimlik('o-' + a).textContent = Math.round(AYAR[a] * 100) + '%'; }
}
for (const a of ayarAnahtarlari) {
  kimlik('a-' + a).addEventListener('input', (e) => { AYAR[a] = Number(e.target.value); kimlik('o-' + a).textContent = Math.round(AYAR[a] * 100) + '%'; ayarKaydet(); });
}
kimlik('a-sifirla').addEventListener('click', () => { ayarSifirla(); ayarYaz(); karakterIsaretle(); sesDugmeleriYaz(); muzikGuncelle(false); });
// Karakter seçici (Kenney CC0 beş karakter)
const karakterDugmeleri = [];
function karakterIsaretle() { karakterDugmeleri.forEach((b, i) => { b.setAttribute('aria-pressed', String(AYAR.karakter === i)); b.className = 'karakter' + (AYAR.karakter === i ? ' secili' : ''); }); }
KARAKTERLER.forEach((ad, i) => {
  const b = document.createElement('button'), im = document.createElement('img');
  b.type = 'button'; b.setAttribute('aria-label', t('j_karakter', { ad: t('kar_' + i) })); b.title = t('kar_' + i);
  im.src = './varlik/kenney/karakter/' + ad + '/stand.png'; im.alt = ''; b.appendChild(im);
  b.addEventListener('click', () => { AYAR.karakter = i; ayarKaydet(); karakterIsaretle(); });
  kimlik('karakterler').appendChild(b); karakterDugmeleri.push(b);
});
karakterIsaretle();
ayarYaz();
if (!document.activeElement || document.activeElement === document.body) odakla(kimlik('t-' + sekme)); // açılışta odak menünün ilk düğmesinde
function profilYaz() { const e = kimlik('m-profil'); if (e) e.textContent = PROFIL.oyun ? t('j_profil', { n: PROFIL.oyun, k: PROFIL.enKat, c: PROFIL.enKombo }) : ''; }
profilYukle();
const notYaz = () => { kimlik('a-not').textContent = AYAR.azaltilmisHareket ? t('j_azalt_not') : t('j_ayar_not'); };
// Dil seçici: seçili dil kalıcıdır; değişince menü, ayar düğmeleri ve listeler yeniden yazılır.
const dilSec = kimlik('a-dil');
DILLER.forEach((d, i) => { const op = document.createElement('option'); op.value = String(i); op.textContent = d.ad; dilSec.appendChild(op); });
function dilYenile() {
  dilSec.value = String(AYAR.dil); dilUygula(); profilYaz(); kimlik('ozet-kopyala').textContent = t('j_ozet_kopyala'); // sekme etiketleri değişince genişlikler değişir: gösterge yeniden konumlanır
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => sekmeSec(sekme, false)); notYaz(); sesDugmeleriYaz(); basarimYaz(); magazaYaz(); listeYaz(kimlik('m-liste'), 5, 0);
  karakterDugmeleri.forEach((b, i) => { b.setAttribute('aria-label', t('j_karakter', { ad: t('kar_' + i) })); b.title = t('kar_' + i); });
}
dilSec.addEventListener('change', () => { AYAR.dil = Number(dilSec.value); ayarKaydet(); dilYenile(); });
kimlik('a-sifirla').addEventListener('click', () => dilYenile());
dilYenile();

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
