# description: ES modüllerini tek klasik betiğe birleştirir (file:// ve CSP uyumu için). sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
import re, pathlib
kok = pathlib.Path(__file__).resolve().parent.parent
sira = ['ayar', 'magaza', 'skorlar', 'basarim', 'hayalet', 'fizik', 'kat', 'cekirdek', 'puan', 'ses', 'gorsel', 'oyun', 'piksel', 'hud', 'arayuz']
cikti = ['(() => {', '"use strict";']
# Modüller tek kapsamda birleşir: aynı üst düzey ad iki dosyada tanımlıysa sessizce ezilir (bir oyun hatasına yol açmıştı). Çakışmayı derlemede yakala.
adlar = {}
for ad in sira:
    for m in re.finditer(r'^(?:export )?(?:function|const|let) ([A-Za-z_$][\w$]*)', (kok / 'src' / f'{ad}.js').read_text(encoding='utf-8'), flags=re.M):
        adlar.setdefault(m.group(1), []).append(ad)
cakisan = {k: v for k, v in adlar.items() if len(v) > 1}
if cakisan:
    raise SystemExit('AD ÇAKIŞMASI (birleştirme durduruldu): ' + str(cakisan))
import base64
wasm = kok / 'uygulama' / 'src' / 'varlik' / 'core.wasm'
for ad in sira:
    kod = (kok / 'src' / f'{ad}.js').read_text(encoding='utf-8')
    kod = re.sub(r'^import .*?;\s*$', '', kod, flags=re.M)
    kod = re.sub(r'^export (const|function|let)', r'\1', kod, flags=re.M)
    if ad == 'cekirdek' and wasm.exists():  # Rust çekirdeği baytları betiğe gömülür (CSP connect-src 'none' fetch'i engeller)
        cikti.append('const CEKIRDEK_B64 = "' + base64.b64encode(wasm.read_bytes()).decode() + '";')
    cikti.append(f'// ---- {ad} ----\n{kod}')
cikti.append('})();')
hedef = kok / 'uygulama' / 'src' / 'buz-kule.js'
hedef.write_text('\n'.join(cikti), encoding='utf-8')
html = (kok / 'index.html').read_text(encoding='utf-8')
html = html.replace('<script type="module" src="./src/arayuz.js"></script>', '<script src="./buz-kule.js"></script>')
(kok / 'uygulama' / 'src' / 'index.html').write_text(html, encoding='utf-8')
print('tamam', hedef.stat().st_size)
