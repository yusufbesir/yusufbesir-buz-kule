# description: Kamerayı zıplama tepe noktasına kilitlenmekten kurtarır (tek seferlik yama). sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
import pathlib
p = pathlib.Path(__file__).resolve().parent.parent / 'src' / 'oyun.js'
s = p.read_text(encoding='utf-8')
a = s.index("  // Kamera\n")
b = s.index("  if (o.y - o.kamY > H)")
yeni = '''  // Kamera: taban en yüksek kata göre yükselir (ve kayma başlayınca kendiliğinden); zıplama anında oyuncu üst kenara
  // yaklaşırsa kamera geçici olarak yukarı çıkar, inince tabana yumuşakça döner (tepe noktasına kilitlenmez).
  o.kamTaban = Math.min(o.kamTaban, katY(o.enYuksek) - 200);
  if (!o.kaymaBasladi && o.enYuksek >= 5) o.kaymaBasladi = true; // kat 5'ten sonra kayma başlar
  if (o.kaymaBasladi) { o.kayma = o.kare < SAAT ? 0.5 : Math.min(5, Math.floor(o.kare / SAAT)); o.kamTaban -= o.kayma; }
  const kamHedef = Math.min(o.kamTaban, o.y - 100);
  if (kamHedef < o.kamY) o.kamY = kamHedef; else o.kamY += Math.min(8, kamHedef - o.kamY);
'''
s = s[:a] + yeni + s[b:]
s = s.replace("kamY: 0, kayma: 0,", "kamY: 0, kamTaban: 0, kayma: 0,")
p.write_text(s, encoding='utf-8')
print('tamam')
