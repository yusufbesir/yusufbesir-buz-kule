// description: Tarayıcı girişi, durum makinesi (menü/oyun/duraklat/bitiş), HTML katmanları (sekmeler, canlı ayar paneli) ve oyun döngüsü. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
import { yeniOyun, adim, ciz, skor } from './oyun.js';
import { hudCiz } from './hud.js';
import { AYAR, ayarYukle, ayarKaydet, ayarSifirla } from './ayar.js';

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
