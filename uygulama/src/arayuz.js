// description: Tarayıcı girişi ve oyun döngüsü. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
import { yeniOyun, adim, ciz } from './oyun.js';
const c = document.getElementById('c').getContext('2d'); let o = yeniOyun(); const k = {};
addEventListener('keydown', e => { k[e.code] = 1; if (e.code === 'KeyR') o = yeniOyun(); if (e.code === 'Space') e.preventDefault(); });
addEventListener('keyup', e => k[e.code] = 0);
let t = 0, acc = 0; const DT = 20;
function dongu(ms) { acc += ms - t; t = ms; while (acc >= DT) { adim(o, { sol: k.ArrowLeft, sag: k.ArrowRight, zipla: k.Space }); acc -= DT; } ciz(c, o); requestAnimationFrame(dongu); }
requestAnimationFrame(ms => { t = ms; dongu(ms); });
