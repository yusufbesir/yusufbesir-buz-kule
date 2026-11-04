# description: Buz Kule dil tablolarını (arac/dil/<kod>.json) tek bir src/dil_veri.js dosyasına derler; eksik/fazla anahtar ve yer tutucu ({n}, {k}, {ad}) tutarsızlığını denetler. Sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı). Çalıştır: python arac/dil-derle.py
import json, pathlib, re, sys
kok = pathlib.Path(__file__).resolve().parent.parent
tr = json.loads((kok / 'arac/dil/tr.json').read_text(encoding='utf-8'))
yer = lambda s: sorted(re.findall(r'\{\w+\}', s))
veri, hata = {}, []
for p in sorted((kok / 'arac/dil').glob('*.json')):
    kod = p.stem; t = json.loads(p.read_text(encoding='utf-8'))
    for k in tr:
        if k not in t: hata.append(f'{kod}: eksik anahtar {k}'); continue
        if yer(tr[k]) != yer(t[k]): hata.append(f'{kod}: {k} yer tutucuları uyuşmuyor ({yer(tr[k])} / {yer(t[k])})')
        if not str(t[k]).strip(): hata.append(f'{kod}: {k} boş')
    for k in t:
        if k not in tr: hata.append(f'{kod}: fazla anahtar {k}')
    veri[kod] = t
if hata:
    print('\n'.join(hata)); sys.exit(1)
(kok / 'src/dil_veri.js').write_text('// description: Buz Kule dil tabloları (arac/dil-derle.py üretir, elle düzenleme; kaynak arac/dil/*.json). sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)\nexport const DILVERI = ' + json.dumps(veri, ensure_ascii=False) + ';\n', encoding='utf-8')
print('dil_veri.js:', ', '.join(f'{k}({len(v)})' for k, v in veri.items()))
