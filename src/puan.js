// description: Puan ve kombo kuralları (özgün kod). sahip: Claude (Icy Tower iş parçacığı)
export const KOMBO_KARE = 100;
const ODULLER = [[200,'UNBELIEVABLE'],[140,'SPLENDID'],[100,'FANTASTIC'],[70,'EXTREME'],[50,'AMAZING'],[35,'WOW'],[25,'SUPER'],[15,'GREAT'],[7,'SWEET'],[0,'GOOD']];
export const odulAdi = (toplamKat) => ODULLER.find(([e]) => toplamKat >= e)[1];

export function yeniPuan() { return { katPuani: 0, bonus: 0, kombo: null }; }

// Her inişte çağır: katFarki = bu zıplamada çıkılan kat (düşüşte <=0).
export function inis(p, katFarki, yeniEnYuksekKat = 0) {
  if (katFarki >= 2) {
    p.kombo = p.kombo ? { toplam: p.kombo.toplam + katFarki, sayac: KOMBO_KARE, zip: p.kombo.zip + 1 }
                      : { toplam: katFarki, sayac: KOMBO_KARE, zip: 1 };
    return null;
  }
  return bitir(p);
}
export function kare(p) {
  if (!p.kombo) return null;
  return --p.kombo.sayac <= 0 ? bitir(p) : null;
}
function bitir(p) {
  const k = p.kombo; p.kombo = null;
  if (!k || k.zip < 2) return null;
  p.bonus += k.toplam * k.toplam;
  return { ad: odulAdi(k.toplam), toplam: k.toplam };
}
export const toplam = (p, enYuksekKat) => enYuksekKat * 10 + p.bonus;
