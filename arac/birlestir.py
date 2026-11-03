# description: ES modüllerini tek klasik betiğe birleştirir (file:// ve CSP uyumu için). sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
import re, pathlib
kok = pathlib.Path(__file__).resolve().parent.parent
sira = ['fizik', 'kat', 'puan', 'ses', 'gorsel', 'oyun', 'arayuz']
cikti = ['(() => {', '"use strict";']
for ad in sira:
    kod = (kok / 'src' / f'{ad}.js').read_text(encoding='utf-8')
    kod = re.sub(r'^import .*?;\s*$', '', kod, flags=re.M)
    kod = re.sub(r'^export (const|function|let)', r'\1', kod, flags=re.M)
    cikti.append(f'// ---- {ad} ----\n{kod}')
cikti.append('})();')
hedef = kok / 'uygulama' / 'src' / 'buz-kule.js'
hedef.write_text('\n'.join(cikti), encoding='utf-8')
html = (kok / 'index.html').read_text(encoding='utf-8')
html = html.replace('<script type="module" src="./src/arayuz.js"></script>', '<script src="./buz-kule.js"></script>')
(kok / 'uygulama' / 'src' / 'index.html').write_text(html, encoding='utf-8')
print('tamam', hedef.stat().st_size)
