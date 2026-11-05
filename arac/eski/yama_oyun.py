# description: oyun.js içindeki eski HUD'u kaldırır, ödül mesajına süre ekler (tek seferlik yama). sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
import pathlib
p = pathlib.Path(__file__).resolve().parent.parent / 'src' / 'oyun.js'
s = p.read_text(encoding='utf-8')
a = s.index("  c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(90, 6, 250, 26);")
b = s.index("// Özgün 10x12")
s = s[:a] + "}\n\n" + s[b:]
s = s.replace("if (od) { o.mesaj = od; odulSesi(od.toplam); } }", "if (od) { o.mesaj = { ...od, guc: 60 }; odulSesi(od.toplam); } }")
s = s.replace("if (od) { o.mesaj = od; odulSesi(od.toplam); }", "if (od) { o.mesaj = { ...od, guc: 60 }; odulSesi(od.toplam); }")
s = s.replace("  o.kare++;\n", "  o.kare++; if (o.mesaj && o.mesaj.guc > 0) o.mesaj.guc--;\n", 1)
p.write_text(s, encoding='utf-8')
print('yama tamam')
