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
export const pikselGenislik = (metin, olcek) => Math.max(0, [...metin].length * 6 * olcek - olcek);

// Önbellek: metin+ölçek+renk+kontur+gölge anahtarıyla bir kez çizilip drawImage ile basılır (en çok PBOY giriş, LRU). Düzgün ölçekli olmayan dönüşümde (döndürme/eğme), yarı saydamlık kat çakışması varsa veya tuval yoksa eski yola düşer.
const PBOY = 64, onbellek = new Map();
let tuvalYap = (w, h) => (typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(w, h) : typeof document !== 'undefined' && document.createElement ? Object.assign(document.createElement('canvas'), { width: w, height: h }) : null);
export const pikselOnbellekAyarla = (fabrika) => { tuvalYap = fabrika; onbellek.clear(); };
export const pikselOnbellekBoyut = () => onbellek.size;
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
export function pikselYaz(c, metin, x, y, olcek, renk, secenek = {}) {
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
