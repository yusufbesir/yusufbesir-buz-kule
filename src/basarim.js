// description: Buz Kule başarımları (kalıcı); açılınca kristal ödülü verir. Oyun kurallarını değiştirmez. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
import { kristalKazan } from './magaza.js';
import { basarimSesi } from './ses.js';
export const BASARIMLAR = Object.freeze([
  { id: 'kat10', ad: 'İlk basamaklar', acik: 'Kat 10\'a ulaş', odul: 5, sart: (o) => o.enYuksek >= 10 },
  { id: 'kat50', ad: 'Yarı yol', acik: 'Kat 50\'ye ulaş', odul: 20, sart: (o) => o.enYuksek >= 50 },
  { id: 'kat100', ad: 'Bulutların üstü', acik: 'Kat 100\'e ulaş', odul: 50, sart: (o) => o.enYuksek >= 100 },
  { id: 'kristal10', ad: 'Kristal avcısı', acik: 'Tek oyunda 10 kristal topla', odul: 15, sart: (o) => o.alinan.size >= 10 },
  { id: 'kombo20', ad: 'Zincirleme', acik: 'Tek kombo ile 20 kat çık', odul: 25, sart: (o) => o.enIyiKombo >= 20 },
  { id: 'yay3', ad: 'Fırlatıldım', acik: 'Tek oyunda 3 yaydan fırla', odul: 10, sart: (o) => o.yaySayisi >= 3 },
  { id: 'dayanikli', ad: 'Dayanıklı', acik: '2 dakika hayatta kal', odul: 15, sart: (o) => o.kare >= 6000 },
]);
const BASARIM_ANAHTAR = 'buzkule.basarim';
export const ACIK = new Set();
export const BILDIRIM = []; // ekrandaki bildirimler: { ad, odul, guc }

export function basarimYukle() {
  try { const k = JSON.parse(localStorage.getItem(BASARIM_ANAHTAR) || '[]'); if (Array.isArray(k)) for (const id of k) if (BASARIMLAR.some(b => b.id === id)) ACIK.add(id); } catch { /* kayıt yoksa boş */ }
}
// Her karede çağrılır; yalnız kilitli başarımlara bakar. Yeni açılanların kimliklerini döndürür.
export function basarimKontrol(o) {
  const yeni = [];
  for (const b of BASARIMLAR) {
    if (ACIK.has(b.id) || !b.sart(o)) continue;
    ACIK.add(b.id); yeni.push(b.id); kristalKazan(b.odul); basarimSesi(); BILDIRIM.push({ ad: b.ad, id: b.id, odul: b.odul, guc: 200 });
  }
  if (yeni.length) { try { localStorage.setItem(BASARIM_ANAHTAR, JSON.stringify([...ACIK])); } catch { /* sessiz */ } }
  return yeni;
}
export const bildirimAdim = () => { for (let i = BILDIRIM.length - 1; i >= 0; i--) if (--BILDIRIM[i].guc <= 0) BILDIRIM.splice(i, 1); };
