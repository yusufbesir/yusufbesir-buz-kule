---
description: Icy Tower 1.3 (Windows freeware, C + Allegro) oyun mekanikleri; Ghidra decompile (icytower13_decomp.c) ve unpacked exe .rdata sabitlerinden cikarildi. Klon icin referans.
sahip: Claude (Icy Tower iş parçacığı)
yazan: Claude (salt okunur analiz alt ajani)
kaynak: D:\Programlar\Indirilenler\IcyTower-demo\icytower13_decomp.c ; sabitler D:\Programlar\Indirilenler\IcyTower-demo\acilmis-exe\icytower13_unpacked.exe (salt okunur bayt okuma)
degistirme: yalniz Icy Tower is parcacigi sahibi; silme yalniz Yusuf'un karari (Geri Donusum Kutusu)
---

# Icy Tower 1.3 mekanikleri

Not: Fonksiyon adlari Ghidra adlari (FUN_xxxxxxxx). Sabitler decompile'da yok; adresleri exe .rdata/.data'dan okundu (float = 4 bayt, double = 8 bayt). "belirsiz" = kanit yetersiz, tahmin edilmedi.

## 0. Koordinat ve veri yapisi
- Ekran 640x480 (FUN_00405... baslatma: "Setting windowed mode 640x480"). Karo boyutu 16 px.
- Oyuncu yapisi (double dizisi, işaretçi tablosu DAT_004cb920[DAT_004cb908]): [0]=x, [1]=y (ekran koordinati, asagi pozitif), [2]=vx, [3]=vy. Tamsayi alanlar: +0x34 durum (0 yerde, 1 yukseliyor, 2 dusuyor, 3 platformdan dusuyor), +0x28 mevcut kat, +0x2c kombo bonus puani, +0x30 en iyi kombo, +0x40 kombo sayaci, +0x44 kombo kat toplami, +0x48 kombo ziplama sayisi, +0x4c olu bayragi.
- Baslangic (FUN_0040aa40 @0040aa40, satir ~4427): x=200.0 (hi-word 0x40690000), y=431.0 (hi-word 0x407af000), vx=_DAT_004ace98 (okunmadi; buyuk olasilikla 0). Zemin yuzeyi y=432. NOT: x=200 duvar araligi (85..555) ortasi degil; ham literal bu, belirsiz neden.
- Mod: DAT_004cd8a8 = 2 (yeni oyunda sabit). Hiz tablosu DAT_0049e2a0[mod] (double): mod0=12.0, mod1=12.0, mod2=12.2, mod3=12.2, mod4=12.0. Oyun mod 2 kullaniyor -> T = 12.2.

## 1. Yatay hareket (FUN_004081e0 @004081e0, satir 3649)
- Sola basili: eger vx > 0 (esik _DAT_004acd18 = 0.0) ise vx *= 0.7 (_DAT_004acd00, double); sonra vx -= 0.3 (_DAT_004acd08).
- Saga basili: eger vx < 0 ise vx *= 0.7; sonra vx += 0.3.
- Tus yok: vx *= 0.9 (_DAT_004acd10, surtunme).
- Maks hiz: |vx| <= T = 12.2 px/kare (FUN_00413880 @00413880, satir 8251; clamp DAT_0049e2a0[mod]).
- Duvarlar: x sinirlari 85.0 (_DAT_004ad80c) ve 555.0 (_DAT_004ad7f8). Duvara carpinca x sinira kilitlenir ve vx = vx * -0.9 (_DAT_004ad800 = -0.9). |vx| > 4.0 (_DAT_004ad808) ise +0x30 alanina animasyon degeri yazilir (sol duvar +20, sag duvar -20). Sekme her duvar temasinda uygulanir (hiz kosulsuz ters cevrilip 0.9 ile carpilir).
- Sira (kare basina): giris/ivme (FUN_004081e0) -> FUN_00413880 (clamp, x+=vx, y+=vy, duvar, yercekimi) -> carpisma (FUN_0040b860 vb.).

## 2. Ziplama ve yercekimi
- Ziplama (FUN_00413a70 @00413a70, satir 8352), yalniz yerdeyken (+0x34==0): durum=1; vy = (vx<0 ? 2*vx : -2.0*vx) = -2*|vx| (_DAT_004ad820 = -2.0 float); sonra vy en fazla -T: vy = min(-2*|vx|, -12.2). Yani |vx|<=6.1 iken vy=-12.2; |vx|=12.2 iken vy=-24.4.
- Bayrak: vy < -22.0 (_DAT_004ad824) ise +0x50=1 (donme animasyonu / "super ziplama"). Ziplama sesi vy esiklerine gore (FUN_00408140: -22 ve -15).
- Zorunlu ziplama (param_2 != 0): vy = -12.0 (hi-word 0xc0280000), durum=1 (kaynagi belirsiz; yay/bounce benzeri).
- Yercekimi: havadayken (+0x34 != 0) her kare vy += 0.8 (_DAT_004ad810), konum guncellemesinden sonra.
- Maks dusme hizi: vy <= T = 12.2. Alt sinir vy >= -100.0 (_DAT_004ad7f0, fiilen sinirsiz). y ust siniri 1000.0 (_DAT_004ad7f4).
- Durum gecisi: durum 1 iken vy > 0.0 (_DAT_004ad818) -> durum 2 (dusus).
- Ziplama tusu basili tutulursa tekrar ziplamaz (+0x38 kilit bayragi; tus birakilinca sifirlanir) -- FUN_004081e0 satir 3738-3749.
- Sabit nokta YOK: konum/hiz double (kayan nokta); fixed-point yalniz parcacik efektlerinde (<<16) kullaniliyor.
- Yaklasik ziplama yuksekligi: vy=-12.2 ile ~90-95 px (kat araligi 80 px); tam hiz ile ~370 px.

## 3. Platform (kat) uretimi (FUN_004115a0 @004115a0, satir 6731-6843)
- Harita 32 satirlik halka tablo (satir basi 6 int = 0x18 bayt): [0]=tip (0 platform, -1 bos), [1]=bas karo, [2]=bitis karo, [3]=mutlak satir sayaci, [4]=kat numarasi isareti, [5]=tema. Yeni satir, kaydirma 16 px'i astikca uretilir (satir 5850). Baslangicta 30+ satir onceden uretilir (FUN_0040aa40).
- Kat araligi: her 5 satirda bir platform = 5*16 = 80 px. Kat no = satir_sayaci/5.
- Platform satiri: sayaç % 5 == 0 ise.
- Genislik (karo): kat < 600: w = rand() % round(max(1, (300 - kat) * 0.03333)) + 6 (_DAT_004ad590 = 1/30). Kat 0'da rand()%10+6 = 6..15, kat 270+ icin hep 6. Kat >= 600: w = 6 (kat <1001), 5 (>1000), 4 (>1500), 3 (>2000), 2 (>10000).
- Konum: bas karo = rand() % (30 - w) + 5 (5..34 arasi); bitis karo = bas + w. Platform px: x = bas*16-2 .. (bitis+1)*16+1 (FUN_004119a0). Oynanabilir alan karo 5..34 (duvarlar 80 px).
- Ozel katlar: sayaç % 250 == 0 (kat % 50 == 0) ve kat < 1001 -> tam genislik (karo 0..40). Kat > 1000 icin yalniz sayaç % 2500 == 0 (kat % 500 == 0). Kat 0 (zemin) de tam genislik. NOT: "her 100 kat" degil, her 50 kat.
- Kat numarasi tabelasi: (sayaç-1) % 50 == 0 -> her 10 katta numara cizilir.
- Tema (arka plan): min(10, sayaç/500) -> her 100 katta degisir, en fazla 10.
- RNG: CRT rand(); srand(tohum) tohum = rand() (tekrar kaydina 0x60 ofsetinde saklanir) -> harita tohumdan yeniden uretilebilir (FUN_0040aa40).
- Carpisma: tek yonlu platformlar; ayak yari genisligi 11 px (x-11 ve x+11, 0xb). Yuzey y = (29 - satir)*16 + kaydirma%16. Inis yalniz asagi inerken (durum 2/3) -- mod 2 icin kesin carpisma fonksiyonu belirsiz (switch tablosu cozulmedi; adaylar FUN_0040b860 karo tabanli, FUN_0040af90 / FUN_0040b3d0 dogru parcasi kesisim).

## 4. Kamera / kayma (FUN_0040e060 @0040e060 ana dongu, satir 5780-5880)
- Oyuncu yonlu itme (manuel kaydirma): oyuncu y (ekran) < 160 ise dunya asagi kayar ve oyuncu y ayni miktar artar. Kare basina kayma px: y<160:1; <140:2; <120:3; <100:4; <80:5; <60:6; <40:8; <20:10; <0:13 (esikler float _DAT_004ad3ac.. 160,140,120,100,80,60,40,20; ek +2 (y<40), +2 (y<20), +3 (y<0) _DAT_004ad3d8=0).
- Otomatik kayma baslangici: toplam kayma (DAT_004ccbc0) > 100 px olunca (kosul "iVar23 < 0x65" degilse).
- Baslangic hizi: 0.5 px/kare (her ikinci karede 1 px; bVar7 her kare terslenir).
- Hiz artisi: kare sayaci (DAT_004cb8f0, otomatik kayma baslayinca sayar) esikleri 1500, 3000, 4500, 6000, 7500 (local_6c dizisi) asinca hiz sirayla 1, 2, 3, 4, 5 px/kare olur. Maks 5 px/kare (sonra sayaç her karede -45 ile dondurulur). Her artista "hurryup" sesi ve banner.
- FPS: 50 (zamanlayici FUN_004602fc(proc, 20) -> ms*0x4a9 = Allegro MSEC_TO_TIMER; ana dongu DAT_004d2d80 bayragini bekler). 1500 kare = 30 sn -> her 30 sn'de hiz artar (0.5 -> 1 -> 2 -> 3 -> 4 -> 5 px/kare; artis miktari ilk adimda +0.5, sonra +1).
- Olum: oyuncu y > 540.0 (_DAT_004ad3cc; ekran 480 + 60) ve olu degilse +0x4c=1, olum sesi. y > 900 (_DAT_004ad3d0) olunca "gameover" sesi.

## 5. Puan ve kombo
- Gosterilen puan = +0x2c (kombo bonusu) + kat * 10 (FUN_004084b0 satir 4257: +0x2c + +0x28*10).
- Kat tespiti: oyuncu yerdeyken kat = (satir_sayaci_oyuncu_satiri - 1)/5 (FUN_00411970), her karede ana dongu satir 5896-5927.
- Kombo: yerdeyken kat farki d = yeni_kat - onceki_kat. d >= 2 ise: sayaç==0 ise (+0x44 = d, +0x48 = 1), degilse (+0x44 += d, +0x48 += 1); sayaç = 100 kare (2 sn @50 FPS). d == 1 iken sayaç acik ise sayaç=1 (kombo biter); asagi inis (d<0) iken sayaç acik ise sayaç=1. d==0 hicbir sey yapmaz.
- Sayaç her karede -1 (satir 5882). 0'a inince ve ziplama sayisi (+0x48) > 1 ise: +0x2c += (kat toplami)^2 ; FUN_00407f00(kat toplami) odul gosterir; +0x68 = son kombo, +0x30 = max. En az 2 ardisik >=2 katlik ziplama gerekir (tek buyuk ziplama bonus vermez; min toplam 4).
- Odul esikleri (FUN_00407f00 @00407f00, kat toplamina gore indeks): <7:0 GOOD; 7-14:1 SWEET; 15-24:2 GREAT; 25-34:3 SUPER; 35-49:4 WOW; 50-69:5 AMAZING; 70-99:6 EXTREME; 100-139:7 FANTASTIC; 140-199:8 SPLENDID; >=200:9 UNBELIEVABLE. (Indeks->ad eslemesi ses dosyalarindan: good, sweet, great, super, wow, amazing, extreme, fantastic, splendid, unbelievable; ekrandaki yazi sprite'inin ayni sirada oldugu olasi ama dogrulanmadi.) Indeks>2 ise yildiz parcaciklari (16*(indeks)-32 adet).
- Odul sonrasi "ekran" efektleri ve ses cagrisi: DAT_004afe60[indeks].

## 6. Diger bulgular
- Oyun donusu: ana dongu FUN_0040e060; mod/oyun baslatma FUN_0040aa40; platform uretimi FUN_004115a0; oyuncu entegrasyon FUN_00413880; ziplama FUN_00413a70; giris FUN_004081e0; odul FUN_00407f00; cizim FUN_004084b0.
- Tekrar kaydi (.itr) tus durumlarini (maske 0x93) kare sayisiyla RLE olarak saklar; harita tohumla yeniden uretilir -> mekanik deterministik.
- Olum sonrasi: ~250 kareye kadar bekler (local_180 > 250 veya kat*5'ten buyuk), "splat" sesi, ekran sarsintisi (+100 = 0x18).
- Skor tablosu/kombo dogrulama (satir 1692): iVar2*iVar2 + (x/0x11)*10 biciminde kayit dogrulamasi (tam anlami belirsiz).

## 7. Belirsizler
- Mod 2'nin hangi carpisma fonksiyonuna eslendigi (switch tablosu 004ad3e0).
- Baslangic vx (_DAT_004ace98) degeri okunmadi.
- Odul yazisi sprite sirasi.
- Zorunlu ziplama (-12.0) tetikleyicisi (yay/gokyuzu nesnesi) bulunmadi.
