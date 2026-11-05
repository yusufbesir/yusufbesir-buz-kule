# description: karakter çizimini Kenney (CC0) Player pozlarına geçirir (tek seferlik yama). sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
import pathlib
p = pathlib.Path(__file__).resolve().parent.parent / 'src' / 'oyun.js'
s = p.read_text(encoding='utf-8')
a = s.index("const RESIMLER = {};")
b = s.index("// ---- Arayüz") if "// ---- Arayüz" in s else len(s)
yeni = '''const RESIMLER = {};
if (typeof Image !== 'undefined') for (const ad of ['stand', 'walk1', 'walk2', 'jump', 'fall', 'skid', 'cheer1', 'hurt']) { const r = new Image(); r.src = './varlik/kenney/player_' + ad + '.png'; RESIMLER[ad] = r; }
// Kenney "Platformer Characters" (CC0) Player pozları; kaynak varlik/kenney/LICENSE-Kenney-CC0.txt
function pozSec(o) {
  if (o.bitti) return 'hurt';
  if (o.havada) return o.puan.kombo && o.vy < 0 && o.puan.kombo.zip >= 2 ? 'cheer1' : o.vy < 0 ? 'jump' : 'fall';
  if (Math.abs(o.vx) > 2) return (o.kare >> 3) & 1 ? 'walk1' : 'walk2';
  return 'stand';
}
function karakterCiz(c, o) {
  const r = RESIMLER[pozSec(o)], ters = o.vx < -0.5;
  if (r && r.complete && r.naturalWidth > 0) {
    const g = 48, y = 66, x = Math.round(o.x - g / 2), yy = Math.round(o.y - o.kamY - y + 3);
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(o.x, o.y - o.kamY + 1, 16, 4, 0, 0, 7); c.fill();
    c.save(); if (ters) { c.translate(x + g, 0); c.scale(-1, 1); c.drawImage(r, 0, yy, g, y); } else c.drawImage(r, x, yy, g, y); c.restore();
    return;
  }
  const x0 = Math.round(o.x - 15), y0 = Math.round(o.y - o.kamY - 36), m = 3;
  for (let r2 = 0; r2 < SPR.length; r2++) for (let q = 0; q < 10; q++) {
    const ch = SPR[r2][ters ? 9 - q : q]; if (ch === '.') continue;
    c.fillStyle = RENK[ch]; c.fillRect(x0 + q * m, y0 + r2 * m, m, m);
  }
}
'''
s = s[:a] + yeni
p.write_text(s, encoding='utf-8')
print('tamam')
