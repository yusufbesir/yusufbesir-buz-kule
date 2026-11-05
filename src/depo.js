// description: Buz Kule yerel depolama (localStorage) yardımcıları: güvenli JSON okuma/yazma. Depolama kapalıysa ya da kayıt bozuksa oyun çalışmaya devam eder (okuma varsayılanı döner, yazma false döner). Sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı).
// Okur: kayıt yoksa ya da bozuksa varsayilan döner (doğrulama çağıranın işi).
export function depoOku(anahtar, varsayilan = null) {
  try { const s = localStorage.getItem(anahtar); return s === null ? varsayilan : JSON.parse(s); } catch { return varsayilan; }
}
// Yazar: başarılıysa true, depolama kapalı ya da kota doluysa false (oyun sessizce sürer).
export function depoYaz(anahtar, deger) {
  try { localStorage.setItem(anahtar, JSON.stringify(deger)); return true; } catch { return false; }
}
