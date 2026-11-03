# description: oyun.js'e kırılgan/yay basamak ve başarım sayaçlarını ekler (tek seferlik yama). sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
import pathlib
kok = pathlib.Path(__file__).resolve().parent.parent
p = kok / 'src' / 'oyun.js'
s = p.read_text(encoding='utf-8')

def degistir(eski, yeni, adet=1):
    global s
    assert eski in s, 'bulunamadı: ' + eski[:60]
    s = s.replace(eski, yeni, adet)

degistir("import { zipSesi, odulSesi, olumSesi, kristalSesi, hizSesi, gucSesi } from './ses.js';",
         "import { zipSesi, odulSesi, olumSesi, kristalSesi, hizSesi, gucSesi, yaySesi, kirmaSesi } from './ses.js';")
degistir("const SAAT_SURE = 480, MIKNATIS_SURE = 500; // güç öğesi süreleri (kare)",
         "const SAAT_SURE = 480, MIKNATIS_SURE = 500; // güç öğesi süreleri (kare)\nconst KIRILMA = 30;         // kırılgan basamak: üstünde bu kadar kare durulursa kırılır (0,6 sn)\nconst YAY_HIZI = 27;        // yay basamak: inişte yukarı fırlatma hızı (normal zıplamanın en fazla 24,4 hızından yüksek, ~6 kat)")
degistir("coyote: 0, tampon: 0, oncekiZ: false, saat: 0, miknatis: 0,",
         "coyote: 0, tampon: 0, oncekiZ: false, saat: 0, miknatis: 0,\n    kirik: new Set(), sayac: 0, sayacKat: -1, yaySayisi: 0, enIyiKombo: 0, // kırık basamaklar, kırılma sayacı, başarım sayaçları")
degistir("const f = o.kat(n), py = katY(n), [kx0, kx1] = basamakAralik(f);\n      const t =",
         "const f = o.kat(n), py = katY(n), [kx0, kx1] = basamakAralik(f);\n      if (o.kirik.has(n)) continue; // kırılan basamaktan geçilir\n      const t =")
degistir("        const od = inis(o.puan, fark); if (od) { o.mesaj = { ...od, guc: 60 }; odulSesi(od.toplam); }\n        break;",
         "        const od = inis(o.puan, fark); if (od) { o.mesaj = { ...od, guc: 60 }; odulSesi(od.toplam); o.enIyiKombo = Math.max(o.enIyiKombo, od.toplam); }\n        if (f.tur === 'yay') { // yay basamak: otomatik yukarı fırlatır ve takla attırır\n          o.vy = -YAY_HIZI; o.havada = true; o.donuyor = true; o.aci = 0; o.aciHiz = o.yon * 2 * Math.PI / (2.5 * YAY_HIZI); o.yaySayisi++;\n          yaySesi(); parcacikEkle(o.x, o.y, 16, '#ff9a9a', 4);\n        }\n        break;")
degistir("  if (!o.havada && o.katNo > 0) { // basamağın dışına tamamen çıktıysa düşer; coyote süresi boyunca hâlâ zıplayabilir",
         "  if (!o.havada && o.katNo > 0 && o.kat(o.katNo).tur === 'kirilgan') { // kırılgan basamakta durdukça sayaç artar, dolunca basamak kırılır\n    if (o.sayacKat === o.katNo) o.sayac++; else { o.sayacKat = o.katNo; o.sayac = 1; }\n    if (o.sayac >= KIRILMA) { o.kirik.add(o.katNo); o.havada = true; o.coyote = 0; kirmaSesi(); parcacikEkle(o.x, o.y, 22, '#cfeeff', 3.5); }\n  } else if (!o.havada) { o.sayac = 0; o.sayacKat = -1; }\n  if (!o.havada && o.katNo > 0) { // basamağın dışına tamamen çıktıysa düşer; coyote süresi boyunca hâlâ zıplayabilir")
degistir("  { const od = kare(o.puan); if (od) { o.mesaj = { ...od, guc: 60 }; odulSesi(od.toplam); } }",
         "  { const od = kare(o.puan); if (od) { o.mesaj = { ...od, guc: 60 }; odulSesi(od.toplam); o.enIyiKombo = Math.max(o.enIyiKombo, od.toplam); } }")
degistir("    if (n === 0) platform(c, 85, sy, 470, 0, true, 0); else platform(c, 85 + (f.xKaro - 5) * KARO, sy, f.genislikKaro * KARO, n, f.no, n);",
         "    if (n === 0) platform(c, 85, sy, 470, 0, true, 0);\n    else if (!o.kirik.has(n)) platform(c, 85 + (f.xKaro - 5) * KARO, sy, f.genislikKaro * KARO, n, f.no, n, f.tur, o.sayacKat === n ? o.sayac / KIRILMA : 0);")
p.write_text(s, encoding='utf-8')

# ses.js
q = kok / 'src' / 'ses.js'
t = q.read_text(encoding='utf-8')
t += "export const yaySesi = () => { bip(300, 1200, 0.22, 'square', 0.07); };\nexport const kirmaSesi = () => { bip(900, 200, 0.18, 'sawtooth', 0.06); setTimeout(() => bip(500, 120, 0.2, 'triangle', 0.05), 70); };\n"
q.write_text(t, encoding='utf-8')
print('yama tamam')
