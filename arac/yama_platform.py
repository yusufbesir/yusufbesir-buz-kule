# description: gorsel.js platform çizimini Kenney (CC0) kar/tundra/kum/metal dilimleriyle değiştirir (tek seferlik yama). sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
import pathlib
p = pathlib.Path(__file__).resolve().parent.parent / 'src' / 'gorsel.js'
s = p.read_text(encoding='utf-8')
s = s.replace("export function platform(c, x, y, gen, kat, no, n) {", "function platformProsedurel(c, x, y, gen, kat, no, n) {", 1)
ek = '''
// Kenney "Platformer Pack: Extended Tiles" (CC0) dilimleri; kaynak varlik/kenney/plat/LICENSE-Kenney-CC0.txt
const PLAT_TEMA = ['snow', 'tundra', 'sand', 'metal'], PLAT = {};
if (typeof Image !== 'undefined') for (const t of PLAT_TEMA) for (const p of ['left', 'mid', 'right']) { const r = new Image(); r.src = './varlik/kenney/plat/' + t + '_' + p + '.png'; PLAT[t + '_' + p] = r; }
export function platform(c, x, y, gen, kat, no, n) {
  const t = PLAT_TEMA[Math.floor(kat / 100) % PLAT_TEMA.length], l = PLAT[t + '_left'], m = PLAT[t + '_mid'], r = PLAT[t + '_right'];
  if (!(l && m && r && l.complete && m.complete && r.complete && l.naturalWidth > 0 && m.naturalWidth > 0 && r.naturalWidth > 0)) return platformProsedurel(c, x, y, gen, kat, no, n);
  const tw = 32, th = 19, top = y - 4;
  c.save(); c.beginPath(); c.rect(x, top - 2, gen, th + 4); c.clip();
  const adet = Math.max(2, Math.ceil(gen / tw));
  for (let i = 0; i < adet; i++) {
    const px = i === adet - 1 ? x + gen - tw : x + i * tw, img = i === 0 ? l : i === adet - 1 ? r : m;
    c.drawImage(img, 0, 0, 70, 41, px, top, tw, th);
  }
  c.restore();
  if (no) { // her 10. kat: altın şerit ve numara
    c.fillStyle = 'rgba(255,200,40,0.55)'; c.fillRect(x, top, gen, 6);
    c.fillStyle = '#3a2a00'; c.font = 'bold 11px monospace'; c.fillText(String(n), x + 6, top + 16);
  }
}
'''
i = s.index("// Kozmetik parçacık sistemi")
s = s[:i] + ek + "\n" + s[i:]
p.write_text(s, encoding='utf-8')
print('tamam')
