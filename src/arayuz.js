// description: Tarayıcı girişi, durum makinesi (menü/oyun/duraklat/bitiş), HTML katmanları (sekmeler, canlı ayar paneli) ve oyun döngüsü. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
import { yeniOyun, adim, ciz, skor } from './oyun.js';
import { hudCiz } from './hud.js';
import { AYAR, KARAKTERLER, ayarYukle, ayarKaydet, ayarSifirla } from './ayar.js';
import { skorListesi, skorEkle } from './skorlar.js';
import { yeniTohum, gunlukTohum, gunlukAnahtar, kayitBaslat, kayitEkle, kayitBitir, kayitCoz, kayitOku, kayitYaz, bitGiris, HAYALET_ANAHTAR } from './hayalet.js';
import { muzikGuncelle } from './ses.js';
import { BASARIMLAR, ACIK, basarimYukle, basarimKontrol, bildirimAdim } from './basarim.js';
import { IZLER, CUZDAN, cuzdanYukle, kristalKazan, izAl, izSec } from './magaza.js';

const kimlik = (a) => document.getElementById(a);
const tuval = kimlik('c'), c = tuval.getContext('2d'); const k = {};
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
function durumDegistir(d) {
  durum = d; katmanGoster(durumKatman[d]); muzikGuncelle(d === 'oyun'); // müzik yalnız oyun sürerken çalar
  odakla(durumOdak[d]());
  if (d === 'baslik') { basarimYaz(); kimlik('m-en').textContent = String(en); kimlik('m-kristal').textContent = String(CUZDAN.kristal); magazaYaz(); listeYaz(kimlik('m-liste'), 5, 0); modYaz(); }
  if (d === 'bitti') {
    kimlik('s-skor').textContent = String(skor(o)); kimlik('s-kat').textContent = String(o.enYuksek); kimlik('s-en').textContent = String(en); kimlik('s-kombo').textContent = String(o.enIyiKombo); kimlik('s-olum').textContent = o.enYuksek + '. katta düştün' + (o.katNo < o.enYuksek ? ' (' + (o.enYuksek - o.katNo) + ' kat aşağıya)' : '') + '.';
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
  durumDegistir('oyun'); // odak tuvale geçer; Space odaktaki düğmeyi tekrar tıklamaz
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
  ciz(c, o, hayalet);
  if (durum !== 'baslik') hudCiz(c, o, en, hayalet);
  requestAnimationFrame(dongu);
}
requestAnimationFrame(ms => { onceki = ms; dongu(ms); });
