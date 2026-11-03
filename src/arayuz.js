// description: Tarayıcı girişi, durum makinesi (başlık/oyun/duraklat/bitiş) ve oyun döngüsü. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
import { yeniOyun, adim, ciz, skor } from './oyun.js';
import { hudCiz, baslikCiz, duraklatCiz, bitisCiz } from './hud.js';
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
function bitir() {
  durum = 'bitti'; const s = skor(o);
  if (s > en) { en = s; yeniRekor = s > 0; try { localStorage.setItem('buzkule.en', String(s)); } catch { /* sessiz */ } }
}
let onceki = 0, acc = 0; const DT = 20;
function dongu(ms) {
  acc += Math.min(100, ms - onceki); onceki = ms; t++;
  while (acc >= DT) {
    if (durum === 'oyun') { adim(o, { sol: k.ArrowLeft, sag: k.ArrowRight, zipla: k.Space }); if (o.bitti) bitir(); }
    acc -= DT;
  }
  ciz(c, o);
  if (durum !== 'baslik') hudCiz(c, o, en);
  if (durum === 'baslik') baslikCiz(c, en, t); else if (durum === 'duraklat') duraklatCiz(c); else if (durum === 'bitti') bitisCiz(c, o, en, yeniRekor);
  requestAnimationFrame(dongu);
}
requestAnimationFrame(ms => { onceki = ms; dongu(ms); });
