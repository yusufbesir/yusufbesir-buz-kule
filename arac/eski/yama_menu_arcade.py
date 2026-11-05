# description: index.html'deki menü stilini oyunun buz ve kule temasında arcade görünümüne çevirir (tek seferlik yama). sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
import pathlib
kok = pathlib.Path(__file__).resolve().parent.parent
p = kok / 'index.html'
s = p.read_text(encoding='utf-8')
a = s.index('<style>'); b = s.index('</style>') + len('</style>')
css = '''<style>
/* Arcade makinesi + buz kule teması: koyu taş-mavi zemin, buz mavisi neon çerçeve, karlı saçaklı kartlar, buz bloğu düğmeler, altın skor. HUD (canvas) ile aynı palet. */
:root{
  --zemin:#050a1f; --kart:#0a1736; --yazi:#ffffff; --yazi-soluk:#9fb6e6;
  --buz:#7fe9ff; --buz2:#bff6ff; --kar:#eaffff; --derin:#0b3a6e; --altin:#ffd62e; --altin-g:#b8860b; --yesil:#5dff6a; --kirmizi:#ff5a5a; --mor:#b58cff;
  --sure:200ms; --yay:cubic-bezier(.2,.9,.25,1.05);
}
*{box-sizing:border-box}
html{height:100%;background:
  radial-gradient(800px 500px at 15% 10%,rgba(56,242,200,.20),transparent 60%),
  radial-gradient(800px 500px at 85% 90%,rgba(181,140,255,.22),transparent 60%),var(--zemin);
  background-attachment:fixed;color:var(--yazi);font:700 15px/1.45 "Courier New",ui-monospace,Consolas,monospace}
body{margin:0;min-height:100vh;display:grid;place-items:center;overflow:hidden;background:transparent}
h1,h2{font-family:inherit;font-weight:900;margin:0;text-transform:uppercase;letter-spacing:.1em;color:var(--kar);text-shadow:3px 3px 0 #2b7cc0,6px 6px 0 #081c4a}
.etiket{font:700 11px/1 "Courier New",ui-monospace,Consolas,monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--buz)}
#sahne{position:relative;width:min(calc(100vw - 48px),calc((100vh - 48px)*4/3));aspect-ratio:4/3;margin:auto;border-radius:6px;overflow:hidden;outline:8px solid #1d2f58;box-shadow:0 0 0 11px #000,0 0 46px 14px rgba(127,233,255,.28),0 24px 60px rgba(0,0,0,.65)}
#c{display:block;width:100%;height:100%}
.katman{position:absolute;inset:0;display:grid;place-items:center;padding:16px;background:repeating-linear-gradient(0deg,rgba(0,0,0,.20) 0 2px,transparent 2px 4px),rgba(3,6,24,.68);opacity:0;visibility:hidden;
  transition:opacity var(--sure) var(--yay),visibility 0s linear var(--sure)}
.katman.acik{opacity:1;visibility:visible;transition:opacity var(--sure) var(--yay),visibility 0s}
/* Kart: taş kule duvarı dokusu, buz mavisi çerçeve, üstte kar başlığı ve sarkan buz saçakları */
.kart{zoom:var(--olcek,1);position:relative;border:3px solid var(--buz);border-radius:0;padding:26px 22px 20px;width:min(100%,400px);
  background:
    repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0 1px,transparent 1px 22px),
    repeating-linear-gradient(90deg,rgba(255,255,255,.03) 0 1px,transparent 1px 44px),var(--kart);
  box-shadow:0 0 0 3px #000,0 0 30px rgba(127,233,255,.40),inset 0 0 0 2px rgba(181,140,255,.45);transform:translateY(10px);
  transition:transform var(--sure) var(--yay),box-shadow var(--sure) var(--yay)}
.kart::before{content:"";position:absolute;left:-3px;right:-3px;top:-12px;height:14px;background:
  radial-gradient(circle at 10px 14px,var(--kar) 9px,transparent 10px) 0 0/22px 14px repeat-x;filter:drop-shadow(0 0 4px rgba(127,233,255,.7))}
.kart::after{content:"";position:absolute;left:-3px;right:-3px;top:0;height:14px;background:
  linear-gradient(135deg,var(--buz2) 25%,transparent 25%) 0 0/16px 14px repeat-x,linear-gradient(225deg,var(--buz2) 25%,transparent 25%) 0 0/16px 14px repeat-x;opacity:.85;pointer-events:none}
.katman.acik .kart{transform:none}
.kart h1{font-size:clamp(28px,6vw,44px);line-height:1.05}
.kart h2{font-size:28px;line-height:1.1}
.alt{margin:8px 0 14px}
/* Sekme göstergesi (kat seçici gibi): ön kenar önce, arka kenar gecikmeli */
.sekmeler{position:relative;display:flex;gap:2px;padding:3px;background:#000;border:2px solid var(--buz);margin:0 0 14px}
.sekme-gosterge{position:absolute;top:3px;bottom:3px;background:linear-gradient(var(--kar),var(--buz) 60%,#3c8fc9);left:3px;width:80px}
.sekme{position:relative;z-index:1;flex:1;padding:8px 4px;border:0;background:none;color:var(--yazi);cursor:pointer;font-family:inherit;font-weight:900;font-size:11px;letter-spacing:.06em;text-transform:uppercase;line-height:1.2}
.sekme[aria-selected=true]{color:#06224a}
.sekme:focus-visible,.dugme:focus-visible,input[type=range]:focus-visible,.karakter:focus-visible,.mod:focus-visible,.iz:focus-visible{outline:3px solid var(--altin);outline-offset:2px}
.panel[hidden]{display:none}
/* Kart giriş: kap önce, metin sonra */
.giris{opacity:0;transform:translateY(12px);animation:gir var(--sure) var(--yay) forwards}
.giris .metin{opacity:0;animation:gir var(--sure) var(--yay) 120ms forwards}
@keyframes gir{to{opacity:1;transform:none}}
@keyframes yanip{50%{border-color:var(--altin)}}
/* Düğme: buz bloğu (üstte kar parlaması, altta derin mavi kalınlık) */
.dugme{display:inline-flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:12px 18px;border:3px solid #fff;border-radius:0;
  background:linear-gradient(var(--kar) 0 14%,var(--buz2) 14% 45%,var(--buz) 45% 70%,#3c8fc9);color:#06224a;
  font-family:inherit;font-weight:900;font-size:16px;letter-spacing:.14em;text-transform:uppercase;line-height:1;cursor:pointer;box-shadow:0 5px 0 #1d5f96,0 0 0 3px #000;transition:transform 90ms linear,box-shadow 90ms linear}
.dugme:hover{transform:translateY(-2px);box-shadow:0 7px 0 #1d5f96,0 0 0 3px #000}
.dugme:active{transform:translateY(4px);box-shadow:0 1px 0 #1d5f96,0 0 0 3px #000}
#basla,#tekrar{animation:yanip 1s steps(2,jump-none) infinite}
.dugme.ikincil{background:#10204a;color:var(--yazi);border-color:var(--mor);box-shadow:0 5px 0 #4a3a8a,0 0 0 3px #000;margin-top:12px;font-size:13px}
.satir{display:grid;grid-template-columns:1fr auto;gap:2px 10px;align-items:center;margin:0 0 12px}
.satir output{font:900 12px "Courier New",ui-monospace,Consolas,monospace;color:var(--yesil)}
.satir input{grid-column:1/-1}
input[type=range]{accent-color:var(--buz);width:100%}
.skor{font-family:inherit;font-weight:900;font-size:38px;line-height:1;margin:4px 0;letter-spacing:.06em;color:var(--altin);text-shadow:3px 3px 0 #000}
.ince{color:var(--yazi-soluk);font-size:12px;margin:8px 0 0;letter-spacing:.03em}
.rekor{color:var(--yesil);font-weight:900;animation:yanip2 .9s steps(2,jump-none) infinite}
@keyframes yanip2{50%{opacity:.35}}
kbd{font:900 11px "Courier New",ui-monospace,Consolas,monospace;background:#10204a;color:var(--buz);border:2px solid #4a6aa8;border-bottom-width:4px;padding:1px 6px}
.karakterler{grid-column:1/-1;display:flex;gap:6px;margin-top:4px}
.karakter{flex:1;height:58px;border:3px solid #24407a;border-radius:0;background:rgba(127,233,255,.07);cursor:pointer;padding:2px;display:grid;place-items:center;transition:transform 90ms linear,border-color 90ms linear}
.karakter img{height:50px;width:auto;image-rendering:auto}
.karakter:hover{transform:translateY(-3px);border-color:var(--buz)}
.karakter.secili{border-color:var(--altin);background:rgba(255,214,46,.16)}
.modlar{display:flex;gap:6px;margin-bottom:4px}
.mod{flex:1;padding:9px 4px;border:3px solid #24407a;border-radius:0;background:rgba(127,233,255,.07);cursor:pointer;font-family:inherit;font-weight:900;font-size:10px;letter-spacing:.05em;text-transform:uppercase;color:var(--yazi);transition:transform 90ms linear,border-color 90ms linear}
.mod:hover:not(:disabled){transform:translateY(-2px);border-color:var(--buz)}
.mod:disabled{opacity:.35;cursor:not-allowed}
.mod.secili{border-color:var(--altin);background:rgba(255,214,46,.16);color:var(--altin)}
.izler{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:6px}
.iz{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:10px 12px;border:3px solid #24407a;border-radius:0;background:rgba(127,233,255,.07);cursor:pointer;font-family:inherit;color:var(--yazi);font-size:12px;text-transform:uppercase;transition:transform 90ms linear,border-color 90ms linear}
.iz:hover:not(:disabled){transform:translateY(-2px);border-color:var(--buz)}
.iz:disabled{opacity:.4;cursor:not-allowed}
.iz.secili{border-color:var(--altin);background:rgba(255,214,46,.16)}
.iz-ad{font-weight:900}.iz-ek{font:900 11px "Courier New",ui-monospace,Consolas,monospace;color:var(--yesil)}
.liste{margin:0;padding:0;list-style:none;font:900 12px "Courier New",ui-monospace,Consolas,monospace;color:var(--yazi-soluk);counter-reset:s}
.liste li{display:flex;justify-content:space-between;gap:12px;padding:3px 8px;counter-increment:s;margin:0}
.liste li::before{content:counter(s) '.';width:24px;color:var(--mor)}
.liste li b{margin-left:auto;color:var(--buz);font-weight:900}
.liste li.yeni{background:rgba(255,214,46,.16);color:var(--altin)}
ul{margin:0;padding-left:18px}li{margin:4px 0}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}.giris,.giris .metin{opacity:1;transform:none}.kart{transform:none}}
</style>'''
s = s[:a] + css + s[b:]
s = s.replace("arayüz katmanı (yumuşak açık cam kartlar, sekme göstergesi, canlı ayar paneli)", "arayüz katmanı (arcade makinesi + buz kule teması: neon çerçeve, buz bloğu düğmeler, karlı kartlar, sekme göstergesi, canlı ayar paneli)")
p.write_text(s, encoding='utf-8')
j = kok / 'src' / 'arayuz.js'
t = j.read_text(encoding='utf-8')
t = t.replace("Math.min(gw - 24, (gh - 24) * 4 / 3)", "Math.min(gw - 48, (gh - 48) * 4 / 3)")
j.write_text(t, encoding='utf-8')
print('menü arcade yaması tamam')
