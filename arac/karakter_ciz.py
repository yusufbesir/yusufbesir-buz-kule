# description: Buz Kule oyuncu karakterlerini (Penguen, Kutup ayısı, Tilki, Yeti, Kardan adam) 80x110 PNG olarak kodla çizer; 8 poz: stand, walk1, walk2, jump, fall, skid, cheer1, hurt. Hepsi özgün çizimdir, hiçbir dış varlık kullanılmaz. Sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı). Çalıştırma: python arac/karakter_ciz.py [--onizleme]
import math, pathlib, sys
from PIL import Image, ImageDraw

kok = pathlib.Path(__file__).resolve().parent.parent
CIKTI = kok / 'uygulama' / 'src' / 'varlik' / 'buzkule' / 'karakter'
W, H, S = 80, 110, 4          # tuval boyutu ve çizim büyütmesi (yumuşak kenar için)
CIZGI = (36, 40, 66, 255)       # ortak koyu dış çizgi
BEYAZ = (255, 255, 255, 255)

def renk(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (255,)

# Karakter renk paletleri
KARAKTERLER = {
    'penguen': dict(ana=renk('2f4a85'), koyu=renk('22376a'), karin=renk('f5f9ff'), aksan=renk('ff9f1c'), esarp=renk('e63946')),
    'ayi':     dict(ana=renk('f4f8fc'), koyu=renk('c9d8e6'), karin=renk('ffffff'), aksan=renk('3a86ff'), esarp=renk('3a86ff')),
    'tilki':   dict(ana=renk('f77f2b'), koyu=renk('c95a14'), karin=renk('fff1e0'), aksan=renk('3b2a2a'), esarp=renk('2a9d8f')),
    'yeti':    dict(ana=renk('bfe6fb'), koyu=renk('86c3e8'), karin=renk('e8f6ff'), aksan=renk('5a7fd6'), esarp=renk('7b5ad6')),
    'kardan':  dict(ana=renk('ffffff'), koyu=renk('d2e1ef'), karin=renk('ffffff'), aksan=renk('ff7a1a'), esarp=renk('2fa84f')),
}

# Pozlar: ayak (sol, sağ) konumları, el (sol, sağ) konumları, gövde eğimi (derece), ağız, göz
# Konumlar karakterin merkezine (x=40) göre; y mutlak. Sağa bakan karakter çizilir, oyun gerektiğinde çevirir.
POZLAR = {
    'stand':  dict(ayak=((-9, 107), (9, 107)),  el=((-22, 76), (22, 76)),  egim=0,   ag='gulumse', goz='acik', zip=0),
    'walk1':  dict(ayak=((-15, 107), (13, 100)), el=((-9, 82), (24, 70)), egim=3,   ag='gulumse', goz='acik', zip=0),
    'walk2':  dict(ayak=((-13, 100), (14, 107)), el=((-24, 70), (10, 82)), egim=3,   ag='gulumse', goz='acik', zip=0),
    'jump':   dict(ayak=((-8, 99), (9, 96)),     el=((-24, 62), (24, 60)), egim=0,   ag='ac',      goz='acik', zip=-4),
    'fall':   dict(ayak=((-13, 103), (13, 101)), el=((-28, 54), (28, 54)), egim=0,   ag='ac',      goz='buyuk', zip=2),
    'skid':   dict(ayak=((6, 107), (20, 107)),   el=((-27, 64), (18, 84)), egim=-14, ag='duz',     goz='acik', zip=0),
    'cheer1': dict(ayak=((-11, 104), (11, 104)), el=((-23, 44), (23, 44)), egim=0,   ag='ac',      goz='kapali', zip=-3),
    'hurt':   dict(ayak=((-12, 104), (12, 106)), el=((-27, 66), (27, 60)), egim=-10, ag='uzgun',   goz='x', zip=0),
}

def P(x, y): return (x * S, y * S)

class Cizer:
    def __init__(self):
        self.im = Image.new('RGBA', (W * S, H * S), (0, 0, 0, 0)); self.d = ImageDraw.Draw(self.im)
    def elips(self, cx, cy, rx, ry, dolgu, cizgi=CIZGI, kalin=1.6):
        if cizgi is not None and cizgi[3] == 0: cizgi = None
        if dolgu is not None and dolgu[3] == 0: dolgu = None
        self.d.ellipse([ (cx - rx) * S, (cy - ry) * S, (cx + rx) * S, (cy + ry) * S ], fill=dolgu, outline=cizgi, width=max(1, int(kalin * S)))
    def uzuv(self, a, b, kalinlik, dolgu, cizgi=CIZGI):
        for w, c in ((kalinlik + 3.2, cizgi), (kalinlik, dolgu)):
            self.d.line([P(*a), P(*b)], fill=c, width=int(w * S))
            r = w / 2
            for (x, y) in (a, b): self.d.ellipse([(x - r) * S, (y - r) * S, (x + r) * S, (y + r) * S], fill=c)
    def cokgen(self, noktalar, dolgu, cizgi=CIZGI):
        self.d.polygon([P(x, y) for x, y in noktalar], fill=dolgu)
        if cizgi is not None and cizgi[3] != 0:
            self.d.line([P(x, y) for x, y in noktalar] + [P(*noktalar[0])], fill=cizgi, width=int(1.4 * S), joint='curve')

def yuz(c, ad, pal, goz, ag, fx, fy):
    """Ortak yüz: gözler, yanaklar ve ağız. fx/fy yüz merkezi."""
    ex = (-6.5, 6.5)
    for i, dx in enumerate(ex):
        x, y = fx + dx, fy
        if goz == 'x':
            for s in (-3, 3):
                c.d.line([P(x - 3, y - 3 * (1 if s > 0 else -1)), P(x + 3, y + 3 * (1 if s > 0 else -1))], fill=CIZGI, width=int(1.6 * S))
        elif goz == 'kapali':
            c.d.arc([ (x - 3.5) * S, (y - 2.5) * S, (x + 3.5) * S, (y + 3.5) * S ], 200, 340, fill=CIZGI, width=int(1.8 * S))
        else:
            r = 5.2 if goz == 'buyuk' else 4.4
            c.elips(x, y, r - 0.6, r, BEYAZ, CIZGI, 1.2)
            c.elips(x + 1.4, y + 0.6, 2.3 if goz == 'buyuk' else 2.5, 2.8, CIZGI, CIZGI, 0)
            c.elips(x + 2.1, y - 0.6, 0.9, 0.9, BEYAZ, BEYAZ, 0)
    # yanaklar
    for dx in (-10, 10): c.elips(fx + dx, fy + 6, 2.6, 1.8, (255, 150, 160, 190), (0, 0, 0, 0), 0)
    my = fy + 8.5
    if ag == 'gulumse': c.d.arc([ (fx - 3) * S, (my - 3) * S, (fx + 3) * S, (my + 2) * S ], 20, 160, fill=CIZGI, width=int(1.6 * S))
    elif ag == 'ac':
        c.elips(fx, my + 0.5, 2.8, 3.2, renk('7a1f3d'), CIZGI, 1.2); c.elips(fx, my + 2, 1.7, 1.1, renk('ff7b8a'), (0, 0, 0, 0), 0)
    elif ag == 'duz': c.d.line([P(fx - 2.5, my + 1), P(fx + 2.5, my + 1)], fill=CIZGI, width=int(1.6 * S))
    elif ag == 'uzgun': c.d.arc([ (fx - 3) * S, (my - 0.5) * S, (fx + 3) * S, (my + 5) * S ], 200, 340, fill=CIZGI, width=int(1.6 * S))

def ciz(ad, poz):
    pal, p = KARAKTERLER[ad], POZLAR[poz]
    c = Cizer(); cx = 40; zip_ = p['zip']
    hx = cx + 3; hy = 37 + zip_            # kafa merkezi (sağa bakış için hafif ileride)
    govde_y = 74 + zip_ * 0.5
    ayak, el = p['ayak'], p['el']
    # arka kuyruk / arka uzuvlar (soldaki, uzakta kalan)
    if ad == 'tilki':
        c.elips(cx - 21, govde_y + 6 + zip_ * 0.3, 9, 14, pal['ana']); c.elips(cx - 23, govde_y - 2, 5, 6, pal['karin'], (0, 0, 0, 0), 0)
        c.d.arc([ (cx - 30) * S, (govde_y - 8) * S, (cx - 12) * S, (govde_y + 18) * S ], 100, 260, fill=CIZGI, width=int(1.4 * S))
    if ad == 'penguen':  # kanat gövdenin gerisinden
        pass
    # arka kol ve bacak
    kol_renk = {'penguen': pal['ana'], 'ayi': pal['ana'], 'tilki': pal['ana'], 'yeti': pal['ana'], 'kardan': renk('8a5a3a')}[ad]
    kol_k = 6.5 if ad != 'kardan' else 3
    c.uzuv((cx - 15, govde_y - 8), (cx + el[0][0], el[0][1] + zip_), kol_k, pal['koyu'] if ad != 'kardan' else kol_renk)
    bacak_renk = pal['aksan'] if ad == 'penguen' else (pal['aksan'] if ad == 'tilki' else pal['koyu'] if ad != 'kardan' else pal['koyu'])
    c.uzuv((cx - 7, govde_y + 14), (cx + ayak[0][0], ayak[0][1]), 8, bacak_renk)
    c.elips(cx + ayak[0][0] + 2, ayak[0][1] - 1.5, 6.2, 3.6, bacak_renk)
    # gövde
    c.elips(cx, govde_y, 20, 22, pal['ana'])
    if ad != 'tilki' or True:
        c.elips(cx + 3, govde_y + 3, 12.5, 16, pal['karin'], (0, 0, 0, 0), 0)
    if ad == 'kardan':
        c.elips(cx, govde_y - 10, 16, 10, pal['ana'], CIZGI)  # üst top ile bütünleşik görünüm
        for yy in (-2, 7, 16): c.elips(cx + 3, govde_y + yy, 1.8, 1.8, renk('2b2b3a'), (0, 0, 0, 0), 0)
    # ön bacak
    c.uzuv((cx + 7, govde_y + 14), (cx + ayak[1][0], ayak[1][1]), 8, bacak_renk)
    c.elips(cx + ayak[1][0] + 2, ayak[1][1] - 1.5, 6.2, 3.6, bacak_renk)
    # boyun eşarbı
    # kafa
    kafa_rx, kafa_ry = (22, 21) if ad != 'kardan' else (19, 18)
    if ad == 'ayi':
        for dx in (-14, 17): c.elips(hx + dx, hy - 17, 6.5, 6.5, pal['ana']); c.elips(hx + dx, hy - 17, 3, 3, renk('f6b8c4'), (0, 0, 0, 0), 0)
    if ad == 'tilki':
        for dx, tw in ((-14, -1), (14, 1)):
            c.cokgen([(hx + dx - 7, hy - 8), (hx + dx + tw * 3, hy - 28), (hx + dx + 8, hy - 9)], pal['ana'])
            c.cokgen([(hx + dx - 3, hy - 10), (hx + dx + tw * 2, hy - 22), (hx + dx + 5, hy - 10)], pal['aksan'], (0, 0, 0, 0))
    if ad == 'yeti':
        for dx, tw in ((-12, -1), (13, 1)):  # küçük buz boynuzları
            c.cokgen([(hx + dx - 4, hy - 14), (hx + dx + tw * 2, hy - 29), (hx + dx + 4, hy - 14)], renk('e8f6ff'))
    c.elips(hx, hy, kafa_rx, kafa_ry, pal['ana'])
    if ad == 'penguen':
        c.elips(hx + 4, hy + 3, 15, 16, pal['karin'], (0, 0, 0, 0), 0)
    elif ad == 'tilki':
        c.cokgen([(hx - 20, hy + 6), (hx + 4, hy - 4), (hx + 22, hy + 6), (hx + 6, hy + 19), (hx - 8, hy + 19)], pal['karin'], (0, 0, 0, 0))
        c.elips(hx, hy, kafa_rx, kafa_ry, None, CIZGI, 1.6)
    elif ad == 'yeti':
        c.elips(hx + 2, hy + 4, 15.5, 13.5, renk('f8e7dd'), (0, 0, 0, 0), 0)
    elif ad == 'ayi':
        c.elips(hx + 5, hy + 9, 8.5, 6.5, pal['karin'], renk('b9c9d8'), 1.0)
    yuz(c, ad, pal, p['goz'], p['ag'], hx + 3, hy + 1)
    # ayrıntılar
    if ad == 'penguen':
        c.cokgen([(hx + 5, hy + 9), (hx + 17, hy + 11), (hx + 5, hy + 15)], pal['aksan'])
    elif ad == 'ayi':
        c.elips(hx + 5.5, hy + 5.5, 3.2, 2.2, renk('2a2f4a'), (0, 0, 0, 0), 0)
    elif ad == 'tilki':
        c.elips(hx + 12, hy + 9, 3, 2.4, renk('2a2f4a'), (0, 0, 0, 0), 0)
    elif ad == 'yeti':
        c.cokgen([(hx - 3, hy + 15), (hx - 1, hy + 21), (hx + 1, hy + 15)], BEYAZ)
        c.cokgen([(hx + 5, hy + 15), (hx + 7, hy + 21), (hx + 9, hy + 15)], BEYAZ)
    elif ad == 'kardan':
        c.cokgen([(hx + 4, hy + 6), (hx + 22, hy + 10), (hx + 4, hy + 12)], pal['aksan'])
        # silindir şapka
        c.elips(hx, hy - 14, 17, 4, renk('2b2b3a')); c.d.rectangle([ (hx - 11) * S, (hy - 33) * S, (hx + 11) * S, (hy - 14) * S ], fill=renk('2b2b3a'), outline=CIZGI, width=int(1.4 * S))
        c.elips(hx, hy - 33, 11, 3.2, renk('3b3b52')); c.d.rectangle([ (hx - 11) * S, (hy - 21) * S, (hx + 11) * S, (hy - 17) * S ], fill=pal['esarp'])
    # eşarp
    if ad in ('penguen', 'ayi', 'yeti', 'kardan', 'tilki'):
        ey = hy + kafa_ry - 3
        c.elips(cx + 1, ey + 2, 17, 5, pal['esarp']); c.cokgen([(cx + 7, ey + 4), (cx + 14, ey + 4), (cx + 12, ey + 18), (cx + 6, ey + 15)], pal['esarp'])
        c.d.line([P(cx - 8, ey + 3), P(cx + 10, ey + 3)], fill=(255, 255, 255, 110), width=int(1.2 * S))
    # ön kol
    c.uzuv((cx + 15, govde_y - 8), (cx + el[1][0], el[1][1] + zip_), kol_k, pal['ana'] if ad != 'kardan' else kol_renk)
    if ad == 'kardan':  # çubuk kolların dalcıkları
        bx, by = cx + el[1][0], el[1][1] + zip_
        c.uzuv((bx, by), (bx + 5, by - 4), 2.2, kol_renk); c.uzuv((bx, by), (bx + 5, by + 3), 2.2, kol_renk)
    # el
    if ad != 'kardan':
        for (ex, ey), kc in (((cx + el[0][0], el[0][1] + zip_), pal['koyu']), ((cx + el[1][0], el[1][1] + zip_), pal['ana'])):
            c.elips(ex, ey, 4.4, 4.4, kc if ad != 'penguen' else pal['ana'])
    # eğim: ayak ucundan döndür
    im = c.im.resize((W * 2, H * 2), Image.LANCZOS)
    if p['egim']:
        im = im.rotate(-p['egim'], resample=Image.BICUBIC, center=(cx * 2, 107 * 2))
    return im.resize((W, H), Image.LANCZOS)

def uret(onizleme=False):
    sayfa = Image.new('RGBA', (W * len(POZLAR) + 10, (H + 6) * len(KARAKTERLER)), (60, 84, 130, 255))
    for r, ad in enumerate(KARAKTERLER):
        klasor = CIKTI / ad; klasor.mkdir(parents=True, exist_ok=True)
        for i, poz in enumerate(POZLAR):
            im = ciz(ad, poz); im.save(klasor / f'{poz}.png')
            sayfa.alpha_composite(im, (i * W + 5, r * (H + 6)))
    return sayfa

if __name__ == '__main__':
    sayfa = uret()
    if '--onizleme' in sys.argv:
        hedef = pathlib.Path(sys.argv[sys.argv.index('--onizleme') + 1]) if len(sys.argv) > sys.argv.index('--onizleme') + 1 else kok / 'onizleme-karakterler.png'
        sayfa.save(hedef); print(hedef)
    print('bitti:', CIKTI)
