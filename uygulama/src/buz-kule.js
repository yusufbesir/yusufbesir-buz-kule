(() => {
"use strict";
// ---- ayar ----
// description: Buz Kule kullanıcı ayarları (parıltı, parçacık, sarsıntı, ses, karakter) ve azaltılmış hareket desteği. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
// Fizik ve oyun kuralları bu ayarlardan etkilenmez; yalnız görünüm ve ses.
const AZ = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const VARSAYILAN = Object.freeze({ parilti: 1, parcacik: AZ ? 0.25 : 1, sarsinti: AZ ? 0 : 1, ses: 0.8, karakter: 0, hud: 1, efektAcik: 1, muzikAcik: 0, zorluk: 1, dil: 0, golge: 1, perde: 1, kaygan: 0, hayaletGoster: 1, kontrast: 0, mukemmel: 1, muzikSes: 0.8, kule: 0, kuleKilidi: 1, kuleEfekt: 1 }); // kule: seçili kule konsepti (0 Buz); kuleKilidi: 1 = başarım/kristal kilitleri açık, 0 = hepsi serbest // golge/perde/kaygan: ek özellikler; kaygan buz yeni fizik olduğu için varsayılan kapalı // efektler açık, müzik kapalı başlar
const ARALIK = Object.freeze({ parilti: [0, 2], parcacik: [0, 2], sarsinti: [0, 2], ses: [0, 1], karakter: [0, 4], hud: [0, 1.5], efektAcik: [0, 1], muzikAcik: [0, 1], zorluk: [0, 3], dil: [0, 10], golge: [0, 1], perde: [0, 1], kaygan: [0, 1], hayaletGoster: [0, 1], kontrast: [0, 1], mukemmel: [0, 1], muzikSes: [0, 1], kule: [0, 4], kuleKilidi: [0, 1], kuleEfekt: [0, 1] });
const KARAKTERLER = Object.freeze(['player', 'adventurer', 'female', 'soldier', 'zombie']);
// Zorluk: 0 kolay, 1 orta (varsayılan), 2 zor, 3 çok zor. Orta dışındaki seviyelerin skor ve hayalet kayıtları ayrı anahtarlarda tutulur.
const zSonek = (z) => (z === 1 || !Number.isInteger(z) ? '' : '.z' + z);
// ISO hafta kimliği (yıl-Hnn, yerel tarih): haftalık meydan okuma kulesi ve kayıt anahtarları için.
function haftaKimlik(tarih = new Date()) {
  const d = new Date(Date.UTC(tarih.getFullYear(), tarih.getMonth(), tarih.getDate())), gun = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - gun); const yil = d.getUTCFullYear(), ilk = new Date(Date.UTC(yil, 0, 1));
  return yil + '-H' + String(Math.ceil(((d - ilk) / 86400000 + 1) / 7)).padStart(2, '0');
}
const AYAR = { ...VARSAYILAN, azaltilmisHareket: AZ };
const ANAHTAR = 'buzkule.ayar';

function ayarYukle() {
  try {
    const k = JSON.parse(localStorage.getItem(ANAHTAR) || 'null');
    if (k) for (const a of Object.keys(VARSAYILAN)) if (typeof k[a] === 'number' && k[a] >= ARALIK[a][0] && k[a] <= ARALIK[a][1]) AYAR[a] = k[a];
  } catch { /* kayıt yoksa varsayılanlar */ }
}
function ayarKaydet() {
  try { localStorage.setItem(ANAHTAR, JSON.stringify(Object.fromEntries(Object.keys(VARSAYILAN).map(a => [a, AYAR[a]])))); } catch { /* sessiz */ }
}
function ayarSifirla() { Object.assign(AYAR, VARSAYILAN); ayarKaydet(); }

// ---- dil_veri ----
// description: Buz Kule dil tabloları (arac/dil-derle.py üretir, elle düzenleme; kaynak arac/dil/*.json). sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
const DILVERI = {"ar": {"h01": "ساحة لعبة برج الجليد: الشخصية تتسلق البرج", "h02": "القائمة", "h03": "نمط اللعب", "h04": "برج جديد عشوائي في كل مرة", "h05": "برج أفضل لعبة لك؛ يجري تسجيلها كشبح شبه شفاف", "h06": "برج ثابت خاص باليوم؛ شبح أفضل تسجيل يومي", "h07": "الصعوبة", "h08": "تتحرك الكاميرا ببطء أكبر", "h09": "السرعة الافتراضية", "h10": "تتحرك الكاميرا بسرعة", "h11": "تتحرك الكاميرا بسرعة كبيرة جدًا", "h12": "اختيار لون الأثر", "h13": "أزرار الصوت", "h14": "قفز عمودي", "h15": "برج الجليد", "h16": "تسلّق البرج، اصنع كومبو، ولا تسقط.", "h17": "العب", "h18": "المتجر", "h19": "الإنجازات", "h20": "الإعدادات", "h21": "طريقة اللعب", "h22": "أفضل نتيجة", "h23": "محفظة البلّور:", "h24": "نمط اللعب", "h25": "برج جديد", "h26": "سباق مع الشبح", "h27": "برج اليوم", "h28": "الصعوبة", "h29": "سهل", "h30": "متوسط", "h31": "صعب", "h32": "صعب جدًا", "h33": "لوحة النتائج (النمط المختار، أفضل 5)", "h34": "ابدأ", "h35": "محفظة البلّور", "h36": "لون الأثر", "h37": "البلّورات التي تجمعها في اللعبة تُضاف هنا. لون الأثر يغيّر المظهر فقط.", "h38": "الإنجازات", "h39": "كل إنجاز يمنحك مكافأة من البلّور عند فتحه لأول مرة.", "h40": "التوهّج", "h41": "الجسيمات", "h42": "اهتزاز الشاشة", "h43": "معلومات اللعب (HUD)", "h44": "الصوت", "h45": "الشخصية", "h46": "المؤثرات", "h47": "الموسيقى", "h48": "استعادة الافتراضي", "h49": "اركض؛ كلما زادت سرعتك ارتفع قفزك.", "h50": "اقفز. عند الارتداد عن الجدار تحتفظ بمعظم سرعتك.", "h51": "اقفز طابقين متتاليين على الأقل لتصنع كومبو؛ وعند القفز بسرعة تنقلب الشخصية في الهواء. يجب أن تقفز قفزة كومبو جديدة قبل أن ينتهي العدّاد.", "h52": "المس بلّورات الجليد الطافية: كل واحدة +25 نقطة، ويمكنك إنفاقها في المتجر.", "h53": "الدرجة الجليدية المتشقّقة تنكسر بعد 0٫6 ثانية، فاعبر بسرعة. الدرجة الحمراء ذات النابض ترميك للأعلى وتجعلك تنقلب.", "h54": "الساعة تبطئ البرج، والمغناطيس يجذب البلّورات القريبة. تتشبّث بحواف الدرجات لوقت قصير ويمكنك القفز حتى أثناء السقوط من الحافة.", "h55": "إيقاف مؤقت،", "h56": "إعادة البدء. بعد الطابق 5 يبدأ البرج بالتحرك ويزداد سرعة كل 30 ثانية.", "h57": "متوقفة مؤقتًا", "h58": "خذ نفسًا", "h59": "للمتابعة", "h60": "، لإعادة البدء", "h61": "، للعودة إلى القائمة", "h62": "هزمك البرج", "h63": "تسلّق رائع", "h64": "أكبر كومبو:", "h65": "طابق", "h66": "★ رقم قياسي جديد", "h67": "أُضيفت إلى محفظة البلّور", "h68": "حاول مجددًا", "j_en_iyi": "الأفضل", "j_kat": "طابق", "j_kule_no": "رقم البرج", "j_alindi": "تم الحصول عليه", "j_sec": "اختيار", "j_secili": "مختار", "j_acik": "مفعّل", "j_kapali": "متوقف", "j_efektler": "المؤثرات", "j_muzik": "الموسيقى", "j_hayalet_gecti": "تجاوزت الشبح! ({n})", "j_hayalet_onde": "الشبح في المقدمة: {n}", "j_dustun": "سقطت في الطابق {n}", "j_dustun_asagi": "سقطت في الطابق {n} (بفارق {k} طابقًا للأسفل)", "j_azalt_not": "إعداد النظام «تقليل الحركة» مفعّل: الاهتزاز متوقف، والجسيمات مخفّضة، والرسوم المتحركة ثابتة.", "j_ayar_not": "تُطبَّق الإعدادات فورًا وتُحفظ؛ قواعد اللعبة لا تتغير.", "j_karakter": "الشخصية: {ad}", "kar_0": "الأخضر", "kar_1": "المستكشف", "kar_2": "الأحمر", "kar_3": "الجندي", "kar_4": "الزومبي", "iz_0": "أزرق جليدي", "iz_1": "ذهبي", "iz_2": "وردي", "iz_3": "زمردي", "iz_4": "قوس قزح", "b_kat10_ad": "الدرجات الأولى", "b_kat10_acik": "اصل إلى الطابق 10", "b_kat50_ad": "منتصف الطريق", "b_kat50_acik": "اصل إلى الطابق 50", "b_kat100_ad": "فوق الغيوم", "b_kat100_acik": "اصل إلى الطابق 100", "b_kristal10_ad": "صائد البلّور", "b_kristal10_acik": "اجمع 10 بلّورات في لعبة واحدة", "b_kombo20_ad": "سلسلة متصلة", "b_kombo20_acik": "اصعد 20 طابقًا بكومبو واحد", "b_yay3_ad": "قُذفت للأعلى", "b_yay3_acik": "انطلق من 3 نوابض في لعبة واحدة", "b_dayanikli_ad": "صلب العود", "b_dayanikli_acik": "ابقَ حيًّا لمدة دقيقتين", "hud_1up": "1UP", "hud_rekor": "الرقم القياسي", "hud_kat": "الطابق", "hud_hayalet": "الشبح", "hud_bitti": "انتهى", "hud_saat": "الساعة", "hud_miknatis": "المغناطيس", "hud_kombo": "كومبو", "hud_kombo_bitti": "انتهى الكومبو", "hud_puan": "النقاط", "hud_hizlaniyor": "تسارع!", "hud_basarim": "إنجاز!", "hud_kil_payi": "نجوت!", "hud_rekor_kat": "أعلى طابق", "hud_yeni_kat_rekoru": "رقم جديد", "hud_odul0": "جيد", "hud_odul1": "لطيف", "hud_odul2": "رائع", "hud_odul3": "ممتاز", "hud_odul4": "مذهل", "hud_odul5": "لا يصدق", "hud_odul6": "أسطوري", "hud_odul7": "ملحمي", "hud_odul8": "خرافي", "hud_odul9": "لا تشوبه شائبة", "j_dil": "اللغة", "j_profil": "{n} لعبة · أعلى طابق {k} · أكبر كومبو {c}", "j_golge": "ظل الهبوط", "j_perde": "مرشح الكومبو", "j_kaygan": "جليد زلق", "j_ozellikler": "ميزات إضافية", "j_hayalet_goster": "شبح", "j_kontrast": "تباين عالٍ", "j_mukemmel": "هبوط مثالي", "hud_mukemmel": "مثالي", "j_muzik_ses": "مستوى الموسيقى", "j_haftalik": "برج الأسبوع", "j_haftalik_ipucu": "برج ثابت لهذا الأسبوع؛ شبح أفضل سجل أسبوعي", "j_kod_etiket": "رمز البرج", "j_kod_oyna": "العب بهذا الرمز", "j_kod_gecersiz": "رمز غير صالح", "j_ozet_kopyala": "نسخ الملخص", "j_kopyalandi": "تم النسخ", "j_ozet_metin": "برج الجليد: الطابق {k}، {s} نقطة، أفضل كومبو {c}، رمز البرج {kod}", "j_kuleler": "الأبراج", "j_kule_buz": "برج الجليد", "j_kule_kor": "برج الجمر", "j_kule_run": "برج الرونية", "j_kule_kum": "برج الرمال", "j_kule_yildiz": "برج النجوم", "j_kule_basarim": "إنجاز: {ad}", "j_kule_fiyat": "افتحه بـ {n} ◆", "j_kule_kilidi": "أقفال الأبراج", "j_kule_ipucu": "الأبراج تغيّر المظهر فقط، ولكل برج لوحة نتائج خاصة به. يمكنك إيقاف الأقفال من الإعدادات.", "j_kule_efekt": "تأثيرات البرج"}, "bn": {"h01": "বরফ টাওয়ার খেলার মাঠ: চরিত্রটি টাওয়ারে উঠছে", "h02": "মেনু", "h03": "খেলার ধরন", "h04": "প্রতিবার নতুন, এলোমেলো একটি টাওয়ার", "h05": "তোমার সেরা খেলার টাওয়ার; রেকর্ডটি আধা-স্বচ্ছ ভূত হয়ে দৌড়ায়", "h06": "আজকের জন্য নির্দিষ্ট টাওয়ার; দৈনিক সেরা রেকর্ডের ভূত", "h07": "কঠিনতা", "h08": "ক্যামেরা আরও ধীরে সরে", "h09": "ডিফল্ট গতি", "h10": "ক্যামেরা দ্রুত সরে", "h11": "ক্যামেরা খুব দ্রুত সরে", "h12": "ট্রেইলের রং বাছাই", "h13": "শব্দের বোতাম", "h14": "উল্লম্ব লাফ", "h15": "বরফ টাওয়ার", "h16": "টাওয়ারে ওঠো, কম্বো করো, পড়ে যেয়ো না।", "h17": "খেলো", "h18": "দোকান", "h19": "অর্জন", "h20": "সেটিংস", "h21": "কীভাবে", "h22": "সেরা স্কোর", "h23": "ক্রিস্টাল ওয়ালেট:", "h24": "খেলার ধরন", "h25": "নতুন টাওয়ার", "h26": "ভূতের সাথে দৌড়", "h27": "আজকের টাওয়ার", "h28": "কঠিনতা", "h29": "সহজ", "h30": "মাঝারি", "h31": "কঠিন", "h32": "খুব কঠিন", "h33": "স্কোরবোর্ড (নির্বাচিত ধরন, সেরা ৫)", "h34": "শুরু", "h35": "ক্রিস্টাল ওয়ালেট", "h36": "ট্রেইলের রং", "h37": "খেলায় যে ক্রিস্টাল সংগ্রহ করো তা এখানে যোগ হয়। ট্রেইলের রং শুধু চেহারা বদলায়।", "h38": "অর্জনসমূহ", "h39": "প্রতিটি অর্জন প্রথমবার আনলক হলে ক্রিস্টাল পুরস্কার দেয়।", "h40": "ঝলক", "h41": "কণা", "h42": "স্ক্রিন কাঁপুনি", "h43": "খেলার ভেতরের তথ্য (HUD)", "h44": "শব্দ", "h45": "চরিত্র", "h46": "ইফেক্ট", "h47": "সংগীত", "h48": "ডিফল্টে ফেরো", "h49": "দৌড়াও; যত দ্রুত, তত উঁচুতে লাফ দেবে।", "h50": "লাফ দাও। দেয়াল থেকে ফিরলে গতির বেশিরভাগ থেকে যায়।", "h51": "টানা অন্তত ২ তলা লাফিয়ে কম্বো করো; দ্রুত লাফালে চরিত্র ডিগবাজি খায়। কাউন্টার ফুরানোর আগে নতুন কম্বো লাফ দিতে হবে।", "h52": "ভাসমান বরফ-ক্রিস্টালে ছোঁয়াও: প্রতিটি +২৫ পয়েন্ট, আবার দোকানে খরচও করা যায়।", "h53": "ফাটা বরফের ধাপ ০,৬ সেকেন্ড পরে ভেঙে যায়, দ্রুত পার হও। লাল স্প্রিংয়ের ধাপ তোমাকে ওপরে ছুড়ে দেয় ও ডিগবাজি খাওয়ায়।", "h54": "ঘড়ি টাওয়ারকে ধীর করে, চুম্বক কাছের ক্রিস্টাল টানে। ধাপের কিনারায় অল্প সময় আঁকড়ে থাকা যায় এবং কিনারা থেকে পড়ার সময়ও লাফ দেওয়া যায়।", "h55": "বিরতি,", "h56": "আবার শুরু। ৫ম তলার পর টাওয়ার সরতে থাকে, প্রতি ৩০ সেকেন্ডে গতি বাড়ে।", "h57": "বিরতিতে", "h58": "একটু দম নাও", "h59": "চালিয়ে যেতে", "h60": ", আবার শুরু করতে", "h61": ", মেনুতে ফিরতে", "h62": "টাওয়ার তোমাকে হারিয়ে দিল", "h63": "দারুণ ওঠা", "h64": "সবচেয়ে বড় কম্বো:", "h65": "তলা", "h66": "★ নতুন রেকর্ড", "h67": "ক্রিস্টাল ওয়ালেটে যোগ হয়েছে", "h68": "আবার চেষ্টা করো", "j_en_iyi": "সেরা", "j_kat": "তলা", "j_kule_no": "টাওয়ার নম্বর", "j_alindi": "নেওয়া হয়েছে", "j_sec": "বাছাই", "j_secili": "বাছাই করা", "j_acik": "চালু", "j_kapali": "বন্ধ", "j_efektler": "ইফেক্ট", "j_muzik": "সংগীত", "j_hayalet_gecti": "ভূতকে ছাড়িয়ে গেলে! ({n})", "j_hayalet_onde": "ভূত এগিয়ে: {n}", "j_dustun": "{n} নম্বর তলায় পড়ে গেলে", "j_dustun_asagi": "{n} নম্বর তলায় পড়ে গেলে ({k} তলা নিচে)", "j_azalt_not": "সিস্টেমের \"গতি কমাও\" সেটিং চালু: কাঁপুনি বন্ধ, কণা কমানো, অ্যানিমেশন স্থির।", "j_ayar_not": "সেটিংস সঙ্গে সঙ্গে প্রয়োগ ও সংরক্ষণ হয়; খেলার নিয়ম বদলায় না।", "j_karakter": "চরিত্র: {ad}", "kar_0": "সবুজ", "kar_1": "অভিযাত্রী", "kar_2": "লালচুল", "kar_3": "সৈনিক", "kar_4": "জম্বি", "iz_0": "বরফ নীল", "iz_1": "সোনালি", "iz_2": "গোলাপি", "iz_3": "পান্না সবুজ", "iz_4": "রংধনু", "b_kat10_ad": "প্রথম ধাপগুলো", "b_kat10_acik": "১০ম তলায় পৌঁছাও", "b_kat50_ad": "অর্ধেক পথ", "b_kat50_acik": "৫০তম তলায় পৌঁছাও", "b_kat100_ad": "মেঘের ওপরে", "b_kat100_acik": "১০০তম তলায় পৌঁছাও", "b_kristal10_ad": "ক্রিস্টাল শিকারি", "b_kristal10_acik": "এক খেলায় ১০টি ক্রিস্টাল সংগ্রহ করো", "b_kombo20_ad": "শিকলের টান", "b_kombo20_acik": "এক কম্বোয় ২০ তলা ওঠো", "b_yay3_ad": "ছিটকে গেলাম", "b_yay3_acik": "এক খেলায় ৩টি স্প্রিং থেকে ছিটকে ওঠো", "b_dayanikli_ad": "টেকসই", "b_dayanikli_acik": "২ মিনিট টিকে থাকো", "hud_1up": "1UP", "hud_rekor": "রেকর্ড", "hud_kat": "তলা", "hud_hayalet": "ভূত", "hud_bitti": "শেষ", "hud_saat": "ঘড়ি", "hud_miknatis": "চুম্বক", "hud_kombo": "কম্বো", "hud_kombo_bitti": "কম্বো শেষ", "hud_puan": "পয়েন্ট", "hud_hizlaniyor": "দ্রুততর!", "hud_basarim": "অর্জন!", "hud_kil_payi": "অল্পের জন্য!", "hud_rekor_kat": "সেরা তলা", "hud_yeni_kat_rekoru": "নতুন রেকর্ড", "hud_odul0": "ভালো", "hud_odul1": "সুন্দর", "hud_odul2": "দারুণ", "hud_odul3": "সুপার", "hud_odul4": "চমৎকার", "hud_odul5": "অবিশ্বাস্য", "hud_odul6": "কিংবদন্তি", "hud_odul7": "মহাকাব্য", "hud_odul8": "অসাধারণ", "hud_odul9": "নিখুঁত", "j_dil": "ভাষা", "j_profil": "{n}টি খেলা · সর্বোচ্চ তলা {k} · সবচেয়ে বড় কম্বো {c}", "j_golge": "অবতরণ ছায়া", "j_perde": "কম্বো ফিল্টার", "j_kaygan": "পিচ্ছিল বরফ", "j_ozellikler": "অতিরিক্ত বৈশিষ্ট্য", "j_hayalet_goster": "ভূত", "j_kontrast": "উচ্চ কনট্রাস্ট", "j_mukemmel": "নিখুঁত অবতরণ", "hud_mukemmel": "পারফেক্ট", "j_muzik_ses": "সঙ্গীতের মাত্রা", "j_haftalik": "সপ্তাহের টাওয়ার", "j_haftalik_ipucu": "এই সপ্তাহের স্থির টাওয়ার; সাপ্তাহিক সেরা রেকর্ডের ভূত", "j_kod_etiket": "টাওয়ার কোড", "j_kod_oyna": "এই কোড দিয়ে খেলুন", "j_kod_gecersiz": "অবৈধ কোড", "j_ozet_kopyala": "সারাংশ কপি করুন", "j_kopyalandi": "কপি হয়েছে", "j_ozet_metin": "বরফ টাওয়ার: তল {k}, {s} পয়েন্ট, সেরা কম্বো {c}, টাওয়ার কোড {kod}", "j_kuleler": "টাওয়ার", "j_kule_buz": "বরফ টাওয়ার", "j_kule_kor": "অঙ্গার টাওয়ার", "j_kule_run": "রুন টাওয়ার", "j_kule_kum": "বালু টাওয়ার", "j_kule_yildiz": "তারা টাওয়ার", "j_kule_basarim": "অর্জন: {ad}", "j_kule_fiyat": "{n} ◆ দিয়ে খুলুন", "j_kule_kilidi": "টাওয়ার লক", "j_kule_ipucu": "টাওয়ার শুধু চেহারা বদলায়; প্রতিটি টাওয়ারের আলাদা স্কোরবোর্ড আছে। সেটিংস থেকে লক বন্ধ করা যায়।", "j_kule_efekt": "টাওয়ার এফেক্ট"}, "en": {"h01": "Ice Tower play area: the character climbs the tower", "h02": "Menu", "h03": "Game mode", "h04": "A new random tower every time", "h05": "The tower of your best run; your record plays as a translucent ghost", "h06": "Today's fixed tower; the ghost of the daily best record", "h07": "Difficulty", "h08": "The camera scrolls slower", "h09": "Default speed", "h10": "The camera scrolls fast", "h11": "The camera scrolls very fast", "h12": "Trail color selection", "h13": "Sound buttons", "h14": "vertical jumper", "h15": "Ice Tower", "h16": "Climb the tower, chain combos, don't fall.", "h17": "Play", "h18": "Shop", "h19": "Achievements", "h20": "Settings", "h21": "How to", "h22": "best score", "h23": "Crystal wallet:", "h24": "game mode", "h25": "New tower", "h26": "Race the ghost", "h27": "Tower of the day", "h28": "difficulty", "h29": "Easy", "h30": "Medium", "h31": "Hard", "h32": "Very hard", "h33": "leaderboard (selected mode, top 5)", "h34": "Start", "h35": "crystal wallet", "h36": "trail color", "h37": "Crystals you collect in the game are added here. Trail color only changes the look.", "h38": "achievements", "h39": "Each achievement gives a crystal reward the first time you unlock it.", "h40": "Glow", "h41": "Particles", "h42": "Screen shake", "h43": "In-game info (HUD)", "h44": "Sound", "h45": "Character", "h46": "Effects", "h47": "Music", "h48": "Reset to default", "h49": "to run; the faster you are, the higher you jump.", "h50": "to jump. Bouncing off a wall keeps most of your speed.", "h51": "Jump at least 2 floors in a row to build a combo; jump fast and the character does a flip. You need to jump again before the counter runs out.", "h52": "Touch the floating ice crystals: each is worth +25 points and can be spent in the shop.", "h53": "A cracked ice platform breaks after 0.6 s, so move fast. A red spring platform launches you up and sends you into a flip.", "h54": "The clock slows the tower down, the magnet pulls in nearby crystals. You cling to platform edges briefly and can even jump while falling off an edge.", "h55": "to pause,", "h56": "to restart. After floor 5 the tower scrolls and speeds up every 30 s.", "h57": "paused", "h58": "Take a breath", "h59": "To continue, press", "h60": ", to restart, press", "h61": ", to go back to the menu, press", "h62": "the tower beat you", "h63": "Nice climb", "h64": "biggest combo:", "h65": "floor", "h66": "★ New record", "h67": "crystals added to wallet", "h68": "Try again", "j_en_iyi": "best", "j_kat": "floor", "j_kule_no": "tower no.", "j_alindi": "collected", "j_sec": "Select", "j_secili": "Selected", "j_acik": "ON", "j_kapali": "OFF", "j_efektler": "Effects", "j_muzik": "Music", "j_hayalet_gecti": "You passed the ghost! ({n})", "j_hayalet_onde": "Ghost ahead: {n}", "j_dustun": "You fell on floor {n}", "j_dustun_asagi": "You fell on floor {n} ({k} floors down)", "j_azalt_not": "Your system \"reduce motion\" setting is on: shake is off, particles are reduced, animations are static.", "j_ayar_not": "Settings apply live and are saved; game rules don't change.", "j_karakter": "Character: {ad}", "kar_0": "Green", "kar_1": "Explorer", "kar_2": "Redhead", "kar_3": "Soldier", "kar_4": "Zombie", "iz_0": "Ice blue", "iz_1": "Gold", "iz_2": "Rose", "iz_3": "Emerald", "iz_4": "Rainbow", "b_kat10_ad": "First steps", "b_kat10_acik": "Reach floor 10", "b_kat50_ad": "Halfway there", "b_kat50_acik": "Reach floor 50", "b_kat100_ad": "Above the clouds", "b_kat100_acik": "Reach floor 100", "b_kristal10_ad": "Crystal hunter", "b_kristal10_acik": "Collect 10 crystals in one run", "b_kombo20_ad": "Chain reaction", "b_kombo20_acik": "Climb 20 floors in a single combo", "b_yay3_ad": "Launched!", "b_yay3_acik": "Bounce off 3 springs in one run", "b_dayanikli_ad": "Tough", "b_dayanikli_acik": "Survive for 2 minutes", "hud_1up": "1UP", "hud_rekor": "BEST", "hud_kat": "FLOOR", "hud_hayalet": "GHOST", "hud_bitti": "OVER", "hud_saat": "CLOCK", "hud_miknatis": "MAGNET", "hud_kombo": "COMBO", "hud_kombo_bitti": "COMBO OVER", "hud_puan": "SCORE", "hud_hizlaniyor": "SPEEDING UP", "hud_basarim": "ACHIEVEMENT!", "hud_kil_payi": "CLOSE CALL!", "hud_rekor_kat": "BEST FLOOR", "hud_yeni_kat_rekoru": "NEW FLOOR RECORD", "hud_odul0": "GOOD", "hud_odul1": "NICE", "hud_odul2": "GREAT", "hud_odul3": "SUPER", "hud_odul4": "AMAZING", "hud_odul5": "INCREDIBLE", "hud_odul6": "OUTSTANDING", "hud_odul7": "LEGENDARY", "hud_odul8": "EPIC", "hud_odul9": "FLAWLESS", "j_dil": "Language", "j_profil": "{n} games · highest floor {k} · biggest combo {c}", "j_golge": "Landing shadow", "j_perde": "Combo filter", "j_kaygan": "Slippery ice", "j_ozellikler": "Extra features", "j_hayalet_goster": "Ghost", "j_kontrast": "High contrast", "j_mukemmel": "Perfect landing", "hud_mukemmel": "PERFECT", "j_muzik_ses": "Music level", "j_haftalik": "Tower of the week", "j_haftalik_ipucu": "A fixed tower for this week; the ghost of the best weekly record", "j_kod_etiket": "Tower code", "j_kod_oyna": "Play with this code", "j_kod_gecersiz": "Invalid code", "j_ozet_kopyala": "Copy summary", "j_kopyalandi": "Copied", "j_ozet_metin": "Ice Tower: floor {k}, {s} points, best combo {c}, tower code {kod}", "j_kuleler": "Towers", "j_kule_buz": "Ice Tower", "j_kule_kor": "Ember Tower", "j_kule_run": "Rune Tower", "j_kule_kum": "Sand Tower", "j_kule_yildiz": "Star Tower", "j_kule_basarim": "Achievement: {ad}", "j_kule_fiyat": "Unlock for {n} ◆", "j_kule_kilidi": "Tower locks", "j_kule_ipucu": "Towers only change the look; each tower has its own scoreboard. You can turn locks off in Settings.", "j_kule_efekt": "Tower effects"}, "es": {"h01": "Zona de juego de Torre de Hielo: el personaje sube por la torre", "h02": "Menú", "h03": "Modo de juego", "h04": "Una torre nueva y aleatoria cada vez", "h05": "La torre de tu mejor partida; tu récord corre como un fantasma translúcido", "h06": "Torre fija de hoy; el fantasma del mejor récord del día", "h07": "Dificultad", "h08": "La cámara avanza más despacio", "h09": "Velocidad predeterminada", "h10": "La cámara avanza rápido", "h11": "La cámara avanza muy rápido", "h12": "Selección del color de la estela", "h13": "Botones de sonido", "h14": "saltador vertical", "h15": "Torre de Hielo", "h16": "Sube la torre, encadena combos, no caigas.", "h17": "Jugar", "h18": "Tienda", "h19": "Logros", "h20": "Ajustes", "h21": "Cómo jugar", "h22": "mejor puntuación", "h23": "Monedero de cristales:", "h24": "modo de juego", "h25": "Torre nueva", "h26": "Carrera con el fantasma", "h27": "Torre del día", "h28": "dificultad", "h29": "Fácil", "h30": "Media", "h31": "Difícil", "h32": "Muy difícil", "h33": "clasificación (modo elegido, top 5)", "h34": "Empezar", "h35": "monedero de cristales", "h36": "color de la estela", "h37": "Los cristales que recoges en el juego se añaden aquí. El color de la estela solo cambia el aspecto.", "h38": "logros", "h39": "Cada logro da una recompensa de cristales la primera vez que lo desbloqueas.", "h40": "Brillo", "h41": "Partículas", "h42": "Temblor de pantalla", "h43": "Información en juego (HUD)", "h44": "Sonido", "h45": "Personaje", "h46": "Efectos", "h47": "Música", "h48": "Restablecer valores", "h49": "para correr; cuanto más rápido vas, más alto saltas.", "h50": "para saltar. Al rebotar en una pared conservas casi toda la velocidad.", "h51": "Salta al menos 2 pisos seguidos para hacer un combo; si saltas rápido, el personaje da una voltereta. Debes volver a saltar antes de que se agote el contador.", "h52": "Toca los cristales de hielo flotantes: cada uno da +25 puntos y además se gasta en la tienda.", "h53": "La plataforma de hielo agrietada se rompe a los 0,6 s, así que pasa rápido. La plataforma roja con resorte te lanza hacia arriba y te hace dar una voltereta.", "h54": "El reloj frena la torre y el imán atrae los cristales cercanos. Te agarras un instante a los bordes de las plataformas y puedes saltar incluso al caer de un borde.", "h55": "para pausar,", "h56": "para reiniciar. Después del piso 5 la torre avanza y se acelera cada 30 s.", "h57": "en pausa", "h58": "Respira un momento", "h59": "Para continuar, pulsa", "h60": ", para reiniciar, pulsa", "h61": ", para volver al menú, pulsa", "h62": "la torre te ha vencido", "h63": "Buena subida", "h64": "combo más grande:", "h65": "piso", "h66": "★ Nuevo récord", "h67": "cristales añadidos al monedero", "h68": "Reintentar", "j_en_iyi": "mejor", "j_kat": "piso", "j_kule_no": "torre n.º", "j_alindi": "obtenido", "j_sec": "Elegir", "j_secili": "Elegido", "j_acik": "SÍ", "j_kapali": "NO", "j_efektler": "Efectos", "j_muzik": "Música", "j_hayalet_gecti": "¡Superaste al fantasma! ({n})", "j_hayalet_onde": "Fantasma delante: {n}", "j_dustun": "Caíste en el piso {n}", "j_dustun_asagi": "Caíste en el piso {n} ({k} pisos abajo)", "j_azalt_not": "Tu sistema tiene activada la opción \"reducir movimiento\": temblor desactivado, menos partículas, animaciones estáticas.", "j_ayar_not": "Los ajustes se aplican al instante y se guardan; las reglas del juego no cambian.", "j_karakter": "Personaje: {ad}", "kar_0": "Verde", "kar_1": "Explorador", "kar_2": "Pelirroja", "kar_3": "Soldado", "kar_4": "Zombi", "iz_0": "Azul hielo", "iz_1": "Oro", "iz_2": "Rosa", "iz_3": "Esmeralda", "iz_4": "Arcoíris", "b_kat10_ad": "Primeros peldaños", "b_kat10_acik": "Llega al piso 10", "b_kat50_ad": "A medio camino", "b_kat50_acik": "Llega al piso 50", "b_kat100_ad": "Sobre las nubes", "b_kat100_acik": "Llega al piso 100", "b_kristal10_ad": "Cazador de cristales", "b_kristal10_acik": "Recoge 10 cristales en una partida", "b_kombo20_ad": "Reacción en cadena", "b_kombo20_acik": "Sube 20 pisos con un solo combo", "b_yay3_ad": "¡Lanzado!", "b_yay3_acik": "Sal disparado de 3 resortes en una partida", "b_dayanikli_ad": "Resistente", "b_dayanikli_acik": "Sobrevive 2 minutos", "hud_1up": "1UP", "hud_rekor": "RECORD", "hud_kat": "PISO", "hud_hayalet": "FANTASMA", "hud_bitti": "FIN", "hud_saat": "RELOJ", "hud_miknatis": "IMAN", "hud_kombo": "COMBO", "hud_kombo_bitti": "FIN DE COMBO", "hud_puan": "PUNTOS", "hud_hizlaniyor": "ACELERANDO", "hud_basarim": "LOGRO!", "hud_kil_payi": "POR POCO!", "hud_rekor_kat": "MEJOR PISO", "hud_yeni_kat_rekoru": "NUEVO RECORD", "hud_odul0": "BIEN", "hud_odul1": "BUENO", "hud_odul2": "GENIAL", "hud_odul3": "SUPER", "hud_odul4": "ESTUPENDO", "hud_odul5": "INCREIBLE", "hud_odul6": "ASOMBROSO", "hud_odul7": "LEGENDARIO", "hud_odul8": "EPICO", "hud_odul9": "PERFECTO", "j_dil": "Idioma", "j_profil": "{n} partidas · piso más alto {k} · combo más grande {c}", "j_golge": "Sombra de aterrizaje", "j_perde": "Filtro de combo", "j_kaygan": "Hielo resbaladizo", "j_ozellikler": "Funciones extra", "j_hayalet_goster": "Fantasma", "j_kontrast": "Alto contraste", "j_mukemmel": "Aterrizaje perfecto", "hud_mukemmel": "PERFECTO", "j_muzik_ses": "Nivel de música", "j_haftalik": "Torre de la semana", "j_haftalik_ipucu": "Torre fija de esta semana; el fantasma de tu mejor récord semanal", "j_kod_etiket": "Código de torre", "j_kod_oyna": "Jugar con este código", "j_kod_gecersiz": "Código no válido", "j_ozet_kopyala": "Copiar resumen", "j_kopyalandi": "Copiado", "j_ozet_metin": "Torre de Hielo: piso {k}, {s} puntos, mejor combo {c}, código de torre {kod}", "j_kuleler": "Torres", "j_kule_buz": "Torre de Hielo", "j_kule_kor": "Torre de Brasas", "j_kule_run": "Torre de Runas", "j_kule_kum": "Torre de Arena", "j_kule_yildiz": "Torre Estelar", "j_kule_basarim": "Logro: {ad}", "j_kule_fiyat": "Desbloquear por {n} ◆", "j_kule_kilidi": "Cerrojos de torres", "j_kule_ipucu": "Las torres solo cambian el aspecto; cada una tiene su propia tabla de puntuaciones. Puedes desactivar los cerrojos en Ajustes.", "j_kule_efekt": "Efectos de la torre"}, "fr": {"h01": "Aire de jeu de Buz Kule : le personnage grimpe la tour", "h02": "Menu", "h03": "Mode de jeu", "h04": "Une nouvelle tour aléatoire à chaque partie", "h05": "La tour de ta meilleure partie ; ton enregistrement court en fantôme translucide", "h06": "Une tour fixe pour aujourd'hui ; le fantôme du meilleur score du jour", "h07": "Difficulté", "h08": "La caméra défile plus lentement", "h09": "Vitesse par défaut", "h10": "La caméra défile vite", "h11": "La caméra défile très vite", "h12": "Choix de la couleur de traînée", "h13": "Boutons du son", "h14": "saut vertical", "h15": "Buz Kule", "h16": "Grimpe la tour, enchaîne les combos, ne tombe pas.", "h17": "Jouer", "h18": "Boutique", "h19": "Succès", "h20": "Réglages", "h21": "Comment jouer", "h22": "meilleur score", "h23": "Bourse de cristaux :", "h24": "mode de jeu", "h25": "Nouvelle tour", "h26": "Course contre le fantôme", "h27": "Tour du jour", "h28": "difficulté", "h29": "Facile", "h30": "Moyen", "h31": "Difficile", "h32": "Très difficile", "h33": "classement (mode choisi, top 5)", "h34": "Démarrer", "h35": "bourse de cristaux", "h36": "couleur de traînée", "h37": "Les cristaux ramassés en jeu sont ajoutés ici. La couleur de traînée ne change que l'apparence.", "h38": "succès", "h39": "Chaque succès donne une récompense en cristaux à son premier déblocage.", "h40": "Éclat", "h41": "Particules", "h42": "Secousses d'écran", "h43": "Infos en jeu (HUD)", "h44": "Son", "h45": "Personnage", "h46": "Effets", "h47": "Musique", "h48": "Rétablir les valeurs par défaut", "h49": "pour courir ; plus tu vas vite, plus tu sautes haut.", "h50": "pour sauter. En rebondissant sur un mur, tu gardes presque toute ta vitesse.", "h51": "Saute d'au moins 2 étages d'affilée pour faire un combo ; en sautant vite, le personnage fait un salto. Enchaîne un nouveau saut combo avant que le compteur ne se vide.", "h52": "Touche les cristaux de glace flottants : chacun vaut +25 points et peut aussi être dépensé en boutique.", "h53": "La plateforme de glace fissurée se brise après 0,6 s, passe vite. La plateforme à ressort rouge te propulse vers le haut avec un salto.", "h54": "L'horloge ralentit la tour, l'aimant attire les cristaux proches. Tu t'accroches brièvement aux bords des plateformes et tu peux même sauter en tombant du bord.", "h55": "pause,", "h56": "recommencer. Après l'étage 5, la tour défile et accélère toutes les 30 s.", "h57": "en pause", "h58": "Respire un coup", "h59": "Pour continuer :", "h60": ", pour recommencer :", "h61": ", pour revenir au menu :", "h62": "la tour t'a vaincu", "h63": "Belle ascension", "h64": "plus gros combo :", "h65": "étage", "h66": "★ Nouveau record", "h67": "cristaux ajoutés à la bourse", "h68": "Réessayer", "j_en_iyi": "meilleur", "j_kat": "étage", "j_kule_no": "tour n°", "j_alindi": "obtenu", "j_sec": "Choisir", "j_secili": "Choisi", "j_acik": "ACTIVÉ", "j_kapali": "DÉSACTIVÉ", "j_efektler": "Effets", "j_muzik": "Musique", "j_hayalet_gecti": "Tu as dépassé le fantôme ! ({n})", "j_hayalet_onde": "Le fantôme est devant : {n}", "j_dustun": "Tu es tombé à l'étage {n}", "j_dustun_asagi": "Tu es tombé à l'étage {n} (de {k} étages)", "j_azalt_not": "L'option système « réduire les animations » est activée : secousses désactivées, particules réduites, animations figées.", "j_ayar_not": "Les réglages s'appliquent en direct et sont enregistrés ; les règles du jeu ne changent pas.", "j_karakter": "Personnage : {ad}", "kar_0": "Vert", "kar_1": "Explorateur", "kar_2": "Rouquin", "kar_3": "Soldat", "kar_4": "Zombie", "iz_0": "Bleu glace", "iz_1": "Or", "iz_2": "Rose", "iz_3": "Émeraude", "iz_4": "Arc-en-ciel", "b_kat10_ad": "Premières marches", "b_kat10_acik": "Atteins l'étage 10", "b_kat50_ad": "À mi-chemin", "b_kat50_acik": "Atteins l'étage 50", "b_kat100_ad": "Au-dessus des nuages", "b_kat100_acik": "Atteins l'étage 100", "b_kristal10_ad": "Chasseur de cristaux", "b_kristal10_acik": "Ramasse 10 cristaux en une partie", "b_kombo20_ad": "Réaction en chaîne", "b_kombo20_acik": "Monte de 20 étages en un seul combo", "b_yay3_ad": "Propulsé !", "b_yay3_acik": "Sois propulsé par 3 ressorts en une partie", "b_dayanikli_ad": "Résistant", "b_dayanikli_acik": "Survis 2 minutes", "hud_1up": "1UP", "hud_rekor": "RECORD", "hud_kat": "ETAGE", "hud_hayalet": "FANTOME", "hud_bitti": "FINI", "hud_saat": "HORLOGE", "hud_miknatis": "AIMANT", "hud_kombo": "COMBO", "hud_kombo_bitti": "COMBO FINI", "hud_puan": "SCORE", "hud_hizlaniyor": "ACCELERATION", "hud_basarim": "SUCCES !", "hud_kil_payi": "DE JUSTESSE !", "hud_rekor_kat": "ETAGE RECORD", "hud_yeni_kat_rekoru": "NOUVEAU RECORD", "hud_odul0": "BIEN", "hud_odul1": "JOLI", "hud_odul2": "SUPER", "hud_odul3": "GENIAL", "hud_odul4": "MAGNIFIQUE", "hud_odul5": "INCROYABLE", "hud_odul6": "EXCEPTIONNEL", "hud_odul7": "LEGENDAIRE", "hud_odul8": "EPIQUE", "hud_odul9": "PARFAIT", "j_dil": "Langue", "j_profil": "{n} parties · étage max {k} · plus grand combo {c}", "j_golge": "Ombre d'atterrissage", "j_perde": "Filtre de combo", "j_kaygan": "Glace glissante", "j_ozellikler": "Options supplémentaires", "j_hayalet_goster": "Fantôme", "j_kontrast": "Contraste élevé", "j_mukemmel": "Atterrissage parfait", "hud_mukemmel": "PARFAIT", "j_muzik_ses": "Niveau de musique", "j_haftalik": "Tour de la semaine", "j_haftalik_ipucu": "Tour fixe de cette semaine ; le fantôme de ton meilleur record hebdomadaire", "j_kod_etiket": "Code de la tour", "j_kod_oyna": "Jouer avec ce code", "j_kod_gecersiz": "Code invalide", "j_ozet_kopyala": "Copier le résumé", "j_kopyalandi": "Copié", "j_ozet_metin": "Buz Kule : étage {k}, {s} points, meilleur combo {c}, code de la tour {kod}", "j_kuleler": "Tours", "j_kule_buz": "Tour de Glace", "j_kule_kor": "Tour des Braises", "j_kule_run": "Tour des Runes", "j_kule_kum": "Tour de Sable", "j_kule_yildiz": "Tour Étoilée", "j_kule_basarim": "Succès : {ad}", "j_kule_fiyat": "Débloquer pour {n} ◆", "j_kule_kilidi": "Verrous des tours", "j_kule_ipucu": "Les tours changent seulement l'apparence ; chacune a son propre tableau des scores. Vous pouvez désactiver les verrous dans les Paramètres.", "j_kule_efekt": "Effets de la tour"}, "hi": {"h01": "आइस टॉवर का खेल क्षेत्र: किरदार टॉवर पर चढ़ रहा है", "h02": "मेनू", "h03": "खेल मोड", "h04": "हर बार नया, यादृच्छिक टॉवर", "h05": "आपके सबसे अच्छे खेल का टॉवर; उसका रिकॉर्ड पारदर्शी भूत की तरह दौड़ता है", "h06": "आज का तय टॉवर; दैनिक सर्वश्रेष्ठ रिकॉर्ड का भूत", "h07": "कठिनाई", "h08": "कैमरा धीरे खिसकता है", "h09": "सामान्य गति", "h10": "कैमरा तेज़ खिसकता है", "h11": "कैमरा बहुत तेज़ खिसकता है", "h12": "निशान का रंग चुनें", "h13": "ध्वनि बटन", "h14": "ऊर्ध्वाधर कूद", "h15": "आइस टॉवर", "h16": "टॉवर पर चढ़ो, कॉम्बो बनाओ, गिरो मत।", "h17": "खेलें", "h18": "दुकान", "h19": "उपलब्धियाँ", "h20": "सेटिंग", "h21": "कैसे खेलें", "h22": "सर्वश्रेष्ठ स्कोर", "h23": "क्रिस्टल बटुआ:", "h24": "खेल मोड", "h25": "नया टॉवर", "h26": "भूत से रेस", "h27": "आज का टॉवर", "h28": "कठिनाई", "h29": "आसान", "h30": "मध्यम", "h31": "कठिन", "h32": "बहुत कठिन", "h33": "स्कोरबोर्ड (चुना हुआ मोड, शीर्ष 5)", "h34": "शुरू करें", "h35": "क्रिस्टल बटुआ", "h36": "निशान का रंग", "h37": "खेल में जमा किए क्रिस्टल यहाँ जुड़ते हैं। निशान का रंग सिर्फ़ दिखावट बदलता है।", "h38": "उपलब्धियाँ", "h39": "हर उपलब्धि पहली बार खुलने पर क्रिस्टल इनाम देती है।", "h40": "चमक", "h41": "कण", "h42": "स्क्रीन हिलना", "h43": "खेल की जानकारी (HUD)", "h44": "ध्वनि", "h45": "किरदार", "h46": "प्रभाव", "h47": "संगीत", "h48": "डिफ़ॉल्ट पर लौटें", "h49": "दौड़ो; जितना तेज़ दौड़ोगे उतना ऊँचा कूदोगे।", "h50": "कूदो। दीवार से मुड़ने पर ज़्यादातर गति बनी रहती है।", "h51": "लगातार कम से कम 2 मंज़िल कूदकर कॉम्बो बनाओ; तेज़ कूदने पर किरदार कलाबाज़ी खाता है। मीटर खत्म होने से पहले नया कॉम्बो कूदना होगा।", "h52": "तैरते बर्फ़ीले क्रिस्टल छुओ: हर एक +25 अंक देता है और दुकान में खर्च भी होता है।", "h53": "दरार वाली बर्फ़ की सीढ़ी 0.6 सेकंड बाद टूट जाती है, जल्दी निकलो। लाल स्प्रिंग वाली सीढ़ी तुम्हें ऊपर उछालकर कलाबाज़ी करवाती है।", "h54": "घड़ी टॉवर को धीमा करती है, चुंबक पास के क्रिस्टल खींचता है। सीढ़ी के किनारों पर थोड़ी देर पकड़ बनती है और किनारे से गिरते समय भी कूद सकते हो।", "h55": "रोकें,", "h56": "दोबारा शुरू करें। मंज़िल 5 के बाद टॉवर खिसकने लगता है, हर 30 सेकंड में तेज़ होता है।", "h57": "रुका हुआ", "h58": "थोड़ा दम लो", "h59": "जारी रखने के लिए", "h60": ", दोबारा शुरू करने के लिए", "h61": ", मेनू पर लौटने के लिए", "h62": "टॉवर ने तुम्हें हरा दिया", "h63": "बढ़िया चढ़ाई", "h64": "सबसे बड़ा कॉम्बो:", "h65": "मंज़िल", "h66": "★ नया रिकॉर्ड", "h67": "क्रिस्टल बटुए में जुड़ गए", "h68": "फिर कोशिश करें", "j_en_iyi": "सर्वश्रेष्ठ", "j_kat": "मंज़िल", "j_kule_no": "टॉवर नं.", "j_alindi": "ले लिया", "j_sec": "चुनें", "j_secili": "चुना हुआ", "j_acik": "चालू", "j_kapali": "बंद", "j_efektler": "प्रभाव", "j_muzik": "संगीत", "j_hayalet_gecti": "तुमने भूत को पार कर लिया! ({n})", "j_hayalet_onde": "भूत आगे है: {n}", "j_dustun": "तुम {n}वीं मंज़िल पर गिरे", "j_dustun_asagi": "तुम {n}वीं मंज़िल पर गिरे ({k} मंज़िल नीचे)", "j_azalt_not": "सिस्टम की \"गति कम करें\" सेटिंग चालू है: स्क्रीन हिलना बंद, कण कम, एनिमेशन ठहरे हुए।", "j_ayar_not": "सेटिंग तुरंत लागू होकर सहेज ली जाती हैं; खेल के नियम नहीं बदलते।", "j_karakter": "किरदार: {ad}", "kar_0": "हरा", "kar_1": "खोजी", "kar_2": "लाल", "kar_3": "सिपाही", "kar_4": "ज़ॉम्बी", "iz_0": "बर्फ़ीला नीला", "iz_1": "सुनहरा", "iz_2": "गुलाबी", "iz_3": "पन्ना हरा", "iz_4": "इंद्रधनुष", "b_kat10_ad": "पहली सीढ़ियाँ", "b_kat10_acik": "मंज़िल 10 तक पहुँचो", "b_kat50_ad": "आधा रास्ता", "b_kat50_acik": "मंज़िल 50 तक पहुँचो", "b_kat100_ad": "बादलों के ऊपर", "b_kat100_acik": "मंज़िल 100 तक पहुँचो", "b_kristal10_ad": "क्रिस्टल शिकारी", "b_kristal10_acik": "एक खेल में 10 क्रिस्टल जमा करो", "b_kombo20_ad": "कड़ी में कड़ी", "b_kombo20_acik": "एक कॉम्बो से 20 मंज़िल चढ़ो", "b_yay3_ad": "मैं उछल गया", "b_yay3_acik": "एक खेल में 3 स्प्रिंग से उछलो", "b_dayanikli_ad": "डटे रहो", "b_dayanikli_acik": "2 मिनट तक टिके रहो", "hud_1up": "1UP", "hud_rekor": "रिकॉर्ड", "hud_kat": "मंज़िल", "hud_hayalet": "भूत", "hud_bitti": "खत्म", "hud_saat": "घड़ी", "hud_miknatis": "चुंबक", "hud_kombo": "कॉम्बो", "hud_kombo_bitti": "कॉम्बो खत्म", "hud_puan": "अंक", "hud_hizlaniyor": "तेज़ी!", "hud_basarim": "उपलब्धि!", "hud_kil_payi": "बाल-बाल!", "hud_rekor_kat": "रिकॉर्ड मंज़िल", "hud_yeni_kat_rekoru": "नया रिकॉर्ड", "hud_odul0": "अच्छा", "hud_odul1": "बढ़िया", "hud_odul2": "शानदार", "hud_odul3": "सुपर", "hud_odul4": "कमाल", "hud_odul5": "अविश्वसनीय", "hud_odul6": "ज़बरदस्त", "hud_odul7": "महान", "hud_odul8": "दास्तान", "hud_odul9": "बेदाग़", "j_dil": "भाषा", "j_profil": "{n} खेल · सबसे ऊँची मंज़िल {k} · सबसे बड़ा कॉम्बो {c}", "j_golge": "लैंडिंग छाया", "j_perde": "कॉम्बो फ़िल्टर", "j_kaygan": "फिसलन वाली बर्फ़", "j_ozellikler": "अतिरिक्त सुविधाएँ", "j_hayalet_goster": "भूत", "j_kontrast": "उच्च कंट्रास्ट", "j_mukemmel": "परफेक्ट लैंडिंग", "hud_mukemmel": "परफ़ेक्ट", "j_muzik_ses": "संगीत स्तर", "j_haftalik": "सप्ताह का टावर", "j_haftalik_ipucu": "इस सप्ताह का स्थिर टावर; साप्ताहिक सर्वश्रेष्ठ रिकॉर्ड का भूत", "j_kod_etiket": "टावर कोड", "j_kod_oyna": "इस कोड से खेलें", "j_kod_gecersiz": "अमान्य कोड", "j_ozet_kopyala": "सारांश कॉपी करें", "j_kopyalandi": "कॉपी हो गया", "j_ozet_metin": "आइस टॉवर: मंज़िल {k}, {s} अंक, सर्वश्रेष्ठ कॉम्बो {c}, टावर कोड {kod}", "j_kuleler": "टावर", "j_kule_buz": "बर्फ़ीला टावर", "j_kule_kor": "अंगार टावर", "j_kule_run": "रून टावर", "j_kule_kum": "रेत टावर", "j_kule_yildiz": "तारा टावर", "j_kule_basarim": "उपलब्धि: {ad}", "j_kule_fiyat": "{n} ◆ में अनलॉक करें", "j_kule_kilidi": "टावर लॉक", "j_kule_ipucu": "टावर केवल रूप बदलते हैं; हर टावर का अपना स्कोरबोर्ड है। लॉक सेटिंग्स से बंद कर सकते हैं।", "j_kule_efekt": "टावर प्रभाव"}, "id": {"h01": "Arena Menara Es: karakter memanjat menara", "h02": "Menu", "h03": "Mode permainan", "h04": "Menara acak yang baru setiap kali", "h05": "Menara dari permainan terbaikmu; rekamannya berjalan sebagai hantu transparan", "h06": "Menara tetap khusus hari ini; hantu dari rekor terbaik harian", "h07": "Kesulitan", "h08": "Kamera bergeser lebih lambat", "h09": "Kecepatan standar", "h10": "Kamera bergeser cepat", "h11": "Kamera bergeser sangat cepat", "h12": "Pilihan warna jejak", "h13": "Tombol suara", "h14": "lompat vertikal", "h15": "Menara Es", "h16": "Panjat menara, buat kombo, jangan jatuh.", "h17": "Main", "h18": "Toko", "h19": "Pencapaian", "h20": "Pengaturan", "h21": "Cara main", "h22": "skor terbaik", "h23": "Dompet kristal:", "h24": "mode permainan", "h25": "Menara baru", "h26": "Balapan lawan hantu", "h27": "Menara harian", "h28": "kesulitan", "h29": "Mudah", "h30": "Sedang", "h31": "Sulit", "h32": "Sangat sulit", "h33": "papan skor (mode terpilih, 5 teratas)", "h34": "Mulai", "h35": "dompet kristal", "h36": "warna jejak", "h37": "Kristal yang kamu kumpulkan di game masuk ke sini. Warna jejak hanya mengubah tampilan.", "h38": "pencapaian", "h39": "Setiap pencapaian memberi hadiah kristal saat pertama kali dibuka.", "h40": "Kilau", "h41": "Partikel", "h42": "Guncangan layar", "h43": "Info dalam game (HUD)", "h44": "Suara", "h45": "Karakter", "h46": "Efek", "h47": "Musik", "h48": "Kembali ke default", "h49": "lari; makin cepat, makin tinggi lompatanmu.", "h50": "lompat. Saat memantul dari dinding, sebagian besar kecepatan tetap terjaga.", "h51": "Lompati minimal 2 lantai berturut-turut untuk membuat kombo; lompatan cepat membuat karakter salto. Lompat lagi sebelum hitungan habis agar kombo berlanjut.", "h52": "Sentuh kristal es yang melayang: masing-masing +25 poin dan bisa dibelanjakan di toko.", "h53": "Pijakan es retak pecah setelah 0,6 dtk, cepat lewati. Pijakan pegas merah melontarkanmu ke atas dan membuatmu salto.", "h54": "Jam memperlambat menara, magnet menarik kristal di dekatmu. Kamu bisa berpegangan sebentar di tepi pijakan dan tetap melompat saat jatuh dari tepi.", "h55": "jeda,", "h56": "mulai ulang. Setelah lantai 5 menara bergeser dan makin cepat tiap 30 dtk.", "h57": "dijeda", "h58": "Tarik napas dulu", "h59": "Untuk lanjut:", "h60": ", untuk mulai ulang:", "h61": ", untuk kembali ke menu:", "h62": "menara mengalahkanmu", "h63": "Pendakian bagus", "h64": "kombo terbesar:", "h65": "lantai", "h66": "★ Rekor baru", "h67": "kristal masuk ke dompet", "h68": "Coba lagi", "j_en_iyi": "terbaik", "j_kat": "lantai", "j_kule_no": "no. menara", "j_alindi": "didapat", "j_sec": "Pilih", "j_secili": "Terpilih", "j_acik": "AKTIF", "j_kapali": "MATI", "j_efektler": "Efek", "j_muzik": "Musik", "j_hayalet_gecti": "Kamu melewati hantu! ({n})", "j_hayalet_onde": "Hantu di depan: {n}", "j_dustun": "Kamu jatuh di lantai {n}", "j_dustun_asagi": "Kamu jatuh di lantai {n} ({k} lantai ke bawah)", "j_azalt_not": "Pengaturan \"kurangi gerakan\" sistemmu aktif: guncangan mati, partikel dikurangi, animasi dibekukan.", "j_ayar_not": "Pengaturan diterapkan langsung dan disimpan; aturan permainan tidak berubah.", "j_karakter": "Karakter: {ad}", "kar_0": "Hijau", "kar_1": "Penjelajah", "kar_2": "Merah", "kar_3": "Prajurit", "kar_4": "Zombi", "iz_0": "Biru es", "iz_1": "Emas", "iz_2": "Mawar", "iz_3": "Zamrud", "iz_4": "Pelangi", "b_kat10_ad": "Pijakan pertama", "b_kat10_acik": "Capai lantai 10", "b_kat50_ad": "Setengah jalan", "b_kat50_acik": "Capai lantai 50", "b_kat100_ad": "Di atas awan", "b_kat100_acik": "Capai lantai 100", "b_kristal10_ad": "Pemburu kristal", "b_kristal10_acik": "Kumpulkan 10 kristal dalam satu permainan", "b_kombo20_ad": "Berantai", "b_kombo20_acik": "Naik 20 lantai dengan satu kombo", "b_yay3_ad": "Terlontar", "b_yay3_acik": "Terlontar dari pegas 3 kali dalam satu permainan", "b_dayanikli_ad": "Tangguh", "b_dayanikli_acik": "Bertahan hidup 2 menit", "hud_1up": "1UP", "hud_rekor": "REKOR", "hud_kat": "LANTAI", "hud_hayalet": "HANTU", "hud_bitti": "TAMAT", "hud_saat": "JAM", "hud_miknatis": "MAGNET", "hud_kombo": "KOMBO", "hud_kombo_bitti": "KOMBO TAMAT", "hud_puan": "POIN", "hud_hizlaniyor": "MAKIN CEPAT", "hud_basarim": "PENCAPAIAN!", "hud_kil_payi": "HAMPIR SAJA!", "hud_rekor_kat": "REKOR LANTAI", "hud_yeni_kat_rekoru": "REKOR LANTAI BARU", "hud_odul0": "BAGUS", "hud_odul1": "KEREN", "hud_odul2": "HEBAT", "hud_odul3": "SUPER", "hud_odul4": "LUAR BIASA", "hud_odul5": "MENAKJUBKAN", "hud_odul6": "SPEKTAKULER", "hud_odul7": "LEGENDA", "hud_odul8": "EPIK", "hud_odul9": "SEMPURNA", "j_dil": "Bahasa", "j_profil": "{n} permainan · lantai tertinggi {k} · kombo terbesar {c}", "j_golge": "Bayangan mendarat", "j_perde": "Filter kombo", "j_kaygan": "Es licin", "j_ozellikler": "Fitur tambahan", "j_hayalet_goster": "Hantu", "j_kontrast": "Kontras tinggi", "j_mukemmel": "Pendaratan sempurna", "hud_mukemmel": "SEMPURNA", "j_muzik_ses": "Level musik", "j_haftalik": "Menara mingguan", "j_haftalik_ipucu": "Menara tetap minggu ini; hantu dari rekor mingguan terbaikmu", "j_kod_etiket": "Kode menara", "j_kod_oyna": "Main dengan kode ini", "j_kod_gecersiz": "Kode tidak valid", "j_ozet_kopyala": "Salin ringkasan", "j_kopyalandi": "Disalin", "j_ozet_metin": "Menara Es: lantai {k}, {s} poin, kombo terbaik {c}, kode menara {kod}", "j_kuleler": "Menara", "j_kule_buz": "Menara Es", "j_kule_kor": "Menara Bara", "j_kule_run": "Menara Rune", "j_kule_kum": "Menara Pasir", "j_kule_yildiz": "Menara Bintang", "j_kule_basarim": "Pencapaian: {ad}", "j_kule_fiyat": "Buka dengan {n} ◆", "j_kule_kilidi": "Kunci menara", "j_kule_ipucu": "Menara hanya mengubah tampilan; setiap menara punya papan skor sendiri. Kunci bisa dimatikan di Pengaturan.", "j_kule_efekt": "Efek menara"}, "pt": {"h01": "Área de jogo de Buz Kule: o personagem sobe a torre", "h02": "Menu", "h03": "Modo de jogo", "h04": "Uma torre nova e aleatória a cada partida", "h05": "A torre da sua melhor partida; o registro corre como um fantasma translúcido", "h06": "Torre fixa de hoje; o fantasma do melhor registro do dia", "h07": "Dificuldade", "h08": "A câmera sobe mais devagar", "h09": "Velocidade padrão", "h10": "A câmera sobe rápido", "h11": "A câmera sobe muito rápido", "h12": "Escolha da cor do rastro", "h13": "Botões de som", "h14": "pulo vertical", "h15": "Buz Kule", "h16": "Suba a torre, faça combos, não caia.", "h17": "Jogar", "h18": "Loja", "h19": "Conquistas", "h20": "Configurações", "h21": "Como jogar", "h22": "melhor pontuação", "h23": "Carteira de cristais:", "h24": "modo de jogo", "h25": "Torre nova", "h26": "Corrida contra o fantasma", "h27": "Torre do dia", "h28": "dificuldade", "h29": "Fácil", "h30": "Médio", "h31": "Difícil", "h32": "Muito difícil", "h33": "placar (modo selecionado, top 5)", "h34": "Começar", "h35": "carteira de cristais", "h36": "cor do rastro", "h37": "Os cristais que você coleta no jogo são adicionados aqui. A cor do rastro muda apenas o visual.", "h38": "conquistas", "h39": "Cada conquista dá uma recompensa em cristais na primeira vez que é desbloqueada.", "h40": "Brilho", "h41": "Partículas", "h42": "Tremor de tela", "h43": "Informações no jogo (HUD)", "h44": "Som", "h45": "Personagem", "h46": "Efeitos", "h47": "Música", "h48": "Restaurar padrão", "h49": "para correr; quanto mais rápido, mais alto você pula.", "h50": "para pular. Ao quicar na parede, você mantém quase toda a velocidade.", "h51": "Pule pelo menos 2 andares seguidos para fazer um combo; pulando rápido, o personagem dá uma pirueta. É preciso fazer um novo pulo de combo antes que o contador acabe.", "h52": "Toque nos cristais de gelo flutuantes: cada um vale +25 pontos e também pode ser gasto na loja.", "h53": "A plataforma de gelo rachada quebra após 0,6 s, passe rápido. A plataforma de mola vermelha te lança para cima com uma pirueta.", "h54": "O relógio desacelera a torre, o ímã atrai cristais próximos. Você se segura por pouco tempo nas bordas das plataformas e consegue pular até caindo da borda.", "h55": "pausar,", "h56": "reiniciar. Depois do andar 5, a torre começa a subir e acelera a cada 30 s.", "h57": "pausado", "h58": "Respire um pouco", "h59": "Para continuar:", "h60": ", para recomeçar:", "h61": ", para voltar ao menu:", "h62": "a torre venceu você", "h63": "Bela subida", "h64": "maior combo:", "h65": "andar", "h66": "★ Novo recorde", "h67": "cristais adicionados à carteira", "h68": "Tentar de novo", "j_en_iyi": "melhor", "j_kat": "andar", "j_kule_no": "torre nº", "j_alindi": "obtida", "j_sec": "Escolher", "j_secili": "Escolhido", "j_acik": "LIGADO", "j_kapali": "DESLIGADO", "j_efektler": "Efeitos", "j_muzik": "Música", "j_hayalet_gecti": "Você passou o fantasma! ({n})", "j_hayalet_onde": "Fantasma na frente: {n}", "j_dustun": "Você caiu no andar {n}", "j_dustun_asagi": "Você caiu no andar {n} ({k} andares abaixo)", "j_azalt_not": "A opção do sistema \"reduzir movimento\" está ativada: tremor desligado, partículas reduzidas, animações paradas.", "j_ayar_not": "As configurações são aplicadas ao vivo e salvas; as regras do jogo não mudam.", "j_karakter": "Personagem: {ad}", "kar_0": "Verde", "kar_1": "Explorador", "kar_2": "Ruivo", "kar_3": "Soldado", "kar_4": "Zumbi", "iz_0": "Azul gelo", "iz_1": "Dourado", "iz_2": "Rosa", "iz_3": "Esmeralda", "iz_4": "Arco-íris", "b_kat10_ad": "Primeiros degraus", "b_kat10_acik": "Chegue ao andar 10", "b_kat50_ad": "Meio do caminho", "b_kat50_acik": "Chegue ao andar 50", "b_kat100_ad": "Acima das nuvens", "b_kat100_acik": "Chegue ao andar 100", "b_kristal10_ad": "Caçador de cristais", "b_kristal10_acik": "Colete 10 cristais em uma partida", "b_kombo20_ad": "Reação em cadeia", "b_kombo20_acik": "Suba 20 andares em um único combo", "b_yay3_ad": "Fui lançado!", "b_yay3_acik": "Seja lançado por 3 molas em uma partida", "b_dayanikli_ad": "Resistente", "b_dayanikli_acik": "Sobreviva por 2 minutos", "hud_1up": "1UP", "hud_rekor": "RECORDE", "hud_kat": "ANDAR", "hud_hayalet": "FANTASMA", "hud_bitti": "FIM", "hud_saat": "RELOGIO", "hud_miknatis": "IMA", "hud_kombo": "COMBO", "hud_kombo_bitti": "FIM DO COMBO", "hud_puan": "PONTOS", "hud_hizlaniyor": "ACELERANDO", "hud_basarim": "CONQUISTA!", "hud_kil_payi": "POR POUCO!", "hud_rekor_kat": "ANDAR RECORDE", "hud_yeni_kat_rekoru": "NOVO RECORDE", "hud_odul0": "BOM", "hud_odul1": "LEGAL", "hud_odul2": "OTIMO", "hud_odul3": "SUPER", "hud_odul4": "INCRIVEL", "hud_odul5": "ESPETACULAR", "hud_odul6": "SENSACIONAL", "hud_odul7": "LENDARIO", "hud_odul8": "EPICO", "hud_odul9": "PERFEITO", "j_dil": "Idioma", "j_profil": "{n} jogos · andar mais alto {k} · maior combo {c}", "j_golge": "Sombra de aterrissagem", "j_perde": "Filtro de combo", "j_kaygan": "Gelo escorregadio", "j_ozellikler": "Recursos extras", "j_hayalet_goster": "Fantasma", "j_kontrast": "Alto contraste", "j_mukemmel": "Pouso perfeito", "hud_mukemmel": "PERFEITO", "j_muzik_ses": "Nível da música", "j_haftalik": "Torre da semana", "j_haftalik_ipucu": "Torre fixa desta semana; o fantasma do seu melhor recorde semanal", "j_kod_etiket": "Código da torre", "j_kod_oyna": "Jogar com este código", "j_kod_gecersiz": "Código inválido", "j_ozet_kopyala": "Copiar resumo", "j_kopyalandi": "Copiado", "j_ozet_metin": "Buz Kule: andar {k}, {s} pontos, melhor combo {c}, código da torre {kod}", "j_kuleler": "Torres", "j_kule_buz": "Torre de Gelo", "j_kule_kor": "Torre de Brasas", "j_kule_run": "Torre de Runas", "j_kule_kum": "Torre de Areia", "j_kule_yildiz": "Torre Estelar", "j_kule_basarim": "Conquista: {ad}", "j_kule_fiyat": "Desbloquear por {n} ◆", "j_kule_kilidi": "Travas das torres", "j_kule_ipucu": "As torres mudam apenas a aparência; cada uma tem seu próprio placar. Você pode desligar as travas em Configurações.", "j_kule_efekt": "Efeitos da torre"}, "ru": {"h01": "Игровое поле Ледяной башни: персонаж взбирается на башню", "h02": "Меню", "h03": "Режим игры", "h04": "Каждый раз новая случайная башня", "h05": "Башня твоей лучшей игры; запись бежит как полупрозрачный призрак", "h06": "Фиксированная башня на сегодня; призрак лучшей записи дня", "h07": "Сложность", "h08": "Камера движется медленнее", "h09": "Обычная скорость", "h10": "Камера движется быстро", "h11": "Камера движется очень быстро", "h12": "Выбор цвета следа", "h13": "Кнопки звука", "h14": "вертикальные прыжки", "h15": "Ледяная башня", "h16": "Взбирайся на башню, делай комбо, не падай.", "h17": "Играть", "h18": "Магазин", "h19": "Достижения", "h20": "Настройки", "h21": "Как играть", "h22": "лучший счёт", "h23": "Кошелёк кристаллов:", "h24": "режим игры", "h25": "Новая башня", "h26": "Гонка с призраком", "h27": "Башня дня", "h28": "сложность", "h29": "Легко", "h30": "Средне", "h31": "Сложно", "h32": "Очень сложно", "h33": "таблица рекордов (выбранный режим, топ-5)", "h34": "Старт", "h35": "кошелёк кристаллов", "h36": "цвет следа", "h37": "Кристаллы, собранные в игре, попадают сюда. Цвет следа меняет только внешний вид.", "h38": "достижения", "h39": "За каждое достижение при первом получении дают кристаллы.", "h40": "Блеск", "h41": "Частицы", "h42": "Тряска экрана", "h43": "Игровая информация (HUD)", "h44": "Звук", "h45": "Персонаж", "h46": "Эффекты", "h47": "Музыка", "h48": "Сбросить по умолчанию", "h49": "беги; чем быстрее бежишь, тем выше прыгаешь.", "h50": "прыжок. При отскоке от стены большая часть скорости сохраняется.", "h51": "Прыгай минимум на 2 этажа подряд, чтобы сделать комбо; при быстром прыжке персонаж кувыркается. Новый комбо-прыжок нужен до того, как закончится счётчик.", "h52": "Касайся парящих ледяных кристаллов: каждый даёт +25 очков и тратится в магазине.", "h53": "Треснувшая ледяная ступень ломается через 0,6 с, проскочи быстро. Красная пружинная ступень подбрасывает вверх и заставляет кувыркаться.", "h54": "Часы замедляют башню, магнит притягивает ближайшие кристаллы. Можно ненадолго зацепиться за край ступени и даже прыгнуть, падая с края.", "h55": "пауза,", "h56": "перезапуск. После 5-го этажа башня движется и ускоряется каждые 30 с.", "h57": "пауза", "h58": "Переведи дух", "h59": "Чтобы продолжить:", "h60": ", чтобы начать заново:", "h61": ", чтобы вернуться в меню:", "h62": "башня победила тебя", "h63": "Отличный подъём", "h64": "лучшее комбо:", "h65": "этаж", "h66": "★ Новый рекорд", "h67": "кристаллов добавлено в кошелёк", "h68": "Ещё раз", "j_en_iyi": "лучший", "j_kat": "этаж", "j_kule_no": "№ башни", "j_alindi": "получено", "j_sec": "Выбрать", "j_secili": "Выбрано", "j_acik": "ВКЛ", "j_kapali": "ВЫКЛ", "j_efektler": "Эффекты", "j_muzik": "Музыка", "j_hayalet_gecti": "Ты обогнал призрака! ({n})", "j_hayalet_onde": "Призрак впереди: {n}", "j_dustun": "Ты упал на {n}-м этаже", "j_dustun_asagi": "Ты упал на {n}-м этаже (на {k} эт. вниз)", "j_azalt_not": "В системе включено \"уменьшение движения\": тряска выключена, частиц меньше, анимации застывшие.", "j_ayar_not": "Настройки применяются сразу и сохраняются; правила игры не меняются.", "j_karakter": "Персонаж: {ad}", "kar_0": "Зелёный", "kar_1": "Исследователь", "kar_2": "Рыжий", "kar_3": "Солдат", "kar_4": "Зомби", "iz_0": "Ледяной синий", "iz_1": "Золотой", "iz_2": "Розовый", "iz_3": "Изумрудный", "iz_4": "Радужный", "b_kat10_ad": "Первые ступени", "b_kat10_acik": "Доберись до 10-го этажа", "b_kat50_ad": "Полпути", "b_kat50_acik": "Доберись до 50-го этажа", "b_kat100_ad": "Выше облаков", "b_kat100_acik": "Доберись до 100-го этажа", "b_kristal10_ad": "Охотник за кристаллами", "b_kristal10_acik": "Собери 10 кристаллов за одну игру", "b_kombo20_ad": "Цепная реакция", "b_kombo20_acik": "Поднимись на 20 этажей одним комбо", "b_yay3_ad": "Меня катапультировало", "b_yay3_acik": "Взлети с пружин 3 раза за одну игру", "b_dayanikli_ad": "Выносливый", "b_dayanikli_acik": "Продержись 2 минуты", "hud_1up": "1UP", "hud_rekor": "РЕКОРД", "hud_kat": "ЭТАЖ", "hud_hayalet": "ПРИЗРАК", "hud_bitti": "КОНЕЦ", "hud_saat": "ЧАСЫ", "hud_miknatis": "МАГНИТ", "hud_kombo": "КОМБО", "hud_kombo_bitti": "КОМБО ВСЁ", "hud_puan": "ОЧКИ", "hud_hizlaniyor": "УСКОРЕНИЕ", "hud_basarim": "ДОСТИЖЕНИЕ!", "hud_kil_payi": "ЧУТЬ-ЧУТЬ!", "hud_rekor_kat": "РЕКОРД ЭТАЖ", "hud_yeni_kat_rekoru": "НОВЫЙ РЕКОРД", "hud_odul0": "ХОРОШО", "hud_odul1": "КЛАСС", "hud_odul2": "ОТЛИЧНО", "hud_odul3": "СУПЕР", "hud_odul4": "ВАУ", "hud_odul5": "НЕВЕРОЯТНО", "hud_odul6": "ЛЕГЕНДА", "hud_odul7": "ЭПИК", "hud_odul8": "МИФ", "hud_odul9": "БЕЗУПРЕЧНО", "j_dil": "Язык", "j_profil": "{n} игр · макс. этаж {k} · лучшее комбо {c}", "j_golge": "Тень приземления", "j_perde": "Фильтр комбо", "j_kaygan": "Скользкий лёд", "j_ozellikler": "Доп. функции", "j_hayalet_goster": "Призрак", "j_kontrast": "Высокая контрастность", "j_mukemmel": "Идеальная посадка", "hud_mukemmel": "ИДЕАЛЬНО", "j_muzik_ses": "Громкость музыки", "j_haftalik": "Башня недели", "j_haftalik_ipucu": "Фиксированная башня этой недели; призрак твоего лучшего недельного рекорда", "j_kod_etiket": "Код башни", "j_kod_oyna": "Играть с этим кодом", "j_kod_gecersiz": "Неверный код", "j_ozet_kopyala": "Копировать итог", "j_kopyalandi": "Скопировано", "j_ozet_metin": "Ледяная башня: этаж {k}, {s} очков, лучшее комбо {c}, код башни {kod}", "j_kuleler": "Башни", "j_kule_buz": "Ледяная башня", "j_kule_kor": "Башня Углей", "j_kule_run": "Башня Рун", "j_kule_kum": "Песчаная башня", "j_kule_yildiz": "Звёздная башня", "j_kule_basarim": "Достижение: {ad}", "j_kule_fiyat": "Открыть за {n} ◆", "j_kule_kilidi": "Замки башен", "j_kule_ipucu": "Башни меняют только внешний вид; у каждой башни своя таблица рекордов. Замки можно отключить в настройках.", "j_kule_efekt": "Эффекты башни"}, "tr": {"h01": "Buz Kule oyun alanı: karakter kuleye tırmanıyor", "h02": "Menü", "h03": "Oyun kipi", "h04": "Her seferinde yeni, rastgele bir kule", "h05": "En iyi oyununun kulesi; kaydı yarı saydam hayalet olarak koşar", "h06": "Bugüne özel sabit kule; günlük en iyi kaydın hayaleti", "h07": "Zorluk", "h08": "Kamera daha yavaş kayar", "h09": "Varsayılan hız", "h10": "Kamera hızlı kayar", "h11": "Kamera çok hızlı kayar", "h12": "İz rengi seçimi", "h13": "Ses düğmeleri", "h14": "dikey zıplama", "h15": "Buz Kule", "h16": "Kuleye tırman, kombo yap, düşme.", "h17": "Oyna", "h18": "Mağaza", "h19": "Başarım", "h20": "Ayarlar", "h21": "Nasıl", "h22": "en iyi skor", "h23": "Kristal cüzdanı:", "h24": "oyun kipi", "h25": "Yeni kule", "h26": "Hayaletle yarış", "h27": "Günün kulesi", "h28": "zorluk", "h29": "Kolay", "h30": "Orta", "h31": "Zor", "h32": "Çok zor", "h33": "skor tablosu (seçili kip, ilk 5)", "h34": "Başla", "h35": "kristal cüzdanı", "h36": "iz rengi", "h37": "Oyunda topladığın kristaller buraya eklenir. İz rengi yalnız görünümü değiştirir.", "h38": "başarımlar", "h39": "Her başarım ilk açıldığında kristal ödülü verir.", "h40": "Parıltı", "h41": "Parçacık", "h42": "Ekran sarsıntısı", "h43": "Oyun içi bilgi (HUD)", "h44": "Ses", "h45": "Karakter", "h46": "Efektler", "h47": "Müzik", "h48": "Varsayılana dön", "h49": "koş; ne kadar hızlıysan o kadar yükseğe zıplarsın.", "h50": "zıpla. Duvardan dönünce hızın çoğu korunur.", "h51": "Üst üste en az 2 kat zıplayarak kombo yap; hızlı zıplayınca karakter takla atar. Sayaç dolmadan yeni kombo zıplaması gerekir.", "h52": "Süzülen buz kristallerine dokun: her biri +25 puan, ayrıca mağazada harcanır.", "h53": "Çatlak buz basamak 0,6 sn sonra kırılır, hızlı geç. Kırmızı yaylı basamak seni yukarı fırlatır ve taklaya sokar.", "h54": "Saat kuleyi yavaşlatır, mıknatıs yakındaki kristalleri çeker. Basamak kenarlarında kısa süre tutunur ve kenardan düşerken bile zıplayabilirsin.", "h55": "duraklat,", "h56": "yeniden başlat. Kat 5'ten sonra kule kayar, her 30 sn hızlanır.", "h57": "duraklatıldı", "h58": "Bir nefes al", "h59": "Devam etmek için", "h60": ", yeniden başlamak için", "h61": ", menüye dönmek için", "h62": "kule seni yendi", "h63": "Güzel tırmanış", "h64": "en büyük kombo:", "h65": "kat", "h66": "★ Yeni rekor", "h67": "kristal cüzdana eklendi", "h68": "Tekrar dene", "j_en_iyi": "en iyi", "j_kat": "kat", "j_kule_no": "kule no", "j_alindi": "alındı", "j_sec": "Seç", "j_secili": "Seçili", "j_acik": "AÇIK", "j_kapali": "KAPALI", "j_efektler": "Efektler", "j_muzik": "Müzik", "j_hayalet_gecti": "Hayaleti geçtin! ({n})", "j_hayalet_onde": "Hayalet önde: {n}", "j_dustun": "{n}. katta düştün", "j_dustun_asagi": "{n}. katta düştün ({k} kat aşağıya)", "j_azalt_not": "Sistem \"hareketi azalt\" ayarın açık: sarsıntı kapalı, parçacık azaltıldı, animasyonlar donuk.", "j_ayar_not": "Ayarlar canlı uygulanır ve kaydedilir; oyun kuralları değişmez.", "j_karakter": "Karakter: {ad}", "kar_0": "Yeşil", "kar_1": "Kâşif", "kar_2": "Kızıl", "kar_3": "Asker", "kar_4": "Zombi", "iz_0": "Buz mavisi", "iz_1": "Altın", "iz_2": "Gül", "iz_3": "Zümrüt", "iz_4": "Gökkuşağı", "b_kat10_ad": "İlk basamaklar", "b_kat10_acik": "Kat 10'a ulaş", "b_kat50_ad": "Yarı yol", "b_kat50_acik": "Kat 50'ye ulaş", "b_kat100_ad": "Bulutların üstü", "b_kat100_acik": "Kat 100'e ulaş", "b_kristal10_ad": "Kristal avcısı", "b_kristal10_acik": "Tek oyunda 10 kristal topla", "b_kombo20_ad": "Zincirleme", "b_kombo20_acik": "Tek kombo ile 20 kat çık", "b_yay3_ad": "Fırlatıldım", "b_yay3_acik": "Tek oyunda 3 yaydan fırla", "b_dayanikli_ad": "Dayanıklı", "b_dayanikli_acik": "2 dakika hayatta kal", "hud_1up": "1UP", "hud_rekor": "REKOR", "hud_kat": "KAT", "hud_hayalet": "HAYALET", "hud_bitti": "BITTI", "hud_saat": "SAAT", "hud_miknatis": "MIKNATIS", "hud_kombo": "KOMBO", "hud_kombo_bitti": "KOMBO BITTI", "hud_puan": "PUAN", "hud_hizlaniyor": "HIZLANIYOR", "hud_basarim": "BASARIM!", "hud_kil_payi": "KIL PAYI!", "hud_rekor_kat": "REKOR KAT", "hud_yeni_kat_rekoru": "YENİ KAT REKORU", "hud_odul0": "İYİ", "hud_odul1": "GÜZEL", "hud_odul2": "HARİKA", "hud_odul3": "SÜPER", "hud_odul4": "MUHTEŞEM", "hud_odul5": "İNANILMAZ", "hud_odul6": "OLAĞANÜSTÜ", "hud_odul7": "EFSANE", "hud_odul8": "DESTAN", "hud_odul9": "KUSURSUZ", "j_dil": "Dil", "j_profil": "{n} oyun · en yüksek kat {k} · en büyük kombo {c}", "j_golge": "İniş gölgesi", "j_perde": "Kombo perdesi", "j_kaygan": "Kaygan buz", "j_ozellikler": "Ek özellikler", "j_hayalet_goster": "Hayalet", "j_kontrast": "Yüksek kontrast", "j_mukemmel": "Mükemmel iniş", "j_muzik_ses": "Müzik düzeyi", "j_haftalik": "Haftanın kulesi", "j_haftalik_ipucu": "Bu haftaya özel sabit kule; haftalık en iyi kaydın hayaleti", "j_kod_etiket": "Kule kodu", "j_kod_oyna": "Bu kodla oyna", "j_kod_gecersiz": "Geçersiz kod", "j_ozet_kopyala": "Özeti kopyala", "j_kopyalandi": "Kopyalandı", "j_ozet_metin": "Buz Kule: {k}. kat, {s} puan, en büyük kombo {c}, kule kodu {kod}", "hud_mukemmel": "MUKEMMEL", "j_kuleler": "Kuleler", "j_kule_buz": "Buz Kulesi", "j_kule_kor": "Kor Kulesi", "j_kule_run": "Rün Kulesi", "j_kule_kum": "Kum Kulesi", "j_kule_yildiz": "Yıldız Kulesi", "j_kule_basarim": "Başarım: {ad}", "j_kule_fiyat": "{n} ◆ ile aç", "j_kule_kilidi": "Kule kilitleri", "j_kule_ipucu": "Kuleler yalnız görünümü değiştirir; her kulenin skor tablosu ayrıdır. Kilitleri Ayarlar'dan kapatabilirsin.", "j_kule_efekt": "Kule efektleri"}, "zh": {"h01": "冰塔游戏区:角色正在攀登高塔", "h02": "菜单", "h03": "游戏模式", "h04": "每次都是全新的随机高塔", "h05": "你最佳一局的高塔;当时的记录会以半透明幽灵的形式跑动", "h06": "今日专属的固定高塔;幽灵为当日最佳记录", "h07": "难度", "h08": "镜头滚动较慢", "h09": "默认速度", "h10": "镜头滚动较快", "h11": "镜头滚动极快", "h12": "选择轨迹颜色", "h13": "声音按钮", "h14": "垂直跳跃", "h15": "冰塔", "h16": "爬上高塔,打出连击,别掉下去。", "h17": "开始游戏", "h18": "商店", "h19": "成就", "h20": "设置", "h21": "玩法", "h22": "最高分", "h23": "水晶钱包:", "h24": "游戏模式", "h25": "新高塔", "h26": "与幽灵竞速", "h27": "每日高塔", "h28": "难度", "h29": "简单", "h30": "中等", "h31": "困难", "h32": "极难", "h33": "排行榜(当前模式,前5名)", "h34": "开始", "h35": "水晶钱包", "h36": "轨迹颜色", "h37": "游戏中收集的水晶会存入这里。轨迹颜色只改变外观。", "h38": "成就", "h39": "每个成就首次解锁时会奖励水晶。", "h40": "光晕", "h41": "粒子", "h42": "屏幕震动", "h43": "游戏内信息(HUD)", "h44": "声音", "h45": "角色", "h46": "音效", "h47": "音乐", "h48": "恢复默认", "h49": "奔跑;跑得越快,跳得越高。", "h50": "跳跃。从墙上反弹时大部分速度会保留。", "h51": "连续跳过至少2层即可打出连击;跳得够快角色会翻跟头。计时条耗尽前必须再次完成连击跳。", "h52": "触碰飘浮的冰晶:每颗+25分,还可在商店中花费。", "h53": "裂开的冰面踏板0.6秒后碎裂,请快速通过。红色弹簧踏板会把你弹向高处并让你翻滚。", "h54": "时钟会减缓高塔速度,磁铁会吸引附近的水晶。可短暂抓住踏板边缘,从边缘掉落时依然可以跳跃。", "h55": "暂停,", "h56": "重新开始。第5层之后高塔开始滑动,每30秒加速一次。", "h57": "已暂停", "h58": "休息一下", "h59": "继续请按", "h60": ",重新开始请按", "h61": ",返回菜单请按", "h62": "高塔击败了你", "h63": "攀爬得不错", "h64": "最大连击:", "h65": "层", "h66": "★ 新纪录", "h67": "水晶已存入钱包", "h68": "再试一次", "j_en_iyi": "最佳", "j_kat": "层", "j_kule_no": "高塔编号", "j_alindi": "已拥有", "j_sec": "选择", "j_secili": "已选择", "j_acik": "开", "j_kapali": "关", "j_efektler": "音效", "j_muzik": "音乐", "j_hayalet_gecti": "你超过了幽灵!({n})", "j_hayalet_onde": "幽灵领先:{n}", "j_dustun": "你在第{n}层掉落", "j_dustun_asagi": "你在第{n}层掉落(向下掉了{k}层)", "j_azalt_not": "系统已开启“减少动态效果”:屏幕震动已关闭,粒子已减少,动画已静止。", "j_ayar_not": "设置会即时生效并自动保存;游戏规则不变。", "j_karakter": "角色:{ad}", "kar_0": "绿衣", "kar_1": "探险家", "kar_2": "红发", "kar_3": "士兵", "kar_4": "僵尸", "iz_0": "冰蓝", "iz_1": "金色", "iz_2": "玫红", "iz_3": "翠绿", "iz_4": "彩虹", "b_kat10_ad": "初登台阶", "b_kat10_acik": "到达第10层", "b_kat50_ad": "行至半途", "b_kat50_acik": "到达第50层", "b_kat100_ad": "云端之上", "b_kat100_acik": "到达第100层", "b_kristal10_ad": "水晶猎人", "b_kristal10_acik": "单局收集10颗水晶", "b_kombo20_ad": "连锁反应", "b_kombo20_acik": "一次连击爬升20层", "b_yay3_ad": "我被弹飞了", "b_yay3_acik": "单局被3个弹簧弹起", "b_dayanikli_ad": "坚持不懈", "b_dayanikli_acik": "存活2分钟", "hud_1up": "1UP", "hud_rekor": "最高分", "hud_kat": "楼层", "hud_hayalet": "幽灵", "hud_bitti": "结束", "hud_saat": "时钟", "hud_miknatis": "磁铁", "hud_kombo": "连击", "hud_kombo_bitti": "连击结束", "hud_puan": "得分", "hud_hizlaniyor": "加速中", "hud_basarim": "成就!", "hud_kil_payi": "险过!", "hud_rekor_kat": "最高层", "hud_yeni_kat_rekoru": "新层纪录", "hud_odul0": "不错", "hud_odul1": "漂亮", "hud_odul2": "太棒", "hud_odul3": "超赞", "hud_odul4": "惊人", "hud_odul5": "不可思议", "hud_odul6": "传奇", "hud_odul7": "史诗", "hud_odul8": "神话", "hud_odul9": "完美", "j_dil": "语言", "j_profil": "{n} 局 · 最高层数 {k} · 最大连击 {c}", "j_golge": "落地阴影", "j_perde": "连击滤镜", "j_kaygan": "滑溜冰面", "j_ozellikler": "额外功能", "j_hayalet_goster": "幽灵", "j_kontrast": "高对比度", "j_mukemmel": "完美降落", "hud_mukemmel": "完美", "j_muzik_ses": "音乐音量", "j_haftalik": "本周之塔", "j_haftalik_ipucu": "本周固定的塔；每周最佳记录的幽灵", "j_kod_etiket": "塔码", "j_kod_oyna": "用此代码开始", "j_kod_gecersiz": "代码无效", "j_ozet_kopyala": "复制摘要", "j_kopyalandi": "已复制", "j_ozet_metin": "冰塔：第{k}层，{s}分，最佳连击{c}，塔码{kod}", "j_kuleler": "塔楼", "j_kule_buz": "冰霜塔", "j_kule_kor": "余烬塔", "j_kule_run": "符文塔", "j_kule_kum": "沙之塔", "j_kule_yildiz": "星辰塔", "j_kule_basarim": "成就：{ad}", "j_kule_fiyat": "以 {n} ◆ 解锁", "j_kule_kilidi": "塔楼锁定", "j_kule_ipucu": "塔楼只改变外观；每座塔都有独立的排行榜。可在设置中关闭锁定。", "j_kule_efekt": "塔楼特效"}};

// ---- dil ----
// description: Buz Kule çok dilli arayüz (Türkçe + 10 yaygın dil). Metinler arac/dil/*.json'dan derlenen dil_veri.js içindedir; HTML'de data-d (metin) ve data-dt (öznitelik: title/aria-label) ile işaretlenir. Oyun içi piksel yazı yalnız Latin harfleri çizdiği için Latin olmayan dillerde kısa oyun içi yazılar İngilizce kalır. Sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı).


const DILLER = Object.freeze([
  { kod: 'tr', ad: 'Türkçe', yon: 'ltr', latin: true }, { kod: 'en', ad: 'English', yon: 'ltr', latin: true },
  { kod: 'zh', ad: '中文', yon: 'ltr', latin: false }, { kod: 'hi', ad: 'हिन्दी', yon: 'ltr', latin: false },
  { kod: 'es', ad: 'Español', yon: 'ltr', latin: true }, { kod: 'fr', ad: 'Français', yon: 'ltr', latin: true },
  { kod: 'ar', ad: 'العربية', yon: 'rtl', latin: false }, { kod: 'bn', ad: 'বাংলা', yon: 'ltr', latin: false },
  { kod: 'pt', ad: 'Português', yon: 'ltr', latin: true }, { kod: 'ru', ad: 'Русский', yon: 'ltr', latin: false },
  { kod: 'id', ad: 'Bahasa Indonesia', yon: 'ltr', latin: true },
]);
const dilNo = () => (Number.isInteger(AYAR.dil) && AYAR.dil >= 0 && AYAR.dil < DILLER.length ? AYAR.dil : 0);
const doldur = (s, d) => (d ? s.replace(/\{(\w+)\}/g, (m, k) => (k in d ? String(d[k]) : m)) : s);
// Menü ve genel metinler: seçili dil, yoksa İngilizce, yoksa Türkçe, yoksa anahtarın kendisi.
function t(anahtar, degerler) {
  const kod = DILLER[dilNo()].kod;
  return doldur((DILVERI[kod] && DILVERI[kod][anahtar]) ?? (DILVERI.en && DILVERI.en[anahtar]) ?? (DILVERI.tr && DILVERI.tr[anahtar]) ?? anahtar, degerler);
}
// Oyun içi kısa yazılar: seçili dilde (Latin dışı dillerde piksel.js sistem yazı tipiyle çizer), eksikse Türkçe.
function th(anahtar, degerler) {
  const kod = DILLER[dilNo()].kod;
  return doldur((DILVERI[kod] && DILVERI[kod][anahtar]) ?? (DILVERI.tr && DILVERI.tr[anahtar]) ?? anahtar, degerler);
}
// HTML'deki işaretli öğeleri seçili dile çevirir; sayfa dilini ve yönünü ayarlar.
function dilUygula(kok = document) {
  const d = DILLER[dilNo()];
  if (typeof document !== 'undefined' && document.documentElement) { document.documentElement.lang = d.kod; document.documentElement.dir = d.yon; }
  kok.querySelectorAll('[data-d]').forEach((e) => { e.textContent = t(e.getAttribute('data-d')); });
  kok.querySelectorAll('[data-dt]').forEach((e) => {
    for (const cift of e.getAttribute('data-dt').split(';')) { const [ad, k] = cift.split(':'); if (ad && k) e.setAttribute(ad, t(k)); }
  });
}

// ---- magaza ----
// description: Buz Kule kristal cüzdanı ve mağaza (iz renkleri); kalıcı kayıt. Oyun kurallarını etkilemez, yalnız görünüm. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
const IZLER = Object.freeze([
  { ad: 'Buz mavisi', renk: 'rgba(120,220,255,0.8)', fiyat: 0 },
  { ad: 'Altın', renk: 'rgba(255,210,120,0.9)', fiyat: 40 },
  { ad: 'Gül', renk: 'rgba(255,150,200,0.9)', fiyat: 90 },
  { ad: 'Zümrüt', renk: 'rgba(120,255,190,0.9)', fiyat: 160 },
  { ad: 'Gökkuşağı', renk: null, fiyat: 300 }, // renk zamanla değişir
]);
const CUZDAN_ANAHTAR = 'buzkule.cuzdan';
const CUZDAN = { kristal: 0, acik: [0], secili: 0, toplam: 0 };

function cuzdanYukle() {
  try {
    const k = JSON.parse(localStorage.getItem(CUZDAN_ANAHTAR) || 'null');
    if (k && Number.isFinite(k.kristal) && k.kristal >= 0) {
      CUZDAN.kristal = Math.floor(k.kristal); CUZDAN.toplam = Number.isFinite(k.toplam) ? Math.max(0, Math.floor(k.toplam)) : 0;
      CUZDAN.acik = Array.isArray(k.acik) ? k.acik.filter(i => Number.isInteger(i) && i >= 0 && i < IZLER.length) : [0];
      if (!CUZDAN.acik.includes(0)) CUZDAN.acik.push(0);
      CUZDAN.secili = CUZDAN.acik.includes(k.secili) ? k.secili : 0;
    }
  } catch { /* kayıt yoksa boş cüzdan */ }
}
function cuzdanKaydet() { try { localStorage.setItem(CUZDAN_ANAHTAR, JSON.stringify(CUZDAN)); } catch { /* sessiz */ } }
function kristalKazan(n) { if (n > 0) { CUZDAN.kristal += n; CUZDAN.toplam += n; cuzdanKaydet(); } }
// Satın alma: yeterli kristal varsa düşer ve açar; sonucu döndürür ('acik' zaten açıksa, 'yetersiz', 'alindi').
function izAl(i) {
  if (!IZLER[i]) return 'gecersiz';
  if (CUZDAN.acik.includes(i)) return 'acik';
  if (CUZDAN.kristal < IZLER[i].fiyat) return 'yetersiz';
  CUZDAN.kristal -= IZLER[i].fiyat; CUZDAN.acik.push(i); cuzdanKaydet(); return 'alindi';
}
function izSec(i) { if (CUZDAN.acik.includes(i)) { CUZDAN.secili = i; cuzdanKaydet(); return true; } return false; }
function izRengi(zaman) {
  const iz = IZLER[CUZDAN.secili] || IZLER[0];
  return iz.renk || 'hsla(' + (zaman * 6 % 360) + ',95%,70%,0.9)';
}

// ---- skorlar ----
// description: Buz Kule yerel skor tabloları: her oyun kipi (yeni, hayalet, günün kulesi) için ayrı ilk 5, kalıcı. Eski tek tablo "yeni" kipine devredilir. Oyun kurallarını etkilemez. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)

const SKOR_SAYISI = 5;
const SKOR_ESKI_ANAHTAR = 'buzkule.skorlar'; // 0.10-0.14: tek tablo; artık "yeni" kipinin tablosu
const bugun = () => { const t = new Date(); return t.getFullYear() + '-' + (t.getMonth() + 1) + '-' + t.getDate(); };
const skorAnahtari = (mod, z = 1) => (mod === 'hayalet' ? 'buzkule.skorlar.hayalet' : mod === 'gunun' ? 'buzkule.skorlar.gunun.' + bugun() : mod === 'hafta' ? 'buzkule.skorlar.hafta.' + haftaKimlik() : mod === 'kod' ? 'buzkule.skorlar.kod' : SKOR_ESKI_ANAHTAR) + zSonek(z);

const gecerli = (x) => x && Number.isFinite(x.skor) && x.skor > 0 && Number.isFinite(x.kat) && Number.isFinite(x.t);
// Kipin tablosunu okur (sıralı, en çok 5, geçersiz satırlar atılır); bozuk kayıtta boş tablo döner.
function skorListesi(mod, z = 1) {
  try {
    const k = JSON.parse(localStorage.getItem(skorAnahtari(mod, z)) || '[]');
    return Array.isArray(k) ? k.filter(gecerli).sort((a, b) => b.skor - a.skor || a.t - b.t).slice(0, SKOR_SAYISI) : [];
  } catch { return []; }
}
// Skoru kipin tablosuna ekler; sırasını (1'den başlar) döndürür, ilk 5'e giremediyse 0. Sıfır skor eklenmez.
function skorEkle(mod, skor, kat, z = 1) {
  if (!(skor > 0)) return 0;
  const kayit = { skor, kat, t: Date.now() }, liste = skorListesi(mod, z);
  liste.push(kayit); liste.sort((a, b) => b.skor - a.skor || a.t - b.t);
  const kesik = liste.slice(0, SKOR_SAYISI);
  try { localStorage.setItem(skorAnahtari(mod, z), JSON.stringify(kesik)); } catch { /* sessiz */ }
  return kesik.indexOf(kayit) + 1;
}

// ---- profil ----
// description: Buz Kule oyuncu profili (yerel, kalıcı): oynanan oyun sayısı, en yüksek kat, en büyük kombo. Yalnız görüntü; oyun kurallarını etkilemez. Bozuk kayıt varsayılana döner. Sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı).
const PROFIL_ANAHTAR = 'buzkule.profil';
const PROFIL = { oyun: 0, enKat: 0, enKombo: 0 };
const profilDegeriGecerli = (x) => Number.isInteger(x) && x >= 0 && x <= 1e9;

function profilYukle() {
  PROFIL.oyun = PROFIL.enKat = PROFIL.enKombo = 0;
  try {
    const k = JSON.parse(localStorage.getItem(PROFIL_ANAHTAR) || 'null');
    if (k) for (const a of Object.keys(PROFIL)) if (profilDegeriGecerli(k[a])) PROFIL[a] = k[a];
  } catch { /* kayıt yoksa ya da bozuksa sıfırdan başlar */ }
}
// Oyun bittiğinde çağrılır: o = bitmiş oyun durumu (enYuksek, enIyiKombo).
function profilGuncelle(o) {
  PROFIL.oyun++; PROFIL.enKat = Math.max(PROFIL.enKat, o.enYuksek | 0); PROFIL.enKombo = Math.max(PROFIL.enKombo, o.enIyiKombo | 0);
  try { localStorage.setItem(PROFIL_ANAHTAR, JSON.stringify(PROFIL)); } catch { /* sessiz */ }
}

// ---- basarim ----
// description: Buz Kule başarımları (kalıcı); açılınca kristal ödülü verir. Oyun kurallarını değiştirmez. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)


const BASARIMLAR = Object.freeze([
  { id: 'kat10', ad: 'İlk basamaklar', acik: 'Kat 10\'a ulaş', odul: 5, sart: (o) => o.enYuksek >= 10 },
  { id: 'kat50', ad: 'Yarı yol', acik: 'Kat 50\'ye ulaş', odul: 20, sart: (o) => o.enYuksek >= 50 },
  { id: 'kat100', ad: 'Bulutların üstü', acik: 'Kat 100\'e ulaş', odul: 50, sart: (o) => o.enYuksek >= 100 },
  { id: 'kristal10', ad: 'Kristal avcısı', acik: 'Tek oyunda 10 kristal topla', odul: 15, sart: (o) => o.alinan.size >= 10 },
  { id: 'kombo20', ad: 'Zincirleme', acik: 'Tek kombo ile 20 kat çık', odul: 25, sart: (o) => o.enIyiKombo >= 20 },
  { id: 'yay3', ad: 'Fırlatıldım', acik: 'Tek oyunda 3 yaydan fırla', odul: 10, sart: (o) => o.yaySayisi >= 3 },
  { id: 'dayanikli', ad: 'Dayanıklı', acik: '2 dakika hayatta kal', odul: 15, sart: (o) => o.kare >= 6000 },
]);
const BASARIM_ANAHTAR = 'buzkule.basarim';
const ACIK = new Set();
const BILDIRIM = []; // ekrandaki bildirimler: { ad, odul, guc }

function basarimYukle() {
  try { const k = JSON.parse(localStorage.getItem(BASARIM_ANAHTAR) || '[]'); if (Array.isArray(k)) for (const id of k) if (BASARIMLAR.some(b => b.id === id)) ACIK.add(id); } catch { /* kayıt yoksa boş */ }
}
// Her karede çağrılır; yalnız kilitli başarımlara bakar. Yeni açılanların kimliklerini döndürür.
function basarimKontrol(o) {
  const yeni = [];
  for (const b of BASARIMLAR) {
    if (ACIK.has(b.id) || !b.sart(o)) continue;
    ACIK.add(b.id); yeni.push(b.id); kristalKazan(b.odul); basarimSesi(); BILDIRIM.push({ ad: b.ad, id: b.id, odul: b.odul, guc: 200 });
  }
  if (yeni.length) { try { localStorage.setItem(BASARIM_ANAHTAR, JSON.stringify([...ACIK])); } catch { /* sessiz */ } }
  return yeni;
}
const bildirimAdim = () => { for (let i = BILDIRIM.length - 1; i >= 0; i--) if (--BILDIRIM[i].guc <= 0) BILDIRIM.splice(i, 1); };

// ---- kule ----
// description: Buz Kule kule konseptleri (Buz, Kor, Rün, Kum, Yıldız): yalnız görünüm (renk tonu); açılış kuralları: başlangıç kulesi açık, bazıları başarımla, bazıları kristalle açılır. Kilit sistemi ayardan kapatılabilir (AYAR.kuleKilidi = 0 → hepsi açık). Fizik ve kat üretimi değişmez. Sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı).



// tint: tüm sahneye 'color' karışımıyla uygulanan ton (h: renk açısı, s/l: doygunluk/açıklık %, a: etki, karart: ek koyulaştırma)
const KULELER = Object.freeze([
  { id: 'buz', acik: { tur: 'acik' }, tint: null },
  { id: 'kor', acik: { tur: 'basarim', id: 'kat50' }, tint: { h: 12, s: 95, l: 48, a: 0.55, karart: 0.16 } },
  { id: 'run', acik: { tur: 'kristal', fiyat: 150 }, tint: { h: 268, s: 70, l: 46, a: 0.5, karart: 0.12 } },
  { id: 'kum', acik: { tur: 'kristal', fiyat: 300 }, tint: { h: 42, s: 85, l: 55, a: 0.55, karart: 0 } },
  { id: 'yildiz', acik: { tur: 'basarim', id: 'kat100' }, tint: { h: 225, s: 75, l: 30, a: 0.62, karart: 0.35 } },
]);
const KULE_ANAHTAR = 'buzkule.kuleler';
const KULE = { satin: [] }; // kristalla satın alınan kule numaraları

function kuleYukle() {
  KULE.satin = [];
  try {
    const k = JSON.parse(localStorage.getItem(KULE_ANAHTAR) || 'null');
    if (k && Array.isArray(k.satin)) KULE.satin = [...new Set(k.satin.filter((i) => Number.isInteger(i) && i > 0 && i < KULELER.length))];
  } catch { /* kayıt yoksa ya da bozuksa sıfırdan */ }
}
const kuleKaydet = () => { try { localStorage.setItem(KULE_ANAHTAR, JSON.stringify(KULE)); } catch { /* sessiz */ } };

// Kule seçilebilir mi? Kilit sistemi kapalıysa hepsi açık.
function kuleAcikMi(i) {
  const k = KULELER[i]; if (!k) return false;
  if (!AYAR.kuleKilidi || k.acik.tur === 'acik') return true;
  return k.acik.tur === 'basarim' ? ACIK.has(k.acik.id) : KULE.satin.includes(i);
}
// Kristalle satın alma: 'alindi' | 'yetersiz' | 'acik' (zaten açık) | 'gecersiz' (başarımla açılan ya da geçersiz numara)
function kuleAl(i) {
  const k = KULELER[i]; if (!k || k.acik.tur !== 'kristal') return 'gecersiz';
  if (kuleAcikMi(i)) return 'acik';
  if (CUZDAN.kristal < k.acik.fiyat) return 'yetersiz';
  CUZDAN.kristal -= k.acik.fiyat; KULE.satin.push(i); cuzdanKaydet(); kuleKaydet(); return 'alindi';
}
function kuleSec(i) { if (kuleAcikMi(i)) { AYAR.kule = i; return true; } return false; }
// Seçili kule artık kilitliyse (ör. kilit sistemi açıldı) başlangıç kulesine döner.
const kuleDogrula = () => { if (!kuleAcikMi(AYAR.kule)) AYAR.kule = 0; };

// ---- hayalet ----
// description: Buz Kule hayalet kaydı: tohumlu rastgelelik, giriş kaydı (kosu uzunluğu kodlu) ve kalıcı en iyi oyun kayıtları. Oyun kurallarını değiştirmez. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)

const SOL = 1, SAG = 2, ZIPLA = 4;

// mulberry32: küçük, hızlı, tekrarlanabilir rastgele sayı üreteci
function tohumluRnd(tohum) {
  let a = tohum >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// Kat başına ayrı üreteç: katlar hangi sırayla görüntülenirse görüntülensin aynı kalır (oyuncu ve hayalet aynı kuleyi görür).
const katRnd = (tohum, n) => tohumluRnd(((tohum >>> 0) ^ Math.imul(n + 1, 0x9E3779B1)) >>> 0);
const yeniTohum = () => (Math.random() * 4294967296) >>> 0;
function gunlukTohum(tarih = new Date()) { // yerel tarihe göre günlük tohum
  const s = tarih.getFullYear() * 10000 + (tarih.getMonth() + 1) * 100 + tarih.getDate(); return (Math.imul(s, 2654435761) >>> 0) || 1;
}
const gunlukAnahtar = (tarih = new Date(), z = 1) => 'buzkule.hayalet.' + tarih.getFullYear() + '-' + (tarih.getMonth() + 1) + '-' + tarih.getDate() + zSonek(z);

// Haftalık meydan okuma: haftaya özel sabit kule ve kayıt anahtarı; kule kodu: 1-8 onaltılık hane = tohum.
function haftalikTohum(tarih = new Date()) { let h = 2166136261; for (const ch of 'buzkule-' + haftaKimlik(tarih)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return (h >>> 0) || 1; }
const haftalikAnahtar = (tarih = new Date(), z = 1) => 'buzkule.hayalet.hafta.' + haftaKimlik(tarih) + zSonek(z);
const kodAnahtar = (tohum, z = 1) => 'buzkule.hayalet.kod.' + (tohum >>> 0).toString(16) + zSonek(z);
const kodCoz = (metin) => (/^[0-9a-f]{1,8}$/i.test(String(metin).trim()) ? parseInt(String(metin).trim(), 16) >>> 0 : null);
const girisBit = (g) => (g.sol ? SOL : 0) | (g.sag ? SAG : 0) | (g.zipla ? ZIPLA : 0);
const bitGiris = (b) => ({ sol: !!(b & SOL), sag: !!(b & SAG), zipla: !!(b & ZIPLA) });

// Kayıt: kare başına 3 bitlik giriş; art arda aynı değerler [değer, sayı] çiftleriyle sıkıştırılır.
function kayitBaslat() { return { kosu: [], son: -1, sayi: 0, kare: 0 }; }
function kayitEkle(k, g) {
  const b = girisBit(g); k.kare++;
  if (b === k.son) k.sayi++; else { if (k.sayi) k.kosu.push(k.son, k.sayi); k.son = b; k.sayi = 1; }
}
const KAYIT_SURUM = 1; // kayıt biçimi sürümü; v alanı olmayan eski kayıtlar sürüm 1 sayılır, bilinmeyen sürüm reddedilir
function kayitBitir(k, tohum, skor, kat) { const kosu = k.kosu.slice(); if (k.sayi) kosu.push(k.son, k.sayi); return { v: KAYIT_SURUM, tohum, kosu, skor, kat, kare: k.kare }; }
function kayitCoz(kayit) { // kare kare giriş bitleri dizisi
  const out = []; for (let i = 0; i + 1 < kayit.kosu.length; i += 2) for (let j = 0; j < kayit.kosu[i + 1]; j++) out.push(kayit.kosu[i]); return out;
}
function kayitGecerli(k) {
  return !!k && (k.v === undefined || k.v === KAYIT_SURUM) && Number.isFinite(k.tohum) && Number.isFinite(k.skor) && Number.isFinite(k.kat) && Array.isArray(k.kosu) && k.kosu.length % 2 === 0 && k.kosu.length < 40000
    && k.kosu.every((v, i) => Number.isInteger(v) && v >= 0 && (i % 2 === 0 ? v <= 7 : v >= 1 && v <= 200000)) // çift: giriş bitleri, tek: tekrar sayısı
    && k.kosu.reduce((t, v, i) => (i % 2 ? t + v : t), 0) <= 1000000; // toplam kare üst sınırı (bozuk kayıt belleği tüketmesin)
}
function kayitOku(anahtar) {
  try { const k = JSON.parse(localStorage.getItem(anahtar) || 'null'); return kayitGecerli(k) ? k : null; } catch { return null; }
}
function kayitYaz(anahtar, kayit) { try { localStorage.setItem(anahtar, JSON.stringify(kayit)); } catch { /* sessiz */ } }
const HAYALET_ANAHTAR = 'buzkule.hayalet';
const hayaletAnahtar = (z = 1) => HAYALET_ANAHTAR + zSonek(z);

// ---- fizik ----
// description: Buz Kule fizik çekirdeği (özgün kod). sahip: Claude (Buz Kule iş parçacığı)
// Sabitler mekanikler.md dosyasındaki gözlemlerden; orijinal kod kopyalanmadı.
const SABIT = Object.freeze({
  MAKS_VX: 12.2, MAKS_DUSME: 12.2, YERCEKIMI: 0.8,
  SURTUNME: 0.9, IVME: 0.3, TERS_YON_CARPAN: 0.7,
  DUVAR_SOL: 85, DUVAR_SAG: 555, SEKME: -0.9, FPS: 50,
});

function yatayGuncelle(vx, sol, sag) {
  const dir = (sag ? 1 : 0) - (sol ? 1 : 0);
  if (dir === 0) return vx * SABIT.SURTUNME;
  if (vx * dir < 0) vx *= SABIT.TERS_YON_CARPAN;
  vx += dir * SABIT.IVME;
  return Math.max(-SABIT.MAKS_VX, Math.min(SABIT.MAKS_VX, vx));
}

function zipla(vx) {
  return Math.min(-2 * Math.abs(vx), -SABIT.MAKS_VX);
}

function duvarSekmesi(x, vx) {
  if (x < SABIT.DUVAR_SOL) return { x: SABIT.DUVAR_SOL, vx: vx * SABIT.SEKME };
  if (x > SABIT.DUVAR_SAG) return { x: SABIT.DUVAR_SAG, vx: vx * SABIT.SEKME };
  return { x, vx };
}

function dikeyGuncelle(vy) {
  return Math.min(vy + SABIT.YERCEKIMI, SABIT.MAKS_DUSME);
}

// ---- kat ----
// description: Prosedürel kat üretimi (özgün kod). sahip: Claude (Buz Kule iş parçacığı)
const KARO = 16, KAT_ARALIK = 80, SATIR_KARO = 30;
const ZEMIN_Y = 440, AYAK = 10; // zemin çizgisi; ayak yarı genişliği: basamak kenarından bu kadar taşan ayak hâlâ basamağa basar (Rust çekirdeğiyle ortak)
function genislik(kat, rnd) {
  if (kat > 0 && kat % 50 === 0) return SATIR_KARO;
  const aralik = Math.max(1, Math.round((300 - kat) / 30));
  const w = 6 + Math.floor(rnd() * aralik);
  const ust = kat < 100 ? SATIR_KARO : Math.max(3, 6 - Math.floor(kat / 100));
  return Math.max(2, Math.min(w, ust));
}
function katUret(kat, rnd = Math.random) {
  const w = genislik(kat, rnd);
  const bas = 5 + (w === SATIR_KARO ? 0 : Math.floor(rnd() * (SATIR_KARO - w + 1)));
  const kristal = kat > 0 && rnd() < 0.3, kristalX = rnd(); // toplanabilir kristal: katların ~%30'unda, basamağın üstünde yüzer
  // güç öğesi (kristalsiz katların ~%7'sinde): 'saat' kaymayı yavaşlatır, 'miknatis' yakındaki kristalleri çeker
  const gucZar = rnd(), guc = kat > 4 && !kristal && gucZar < 0.07 ? (gucZar < 0.035 ? 'saat' : 'miknatis') : null;
  // basamak türü (kat 15'ten sonra; numaralı ve tam genişlik katlar hep normal): 'kirilgan' basılınca kırılır, 'yay' yukarı fırlatır
  const turZar = rnd(), tur = kat >= 15 && kat % 10 !== 0 && w < SATIR_KARO ? (turZar < 0.08 ? 'kirilgan' : turZar < 0.14 ? 'yay' : 'normal') : 'normal';
  return { kat, y: -kat * KAT_ARALIK, xKaro: bas, genislikKaro: w, no: kat % 10 === 0, tema: Math.floor(kat / 100), kristal, kristalX, guc, tur };
}

const CEKIRDEK_B64 = "AGFzbQEAAAABQgtgAAF/YAF8AXxgAnx8AGAIf3x8fHx/f38Bf2ACf38AYAF/AX9gAX8AYAV/fHx8fABgBH98fHwAYAN8f38BfGAAAAMPDgABAgMABAUGAAcICQEKBQMBABgHqQENBmJlbGxlawIADGNpa2lzX2FkcmVzaQAADmRpa2V5X2d1bmNlbGxlAAENZHV2YXJfc2VrbWVzaQACCGluaXNfYXJhAAMLa2FyZV9hZHJlc2kABAhrYXRfdXJldAAFCWtheWl0X2NvegAGC2tvc3VfYWRyZXNpAAgJcHVhbl9pbmlzAAkJcHVhbl9rYXJlAAoOeWF0YXlfZ3VuY2VsbGUACwV6aXBsYQAMCuYZDggAQcCGx4AACyYAIABEmpmZmZmZ6T+gIgBEZmZmZmZmKEAgAERmZmZmZmYoQGMbC3kBAXxEAAAAAABAVUAhAgJAAkACQCAARAAAAAAAQFVAYw0ARAAAAAAAWIFAIQIgAEQAAAAAAFiBQGQNASAAIQIMAgsgAUTNzMzMzMzsv6IhAQwBCyABRM3MzMzMzOy/oiEBC0EAIAE5A8iGx4AAQQAgAjkDwIbHgAAL3wUFAnwFfwR8AX4CfwJAIAUgBk0NAEF/DwsgASADoSEIIAIgBKEhCUGx893xeSAFQc+Moo4GbGshCkEAIQsgBSEMA0AgDEEybiENAkACQCALQSBPDQAgByALdkEBcQ0BCyAFIAtqIg64Ig9EAAAAAAAAVMCiRAAAAAAAgHtAoCEQAkACQAJAAkAgDkUNAEQAAAAAAMBSQCERRAAAAAAA+IFAIRICQCAOIA1BTmxqRQ0ARAAAAAAAAPA/RAAAAAAAAPA/RAAAAAAAwHJAIA+hRAAAAAAAAD5Ao0QAAAAAAADgP6AiD/wHIhO6IBNQGyAPRAAAAAAAAAAAYxsgCiAAcyIUQfXzrekGaiINQQ92IA1zIA1BAXJsIg1BB3YgDXMgDUE9cmwgDWogDXMiDUEOdiANc7hEAAAAAAAA8D2iovwHuvwDQQZqIQ0CQAJAIA5B5ABPDQBBHiEVDAELAkAgDkGPA00NAEEDIRUMAQtBBiAOQf//A3FB5ABuayEVCyANIBUgDSAVSRsiFUEeRg0AIBRB6ufb0n1qIg1BD3YgDXMgDUEBcmwiDUEHdiANcyANQT1ybCANaiANcyINQQ52IA1zuEQAAAAAAADwPaIgFUECIBVBAksbIg1BH3O4ovwHuvwDuEQAAAAAAAAwQKJEAAAAAABAVUCgIg9EAAAAAAAAJMCgIREgDyANQQR0uKBEAAAAAAAAJECgIRILRAAAAAAAAPA/IQ8gAiAEZEUNAkQAAAAAAADwPyAQIAShIAmjIg8gD0QAAAAAAADwP2QbIg9EAAAAAAAAAABjDQEMAgsgAiAQYw0DQQAhDgwCC0QAAAAAAAAAACEPCyAEIBBlRQ0BIAIgEGZFDQECQCADIAggD6KgIhAgEWZFDQAgECASZQ0BCyABIBFmRQ0BIAEgEmVFDQEgDA8LIA4PCyAKQbHz3fF5aiEKIAxBAWohDCAFIAtBAWoiC2ogBk0NAAtBfwsIAEGAoICAAAumCAUCfwF8AX4CfwF8IAFBMnAhAiABQbHz3fF5bEGx893xeWogAHMhAwJAAkACQAJAIAFFDQAgAg0AQR4hAkQAAAAAAAAUQCEEDAELRAAAAAAAAPA/RAAAAAAAAPA/RAAAAAAAwHJAIAG4oUQAAAAAAAA+QKNEAAAAAAAA4D+gIgT8ByIFuiAFUBsgBEQAAAAAAAAAAGMbIANB9fOt6QZqIgBBD3YgAHMgAEEBcmwiAkEHdiACcyACQT1ybCACaiACcyICQQ52IAJzuEQAAAAAAADwPaKi/Ae6/ANBBmohBkEeIQJBHiEHAkAgAUHkAEkNAEEDIQcgAUGPA0sNAEEGIAFB//8DcUHkAG5rIQcLRAAAAAAAABRAIQQCQCAGIAcgBiAHSRsiB0EeRg0AIANB6ufb0n1qIgBBD3YgAHMgAEEBcmwiA0EHdiADcyADQT1ybCADaiADcyIDQQ52IANzuEQAAAAAAADwPaIgB0ECIAdBAksbIgJBH3O4ovwHuvwDQQVquCEECyABRQ0BIAAhAwsgA0H1863pBmoiAEEPdiAAcyAAQQFybCIDQQd2IANzIANBPXJsIANqIANzIgNBDnYgA3O4RAAAAAAAAPA9okQzMzMzMzPTP2MhAwwBC0EAIQMLAkACQAJAIAFBDksNACABIAFBdmogAUEKSRshBwwBCyABQQpwIgdFDQAgAkEdSw0AQQAgBDkDyIbHgABBACACuDkD0IbHgABBACABuDkDwIbHgABEAAAAAAAAAAAhCEQAAAAAAADwP0QAAAAAAAAAQEQAAAAAAAAAACAAQd/bibwEaiICQQ92IAJzIAJBAXJsIgJBB3YgAnMgAkE9cmwgAmogAnMiAkEOdiACc7hEAAAAAAAA8D2iIgRE7FG4HoXrwT9jGyAERHsUrkfherQ/YxshBAwBC0EAIAQ5A8iGx4AAQQAgArg5A9CGx4AAQQAgAbg5A8CGx4AARAAAAAAAAAAAIQREAAAAAAAAAABEAAAAAAAA8D8gBxshCAtBACAEOQOAh8eAAEEAIAg5A9iGx4AAQQAgAUHkAG64OQPghseAAEEARAAAAAAAAPA/RAAAAAAAAAAAIANBAXEiAhs5A+iGx4AAQQAgAEH1863pBmoiA0EPdiADcyADQQFybCIDQQd2IANzIANBPXJsIANqIANzIgNBDnYgA3O4RAAAAAAAAPA9ojkD8IbHgABBAEQAAAAAAAAAAEQAAAAAAAAAAEQAAAAAAAAAAEQAAAAAAADwP0QAAAAAAAAAQCAAQern29J9aiIAQQ92IABzIABBAXJsIgBBB3YgAHMgAEE9cmwgAGogAHMiAEEOdiAAc7hEAAAAAAAA8D2iIgRE7FG4HoXroT9jGyAEROxRuB6F67E/ZhsgAhsgAUEFSRs5A/iGx4AAC7EBAQV/AkACQCAAQcC4AksNAAJAIABBAk8NAEEADwtBACEBQQAhAgNAIAJBAnQiAygCxKS9gAAiBCABaiIFQcGEPU8NAQJAAkAgBEUNACADKALApL2AACEDA0AgAUHAhD1GDQIgAUGAoICAAGogAzoAACABQQFqIQEgBEF/aiIEDQALCyACQQNqIQQgBSEBIAJBAmohAiAEIABJDQEMAwsLIAEQh4CAgAAAC0F/IQULIAULCQAQjYCAgAAACwgAQcCkvYAAC+ADAQN8AkAgBEQAAAAAAAAAQGYNAEQAAAAAAAAAACEEAkACQCAADQBEAAAAAAAAAAAhBUQAAAAAAAAAACEGRAAAAAAAAAAAIQcMAQtEAAAAAAAAAAAhBUQAAAAAAAAAACEGRAAAAAAAAAAAIQcgA0QAAAAAAAAAQGZFDQAgASABoiEERAAAAAAAAPA/IQUgASEGIAMhBwtBAEIANwPYhseAAEEAQgA3A9CGx4AAQQBCADcDyIbHgABBAEIANwPAhseAAEEAIAc5A/iGx4AAQQAgBjkD8IbHgABBACAFOQPohseAAEEAIAQ5A+CGx4AADwsCQCAARQ0AQQBCADcD4IbHgABBAEKAgICAgIDArMAANwPQhseAAEEAQoCAgICAgID4PzcDwIbHgABBAEIANwPohseAAEEAQgA3A/CGx4AAQQBCADcD+IbHgABBACADRAAAAAAAAPA/oDkD2IbHgABBACABIASgOQPIhseAAA8LQQBCADcD4IbHgABBAEKAgICAgICA+D83A9iGx4AAQQBCgICAgICAwKzAADcD0IbHgABBACAEOQPIhseAAEEAQoCAgICAgID4PzcDwIbHgABBAEIANwPohseAAEEAQgA3A/CGx4AAQQBCADcD+IbHgAALkwMBA3wCQCAADQBBAEIANwP4hseAAEEAQgA3A/CGx4AAQQBCADcD6IbHgABBAEIANwPghseAAEEAQgA3A9iGx4AAQQBCADcD0IbHgABBAEIANwPIhseAAEEAQgA3A8CGx4AADwtEAAAAAAAAAAAhBAJAIAJEAAAAAAAA8L+gIgJEAAAAAAAAAABlRQ0ARAAAAAAAAAAAIQJEAAAAAAAAAAAhBUQAAAAAAAAAACEGAkAgA0QAAAAAAAAAQGZFDQAgASABoiEERAAAAAAAAPA/IQIgASEFIAMhBgtBAEIANwPYhseAAEEAQgA3A9CGx4AAQQBCADcDyIbHgABBAEIANwPAhseAAEEAIAY5A/iGx4AAQQAgBTkD8IbHgABBACACOQPohseAAEEAIAQ5A+CGx4AADwtBAEIANwPghseAAEEAIAM5A9iGx4AAQQAgAjkD0IbHgABBACABOQPIhseAAEEAQoCAgICAgID4PzcDwIbHgABBAEIANwPohseAAEEAQgA3A/CGx4AAQQBCADcD+IbHgAALrwEBAXwCQEQAAAAAAADwP0QAAAAAAAAAACACG0QAAAAAAADwP0QAAAAAAAAAACABG6EiA0QAAAAAAAAAAGENAAJARGZmZmZmZihAIANEMzMzMzMz0z+iIABEZmZmZmZm5j+iIAAgACADokQAAAAAAAAAAGMboCIAIABEZmZmZmZmKEBkGyIARGZmZmZmZijAY0UNAERmZmZmZmYowCEACyAADwsgAETNzMzMzMzsP6ILNgAgAJogACAARAAAAAAAAAAAYxtEAAAAAAAAAMCiIgBEZmZmZmZmKMAgAERmZmZmZmYowGMbCwMAAAs=";
// ---- cekirdek ----
// description: Buz Kule Rust çekirdeği yükleyici (aşama 1: kat üretimi). core.wasm baytları birleştirilmiş betiğe base64 olarak gömülür (CEKIRDEK_B64, arac/birlestir.py); yüklenemezse ya da kendi kendine sınavda JS ile uyuşmazsa eski JS kat üretimi kullanılır. Sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı). Sözleşme: PLAN-buz-kule.md.




let cekirdekIc = null;
const GUC_AD = [null, 'saat', 'miknatis'], TUR_AD = ['normal', 'kirilgan', 'yay'];
const rustKat = (tohum, n) => {
  cekirdekIc.kat_uret(tohum >>> 0, n);
  const v = new Float64Array(cekirdekIc.bellek.buffer, cekirdekIc.cikis_adresi(), 9);
  return { kat: v[0], y: -v[0] * KAT_ARALIK, xKaro: v[1], genislikKaro: v[2], no: v[3] === 1, tema: v[4], kristal: v[5] === 1, kristalX: v[6], guc: GUC_AD[v[7]], tur: TUR_AD[v[8]] };
};
const ayni = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// Aşama 2: fizik. Rust çekirdeği varsa onunla, yoksa src/fizik.js ile (aynı sonuç).
const yatayGuncelleC = (vx, sol, sag) => (cekirdekIc ? cekirdekIc.yatay_guncelle(vx, sol ? 1 : 0, sag ? 1 : 0) : yatayGuncelle(vx, sol, sag));
const ziplaC = (vx) => (cekirdekIc ? cekirdekIc.zipla(vx) : zipla(vx));
const dikeyGuncelleC = (vy) => (cekirdekIc ? cekirdekIc.dikey_guncelle(vy) : dikeyGuncelle(vy));
function duvarSekmesiC(x, vx) {
  if (!cekirdekIc) return duvarSekmesi(x, vx);
  cekirdekIc.duvar_sekmesi(x, vx);
  const v = new Float64Array(cekirdekIc.bellek.buffer, cekirdekIc.cikis_adresi(), 2);
  return { x: v[0], vx: v[1] };
}
// Aşama 2b: puan/kombo. Durum JS nesnesinde (p.kombo, p.bonus) kalır; Rust yalnız kuralı hesaplar.
function puanUygula(p) {
  const v = new Float64Array(cekirdekIc.bellek.buffer, cekirdekIc.cikis_adresi(), 8);
  p.kombo = v[0] === 1 ? { toplam: v[1], sayac: v[2], zip: v[3] } : null;
  if (v[4] !== 0) p.bonus += v[4];
  return v[5] === 1 ? { ad: odulAdi(v[6]), toplam: v[6], zip: v[7] } : null;
}
function puanInisC(p, katFarki) {
  if (!cekirdekIc) return inis(p, katFarki);
  const k = p.kombo; cekirdekIc.puan_inis(k ? 1 : 0, k ? k.toplam : 0, k ? k.sayac : 0, k ? k.zip : 0, katFarki);
  return puanUygula(p);
}
function puanKareC(p) {
  if (!cekirdekIc) return kare(p);
  const k = p.kombo; if (!k) return null;
  cekirdekIc.puan_kare(1, k.toplam, k.sayac, k.zip);
  return puanUygula(p);
}
function puanSinav() {
  let s = 777; const r = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  const a = yeniPuan(), b = yeniPuan();
  for (let i = 0; i < 20000; i++) {
    const kareMi = r() < 0.5, fark = Math.floor(r() * 8) - 2;
    const ra = kareMi ? puanKareC(a) : puanInisC(a, fark), rb = kareMi ? kare(b) : inis(b, fark);
    if (!ayni(ra, rb) || !ayni(a, b)) return false;
  }
  return true;
}
// Aşama 3a: iniş araması (basamak çarpışması). JS sürümü: ilk inilen kat ya da -1.
function inisBulJS(katFn, kirikHas, x, y, eskiX, eskiY) {
  for (let n = Math.max(0, Math.floor((ZEMIN_Y - y) / KAT_ARALIK) - 1); n <= Math.floor((ZEMIN_Y - eskiY) / KAT_ARALIK) + 1; n++) {
    const f = katFn(n), py = ZEMIN_Y - n * KAT_ARALIK, kx0 = 85 + (f.xKaro - 5) * KARO, kx1 = kx0 + f.genislikKaro * KARO;
    if (kirikHas(n)) continue;
    const t = y > eskiY ? Math.min(1, Math.max(0, (py - eskiY) / (y - eskiY))) : 1, xk = eskiX + (x - eskiX) * t;
    const uzerinde = (v) => v >= kx0 - AYAK && v <= kx1 + AYAK;
    if (n === 0 ? true : (eskiY <= py && y >= py && (uzerinde(xk) || uzerinde(x)))) {
      if (n === 0 && y < py) continue;
      return n;
    }
  }
  return -1;
}
// Rust çekirdeği varsa ve oyun tohumluysa Rust, yoksa JS. kirik: kırık katların Set'i, katFn: o.kat.
function inisBulC(tohum, kirik, katFn, x, y, eskiX, eskiY) {
  const n0 = Math.max(0, Math.floor((ZEMIN_Y - y) / KAT_ARALIK) - 1), n1 = Math.floor((ZEMIN_Y - eskiY) / KAT_ARALIK) + 1;
  if (!cekirdekIc || tohum === null || n1 < n0 || n1 - n0 >= 32) return inisBulJS(katFn, (n) => kirik.has(n), x, y, eskiX, eskiY);
  let maske = 0; for (let i = 0; i <= n1 - n0; i++) if (kirik.has(n0 + i)) maske |= 1 << i;
  return cekirdekIc.inis_ara(tohum >>> 0, x, y, eskiX, eskiY, n0, n1, maske >>> 0);
}
function inisSinav() {
  let s = 4242; const r = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 6000; i++) {
    const tohum = (r() * 4294967296) >>> 0, katFn = (n) => katUret(n, katRnd(tohum, n));
    const eskiY = ZEMIN_Y - r() * (i % 3 === 0 ? 400 : 20000), y = eskiY + r() * 12.2, eskiX = 60 + r() * 520, x = eskiX + (r() - 0.5) * 24;
    const kirik = new Set(); for (let k = 0; k < 4; k++) if (r() < 0.3) kirik.add(Math.max(0, Math.floor((ZEMIN_Y - y) / KAT_ARALIK) - 1 + Math.floor(r() * 4)));
    if (inisBulC(tohum, kirik, katFn, x, y, eskiX, eskiY) !== inisBulJS(katFn, (n) => kirik.has(n), x, y, eskiX, eskiY)) return false;
  }
  return true;
}
// Aşama 4: hayalet kaydı çözme. Rust çekirdeği varsa onunla (sınırlar aşılırsa ya da hata olursa JS ile).
function kayitCozC(kayit) {
  const kosu = kayit.kosu;
  if (!cekirdekIc || kosu.length > 40000) return kayitCoz(kayit);
  const adres = cekirdekIc.kosu_adresi(), tampon = cekirdekIc.bellek.buffer;
  new Uint32Array(tampon, adres, kosu.length).set(kosu);
  const n = cekirdekIc.kayit_coz(kosu.length);
  return n < 0 ? kayitCoz(kayit) : Array.from(new Uint8Array(tampon, cekirdekIc.kare_adresi(), n));
}
function kayitSinav() {
  let s = 99; const r = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 300; i++) {
    const kosu = []; const adet = Math.floor(r() * 300);
    for (let k = 0; k < adet; k++) kosu.push(Math.floor(r() * 8), 1 + Math.floor(r() * 80));
    if (!ayni(kayitCozC({ kosu }), kayitCoz({ kosu }))) return false;
  }
  return true;
}
// Kendi kendine sınav (fizik): sabit tohumlu sahte rastgele girdilerle JS ile bit düzeyinde aynı olmalı.
function fizikSinav() {
  let s = 12345; const r = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 3000; i++) {
    const vx = (r() - 0.5) * 30, vy = (r() - 0.5) * 40, x = 60 + r() * 520, sol = r() < 0.4, sag = r() < 0.4;
    if (!Object.is(yatayGuncelleC(vx, sol, sag), yatayGuncelle(vx, sol, sag)) || !Object.is(ziplaC(vx), zipla(vx)) || !Object.is(dikeyGuncelleC(vy), dikeyGuncelle(vy))) return false;
    const a = duvarSekmesiC(x, vx), b = duvarSekmesi(x, vx);
    if (!Object.is(a.x, b.x) || !Object.is(a.vx, b.vx)) return false;
  }
  return true;
}

// Baytlardan çekirdeği kurar (küçük modül, eşzamanlı derlenir). Kendi kendine sınav: 8 tohum x 120 kat JS ile birebir aynı olmalı, değilse kapatılır.
function cekirdekYukle(b64) {
  cekirdekIc = null;
  try {
    const bayt = Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));
    cekirdekIc = new WebAssembly.Instance(new WebAssembly.Module(bayt), {}).exports;
    for (const t of [0, 1, 7, 42, 1234, 99999, 2147483647, 4294967295]) for (let n = 0; n < 120; n++)
      if (!ayni(rustKat(t, n), katUret(n, katRnd(t, n)))) throw new Error('çekirdek uyuşmazlığı');
    if (!fizikSinav()) throw new Error('fizik uyuşmazlığı');
    if (!puanSinav()) throw new Error('puan uyuşmazlığı');
    if (!inisSinav()) throw new Error('iniş uyuşmazlığı');
    if (!kayitSinav()) throw new Error('kayıt çözme uyuşmazlığı');
  } catch { cekirdekIc = null; }
  return cekirdekIc !== null;
}
const cekirdekVar = () => cekirdekIc !== null;
// Tohumlu kat üretimi: Rust çekirdeği varsa onunla, yoksa JS ile (aynı sonuç).
const katUretTohum = (n, tohum) => (cekirdekIc ? rustKat(tohum, n) : katUret(n, katRnd(tohum, n)));

if (typeof CEKIRDEK_B64 !== 'undefined') cekirdekYukle(CEKIRDEK_B64);

// ---- puan ----
// description: Puan ve kombo kuralları (özgün kod). sahip: Claude (Buz Kule iş parçacığı)
const KOMBO_KARE = 100;
const ODULLER = [[200,'KUSURSUZ'],[140,'DESTAN'],[100,'EFSANE'],[70,'OLAĞANÜSTÜ'],[50,'İNANILMAZ'],[35,'MUHTEŞEM'],[25,'SÜPER'],[15,'HARİKA'],[7,'GÜZEL'],[0,'İYİ']];
const ODUL_SIRA = ODULLER.map((e) => e[1]).reverse(); // küçükten büyüğe ödül adları (dil anahtarı hud_odul<sıra>)
const odulAdi = (toplamKat) => ODULLER.find(([e]) => toplamKat >= e)[1];

function yeniPuan() { return { katPuani: 0, bonus: 0, kombo: null }; }

// Her inişte çağır: katFarki = bu zıplamada çıkılan kat (düşüşte <=0).
function inis(p, katFarki, yeniEnYuksekKat = 0) {
  if (katFarki >= 2) {
    p.kombo = p.kombo ? { toplam: p.kombo.toplam + katFarki, sayac: KOMBO_KARE, zip: p.kombo.zip + 1 }
                      : { toplam: katFarki, sayac: KOMBO_KARE, zip: 1 };
    return null;
  }
  return bitir(p);
}
function kare(p) {
  if (!p.kombo) return null;
  return --p.kombo.sayac <= 0 ? bitir(p) : null;
}
function bitir(p) {
  const k = p.kombo; p.kombo = null;
  if (!k || k.zip < 2) return null;
  p.bonus += k.toplam * k.toplam;
  return { ad: odulAdi(k.toplam), toplam: k.toplam, zip: k.zip };
}
const toplam = (p, enYuksekKat) => enYuksekKat * 10 + p.bonus;

// ---- ses ----
// description: Buz Kule ses ve müzik: hazır CC0 dosyalarını (Kenney Digital Audio efektleri, SketchyLogic NES müziği; kaynak varlik/ses/KAYNAK.txt) HTMLAudio ile çalar. Efekt ve müzik ayrı açılıp kapanır; ses düzeyi ayar.js'den. Orijinal oyunun sesi yok. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)

const YOL = './varlik/ses/', MUZIK_SES = 0.32;
const kaynaklar = {}, havuzlar = {};
const HAVUZ = 3; // ad başına dönüşümlü Audio sayısı: aynı efekt üst üste çalabilir, her çalmada yeni nesne üretilmez
const ses_var = () => typeof Audio !== 'undefined';
const belge = () => (typeof document !== 'undefined' ? document : null);
function dosya(ad) { // ad uzantısız ve ".ogg"; uzantılıysa olduğu gibi
  if (!kaynaklar[ad]) { const a = new Audio(YOL + (ad.includes('.') ? ad : ad + '.ogg')); a.preload = 'auto'; kaynaklar[ad] = a; }
  return kaynaklar[ad];
}
function havuz(ad) { // ilk istekte kurulur; kopyalar yüklenmiş kaynağı paylaşır
  if (!havuzlar[ad]) { const t = dosya(ad); const liste = []; for (let i = 0; i < HAVUZ; i++) liste.push(typeof t.cloneNode === 'function' ? t.cloneNode() : new Audio(t.src)); havuzlar[ad] = { liste, i: 0 }; }
  return havuzlar[ad];
}
// Efekt çalar: efektler kapalıysa ya da ses düzeyi 0 ise hiçbir şey olmaz. Havuzdaki nesneler sırayla kullanılır.
function cal(ad, ses = 1, perde = 1) {
  if (!ses_var() || !AYAR.efektAcik || AYAR.ses <= 0) return;
  try {
    const h = havuz(ad), a = h.liste[h.i]; h.i = (h.i + 1) % h.liste.length;
    try { a.currentTime = 0; } catch { /* henüz yüklenmemiş olabilir */ }
    a.preservesPitch = false; a.playbackRate = perde; // perde: 1 = normal; kombo büyüdükçe yükselir
    a.volume = Math.max(0, Math.min(1, AYAR.ses * ses)); const s = a.play(); if (s && s.catch) s.catch(() => {});
  } catch { /* ses yoksa oyun sessiz sürer */ }
}
const EFEKTLER = ['phaseJump1', 'phaseJump3', 'phaseJump5', 'powerUp5', 'powerUp8', 'lowDown', 'pepSound3', 'threeTone1', 'powerUp1', 'phaserUp3', 'lowRandom', 'kazanma.wav'];
function efektOnYukle() { // ilk kullanımı beklemeden açılışta yükler; Audio yoksa sessiz geçer
  if (!ses_var()) return;
  try { for (const ad of EFEKTLER) havuz(ad); } catch { /* ses yoksa oyun sessiz sürer */ }
}
efektOnYukle();
const zipSesi = (hiz, kombo = 0) => cal(Math.abs(hiz) > 9 ? 'phaseJump5' : Math.abs(hiz) > 5 ? 'phaseJump3' : 'phaseJump1', 0.7, 1 + Math.min(Math.max(kombo, 0), 8) * 0.06); // kombo perdesi: her kombo zıplamasında ~%6 yükselir (en çok 8 basamak)
const odulSesi = (toplamKat) => cal(toplamKat >= 25 ? 'powerUp8' : 'powerUp5', 0.9);
const olumSesi = () => cal('lowDown', 0.9);
const kristalSesi = () => cal('pepSound3', 0.8);
const hizSesi = () => cal('threeTone1', 0.8);
const gucSesi = () => cal('powerUp1', 0.8);
const yaySesi = () => cal('phaserUp3', 0.8);
const kirmaSesi = () => cal('lowRandom', 0.9);
const basarimSesi = () => cal('kazanma.wav', 0.7);

// Müzik: kısa döngülü bir parça; yalnız oyun sürerken çalar. Açık/kapalı ayardan (varsayılan kapalı), duraklatınca durur.
// Düzey AYAR.ses ile ölçeklenir (0 ise çalmaz). Autoplay reddedilirse ilk tuş/dokunuşta bir kez yeniden denenir; sekme gizlenince duraklar.
let muzik = null, istek = false, bekleyen = false;
const calmali = () => istek && !!AYAR.muzikAcik && AYAR.ses > 0 && !(belge() && belge().hidden);
function dene() {
  if (!muzik) return;
  const s = muzik.play();
  if (s && s.catch) s.catch(() => { if (!bekleyen) { bekleyen = true; kullaniciBekle(); } });
}
function kullaniciBekle() {
  const d = belge(); if (!d || !d.addEventListener) return;
  const tetik = () => { d.removeEventListener('pointerdown', tetik); d.removeEventListener('keydown', tetik); bekleyen = false; try { if (calmali() && muzik && muzik.paused) { const s = muzik.play(); if (s && s.catch) s.catch(() => {}); } } catch { /* sessiz */ } };
  d.addEventListener('pointerdown', tetik); d.addEventListener('keydown', tetik);
}
function muzikGuncelle(calsin, bastan = false) { // bastan: yeni oyun, parça başa sarılır
  if (!ses_var()) return;
  try {
    istek = !!calsin;
    if (!muzik) { muzik = new Audio(YOL + 'muzik.wav'); muzik.loop = true; }
    muzik.volume = Math.max(0, Math.min(1, MUZIK_SES * AYAR.muzikSes));
    if (bastan) { try { muzik.currentTime = 0; } catch { /* yüklenmemiş olabilir */ } }
    if (calmali()) dene(); else muzik.pause();
  } catch { /* müzik yoksa oyun sessiz sürer */ }
}
const gorunurluk = belge();
if (gorunurluk && gorunurluk.addEventListener) gorunurluk.addEventListener('visibilitychange', () => {
  if (!muzik) return;
  try { if (calmali()) dene(); else muzik.pause(); } catch { /* sessiz */ }
});
const muzikCaliyor = () => !!muzik && !muzik.paused;

// ---- gorsel ----
// description: Buz Kule görsel katmanı: aurora gökyüzü, kristal siluetleri, taş duvarlar ve mesaleCizler, temaya göre detaylı basamaklar (buz, ametist, ahşap, yosunlu taş), kristal toplanabilirleri, parçacıklar, akış hali (kombo x5+: ton kayması ve kenar hız çizgileri; yalnız görünüm) (prosedürel vektör çizim; yüksek çözünürlükte keskin). sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)

const TEMALAR = [
  { ad: 'buz', ust: '#050a1f', alt: '#12356a', serit: ['#38f2c8', '#5aa8ff'], plat: '#7fe9ff', koyu: '#1b6f9a', kristal: '#0b2a55', duvar: '#2a3f66', harc: '#16233f', mesale: '#8fe3ff' },
  { ad: 'ametist', ust: '#12062b', alt: '#4a1a80', serit: ['#c76bff', '#ff6bd5'], plat: '#e0b3ff', koyu: '#7a3fb8', kristal: '#2a0f52', duvar: '#43296b', harc: '#251440', mesale: '#ff9bf0' },
  { ad: 'tahta', ust: '#1f0a1c', alt: '#6b1f45', serit: ['#ff8a5a', '#ffd24a'], plat: '#ffc2a0', koyu: '#c4553a', kristal: '#3d1230', duvar: '#5b3042', harc: '#321723', mesale: '#ffb347' },
  { ad: 'yosun', ust: '#04161a', alt: '#0b5a50', serit: ['#3dffa8', '#3dd0ff'], plat: '#9affd8', koyu: '#1d8f78', kristal: '#07343a', duvar: '#2a4a46', harc: '#122624', mesale: '#9dff8f' },
];
const hash = (n) => { let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };
const temaNo = (kat) => Math.floor(kat / 100) % TEMALAR.length;
const tema = (kat) => TEMALAR[temaNo(kat)];
let zaman = 0;

// Çizim önbellekleri (yalnız görünüm): sabit gradyanlar tema+boyut anahtarıyla, duvar taş şeridi OffscreenCanvas'ta bir kez çizilir.
// Bağlam değişirse (yeni tuval/test) gradyan önbelleği sıfırlanır; OffscreenCanvas yoksa eski çizim yoluna düşülür.
let gkCtx = null; const gk = new Map();
function gradyan(c, anahtar, uret) {
  if (gkCtx !== c) { gk.clear(); gkCtx = c; }
  let g = gk.get(anahtar); if (!g) { g = uret(); gk.set(anahtar, g); } return g;
}
const SERIT_SATIR = 64, DUV_BH = 22, DUV_BW = 42; // taş şeridi 64 sıra (1408 px) sonra tekrarlanır
const duvarSeritleri = new Map();
function olusTuval(g, h) {
  try { if (typeof OffscreenCanvas !== 'function') return null; const o = new OffscreenCanvas(g, h), k = o.getContext('2d'); return k ? { tuval: o, k } : null; } catch (e) { return null; }
}

function yuvarlak(c, x, y, g, h, r) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + g, y, x + g, y + h, r); c.arcTo(x + g, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + g, y, r); c.closePath();
}
const karisim = (hex, k) => { // hex rengi k (-1..1) kadar koyulaştır/açıklaştır
  const n = parseInt(hex.slice(1), 16), f = (v) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
};

// "Akış hali" (yalnız görünüm): kombo x5 ve üstünde hedef 1, yoksa 0; değer her karede yumuşakça hedefe yaklaşır.
let akis = 0;
const akisDegeri = () => akis;
const akisSifirla = () => { akis = 0; };

// Kule konsepti tonu (yalnız görünüm): tüm sahneye 'color' karışımı + isteğe bağlı koyulaştırma; tint null ise (Buz Kulesi) hiçbir şey yapmaz.
function kuleTint(c, W, H, tint) {
  if (!tint) return;
  c.save(); c.globalCompositeOperation = 'color'; c.globalAlpha = tint.a; c.fillStyle = 'hsl(' + tint.h + ',' + tint.s + '%,' + tint.l + '%)'; c.fillRect(0, 0, W, H);
  if (tint.karart) { c.globalCompositeOperation = 'multiply'; c.globalAlpha = tint.karart; c.fillStyle = '#14102a'; c.fillRect(0, 0, W, H); }
  c.restore();
}
// Kule konseptine özel arka plan efektleri (yalnız görünüm, kapatılabilir): Kor'da yükselen kıvılcımlar, Kum'da savrulan taneler,
// Yıldız'da parlayan yıldızlar ve ara sıra kayan yıldız, Rün'de süzülen parlak elmaslar. Buz Kulesi'nde efekt yoktur.
const kh = (i, k) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); }; // 0..1 sahte rastgele (deterministik)
function kuleEfektCiz(c, W, H, id, kare = zaman) {
  const yog = Math.min(1, Math.max(0, AYAR.parcacik)); if (!yog || id === 'buz') return;
  c.save();
  if (id === 'kor') {
    const n = Math.round(26 * yog); c.fillStyle = '#ffb347';
    for (let i = 0; i < n; i++) { const y = H - ((kare * (0.35 + kh(i, 2) * 0.9) + kh(i, 3) * H) % H), x = kh(i, 1) * W + Math.sin(kare * 0.02 + i) * 10, b = 1 + Math.floor(kh(i, 4) * 3); c.globalAlpha = 0.25 + 0.5 * (y / H); c.fillRect(x, y, b, b); }
  } else if (id === 'kum') {
    const n = Math.round(30 * yog); c.fillStyle = '#ffe8aa';
    for (let i = 0; i < n; i++) { const gen = W * 1.3, x = ((kare * (1.4 + kh(i, 2) * 2.2) + kh(i, 3) * gen) % gen) - W * 0.15, y = kh(i, 1) * H + Math.sin(kare * 0.03 + i) * 3; c.globalAlpha = 0.18 + kh(i, 5) * 0.25; c.fillRect(x, y, 5 + kh(i, 4) * 10, 1); }
  } else if (id === 'yildiz') {
    const n = Math.round(34 * yog); c.fillStyle = '#ffffff';
    for (let i = 0; i < n; i++) { c.globalAlpha = 0.2 + 0.6 * (0.5 + 0.5 * Math.sin(kare * 0.05 * (0.5 + kh(i, 3)) + i * 3)); const b = kh(i, 4) > 0.8 ? 2 : 1; c.fillRect(kh(i, 1) * W, kh(i, 2) * H, b, b); }
    const t = (kare % 420) / 60; // her ~8 sn bir kayan yıldız (1 sn sürer)
    if (t < 1) { const x = W * 0.92 - t * W * 0.55, y = H * 0.06 + t * H * 0.32; c.globalAlpha = 0.9 * (1 - t); c.strokeStyle = '#ffffff'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 46, y - 17); c.stroke(); }
  } else if (id === 'run') {
    const n = Math.round(16 * yog); c.strokeStyle = '#d2aaff'; c.fillStyle = '#e9d4ff'; c.lineWidth = 1;
    for (let i = 0; i < n; i++) {
      const y = H - ((kare * (0.2 + kh(i, 2) * 0.35) + kh(i, 3) * H) % H), x = kh(i, 1) * W, s = 4 + kh(i, 4) * 5; c.globalAlpha = Math.max(0, 0.22 + 0.3 * Math.sin(kare * 0.04 + i));
      c.beginPath(); c.moveTo(x, y - s); c.lineTo(x + s, y); c.lineTo(x, y + s); c.lineTo(x - s, y); c.closePath(); c.stroke(); c.fillRect(x - 1, y - 1, 2, 2);
    }
  }
  c.restore();
}
function arkaPlan(c, W, H, kamY, kat, akisHedef = 0) {
  if (!AYAR.azaltilmisHareket) zaman++; // azaltılmış harekette aurora ve yıldız titremesi donar
  akis += (akisHedef - akis) * (akisHedef > akis ? 0.04 : 0.025); // giriş biraz hızlı, çıkış daha yumuşak
  if (Math.abs(akisHedef - akis) < 0.004) akis = akisHedef;
  const t = tema(kat), tn = temaNo(kat);
  const g = gradyan(c, 'bg|' + tn + '|' + H, () => { const q = c.createLinearGradient(0, 0, 0, H); q.addColorStop(0, t.ust); q.addColorStop(1, t.alt); return q; });
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  if (akis > 0.01 && AYAR.parilti > 0.05) { // akış hali: arka plan tonu yavaşça kayar (ekleme karışımıyla tek dikdörtgen)
    const guc = akis * Math.min(1, AYAR.parilti), ton = (zaman * 0.4 + kat * 0.5) % 360;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.14 * guc;
    const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, `hsl(${ton},80%,55%)`); gr.addColorStop(1, `hsl(${(ton + 70) % 360},80%,45%)`);
    c.fillStyle = gr; c.fillRect(0, 0, W, H); c.restore();
  }
  // aurora şeritleri (ekleme karışımı, yavaş dalgalanma)
  c.save(); c.globalCompositeOperation = 'lighter';
  t.serit.forEach((renk, k) => {
    const y0 = 120 + k * 130 - (kamY * 0.05) % 260;
    const gr = gradyan(c, 'au|' + tn + '|' + k, () => { const q = c.createLinearGradient(0, -70, 0, 70); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(0.5, renk); q.addColorStop(1, 'rgba(0,0,0,0)'); return q; });
    c.save(); c.translate(0, y0); // gradyan y0'a göre göreli kurulur; böylece kamera kayarken yeniden üretilmez
    c.globalAlpha = 0.16 * Math.min(1.5, AYAR.parilti); c.fillStyle = gr; c.beginPath(); c.moveTo(0, 80);
    for (let x = 0; x <= W; x += 10) c.lineTo(x, Math.sin(x * 0.012 + zaman * 0.012 + k * 2) * 34 + Math.sin(x * 0.03 - zaman * 0.02) * 10);
    c.lineTo(W, 160); c.lineTo(0, 160); c.closePath(); c.fill(); c.restore();
  });
  c.restore();
  // uzak kristal siluetleri (paralaks)
  for (const [say, hiz, yuk, a] of [[7, 0.12, 190, 0.55], [9, 0.25, 130, 0.8]]) {
    c.globalAlpha = a; c.fillStyle = t.kristal;
    const periyot = 480;
    for (let i = 0; i < say; i++) {
      const x = 95 + hash(i * 17 + yuk) * 450, taban = ((hash(i * 5 + hiz * 100) * periyot * 2 - kamY * hiz) % (periyot * 2) + periyot * 2) % (periyot * 2) - 60;
      const gen = 28 + hash(i * 3 + yuk) * 34, boy = yuk * (0.5 + hash(i * 11) * 0.5);
      c.beginPath(); c.moveTo(x - gen, taban + boy); c.lineTo(x - gen * 0.3, taban); c.lineTo(x + gen * 0.2, taban + boy * 0.25); c.lineTo(x + gen, taban + boy); c.closePath(); c.fill();
    }
  }
  c.globalAlpha = 1;
  // kule içi: uzak kemerli pencereler (paralaks), içinden gökyüzü görünür
  const aralik = 260, ph = ((kamY * 0.4) % aralik + aralik) % aralik;
  for (let k = -1; k < H / aralik + 2; k++) {
    const y = k * aralik + ph - 60 + (aralik - 0); const px = 320 - 38;
    c.fillStyle = 'rgba(0,0,0,0.28)'; c.beginPath(); c.moveTo(px, y + 100); c.lineTo(px, y + 38); c.arc(px + 38, y + 38, 38, Math.PI, 0); c.lineTo(px + 76, y + 100); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.06)'; c.lineWidth = 3; c.stroke();
  }
  // kar/yıldız tozu: parıldayan
  for (const [say, hiz, boy] of [[40, 0.18, 1], [18, 0.4, 2]]) {
    for (let i = 0; i < say; i++) {
      const x = 90 + hash(i * 7 + hiz * 100) * 460, y0 = hash(i * 13 + boy) * H * 2;
      const y = ((y0 - kamY * hiz) % (H * 2) + H * 2) % (H * 2) - H * 0.5, p = 0.5 + 0.5 * Math.sin(zaman * 0.05 + i * 1.7);
      c.globalAlpha = 0.35 + 0.55 * p; c.fillStyle = '#ffffff'; c.fillRect(Math.round(x), Math.round(y), boy, boy);
    }
  }
  c.globalAlpha = 1;
  // akış hali: oyun alanı kenarlarında aşağı akan ince dikey hız çizgileri (azaltılmış harekette çizilmez; kare başına 16 küçük dikdörtgen)
  if (akis > 0.01 && !AYAR.azaltilmisHareket && AYAR.parilti > 0.05) {
    const guc = akis * Math.min(1, AYAR.parilti), periyot = H + 120;
    c.fillStyle = '#ffffff';
    for (let i = 0; i < 16; i++) {
      const sol = i < 8, x = (sol ? 92 : 514) + hash(i * 23 + 5) * 36, boy = 40 + hash(i * 31) * 70;
      const y = ((((hash(i * 41) * periyot + zaman * (6 + hash(i * 7) * 8) - kamY * 0.3) % periyot) + periyot) % periyot) - 60; // kamera yükselirken aşağı akar
      c.globalAlpha = (0.12 + hash(i * 3) * 0.18) * guc; c.fillRect(Math.round(x), Math.round(y), 1, Math.round(boy * (0.4 + 0.6 * akis)));
    }
    c.globalAlpha = 1;
  }
}

function mesaleCiz(c, x, y, t, yon) {
  const titrek = 0.85 + 0.15 * Math.sin(zaman * 0.3 + y), parlak = AYAR.parilti;
  c.save(); c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, y, 2, x, y, 70 * titrek); g.addColorStop(0, t.mesale + 'cc'); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.globalAlpha = 0.45 * parlak; c.fillStyle = g; c.fillRect(x - 80, y - 80, 160, 160); c.restore();
  c.fillStyle = '#3b2f2a'; c.fillRect(x - 3, y + 4, 6, 18); yuvarlak(c, x - 8, y + 2, 16, 6, 3); c.fill();               // tutucu
  c.fillStyle = t.mesale; c.beginPath(); c.moveTo(x - 6, y + 2); c.quadraticCurveTo(x - 8 * titrek, y - 10, x, y - 20 * titrek); c.quadraticCurveTo(x + 8, y - 8, x + 6, y + 2); c.closePath(); c.fill(); // alev
  c.fillStyle = '#fff6d0'; c.beginPath(); c.moveTo(x - 3, y + 2); c.quadraticCurveTo(x - 3, y - 6, x, y - 11 * titrek); c.quadraticCurveTo(x + 4, y - 4, x + 3, y + 2); c.closePath(); c.fill();
}

// Taş sıraları [r0, r1) aralığı için çizilir; ox yatay başlangıç, ky kamera kayması (şerit için 0). Hash sıra numarasının mod 64'ünü kullanır.
function taslar(c, t, ox, gen, r0, r1, ky, sag) {
  const bh = DUV_BH, bw = DUV_BW;
  for (let r = r0; r < r1; r++) {
    const y = r * bh - ky, kay = (r & 1) * (bw / 2), rm = r & (SERIT_SATIR - 1);
    for (let b = -1; b < gen / bw + 2; b++) {
      const bx = ox + b * bw - kay, h = hash(rm * 131 + b * 17 + (sag ? 7 : 3)), ton = (h - 0.5) * 0.28;
      c.fillStyle = karisim(t.duvar, ton);
      yuvarlak(c, bx + 1.5, y + 1.5, bw - 3, bh - 3, 3); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.07)'; c.fillRect(bx + 3, y + 2, bw - 8, 2);          // üst kenar ışığı
      if (h > 0.82) { c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(bx + 8 + h * 10, y + 8, 7, 3); } // kırağı lekesi
    }
  }
}
function duvarSerit(t, tn, x0, gen) { // tema+kenar+genişlik anahtarlı taş şeridi; yoksa null (eski yol)
  const anahtar = tn + '|' + x0 + '|' + gen; let o = duvarSeritleri.get(anahtar);
  if (!o) {
    o = olusTuval(gen, SERIT_SATIR * DUV_BH);
    if (o) { o.k.fillStyle = t.harc; o.k.fillRect(0, 0, gen, SERIT_SATIR * DUV_BH); taslar(o.k, t, 0, gen, 0, SERIT_SATIR, 0, x0 !== 0); }
    if (o) duvarSeritleri.set(anahtar, o); // null saklanmaz: OffscreenCanvas sonradan gelirse kullanılır
  }
  return o || null;
}

function duvarlar(c, W, H, kamY, kat) {
  const t = tema(kat), tn = temaNo(kat), P = SERIT_SATIR * DUV_BH;
  for (const x0 of [0, 555]) {
    const gen = x0 === 0 ? 85 : W - 555;
    c.save(); c.beginPath(); c.rect(x0, 0, gen, H); c.clip();
    const serit = duvarSerit(t, tn, x0, gen);
    if (serit) { // önbellekli yol: şerit kamY'ye göre kaydırılarak (en fazla iki blit) çizilir
      const off = ((kamY % P) + P) % P;
      for (let y = -off; y < H; y += P) c.drawImage(serit.tuval, x0, y);
    } else {
      c.fillStyle = t.harc; c.fillRect(x0, 0, gen, H);
      taslar(c, t, x0, gen, Math.floor(kamY / DUV_BH) - 1, Math.floor((kamY + H) / DUV_BH) + 1, kamY, x0 !== 0);
    }
    // kenara doğru derinlik gölgesi (kule içine bakış)
    const gr = gradyan(c, 'dv|' + x0 + '|' + gen, () => {
      const q = c.createLinearGradient(x0, 0, x0 + gen, 0);
      if (x0 === 0) { q.addColorStop(0, 'rgba(0,0,0,0.55)'); q.addColorStop(0.6, 'rgba(0,0,0,0.12)'); q.addColorStop(1, 'rgba(0,0,0,0.5)'); }
      else { q.addColorStop(0, 'rgba(0,0,0,0.5)'); q.addColorStop(0.4, 'rgba(0,0,0,0.12)'); q.addColorStop(1, 'rgba(0,0,0,0.55)'); }
      return q;
    });
    c.fillStyle = gr; c.fillRect(x0, 0, gen, H);
    c.restore();
    // mesaleCizler: her 280 px'te bir, iki duvar dönüşümlü
    for (let r = Math.floor(kamY / 280) - 1; r < Math.floor((kamY + H) / 280) + 1; r++) {
      if (((r & 1) === 0) !== (x0 === 0)) continue;
      mesaleCiz(c, x0 === 0 ? 60 : 580, r * 280 + 100 - kamY, t, x0 === 0 ? 1 : -1);
    }
    // iç kenar: parlak taş silmesi; shadowBlur yerine önbellekli yatay parıltı gradyanı (tek dikdörtgen) + 2 px çizgi
    const ex = x0 === 0 ? 83 : 555;
    if (AYAR.parilti > 0.02) {
      const pg = gradyan(c, 'pr|' + tn + '|' + ex, () => { const q = c.createLinearGradient(ex - 11, 0, ex + 13, 0);
        q.addColorStop(0, t.plat + '00'); q.addColorStop(0.3, t.plat + '22'); q.addColorStop(0.46, t.plat + '5a'); q.addColorStop(0.54, t.plat + '5a'); q.addColorStop(0.7, t.plat + '22'); q.addColorStop(1, t.plat + '00'); return q; });
      c.save(); c.globalAlpha = Math.min(1, AYAR.parilti); c.fillStyle = pg; c.fillRect(ex - 11, 0, 24, H); c.restore();
    }
    c.fillStyle = karisim(t.plat, -0.2); c.fillRect(ex, 0, 2, H);
  }
}

// ---- Basamaklar: tema başına ayrı malzeme ----
// shadowBlur yerine ucuz eşdeğer: yuvarlak gövdenin genişleyen, düşük alfalı birkaç katmanı (dy: gölge kayması).
function hale(c, x, y, gen, kal, r, renk, alfa, dy = 0) {
  c.save(); c.fillStyle = renk;
  for (let d = 2; d <= 8; d += 3) { c.globalAlpha = alfa * (1 - d / 11); yuvarlak(c, x - d, y - d + dy, gen + 2 * d, kal + 2 * d, r + d); c.fill(); }
  c.restore();
}
const kabarik = (c, x0, x1, yUst, h, tohum) => { // yumuşak kabarık üst kenar çizgisi (kar/yosun başlığı)
  c.moveTo(x0, yUst + h);
  c.lineTo(x0, yUst + h * 0.4);
  for (let x = x0; x < x1; x += 14) { const a = hash(tohum + x * 3) * h * 0.5; c.quadraticCurveTo(x + 7, yUst - a, Math.min(x + 14, x1), yUst + h * 0.4); }
  c.lineTo(x1, yUst + h);
  c.closePath();
};

function platformBuz(c, x, y, gen, n, no, t) {
  const kal = 22;
  if (AYAR.parilti > 0.02) hale(c, x, y, gen, kal, 8, no ? '#ffd24a' : t.plat, 0.16 * Math.min(1.5, AYAR.parilti));
  const g = c.createLinearGradient(0, y, 0, y + kal); g.addColorStop(0, '#e8fbff'); g.addColorStop(0.3, '#a9e6fb'); g.addColorStop(1, '#3c8fc9');
  c.fillStyle = g; yuvarlak(c, x, y, gen, kal, 8); c.fill();
  c.save(); c.beginPath(); yuvarlak(c, x, y, gen, kal, 8); c.clip();
  // iç yansımalar (çapraz ışık şeritleri) ve çatlaklar
  c.fillStyle = 'rgba(255,255,255,0.28)';
  for (let i = 0; i < Math.max(2, gen / 60); i++) { const px = x + 14 + hash(n * 7 + i) * (gen - 40); c.beginPath(); c.moveTo(px, y + kal); c.lineTo(px + 10, y + kal); c.lineTo(px + 24, y); c.lineTo(px + 14, y); c.closePath(); c.fill(); }
  c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 1;
  for (let i = 0; i < 2; i++) { const px = x + 20 + hash(n * 3 + i * 5) * (gen - 40); c.beginPath(); c.moveTo(px, y + 6); c.lineTo(px + 5, y + 11); c.lineTo(px + 2, y + 15); c.lineTo(px + 8, y + 20); c.stroke(); }
  c.restore();
  // kar başlığı
  c.fillStyle = '#ffffff'; c.beginPath(); kabarik(c, x + 2, x + gen - 2, y - 6, 12, n * 13); c.fill();
  c.fillStyle = 'rgba(130,190,240,0.35)'; c.fillRect(x + 6, y + 5, gen - 12, 2);
  // buz saçakları
  const adet = Math.max(3, Math.floor(gen / 18));
  for (let i = 0; i < adet; i++) {
    const px = x + 8 + (gen - 16) * (i + hash(n * 11 + i) * 0.6) / adet, boy = 8 + hash(n * 5 + i * 3) * 18, w = 4 + hash(n + i) * 3;
    const gr = c.createLinearGradient(0, y + kal - 2, 0, y + kal + boy); gr.addColorStop(0, '#9ddcf8'); gr.addColorStop(1, 'rgba(210,245,255,0.95)');
    c.fillStyle = gr; c.beginPath(); c.moveTo(px - w, y + kal - 2); c.lineTo(px + w, y + kal - 2); c.lineTo(px + w * 0.15, y + kal + boy); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(px - w * 0.5, y + kal - 1, 1.2, boy * 0.6);
  }
}

function platformAmetist(c, x, y, gen, n, no, t) {
  const kal = 22;
  if (AYAR.parilti > 0.02) hale(c, x, y + 2, gen, kal - 2, 6, no ? '#ffd24a' : t.plat, 0.16 * Math.min(1.5, AYAR.parilti));
  c.fillStyle = '#5a2d99'; yuvarlak(c, x, y + 2, gen, kal - 2, 6); c.fill();
  // yüzeyler: üst yüz açık, ön yüz koyu, köşeler eğik
  const g1 = c.createLinearGradient(x, 0, x + gen, 0); g1.addColorStop(0, '#d9a8ff'); g1.addColorStop(0.5, '#f3dcff'); g1.addColorStop(1, '#c08bf5');
  c.fillStyle = g1; c.beginPath(); c.moveTo(x + 6, y); c.lineTo(x + gen - 6, y); c.lineTo(x + gen, y + 7); c.lineTo(x, y + 7); c.closePath(); c.fill();
  const g2 = c.createLinearGradient(0, y + 7, 0, y + kal); g2.addColorStop(0, '#9b5be0'); g2.addColorStop(1, '#4d2488');
  c.fillStyle = g2; c.fillRect(x, y + 7, gen, kal - 7);
  c.fillStyle = 'rgba(255,255,255,0.18)'; for (let i = 0; i < gen / 34; i++) { const px = x + 6 + i * 34; c.beginPath(); c.moveTo(px, y + 7); c.lineTo(px + 14, y + 7); c.lineTo(px + 6, y + kal); c.lineTo(px - 8, y + kal); c.closePath(); c.fill(); }
  // üstte büyüyen kristal sivri uçlar
  for (let i = 0; i < Math.max(2, gen / 40); i++) {
    const px = x + 14 + hash(n * 17 + i) * (gen - 28), h = 10 + hash(n * 3 + i * 7) * 16, w = 5 + hash(i + n) * 4;
    c.fillStyle = '#f0d4ff'; c.beginPath(); c.moveTo(px - w, y + 1); c.lineTo(px, y - h); c.lineTo(px + w, y + 1); c.closePath(); c.fill();
    c.fillStyle = 'rgba(120,60,200,0.35)'; c.beginPath(); c.moveTo(px, y - h); c.lineTo(px + w, y + 1); c.lineTo(px, y + 1); c.closePath(); c.fill();
  }
}

function platformTahta(c, x, y, gen, n, no, t) {
  const kal = 20;
  hale(c, x, y, gen, kal, 4, '#000000', 0.26, 4);
  const g = c.createLinearGradient(0, y, 0, y + kal); g.addColorStop(0, '#d79a62'); g.addColorStop(0.15, '#b9743f'); g.addColorStop(1, '#6f3f20');
  c.fillStyle = g; yuvarlak(c, x, y, gen, kal, 4); c.fill();
  c.save(); c.beginPath(); yuvarlak(c, x, y, gen, kal, 4); c.clip();
  // tahta aralıkları ve damarlar
  for (let px = x + 46; px < x + gen - 10; px += 46 + hash(n + px) * 24) { c.fillStyle = 'rgba(40,20,8,0.55)'; c.fillRect(px, y, 2, kal); }
  c.strokeStyle = 'rgba(60,30,10,0.35)'; c.lineWidth = 1;
  for (let i = 0; i < gen / 22; i++) { const px = x + 6 + i * 22 + hash(n * 3 + i) * 8, py = y + 6 + hash(n + i * 9) * 9; c.beginPath(); c.moveTo(px, py); c.quadraticCurveTo(px + 9, py - 2 + hash(i) * 4, px + 18, py); c.stroke(); }
  c.fillStyle = 'rgba(255,230,190,0.35)'; c.fillRect(x, y + 1, gen, 3);
  c.restore();
  // çiviler ve alt halat bağı
  c.fillStyle = '#3a2a22'; for (const px of [x + 8, x + gen - 8]) { c.beginPath(); c.arc(px, y + 10, 2.3, 0, 7); c.fill(); }
  c.strokeStyle = '#c9a56a'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + gen * 0.3, y + kal); c.quadraticCurveTo(x + gen * 0.4, y + kal + 10, x + gen * 0.5, y + kal); c.quadraticCurveTo(x + gen * 0.6, y + kal + 10, x + gen * 0.7, y + kal); c.stroke();
  if (no) { c.fillStyle = 'rgba(255,210,74,0.45)'; c.fillRect(x, y, gen, 4); }
}

function platformYosun(c, x, y, gen, n, no, t) {
  const kal = 22;
  if (no) { if (AYAR.parilti > 0.02) hale(c, x, y + 4, gen, kal - 4, 5, '#ffd24a', 0.16 * Math.min(1.5, AYAR.parilti)); } else hale(c, x, y + 4, gen, kal - 4, 5, '#000000', 0.26, 4);
  c.fillStyle = '#6d7f78'; yuvarlak(c, x, y + 4, gen, kal - 4, 5); c.fill();
  c.save(); c.beginPath(); yuvarlak(c, x, y + 4, gen, kal - 4, 5); c.clip();
  // taş blokları + harç
  for (let px = x; px < x + gen; px += 38) {
    const h = hash(n * 7 + px * 3); c.fillStyle = karisim('#7a8d85', (h - 0.5) * 0.3); c.fillRect(px + 1, y + 5, 36, kal - 7);
    c.fillStyle = 'rgba(255,255,255,0.14)'; c.fillRect(px + 3, y + 6, 30, 2);
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(px + 36, y + 4, 2, kal);
  }
  c.restore();
  // yosun başlığı + sarkan sarmaşıklar
  c.fillStyle = '#4fae5a'; c.beginPath(); kabarik(c, x + 1, x + gen - 1, y - 4, 12, n * 29); c.fill();
  c.fillStyle = '#7fe08a'; c.beginPath(); kabarik(c, x + 8, x + gen - 14, y - 2, 6, n * 5); c.fill();
  c.strokeStyle = '#3f9a4c'; c.lineWidth = 2; c.lineCap = 'round';
  for (let i = 0; i < Math.max(2, gen / 36); i++) {
    const px = x + 10 + hash(n * 9 + i) * (gen - 20), boy = 10 + hash(n + i * 5) * 16;
    c.beginPath(); c.moveTo(px, y + kal - 2); c.quadraticCurveTo(px + 4, y + kal + boy * 0.5, px - 1, y + kal + boy); c.stroke();
    c.fillStyle = '#6fdc7c'; c.beginPath(); c.ellipse(px - 3, y + kal + boy * 0.7, 3.5, 2, -0.6, 0, 7); c.fill();
  }
  c.lineCap = 'butt';
}

// Basamak türü ayrıntısı: kırılgan (çatlak, titreme) ve yay (kırmızı yaylı pedal).
function turDetay(c, x, y, gen, n, tur, kirilma) {
  if (tur === 'kirilgan') {
    c.save(); c.strokeStyle = 'rgba(20,50,90,' + (0.45 + 0.5 * kirilma) + ')'; c.lineWidth = 1.5 + kirilma * 1.5; c.lineCap = 'round';
    const adet = 3 + Math.floor(kirilma * 5);
    for (let i = 0; i < adet; i++) {
      const px = x + 12 + hash(n * 19 + i * 7) * (gen - 24); c.beginPath(); c.moveTo(px, y + 1); c.lineTo(px - 4, y + 8); c.lineTo(px + 3, y + 14); c.lineTo(px - 2, y + 21); c.stroke();
    }
    c.restore();
    if (kirilma > 0.2) { c.fillStyle = 'rgba(255,120,80,' + Math.min(0.9, kirilma) + ')'; c.font = '800 12px "Segoe UI", system-ui, sans-serif'; c.textAlign = 'center'; c.fillText('!', x + gen / 2, y - 8); c.textAlign = 'left'; }
  } else if (tur === 'yay') {
    const mx = x + gen / 2, sik = 0;
    c.fillStyle = '#c62828'; yuvarlak(c, mx - 22, y - 9, 44, 10, 5); c.fill();               // kırmızı pedal
    c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(mx - 16, y - 7, 32, 2);
    c.strokeStyle = '#eceff1'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(mx - 12, y + 1 + sik);
    for (let i = 0; i < 4; i++) { c.lineTo(mx + (i % 2 ? -12 : 12), y + 1 + sik + i * 1.5 + 3); } c.stroke();                // yay zikzağı
  }
}

function platform(c, x, y, gen, kat, no, n, tur = 'normal', kirilma = 0) {
  const t = tema(kat), tn = temaNo(kat);
  if (kirilma > 0) { c.save(); c.translate((hash(zaman + n) - 0.5) * 3 * kirilma, 0); } // basılınca titrer
  if (tn === 0) platformBuz(c, x, y, gen, n, no, t); else if (tn === 1) platformAmetist(c, x, y, gen, n, no, t); else if (tn === 2) platformTahta(c, x, y, gen, n, no, t); else platformYosun(c, x, y, gen, n, no, t);
  turDetay(c, x, y, gen, n, tur, kirilma);
  if (kirilma > 0) c.restore();
  if (no) { // her 10. kat: zincirle asılı numara levhası
    c.strokeStyle = 'rgba(30,20,10,0.8)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + 14, y + 20); c.lineTo(x + 14, y + 27); c.moveTo(x + 38, y + 20); c.lineTo(x + 38, y + 27); c.stroke();
    const g = c.createLinearGradient(0, y + 26, 0, y + 42); g.addColorStop(0, '#ffe39a'); g.addColorStop(1, '#d9a02a');
    c.fillStyle = g; yuvarlak(c, x + 6, y + 26, 40, 16, 4); c.fill(); c.strokeStyle = '#8a5a10'; c.lineWidth = 1; c.stroke();
    c.fillStyle = '#4a2e00'; c.font = '800 12px "Segoe UI", system-ui, sans-serif'; c.textAlign = 'center'; c.fillText(String(n), x + 26, y + 38.5); c.textAlign = 'left';
  }
}

// Toplanabilir buz kristali (puan bonusu); hafifçe süzülür ve parlar.
function kristalCiz(c, x, y, kat) {
  const t = tema(kat), sal = Math.sin(zaman * 0.08 + x) * 3, cy = y + sal;
  c.save(); c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, cy, 1, x, cy, 24 * Math.min(1.5, AYAR.parilti + 0.2)); g.addColorStop(0, t.plat + 'aa'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - 30, cy - 30, 60, 60);
  c.restore();
  c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(x, cy - 12); c.lineTo(x + 8, cy); c.lineTo(x, cy + 12); c.lineTo(x - 8, cy); c.closePath(); c.fill();
  c.fillStyle = t.plat; c.beginPath(); c.moveTo(x, cy - 12); c.lineTo(x + 8, cy); c.lineTo(x, cy + 2); c.closePath(); c.fill();
  c.fillStyle = karisim(t.koyu, 0.1); c.beginPath(); c.moveTo(x, cy + 12); c.lineTo(x - 8, cy); c.lineTo(x, cy + 2); c.closePath(); c.fill();
}

// Güç öğeleri: 'saat' (alarm saati, kaymayı yavaşlatır) ve 'miknatis' (at nalı mıknatıs, kristalleri çeker).
function gucCiz(c, x, y, tur, kat) {
  const sal = Math.sin(zaman * 0.07 + x) * 3, cy = y + sal, renk = tur === 'saat' ? '#ffd24a' : '#ff6b6b';
  c.save(); c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, cy, 2, x, cy, 26); g.addColorStop(0, renk + 'aa'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - 30, cy - 30, 60, 60);
  c.restore();
  if (tur === 'saat') {
    c.fillStyle = '#fff6e0'; c.strokeStyle = '#b8860b'; c.lineWidth = 2; c.beginPath(); c.arc(x, cy, 11, 0, 7); c.fill(); c.stroke();
    c.fillStyle = '#d9a02a'; c.beginPath(); c.arc(x - 8, cy - 11, 4, 0, 7); c.arc(x + 8, cy - 11, 4, 0, 7); c.fill();               // zil kubbeleri
    c.strokeStyle = '#3a2a00'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(x, cy); c.lineTo(x, cy - 7); c.moveTo(x, cy); c.lineTo(x + 5, cy + 2); c.stroke();
  } else {
    c.strokeStyle = '#d32f2f'; c.lineWidth = 6; c.lineCap = 'butt'; c.beginPath(); c.arc(x, cy + 2, 9, Math.PI, 0); c.lineTo(x + 9, cy + 11); c.moveTo(x - 9, cy + 2); c.lineTo(x - 9, cy + 11); c.stroke();
    c.strokeStyle = '#f5f5f5'; c.lineWidth = 6; c.beginPath(); c.moveTo(x - 9, cy + 8); c.lineTo(x - 9, cy + 12); c.moveTo(x + 9, cy + 8); c.lineTo(x + 9, cy + 12); c.stroke();
  }
}

// Kozmetik parçacık sistemi (parıltılı, oyun mantığını etkilemez).
const par = [];
function parcacikEkle(x, y, adet, renk, hiz = 3) {
  const say = Math.floor(adet * AYAR.parcacik) + (Math.random() < adet * AYAR.parcacik % 1 ? 1 : 0); // ayar çarpanı; kesirli kısım olasılıkla
  for (let i = 0; i < say; i++) par.push({ x, y, vx: (Math.random() - 0.5) * hiz * 2, vy: -Math.random() * hiz, om: 24 + Math.random() * 20, renk, boy: 2 + Math.random() * 3 });
}
function parcacikCiz(c, kamY) {
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = par.length - 1; i >= 0; i--) {
    const p = par[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.18; p.om--;
    if (p.om <= 0) { par.splice(i, 1); continue; }
    c.globalAlpha = Math.min(1, p.om / 16); c.fillStyle = p.renk; c.beginPath(); c.arc(p.x, p.y - kamY, p.boy * (p.om / 40 + 0.4), 0, 7); c.fill();
  }
  c.restore(); c.globalAlpha = 1;
}
const parcacikSifirla = () => { par.length = 0; };

// Kombo kapanış uçuşu (yalnız görünüm): kombo bitince biriken bonusu temsil eden parçacıklar ekran uzayında (kameradan bağımsız)
// önce dışa saçılır, sonra eğri bir yolla skor alanına uçar. Sayı AYAR.parcacik ile ölçeklenir; azaltılmış harekette hiç üretilmez.
// Oyun durumunu okumaz ve değiştirmez; hud.js tetikler ve çizer.
const kapanisPar = [];
const KAPANIS_OMUR = 34; // bir parçacığın uçuş süresi (çizim karesi)
function kapanisEkle(x0, y0, x1, y1, adet, renk) {
  if (AYAR.azaltilmisHareket) return 0;
  const say = Math.round(adet * AYAR.parcacik);
  for (let i = 0; i < say; i++) {
    const a = Math.random() * Math.PI * 2, r = 40 + Math.random() * 70; // kontrol noktası dışarıda: saçıl, sonra topla
    kapanisPar.push({ x0, y0, cx: x0 + Math.cos(a) * r, cy: y0 + Math.sin(a) * r - 20, x1, y1, t: -Math.random() * 0.35, renk, boy: 2 + Math.random() * 2.5 });
  }
  return say;
}
function kapanisAdim() { // bir çizim karesi ilerletir; kalan parçacık sayısını döner
  for (let i = kapanisPar.length - 1; i >= 0; i--) { const p = kapanisPar[i]; p.t += 1 / KAPANIS_OMUR; if (p.t >= 1) kapanisPar.splice(i, 1); }
  return kapanisPar.length;
}
const kapanisSay = () => kapanisPar.length;
const kapanisSifirla = () => { kapanisPar.length = 0; };
function kapanisNokta(p, t) { // yumuşatılmış kuadratik Bezier: (x0,y0) → (cx,cy) → (x1,y1)
  const u = Math.max(0, Math.min(1, t)), s = u * u * (3 - 2 * u), v = 1 - s;
  return { x: v * v * p.x0 + 2 * v * s * p.cx + s * s * p.x1, y: v * v * p.y0 + 2 * v * s * p.cy + s * s * p.y1 };
}
function kapanisCiz(c) {
  kapanisAdim();
  if (!kapanisPar.length) return;
  c.save(); c.globalCompositeOperation = 'lighter';
  for (const p of kapanisPar) {
    if (p.t < 0) continue; // gecikmeli başlar
    const n = kapanisNokta(p, p.t), a = p.t < 0.15 ? p.t / 0.15 : 1 - Math.max(0, (p.t - 0.8) / 0.2);
    c.globalAlpha = Math.max(0, Math.min(1, a)) * 0.95; c.fillStyle = p.renk; c.beginPath(); c.arc(n.x, n.y, p.boy * (1.2 - p.t * 0.6), 0, 7); c.fill();
  }
  c.restore(); c.globalAlpha = 1;
}

// ---- oyun ----
// description: Oyun döngüsü, fizik hissi (kenar toleransı, coyote süresi, zıplama tamponu), kamera, takla, kristaller, güç öğeleri ve çizim (özgün kod). sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)











const W = 640, H = 480, SAAT = 1500; // 30 sn @ 50 kare/sn
// Zorluk (0 kolay, 1 orta, 2 zor, 3 çok zor): kamera kayma hızı tavanı (px/kare); 30 sn'de bir artar. Orta = Yusuf kararı 2026-11-04 (eskiden 5).
const KAYMA_TAVANI = [2.5, 4, 5, 6.5];
// Kaygan buz (isteğe bağlı ayar, varsayılan kapalı): 400. kattan sonra nadir (~%12) basamaklar yatay hızı korur. Seçim tohumdan türer: aynı tohum = aynı kaygan basamaklar.
const kayganKat = (tohum, n) => tohum !== null && n >= 400 && n % 10 !== 0 && katRnd((tohum ^ 0x5bd1e995) >>> 0, n)() < 0.12;
const KAYGAN_SURTUNME = 0.985, KAYGAN_INIS = 0.97; // tuşsuz durumda hızın kare başı korunma oranı / iniş sönümü (normal: 0.9 / 0.8)
const kaymaTavani = (o) => KAYMA_TAVANI[o.zorluk] ?? KAYMA_TAVANI[1];
const KRISTAL_PUAN = 25, TAKLA_HIZI = 16; // |ilk dikey hız| >= 16: en az 2 kat yükselen zıplama takla atar
// Oyun hissi (platformer pratikleri): basamağa tutunma ve affedici giriş
// AYAK (ayak yarı genişliği) ve ZEMIN_Y kat.js'te: Rust çekirdeğiyle ortak sabitler
const COYOTE = 6;           // basamaktan yürüyerek çıktıktan sonra hâlâ zıplayabilme süresi (kare)
const TAMPON = 7;           // inişten hemen önce basılan zıplama tuşu bu kadar kare hatırlanır
const SAAT_SURE = 480, MIKNATIS_SURE = 500; // güç öğesi süreleri (kare)
const KIRILMA = 30;         // kırılgan basamak: üstünde bu kadar kare durulursa kırılır (0,6 sn)
const YAY_HIZI = 27;        // yay basamak: inişte yukarı fırlatma hızı (normal zıplamanın en fazla 24,4 hızından yüksek, ~6 kat)
// "Kıl payı" bonusu: oyuncu ekran altına bir kattan az yaklaşıp (düşme sınırı H) sonra bir basamağa konarsa küçük sabit puan.
// Yalnız oyun durumuna bağlıdır (rastgelelik yok): hayalet/günlük kule tekrarlanabilirliği korunur. Fizik ve kat üretimi değişmez.
const KIL_PAYI_PUAN = 25, KIL_PAYI_BEKLE = 300; // bonus puanı; iki bonus arası en az bekleme (kare, 6 sn)
const KIL_PAYI_SINIR = H - KAT_ARALIK;                  // ekranda bu çizginin altı tehlike bölgesi

// rnd bir sayıysa tohumdur: kat n her zaman aynı (katRnd), böylece aynı tohum + aynı girişler = aynı oyun (hayalet, günlük kule).
// rnd bir fonksiyonsa eski davranış (testler): ardışık çağrılarla üretilir.
function yeniOyun(rnd = Math.random, zorluk = 1, kaygan = 0) {
  const tohum = typeof rnd === 'number' ? rnd >>> 0 : null, katlar = new Map();
  const kat = (n) => (katlar.has(n) || katlar.set(n, tohum === null ? katUret(n, rnd) : katUretTohum(n, tohum)), katlar.get(n));
  return {
    rnd, tohum, kat, zorluk, kaygan: kaygan ? 1 : 0, x: 320, y: ZEMIN_Y, vx: 0, vy: 0, yon: 1, havada: false, katNo: 0, enYuksek: 0, kamY: 0, kamTaban: 0, kayma: 0, kaymaBasladi: false,
    kare: 0, puan: yeniPuan(), mesaj: null, bitti: false, sonInisKat: 0,
    aci: 0, aciHiz: 0, donuyor: false, alinan: new Set(), alinanGuc: new Set(), ek: 0, hizlan: 0, rozet: null,
    coyote: 0, tampon: 0, oncekiZ: false, saat: 0, miknatis: 0,
    kirik: new Set(), sayac: 0, sayacKat: -1, yaySayisi: 0, enIyiKombo: 0, // kırık basamaklar, kırılma sayacı, başarım sayaçları
    px: 320, py: ZEMIN_Y, pk: 0, // önceki adım konumu (çizim ara değeri)
    mukSeri: 0, enMukSeri: 0, // mükemmel iniş serisi (basamağın ortasına inişler; yalnız görünüm sayacı)
    sars: 0, rekorKat: 0, // kilometre taşı sarsıntısı süresi; önceki en iyi kat (arayuz.js yazar, yalnız görünüm)
    sonZip: 0, komboPuls: 0, // kombo yazısı: son görülen kombo zıplama sayısı ve büyüme vurgusu süresi (yalnız görünüm)
    tehlike: false, kilPayi: 0, kilPayiBekle: 0, kilPayiSayisi: 0, // kıl payı: tehlike bölgesine girildi mi, yazı süresi, bekleme süresi, verilen bonus sayısı
  };
}

// y ekranda aşağı artar; kat n platformunun dünya y'si = ZEMIN_Y - n*KAT_ARALIK
const katY = (n) => ZEMIN_Y - n * KAT_ARALIK;
const basamakAralik = (f) => { const x0 = 85 + (f.xKaro - 5) * KARO; return [x0, x0 + f.genislikKaro * KARO]; };
const kristalKonum = (f) => ({ x: 85 + (f.xKaro - 5) * KARO + f.genislikKaro * KARO * (0.15 + 0.7 * f.kristalX), y: katY(f.kat) - 38 });
const gucKonum = (f) => ({ x: 85 + (f.xKaro - 5) * KARO + f.genislikKaro * KARO * (0.15 + 0.7 * f.kristalX), y: katY(f.kat) - 40 });

function zipladi(o) {
  o.vy = ziplaC(o.vx); o.havada = true; o.coyote = 0; o.tampon = 0; zipSesi(o.vx, AYAR.perde && o.puan.kombo ? o.puan.kombo.zip : 0); parcacikEkle(o.x, o.y, 6, '#ffffff', 2);
  o.donuyor = Math.abs(o.vy) >= TAKLA_HIZI; o.aci = 0;
  o.aciHiz = o.donuyor ? o.yon * 2 * Math.PI / (2.5 * Math.abs(o.vy)) : 0; // havada kalma süresi ≈ 2.5·|vy| kare: tam bir takla
}

// Buz kıymığı (yalnız görünüm): açık mavi/beyaz parçacıklar; durumu okumaz/değiştirmez, azaltılmış harekette üretilmez.
function buzKirigi(x, y, adet) {
  if (AYAR.azaltilmisHareket) return;
  parcacikEkle(x, y, adet, '#e8f8ff', 2.2); parcacikEkle(x, y, adet, '#8fd0ff', 2.8);
}
// Her 100. katta kule tabelası metni (yalnız görünüm); diğer katlarda null.
const katTabelasi = (n) => (n > 0 && n % 100 === 0 ? th('hud_kat') + ' ' + n : null);

const KAM_YUMUSAK = 0.22; // yukarı kamera yaklaşma oranı (kare başına)

function adim(o, giris) {
  if (o.bitti) return;
  o.px = o.x; o.py = o.y; o.pk = o.kamY; // önceki kare konumu: çizimde ara değer için (simülasyonu etkilemez)
  o.kare++; if (o.mesaj && o.mesaj.guc > 0) o.mesaj.guc--;
  if (o.sars > 0) o.sars--;
  if (o.hizlan > 0) o.hizlan--; if (o.rozet && --o.rozet.guc <= 0) o.rozet = null;
  if (o.saat > 0) o.saat--; if (o.miknatis > 0) o.miknatis--; if (o.komboPuls > 0) o.komboPuls--;
  if (o.kilPayi > 0) o.kilPayi--; if (o.kilPayiBekle > 0) o.kilPayiBekle--;
  let indi = false; // bu karede bir basamağa konuldu mu (kıl payı denetimi için)
  const kayiyor = o.kaygan && !o.havada && o.katNo > 0 && kayganKat(o.tohum, o.katNo);
  o.vx = kayiyor && !giris.sol && !giris.sag ? o.vx * KAYGAN_SURTUNME : yatayGuncelleC(o.vx, giris.sol, giris.sag); if (Math.abs(o.vx) > 0.5) o.yon = o.vx > 0 ? 1 : -1;
  // zıplama tamponu: tuşa basış (yükselen kenar) kısa süre hatırlanır
  const basildi = !!giris.zipla && !o.oncekiZ; o.oncekiZ = !!giris.zipla;
  if (basildi) o.tampon = TAMPON; else if (o.tampon > 0) o.tampon--;
  if (o.coyote > 0 && o.havada) o.coyote--;
  const yerde = !o.havada, kenardaCoyote = o.havada && o.coyote > 0 && o.vy >= 0 && !o.donuyor;
  if ((yerde || kenardaCoyote) && (giris.zipla || o.tampon > 0)) zipladi(o);
  const eskiX = o.x;
  o.x += o.vx;
  const vxOnce = o.vx;
  ({ x: o.x, vx: o.vx } = duvarSekmesiC(o.x, o.vx));
  if (vxOnce !== 0 && Math.sign(o.vx) !== Math.sign(vxOnce)) buzKirigi(o.x, o.y - 24, 5); // duvar sekmesi
  const eskiY = o.y;
  if (o.havada) { o.vy = dikeyGuncelleC(o.vy); o.y += o.vy; if (o.donuyor) o.aci += o.aciHiz; }
  // Yalnız düşerken platforma konulur. Yatay konum, geçiş anına doğrusal ara değerle (hızlı koşuda basamağı atlamasın) ve ±AYAK toleransla denetlenir.
  if (o.havada && o.vy >= 0) {
    const n = inisBulC(o.tohum, o.kirik, o.kat, o.x, o.y, eskiX, eskiY); // iniş aranır (Rust çekirdeği ya da JS); -1 = inilmedi
    if (n >= 0) {
      const f = o.kat(n), py = katY(n);
    o.y = py; o.vy = 0; o.havada = false; o.donuyor = false; o.aci = 0; o.coyote = 0; indi = true;
    if (!giris.sol && !giris.sag) o.vx *= o.kaygan && kayganKat(o.tohum, n) ? KAYGAN_INIS : 0.8; // tutunma: yön tuşu yokken inişte hız hemen sönümlenir
    const fark = n - o.sonInisKat; o.sonInisKat = n; o.katNo = n;
    const yeniRekor = n > o.enYuksek; o.enYuksek = Math.max(o.enYuksek, n);
    if (yeniRekor && n % 50 === 0) o.rozet = { metin: th('hud_kat') + ' ' + n, guc: 110 };
    if (yeniRekor && (n === 100 || n === 200 || n === 500)) o.sars = 22; // büyük kilometre taşı: kısa ekran sarsıntısı
    if (yeniRekor && o.rekorKat > 0 && n === o.rekorKat + 1) o.rozet = { metin: th('hud_yeni_kat_rekoru'), guc: 110, olcek: 5 };
    { const [mx0, mx1] = basamakAralik(f); const orta = (mx0 + mx1) / 2, yari = (mx1 - mx0) / 2; if (n > 0 && Math.abs(o.x - orta) <= yari * 0.3) { o.mukSeri++; o.enMukSeri = Math.max(o.enMukSeri, o.mukSeri); } else o.mukSeri = 0; } // mükemmel iniş: basamağın orta %30'u (yalnız görünüm sayacı)
    buzKirigi(o.x, o.y, 4); // iniş
    if (fark >= 2) parcacikEkle(o.x, o.y, 10, '#ffd24a', 3);
    const od = puanInisC(o.puan, fark); if (od) { o.mesaj = { ...od, guc: 60 }; odulSesi(od.toplam); o.enIyiKombo = Math.max(o.enIyiKombo, od.toplam); }
    if (f.tur === 'yay') { // yay basamak: otomatik yukarı fırlatır ve takla attırır
      o.vy = -YAY_HIZI; o.havada = true; o.donuyor = true; o.aci = 0; o.aciHiz = o.yon * 2 * Math.PI / (2.5 * YAY_HIZI); o.yaySayisi++;
      yaySesi(); parcacikEkle(o.x, o.y, 16, '#ff9a9a', 4);
    }
    }
  }
  if (!o.havada && o.katNo > 0 && o.kat(o.katNo).tur === 'kirilgan') { // kırılgan basamakta durdukça sayaç artar, dolunca basamak kırılır
    if (o.sayacKat === o.katNo) o.sayac++; else { o.sayacKat = o.katNo; o.sayac = 1; }
    if (o.sayac >= KIRILMA) { o.kirik.add(o.katNo); o.havada = true; o.coyote = 0; kirmaSesi(); parcacikEkle(o.x, o.y, 22, '#cfeeff', 3.5); }
  } else if (!o.havada) { o.sayac = 0; o.sayacKat = -1; }
  if (!o.havada && o.katNo > 0) { // basamağın dışına tamamen çıktıysa düşer; coyote süresi boyunca hâlâ zıplayabilir
    const [kx0, kx1] = basamakAralik(o.kat(o.katNo));
    if (o.x < kx0 - AYAK || o.x > kx1 + AYAK) { o.havada = true; o.coyote = COYOTE; }
  }
  { const zip = o.puan.kombo ? o.puan.kombo.zip : 0; if (zip !== o.sonZip) { o.sonZip = zip; if (zip > 0) o.komboPuls = 18; } } // kombo yazısı her zıplamada büyür
  { const od = puanKareC(o.puan); if (od) { o.mesaj = { ...od, guc: 60 }; odulSesi(od.toplam); o.enIyiKombo = Math.max(o.enIyiKombo, od.toplam); } }
  // Toplanabilirler: yakındaki katlarda yüzen kristaller (+25 puan) ve güç öğeleri
  const taban = Math.floor((ZEMIN_Y - o.y) / KAT_ARALIK), cekim = o.miknatis > 0 ? 150 : 0;
  for (let n = Math.max(1, taban - 1 - (cekim ? 1 : 0)); n <= taban + 2 + (cekim ? 1 : 0); n++) {
    const f = o.kat(n);
    if (f.kristal && !o.alinan.has(n)) {
      const p = kristalKonum(f);
      if ((Math.abs(o.x - p.x) < 26 + cekim && Math.abs((o.y - 30) - p.y) < 34 + cekim * 0.7)) { o.alinan.add(n); o.ek += KRISTAL_PUAN; kristalSesi(); parcacikEkle(p.x, p.y, 14, '#bff6ff', 3.5); }
    }
    if (f.guc && !o.alinanGuc.has(n)) {
      const p = gucKonum(f);
      if (Math.abs(o.x - p.x) < 28 && Math.abs((o.y - 30) - p.y) < 36) {
        o.alinanGuc.add(n); gucSesi(); parcacikEkle(p.x, p.y, 18, f.guc === 'saat' ? '#ffd24a' : '#ff7a7a', 4);
        if (f.guc === 'saat') o.saat = SAAT_SURE; else o.miknatis = MIKNATIS_SURE;
      }
    }
  }
  // Kamera: taban en yüksek kata göre yükselir (ve kayma başlayınca kendiliğinden); zıplama anında oyuncu üst kenara
  // yaklaşırsa kamera geçici olarak yukarı çıkar, inince tabana yumuşakça döner (tepe noktasına kilitlenmez).
  o.kamTaban = Math.min(o.kamTaban, katY(o.enYuksek) - 200);
  if (!o.kaymaBasladi && o.enYuksek >= 5) o.kaymaBasladi = true; // kat 5'ten sonra kayma başlar
  if (o.kaymaBasladi) {
    o.kayma = o.kare < SAAT ? 0.5 : Math.min(kaymaTavani(o), Math.floor(o.kare / SAAT)); o.kamTaban -= o.kayma * (o.saat > 0 ? 0.4 : 1); // saat: kayma yavaşlar
    if (o.kare % SAAT === 0 && o.kare <= Math.ceil(kaymaTavani(o)) * SAAT) { o.hizlan = 110; hizSesi(); } // her 30 sn'de hızlanma uyarısı
  }
  // Yukarı çıkarken kamera hedefe yumuşakça (üstel) yaklaşır; yükselen oyuncunun biraz önüne bakar (gecikme birikmesin). Aşağı dönüş eskisi gibi sınırlı hızda.
  const kamHedef = Math.min(o.kamTaban, o.y - 100 + (o.vy < 0 ? o.vy * 2.5 : 0));
  if (kamHedef < o.kamY) o.kamY += (kamHedef - o.kamY) * KAM_YUMUSAK; else o.kamY += Math.min(8, kamHedef - o.kamY);
  const ekranY = o.y - o.kamY;
  if (ekranY > H) { o.bitti = true; olumSesi(); return; }
  // Kıl payı: önceki karelerde tehlike bölgesine (ekran altına bir kattan az) girmiş oyuncu bir basamağa konunca bonus; bekleme süresi sık tekrarı önler.
  if (indi && o.tehlike) {
    o.tehlike = false;
    if (o.kilPayiBekle === 0) { o.ek += KIL_PAYI_PUAN; o.kilPayi = 70; o.kilPayiBekle = KIL_PAYI_BEKLE; o.kilPayiSayisi++; parcacikEkle(o.x, o.y, 12, '#5dff6a', 3); }
  }
  if (ekranY > KIL_PAYI_SINIR) o.tehlike = true;
}

function skor(o) { return toplam(o.puan, o.enYuksek) + o.ek; }

// İniş gölgesi: karakter havadayken ve düşerken, ayağının altındaki ilk basamağın üstüne soluk bir elips çizer (kombo planı için).
function inisGolgesi(c, o) {
  if (!o.havada || o.vy < 0 || o.bitti) return;
  for (let n = Math.floor((ZEMIN_Y - o.y) / KAT_ARALIK); n >= 0; n--) {
    const py = katY(n);
    if (py < o.y) continue;
    if (n > 0) { if (o.kirik.has(n)) continue; const [kx0, kx1] = basamakAralik(o.kat(n)); if (o.x < kx0 - AYAK || o.x > kx1 + AYAK) continue; }
    const uzak = Math.min(1, (py - o.y) / 240);
    c.save(); c.globalAlpha = 0.35 * (1 - uzak * 0.6); c.fillStyle = '#0b1230';
    c.beginPath(); c.ellipse(o.x, py - o.kamY - 1, 16 - uzak * 6, 3.5 - uzak, 0, 0, Math.PI * 2); c.fill(); c.restore();
    return;
  }
}
function ciz(c, o, hayalet = null) {
  const titre = Math.max(o.mesaj && o.mesaj.guc > 48 ? (o.mesaj.guc - 48) * 0.35 : 0, o.sars * 0.45) * AYAR.sarsinti; // büyük kombo ödülünde ve 100/200/500. katta kısa ekran sarsıntısı (azaltılmış harekette 0)
  c.save(); if (titre) c.translate((Math.random() - 0.5) * titre, (Math.random() - 0.5) * titre);
  arkaPlan(c, W, H, o.kamY, o.enYuksek, o.puan.kombo && o.puan.kombo.zip >= 5 ? 1 : 0); duvarlar(c, W, H, o.kamY, o.enYuksek); // akış hali: kombo x5+ (yalnız görünüm)
  const ilk = Math.max(0, Math.floor((ZEMIN_Y - (o.kamY + H)) / KAT_ARALIK) - 1), son = Math.ceil((ZEMIN_Y - o.kamY) / KAT_ARALIK) + 1;
  for (let n = ilk; n <= son; n++) {
    const f = o.kat(n), sy = katY(n) - o.kamY;
    if (n === 0) platform(c, 85, sy, 470, 0, true, 0);
    else if (!o.kirik.has(n)) platform(c, 85 + (f.xKaro - 5) * KARO, sy, f.genislikKaro * KARO, n, f.no, n, f.tur, o.sayacKat === n ? o.sayac / KIRILMA : 0);
    if (o.kaygan && n > 0 && !o.kirik.has(n) && kayganKat(o.tohum, n)) { const bx = 85 + (f.xKaro - 5) * KARO, bw = f.genislikKaro * KARO; c.save(); c.globalAlpha = 0.28; c.fillStyle = '#7fe3ff'; c.fillRect(bx, sy - 3, bw, 7); c.globalAlpha = 0.6; c.fillStyle = '#f2fdff'; c.fillRect(bx + 4, sy - 1, bw - 8, 2); c.restore(); } // kaygan buz parlaması
    const tab = katTabelasi(n);
    if (tab) pikselYaz(c, tab, 85 + (f.xKaro - 5) * KARO - 8, sy - 8, 2, '#dff6ff', { hiza: 'sag', golge: 'rgba(0,0,0,0.85)' });
    if (f.kristal && !o.alinan.has(n)) { const p = kristalKonum(f); kristalCiz(c, p.x, p.y - o.kamY, n); }
    if (f.guc && !o.alinanGuc.has(n)) { const p = gucKonum(f); gucCiz(c, p.x, p.y - o.kamY, f.guc, n); }
  }
  if (KULELER[AYAR.kule]) kuleTint(c, W, H, KULELER[AYAR.kule].tint); // kule konsepti tonu (karakterin altında kalır)
  if (AYAR.kuleEfekt && KULELER[AYAR.kule]) kuleEfektCiz(c, W, H, KULELER[AYAR.kule].id); // kule konseptine özel süs efektleri (kapatılabilir)
  if (AYAR.golge) inisGolgesi(c, o); // düşerken altındaki basamağa ince soluk gölge (yalnız görünüm)
  if (hayalet && !hayalet.bitti && AYAR.hayaletGoster) { c.save(); c.globalAlpha = 0.42; karakterCiz(c, hayalet, true); c.restore(); }
  karakterCiz(c, o); parcacikCiz(c, o.kamY);
  c.restore();
}

// Kenney "Platformer Characters" (CC0) pozları; kaynak varlik/kenney/LICENSE-Kenney-CC0.txt. Karakter ayar panelinden seçilir.
const POZLAR = ['stand', 'walk1', 'walk2', 'jump', 'fall', 'skid', 'cheer1', 'hurt'];
const RESIMLER = {};
function resimler(ad) {
  if (!RESIMLER[ad] && typeof Image !== 'undefined') {
    RESIMLER[ad] = {};
    for (const p of POZLAR) { const r = new Image(); r.src = './varlik/kenney/karakter/' + ad + '/' + p + '.png'; RESIMLER[ad][p] = r; }
  }
  return RESIMLER[ad];
}
function pozSec(o) {
  if (o.bitti) return 'hurt';
  if (o.havada) return o.donuyor ? 'cheer1' : o.vy < 0 ? 'jump' : 'fall';
  if (Math.abs(o.vx) > 2) return (o.kare >> 3) & 1 ? 'walk1' : 'walk2';
  return 'stand';
}
function karakterCiz(c, o, hayaletMi = false) {
  const takim = resimler(KARAKTERLER[AYAR.karakter] || KARAKTERLER[0]), r = takim && takim[pozSec(o)], ters = o.yon < 0;
  const ayakY = o.y - o.kamY;
  if (!(r && r.complete && r.naturalWidth > 0)) { // yüklenemezse sade yedek
    c.fillStyle = '#ff7a3d'; c.beginPath(); c.roundRect ? c.roundRect(o.x - 12, ayakY - 40, 24, 40, 8) : c.rect(o.x - 12, ayakY - 40, 24, 40); c.fill(); return;
  }
  // squash & stretch: havada hıza göre uzar; hızlı koşuda hafif eğilir ve iz bırakır (iz rengi mağazadan); takla zıplamasında gövde döner
  const uzama = o.havada && !o.donuyor ? Math.max(-0.12, Math.min(0.14, -o.vy * 0.006)) : 0;
  const g = 48 * (1 - uzama * 0.6), y = 66 * (1 + uzama);
  if (!hayaletMi && (Math.abs(o.vx) > 8 || (o.havada && Math.abs(o.vy) > 14))) parcacikEkle(o.x, o.y - 24, 1, o.donuyor ? 'rgba(255,210,120,0.9)' : izRengi(o.kare), 0.6);
  c.fillStyle = 'rgba(0,0,0,' + (o.havada ? 0.12 : 0.3) + ')'; c.beginPath(); c.ellipse(o.x, ayakY + 2, o.havada ? 11 : 17, 4, 0, 0, 7); c.fill();
  c.save();
  const merkezY = ayakY - 33; // dönüş ve eğilme gövde/ayak noktasından
  if (o.havada && o.donuyor) { c.translate(o.x, merkezY); c.rotate(o.aci); c.translate(-o.x, -merkezY); }
  else { c.translate(o.x, ayakY); c.rotate(o.havada ? 0 : Math.max(-0.18, Math.min(0.18, o.vx * 0.012))); c.translate(-o.x, -ayakY); }
  c.shadowColor = o.donuyor ? 'rgba(255,215,130,0.95)' : 'rgba(140,230,255,0.9)'; c.shadowBlur = (Math.abs(o.vx) > 8 || o.donuyor ? 14 : 6) * AYAR.parilti;
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  const x = o.x - g / 2, yy = ayakY - y + 3;
  if (ters) { c.translate(o.x * 2, 0); c.scale(-1, 1); }
  c.drawImage(r, x, yy, g, y);
  c.restore();
}

// ---- piksel ----
// description: Buz Kule arcade HUD için 5x7 piksel yazı tipi (kendi çizimim, yazı tipi dosyası gerekmez). Türkçe harfler en yakın Latin harfine eşlenir. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
const G = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'], B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'], D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'], F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'], H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'], J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'], L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'], N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'], P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'], R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'], T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'], V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'], X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'], Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  0: ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'], 1: ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'], 3: ['.###.', '#...#', '....#', '..##.', '....#', '#...#', '.###.'],
  4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'], 5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  6: ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'], 7: ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'], 9: ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
  '-': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'], '.': ['.....', '.....', '.....', '.....', '.....', '.##..', '.##..'],
  ':': ['.....', '.##..', '.##..', '.....', '.##..', '.##..', '.....'], '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
  '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'], '/': ['....#', '....#', '...#.', '..#..', '.#...', '#....', '#....'],
  '*': ['.....', '#.#.#', '.###.', '#####', '.###.', '#.#.#', '.....'], ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
};
const TR = { İ: 'I', I: 'I', Ğ: 'G', Ü: 'U', Ş: 'S', Ö: 'O', Ç: 'C' };
const harf = (ch) => { const b = ch.toLocaleUpperCase('tr'); return G[TR[b] || b] || G[b.normalize('NFD').charAt(0)] || G[' ']; };
// Latin dışı yazılar (Kiril, Arapça, Devanagari, Bengalce, Çince): 5x7 piksel yazı bu harfleri çizemez; sistem yazı tipiyle, oyunun neon
// kontur ve gölge diliyle çizilir. Yazı tipleri Windows'ta hazır gelen yazı tipleridir (indirme/ekleme yok).
const LATIN_DISI = /[Ѐ-ӿ؀-ۿݐ-ݿऀ-৿　-鿿ﭐ-﷿ﹰ-﻿]/;
const AILELER = [
  [/[　-鿿]/, '"Microsoft YaHei UI","Microsoft YaHei","Noto Sans CJK SC",sans-serif'],
  [/[ऀ-ॿ]/, '"Nirmala UI","Mangal","Noto Sans Devanagari",sans-serif'],
  [/[ঀ-৿]/, '"Nirmala UI","Vrinda","Noto Sans Bengali",sans-serif'],
  [/[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/, '"Segoe UI","Tahoma","Arial",sans-serif'],
  [/[Ѐ-ӿ]/, '"Lucida Console","Consolas","Courier New",monospace'],
];
const sistemYaziMi = (metin) => LATIN_DISI.test(metin);
const sistemAile = (metin) => (AILELER.find(([re]) => re.test(metin)) || [0, 'sans-serif'])[1];
const sistemBoyut = (olcek) => Math.max(8, Math.round(olcek * 8.5));
let olcerBaglam; // genişlik ölçümü için küçük bir tuval bağlamı (yoksa tahmin)
function sistemGenislik(metin, olcek) {
  try {
    if (olcerBaglam === undefined) { const tv = tuvalYap(1, 1); olcerBaglam = tv && tv.getContext ? tv.getContext('2d') : null; }
    if (olcerBaglam && olcerBaglam.measureText) { olcerBaglam.font = 'bold ' + sistemBoyut(olcek) + 'px ' + sistemAile(metin); const w = olcerBaglam.measureText(metin).width; if (w > 0) return Math.ceil(w); }
  } catch { /* ölçülemezse tahmin */ }
  return Math.ceil([...metin].length * sistemBoyut(olcek) * 0.9);
}
const pikselGenislik = (metin, olcek) => (sistemYaziMi(metin) ? sistemGenislik(metin, olcek) : Math.max(0, [...metin].length * 6 * olcek - olcek));
function sistemYaz(c, metin, x, y, olcek, renk, secenek) {
  const w = sistemGenislik(metin, olcek), x0 = Math.round(secenek.hiza === 'orta' ? x - w / 2 : secenek.hiza === 'sag' ? x - w : x), boyut = sistemBoyut(olcek);
  c.save(); c.font = 'bold ' + boyut + 'px ' + sistemAile(metin); c.textBaseline = 'top'; c.textAlign = 'left'; if ('direction' in c) c.direction = /[؀-ۿ]/.test(metin) ? 'rtl' : 'ltr';
  if (secenek.golge) { c.fillStyle = secenek.golge; c.fillText(metin, x0 + Math.max(1, olcek * 0.7), y + Math.max(1, olcek * 0.7)); }
  if (secenek.cizgi) { c.lineJoin = 'round'; c.lineWidth = Math.max(2, olcek * 1.4); c.strokeStyle = secenek.cizgi; c.strokeText(metin, x0, y); }
  c.fillStyle = renk; c.fillText(metin, x0, y); c.restore(); return w;
}

// Önbellek: metin+ölçek+renk+kontur+gölge anahtarıyla bir kez çizilip drawImage ile basılır (en çok PBOY giriş, LRU). Düzgün ölçekli olmayan dönüşümde (döndürme/eğme), yarı saydamlık kat çakışması varsa veya tuval yoksa eski yola düşer.
const PBOY = 64, onbellek = new Map();
let tuvalYap = (w, h) => (typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(w, h) : typeof document !== 'undefined' && document.createElement ? Object.assign(document.createElement('canvas'), { width: w, height: h }) : null);
const pikselOnbellekAyarla = (fabrika) => { tuvalYap = fabrika; onbellek.clear(); };
const pikselOnbellekBoyut = () => onbellek.size;
const SAYDAM = /a\(|^#(?:[\da-f]{4}|[\da-f]{8})$/i;
function katlar(metin, olcek, renk, secenek) {
  const k = []; const a = Math.max(1, olcek / 2);
  if (secenek.cizgi) for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1], [-1, 0], [1, 0]]) k.push([dx * a, dy * a, secenek.cizgi]);
  if (secenek.golge) k.push([olcek, olcek, secenek.golge]);
  k.push([0, 0, renk]); return k;
}
function hucreCiz(c, metin, olcek, ox, oy, katList) {
  for (const [dx, dy, r] of katList) {
    c.fillStyle = r; let cx = ox + dx;
    for (const ch of metin) { const g = harf(ch); for (let sat = 0; sat < 7; sat++) for (let sut = 0; sut < 5; sut++) if (g[sat][sut] === '#') c.fillRect(cx + sut * olcek, oy + dy + sat * olcek, olcek, olcek); cx += 6 * olcek; }
  }
}
// m: düzgün ölçekli dönüşüm. Bitmap aygıt pikselinde (ölçek*mantıksal) çizilir; aygıt kaymasının kesri 1/8'e yuvarlanıp anahtara girer, tam sayı kısmına drawImage ile (kimlik dönüşümüyle, yeniden örnekleme yok) basılır.
function onbellekten(metin, olcek, renk, secenek, w, s, fx, fy) {
  const anahtar = [metin, olcek, renk, secenek.cizgi || '', secenek.golge || '', Math.round(s * 1e4), fx, fy].join('\u0001');
  let g = onbellek.get(anahtar);
  if (g) { onbellek.delete(anahtar); onbellek.set(anahtar, g); return g; }
  const pad = Math.ceil(Math.max(1, olcek / 2) + olcek) + 1, bw = Math.ceil((Math.ceil(w) + pad * 2) * s) + 2, bh = Math.ceil((7 * olcek + pad * 2) * s) + 2;
  if (bw > 2048 || bh > 1024) return null;
  const t = tuvalYap(bw, bh), tc = t && t.getContext && t.getContext('2d');
  if (!tc || typeof tc.setTransform !== 'function') return null;
  tc.setTransform(s, 0, 0, s, fx / 8, fy / 8);
  hucreCiz(tc, metin, olcek, pad, pad, katlar(metin, olcek, renk, secenek));
  g = { t, pad }; onbellek.set(anahtar, g);
  if (onbellek.size > PBOY) onbellek.delete(onbellek.keys().next().value);
  return g;
}
// Dönüşüm düzgün ölçekli (a==d>0, b==c==0), kat çakışması varken tam opaklık: aksi halde null (eski yol).
function uygun(c, renk, secenek) {
  if (typeof c.drawImage !== 'function' || typeof c.getTransform !== 'function' || typeof c.setTransform !== 'function' || typeof c.save !== 'function') return null;
  const m = c.getTransform(); if (!m || !(m.a > 0) || Math.abs(m.a - m.d) > 1e-6 || Math.abs(m.b) > 1e-6 || Math.abs(m.c) > 1e-6) return null;
  if (c.globalCompositeOperation && c.globalCompositeOperation !== 'source-over') return null;
  if (c.globalAlpha !== 1 && (secenek.cizgi || secenek.golge)) return null;
  return SAYDAM.test(renk) ? null : m;
}

// Piksel yazı çizer. secenek: { hiza: 'sol'|'orta'|'sag', golge: renk, cizgi: renk }. Her harf 5x7 hücre, hücre = olcek piksel.
function pikselYaz(c, metin, x, y, olcek, renk, secenek = {}) {
  if (sistemYaziMi(metin)) return sistemYaz(c, metin, x, y, olcek, renk, secenek);
  const w = pikselGenislik(metin, olcek), x0 = Math.round(secenek.hiza === 'orta' ? x - w / 2 : secenek.hiza === 'sag' ? x - w : x), y0 = Math.round(y);
  const m = w > 0 && typeof renk === 'string' ? uygun(c, renk, secenek) : null;
  if (m) {
    const pad = Math.ceil(Math.max(1, olcek / 2) + olcek) + 1, dx = m.a * (x0 - pad) + m.e, dy = m.a * (y0 - pad) + m.f, ix = Math.floor(dx), iy = Math.floor(dy);
    const g = onbellekten(metin, olcek, renk, secenek, w, m.a, Math.round((dx - ix) * 8), Math.round((dy - iy) * 8));
    if (g) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(g.t, ix, iy); c.restore(); return w; }
  }
  hucreCiz(c, metin, olcek, x0, y0, katlar(metin, olcek, renk, secenek));
  return w;
}

// ---- hud ----
// description: Buz Kule oyun içi HUD: klasik arcade makinesi görünümü (piksel yazı, neon çerçeve, parçalı çubuklar, yanıp sönen uyarılar); oyuncu üst kenara yaklaşınca solar. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
// Menü, duraklatma ve bitiş ekranları HTML katmanındadır (index.html + arayuz.js); burada yalnız canvas HUD'u var.
// Kombo kapanış patlaması (yalnız görünüm): yeni bir kombo ödülü mesajı görülünce kombo renginde ışınlar ve parçacıklar saçılır,
// "+N" etiketi skor alanına uçar, varınca skor kısa süre beyaz yanar. Azaltılmış harekette uçuş yok, yalnız skor vurgusu. Simülasyona dokunmaz.






const odulAd = (ad) => { const i = ODUL_SIRA.indexOf(ad); return i < 0 ? ad : th('hud_odul' + i); }; // ödül adı seçili dilde (piksel yazı için)
const basarimAd = (b) => (b.id ? th('b_' + b.id + '_ad') : b.ad);

let ARKA = 'rgba(8,6,28,0.78)', NEON1 = '#ff3df2', NEON2 = '#2de6ff', SARI = '#ffd62e', KIRMIZI = '#ff4d4d', YESIL = '#5dff6a', BEYAZ = '#ffffff', SOLUK = '#9aa6d6';
// Yüksek kontrast (ayar): koyu zemin üzerinde saf, ayırt edilebilir renkler (renk körlüğü dostu); kapalıyken eski palet.
const kontrastUygula = (a) => { if (a) { ARKA = '#000000'; NEON1 = '#ffffff'; NEON2 = '#00e5ff'; SARI = '#ffee00'; KIRMIZI = '#ff7a4d'; YESIL = '#4dff91'; BEYAZ = '#ffffff'; SOLUK = '#ffffff'; } else { ARKA = 'rgba(8,6,28,0.78)'; NEON1 = '#ff3df2'; NEON2 = '#2de6ff'; SARI = '#ffd62e'; KIRMIZI = '#ff4d4d'; YESIL = '#5dff6a'; BEYAZ = '#ffffff'; SOLUK = '#9aa6d6'; } };
const sifirli = (n, adet) => String(Math.max(0, Math.floor(n))).padStart(adet, '0');

// Arcade paneli: koyu zemin, çift çizgili neon çerçeve, kesik köşeler ve ince tarama çizgileri.
function panelArcade(c, x, y, g, h, renk = NEON2) {
  c.fillStyle = ARKA; c.fillRect(x, y, g, h);
  c.fillStyle = 'rgba(255,255,255,0.045)'; for (let i = 2; i < h; i += 4) c.fillRect(x, y + i, g, 1);       // tarama çizgileri
  c.fillStyle = renk; c.fillRect(x, y, g, 2); c.fillRect(x, y + h - 2, g, 2); c.fillRect(x, y, 2, h); c.fillRect(x + g - 2, y, 2, h);
  c.fillStyle = 'rgba(0,0,0,0.9)'; c.fillRect(x, y, 2, 2); c.fillRect(x + g - 2, y, 2, 2); c.fillRect(x, y + h - 2, 2, 2); c.fillRect(x + g - 2, y + h - 2, 2, 2); // kesik köşeler
  c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(x + 2, y + 2, g - 4, 1);
}
// Parçalı (segmentli) çubuk: dolu segmentler renkli, boşlar sönük.
function parcaliCubuk(c, x, y, seg, doluSay, genislik, yukseklik, aralik, renkFn, dikey = false) {
  for (let i = 0; i < seg; i++) {
    const dolu = i < doluSay, px = dikey ? x : x + i * (genislik + aralik), py = dikey ? y - i * (yukseklik + aralik) : y;
    c.fillStyle = dolu ? renkFn(i, seg) : 'rgba(255,255,255,0.12)'; c.fillRect(px, py, genislik, yukseklik);
    if (dolu) { c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(px, py, genislik, 1); }
  }
}
const yesilKirmizi = (i, seg) => (i < seg * 0.5 ? YESIL : i < seg * 0.8 ? SARI : KIRMIZI);
const vur = (c, yazi, x, y, olcek, renk, hiza = 'sol') => pikselYaz(c, yazi, x, y, olcek, renk, { hiza, golge: 'rgba(0,0,0,0.85)' });
const pikselKristal = (c, x, y, s = 2) => { // 7x9 hücrelik elmas
  const satir = ['..#..', '.###.', '#####', '#####', '.###.', '..#..']; c.fillStyle = '#bff6ff';
  satir.forEach((r, j) => [...r].forEach((h, i) => { if (h === '#') { c.fillStyle = i < 2 && j > 1 ? '#7B5CC4' : j < 2 ? '#e8fbff' : '#8de8ff'; c.fillRect(x + i * s, y + j * s, s, s); } }));
};

// ---- Kombo kapanış patlaması durumu (HUD'a özel, çizim karesiyle ilerler) ----
let sonKapanis = null, kapanisEtiket = null, skorVurgu = 0;
const komboRengi = (zip) => (zip >= 6 ? NEON1 : zip >= 4 ? NEON2 : SARI); // kombo yazısıyla aynı renk basamakları
const kapanisGorunum = () => ({ etiket: !!kapanisEtiket, vurgu: skorVurgu }); // testler için
function kapanisBaslat(m) {
  const renk = komboRengi(m.zip), x0 = W / 2, y0 = 186, x1 = 100 + pikselGenislik('0000000', 2) / 2, y1 = 27; // kaynak: "KOMBO BITTI" satırı; hedef: skor sayısı
  if (AYAR.azaltilmisHareket) { skorVurgu = 14; return; }
  kapanisEkle(x0, y0, x1, y1, 16, renk);
  kapanisEtiket = { metin: '+' + m.toplam * m.toplam, renk, t: 0, isin: 12, p: { x0, y0, cx: x0 + 40, cy: y0 - 90, x1, y1 } };
}
function kapanisCizHud(c) {
  kapanisCiz(c);
  const e = kapanisEtiket; if (!e) return;
  e.t += 1 / 40;
  if (e.isin > 0 && AYAR.parilti > 0.05) { // kaynaktan dışa açılan kısa ışınlar
    const k = e.isin / 12; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, AYAR.parilti) * 0.7 * k; c.strokeStyle = e.renk; c.lineWidth = 2;
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + 0.3, r0 = (1 - k) * 60 + 10, r1 = r0 + 26 + 30 * (1 - k); c.beginPath(); c.moveTo(e.p.x0 + Math.cos(a) * r0, e.p.y0 + Math.sin(a) * r0); c.lineTo(e.p.x0 + Math.cos(a) * r1, e.p.y0 + Math.sin(a) * r1); c.stroke(); }
    c.restore(); e.isin--;
  }
  if (e.t >= 1) { kapanisEtiket = null; skorVurgu = 14; return; } // vardı: skor yanar
  const n = kapanisNokta(e.p, e.t); c.save(); c.globalAlpha = e.t > 0.85 ? (1 - e.t) / 0.15 : 1;
  pikselYaz(c, e.metin, n.x, n.y, 2, e.renk, { hiza: 'orta', golge: 'rgba(0,0,0,0.85)' }); c.restore();
}

function hudCiz(c, o, en, hayalet = null) {
  kontrastUygula(AYAR.kontrast);
  const kare = o.kare, yanip = (Math.floor(kare / 12) % 2) === 0;
  if (o.mesaj !== sonKapanis) { sonKapanis = o.mesaj; if (o.mesaj && o.mesaj.zip) kapanisBaslat(o.mesaj); } // her kombo kapanışında bir kez
  if (skorVurgu > 0) skorVurgu--;
  // Oyuncu ekranın üst kısmındayken (yukarı zıplama) ana şerit neredeyse görünmez olur, görüşü kapatmaz.
  const ekranY = o.y - o.kamY, gorunur = Math.max(0.14, Math.min(1, (ekranY - 70) / 150)) * Math.min(1.1, AYAR.hud);
  if (AYAR.hud > 0.02) {
    c.save(); c.globalAlpha = Math.min(1, gorunur);
    // ana şerit: SKOR | REKOR | KAT
    panelArcade(c, 92, 6, 456, 34, NEON1);
    vur(c, th('hud_1up'), 100, 10, 1, yanip ? KIRMIZI : '#7a2b2b'); vur(c, sifirli(skor(o), 7), 100, 20, 2, skorVurgu > 0 ? BEYAZ : SARI);
    vur(c, th('hud_rekor'), 320, 10, 1, SOLUK, 'orta'); vur(c, sifirli(Math.max(en, skor(o)), 7), 320, 20, 2, NEON2, 'orta');
    vur(c, th('hud_kat'), 540, 10, 1, SOLUK, 'sag'); vur(c, sifirli(o.enYuksek, 3), 540, 20, 2, YESIL, 'sag');
    // ikinci satır: kristal sayacı, hayalet, güç öğeleri
    let sx = 94;
    pikselKristal(c, sx, 45, 2); vur(c, 'X' + sifirli(o.alinan.size, 2), sx + 14, 46, 2, BEYAZ); sx += 14 + pikselGenislik('X00', 2) + 14;
    if (hayalet && AYAR.hayaletGoster) { const fark = o.enYuksek - hayalet.enYuksek, t = th('hud_hayalet') + ' ' + (hayalet.bitti ? th('hud_bitti') : th('hud_kat') + ' ' + hayalet.enYuksek); vur(c, t, sx, 48, 1, fark >= 0 ? YESIL : KIRMIZI); sx += pikselGenislik(t, 1) + 14; }
    if (AYAR.mukemmel && o.mukSeri >= 2) vur(c, th('hud_mukemmel') + ' X' + o.mukSeri, 546, 48, 1, YESIL, 'sag'); // mükemmel iniş serisi (kapatılabilir)
    [[th('hud_saat'), o.saat, 480, SARI], [th('hud_miknatis'), o.miknatis, 500, KIRMIZI]].filter(g => g[1] > 0).forEach((g) => {
      vur(c, g[0], sx, 48, 1, g[3]); const bx = sx + pikselGenislik(g[0], 1) + 5; parcaliCubuk(c, bx, 47, 8, Math.ceil(8 * g[1] / g[2]), 5, 7, 1, () => g[3]); sx = bx + 8 * 6 + 12;
    });
    c.restore();
    // kombo ölçeri: duvar üzerinde dikey parçalı çubuk
    if (o.puan.kombo) {
      const k = o.puan.kombo; c.save(); c.globalAlpha = Math.max(0.55, Math.min(1, gorunur));
      panelArcade(c, 10, 74, 54, 212, NEON2);
      vur(c, th('hud_kombo'), 37, 79, 1, SOLUK, 'orta');
      parcaliCubuk(c, 20, 262, 14, Math.ceil(14 * k.sayac / 100), 34, 9, 3, (i, seg) => (i < seg * 0.4 ? KIRMIZI : i < seg * 0.7 ? SARI : YESIL), true);
      vur(c, 'X' + k.zip, 37, 268, 2, SARI, 'orta'); c.restore();
    }
  }
  // önceki en iyi kat: kulede ince kesikli çizgi; geçilince kaybolur
  if (o.rekorKat > 0 && o.enYuksek <= o.rekorKat) {
    const ry = Math.round(katY(o.rekorKat) - o.kamY - 6);
    if (ry > 66 && ry < 470) {
      c.save(); c.globalAlpha = 0.8; c.fillStyle = SARI; for (let x = 92; x < 548; x += 12) c.fillRect(x, ry, 7, 2);
      vur(c, th('hud_rekor_kat') + ' ' + o.rekorKat, 546, ry - 9, 1, SARI, 'sag'); c.restore();
    }
  }
  // kombo yazısı: kombo sürerken ortada büyüyen "XN KOMBO"; her kombo zıplamasında vurgulanır, süre bitmeye yaklaşırken yanıp söner
  if (o.puan.kombo && o.puan.kombo.zip >= 2) {
    const k = o.puan.kombo, zip = k.zip, renk = zip >= 6 ? NEON1 : zip >= 4 ? NEON2 : SARI, boyut = Math.min(7, 2 + Math.floor(zip * 0.6)) + (o.komboPuls > 10 ? 1 : 0);
    const yazi = 'X' + zip + ' ' + th('hud_kombo'), kalan = k.sayac, soluk = kalan < 30 && Math.floor(kalan / 4) % 2 === 0;
    if (!soluk) {
      c.save(); c.globalAlpha = 0.95;
      const ust = 188 - Math.round(boyut * 3.5);
      pikselYaz(c, yazi, W / 2, ust, boyut, renk, { hiza: 'orta', cizgi: '#150a3a', golge: 'rgba(0,0,0,0.85)' });
      pikselYaz(c, '+' + k.toplam + ' ' + th('hud_kat'), W / 2, ust + 7 * boyut + 10, 2, BEYAZ, { hiza: 'orta', golge: 'rgba(0,0,0,0.85)' }); c.restore();
    }
    if (AYAR.parilti > 0.05) { // oyun alanı kenarlarında kombo rengiyle kısa parıltı
      const a = Math.min(0.55, 0.12 + o.komboPuls * 0.025 + zip * 0.02) * Math.min(1, AYAR.parilti); c.save(); c.globalAlpha = a;
      for (const [x0, x1] of [[90, 130], [550, 510]]) { const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, renk); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(Math.min(x0, x1), 0, 40, 480); }
      c.restore();
    }
  }
  // geçici uyarılar (her zaman görünür)
  BILDIRIM.slice(0, 2).forEach((b, i) => { // başarım bildirimi
    const a = Math.min(1, b.guc / 20, (200 - b.guc) / 12), g = Math.max(pikselGenislik(th('hud_basarim'), 2), pikselGenislik(basarimAd(b) + ' +' + b.odul, 1)) + 24, y = 112 + i * 46;
    c.save(); c.globalAlpha = Math.max(0, a); panelArcade(c, W / 2 - g / 2, y, g, 38, SARI);
    vur(c, th('hud_basarim'), W / 2, y + 6, 2, yanip ? SARI : BEYAZ, 'orta'); vur(c, basarimAd(b) + ' +' + b.odul, W / 2, y + 24, 1, NEON2, 'orta'); c.restore();
  });
  if (o.hizlan > 0) { // her 30 sn'de hızlanma uyarısı
    const t = th('hud_hizlaniyor') + ' X' + (Math.floor(kare / SAAT) + 1), g = pikselGenislik(t, 3) + 24;
    if (yanip || o.hizlan < 20) { c.save(); c.globalAlpha = Math.min(1, o.hizlan / 15); panelArcade(c, W / 2 - g / 2, 72, g, 34, KIRMIZI); vur(c, t, W / 2, 80, 3, SARI, 'orta'); c.restore(); }
  }
  if (o.kilPayi > 0) { // kıl payı bonusu: ekran altına çok yaklaşıp kurtulunca kısa yeşil yazı ve küçük puan
    const s = o.kilPayi > 62 ? 4 : 3; c.save(); c.globalAlpha = Math.min(1, o.kilPayi / 15);
    pikselYaz(c, th('hud_kil_payi'), W / 2, 300 - (70 - o.kilPayi) * 0.3, s, yanip ? YESIL : BEYAZ, { hiza: 'orta', cizgi: '#0a3a14', golge: 'rgba(0,0,0,0.9)' });
    vur(c, '+' + KIL_PAYI_PUAN, W / 2, 300 - (70 - o.kilPayi) * 0.3 + 7 * s + 6, 2, SARI, 'orta'); c.restore();
  }
  if (o.rozet) { // 50 katta kilometre taşı
    const s = o.rozet.olcek || 9, t = o.rozet.metin; c.save(); c.globalAlpha = Math.min(1, o.rozet.guc / 20);
    if (Math.floor(o.rozet.guc / 5) % 2 === 0) pikselYaz(c, t, W / 2, 210, s, SARI, { hiza: 'orta', cizgi: '#7a1fff', golge: 'rgba(0,0,0,0.9)' }); else pikselYaz(c, t, W / 2, 210, s, BEYAZ, { hiza: 'orta', cizgi: NEON1, golge: 'rgba(0,0,0,0.9)' });
    c.restore();
  }
  if (o.mesaj && o.mesaj.guc > 0) { // kombo ödülü: büyük yanıp sönen renkli yazı, altında kombo özeti
    const renk = [SARI, NEON2, NEON1, YESIL][Math.floor(kare / 5) % 4], t = odulAd(o.mesaj.ad) + '!', s = pikselGenislik(t, 5) > 380 ? 3 : 5;
    c.save(); c.globalAlpha = Math.min(1, o.mesaj.guc / 15);
    if (o.mesaj.zip) vur(c, th('hud_kombo_bitti') + ': X' + o.mesaj.zip + '  +' + o.mesaj.toplam * o.mesaj.toplam + ' ' + th('hud_puan'), W / 2, 140 - (60 - o.mesaj.guc) * 0.35 + 7 * s + 8, 2, BEYAZ, 'orta'); pikselYaz(c, t, W / 2, 140 - (60 - o.mesaj.guc) * 0.35, s, renk, { hiza: 'orta', cizgi: '#150a3a', golge: 'rgba(0,0,0,0.9)' }); c.restore();
  }
  kapanisCizHud(c); // kombo kapanış patlaması: parçacıklar, ışınlar ve skora uçan "+N" etiketi (en üstte)
}

// ---- arayuz ----
// description: Tarayıcı girişi, durum makinesi (menü/oyun/duraklat/bitiş), HTML katmanları (sekmeler, canlı ayar paneli) ve oyun döngüsü. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)












const kimlik = (a) => document.getElementById(a);
const tuval = kimlik('c'), c = tuval.getContext('2d', { alpha: false }); // arka plan her karede tam opak çizilir (gorsel.js arkaPlan fillRect) -> alfa kanalı gereksiz
const k = {};
// Yüksek çözünürlük: tuval, ekrandaki gerçek boyut × cihaz piksel oranı kadar piksel kullanır; çizim 640×480 mantıksal koordinatta kalır.
let olcek = 1;
function boyutla() {
  // Sahne boyutu CSS vw/vh yerine gerçekten görünen alana (visualViewport) göre hesaplanır: pencere, yakınlaştırma ya da ekran ölçeği
  // farklı olsa bile sahne görünen alana sığar ve ortalanır.
  const sahne = kimlik('sahne'), vv = window.visualViewport;
  const gw = Math.min(window.innerWidth || 640, (vv && vv.width) || 1e9, (document.documentElement && document.documentElement.clientWidth) || 1e9);
  const gh = Math.min(window.innerHeight || 480, (vv && vv.height) || 1e9, (document.documentElement && document.documentElement.clientHeight) || 1e9);
  if (sahne && sahne.style && gw && gh) { const w = Math.max(320, Math.min(gw - 48, (gh - 48) * 4 / 3)); sahne.style.width = Math.floor(w) + 'px'; }
  const r = tuval.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  const w = Math.max(320, Math.min(2560, Math.round(r.width * dpr)));
  if (tuval.width !== w) { tuval.width = w; tuval.height = Math.round(w * 3 / 4); }
  olcek = tuval.width / 640;
  if (sahne && sahne.style && sahne.style.setProperty) sahne.style.setProperty('--olcek', String(Math.max(0.6, Math.min(2, r.width / 960))));
}
boyutla(); addEventListener('resize', boyutla); if (window.visualViewport && window.visualViewport.addEventListener) window.visualViewport.addEventListener('resize', boyutla);
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(boyutla).observe(tuval); // pencere büyütülünce ya da başka ekrana taşınınca yeniden boyutla
// Skor ve hayalet kayıt anahtarı: zorluk (0-3) + kaygan buz açıksa 10. Orta zorluk ve kaygan kapalı = eski anahtarlar.
const zk = () => AYAR.zorluk + (AYAR.kaygan ? 10 : 0) + 100 * AYAR.kule, oz = (g) => g.zorluk + (g.kaygan ? 10 : 0) + 100 * (g.kule | 0);
let o = yeniOyun(), durum = 'baslik', en = 0, yeniRekor = false, sekme = 'oyna', sonSira = 0;
let mod = 'yeni', sonMod = 'yeni', hayalet = null, hayaletGiris = [], kaydedici = kayitBaslat(), hayaletSonuc = '';
ayarYukle(); cuzdanYukle(); basarimYukle();
try { en = Number(localStorage.getItem('buzkule.en')) || 0; } catch { /* kayıt yoksa sorun değil */ }

kimlik('m-en').textContent = String(en);
// ---- HTML katmanları ----
const katmanlar = { menu: kimlik('menu'), duraklat: kimlik('duraklat'), sonuc: kimlik('sonuc') };
function katmanGoster(ad) {
  for (const [a, el] of Object.entries(katmanlar)) { const ac = a === ad; el.classList.toggle('acik', ac); el.setAttribute('aria-hidden', String(!ac)); }
}
const durumKatman = { baslik: 'menu', duraklat: 'duraklat', bitti: 'sonuc', oyun: null };
// Erişilebilirlik: katman açılınca odak ilk düğmeye (menüde seçili sekme, sonuçta Tekrar dene, duraklatmada kartın kendisi) gider;
// katman kapanıp oyun sürünce odak tuvale (tabindex=-1) döner, böylece Space odaktaki düğmeyi yeniden tıklamaz.
function odakla(el) { if (el && typeof el.focus === 'function') { try { el.focus({ preventScroll: true }); } catch { /* sahte DOM ya da eski tarayıcı */ } } }
const durumOdak = { baslik: () => kimlik('t-' + sekme), duraklat: () => kimlik('d-kart'), bitti: () => kimlik('tekrar'), oyun: () => tuval };
function durumDegistir(d, yeni = false) {
  durum = d; katmanGoster(durumKatman[d]); muzikGuncelle(d === 'oyun', yeni); // müzik yalnız oyun sürerken çalar
  odakla(durumOdak[d]());
  if (d === 'baslik') { basarimYaz(); kimlik('m-en').textContent = String(en); kimlik('m-kristal').textContent = String(CUZDAN.kristal); magazaYaz(); listeYaz(kimlik('m-liste'), 5, 0); modYaz(); }
  if (d === 'bitti') {
    kimlik('s-skor').textContent = String(skor(o)); kimlik('s-kat').textContent = String(o.enYuksek); kimlik('s-en').textContent = String(en); kimlik('s-kombo').textContent = String(o.enIyiKombo); kimlik('s-olum').textContent = o.katNo < o.enYuksek ? t('j_dustun_asagi', { n: o.enYuksek, k: o.enYuksek - o.katNo }) : t('j_dustun', { n: o.enYuksek });
    kimlik('s-tohum').hidden = o.tohum == null; kimlik('s-tohum').textContent = o.tohum == null ? '' : t('j_kule_no') + ': ' + o.tohum.toString(16);
    kimlik('s-rekor').hidden = !yeniRekor; kimlik('s-kristal').textContent = String(o.alinan.size); listeYaz(kimlik('s-liste'), 5, sonSira, sonMod);
    kimlik('s-hayalet').textContent = hayaletSonuc; kimlik('s-hayalet').hidden = !hayaletSonuc;
  }
}
let kodTohum = 0; // 'kod' kipi: oyuncunun girdiği kule kodu
// Sabit kuleli kipler (günün / haftanın / kod): tohum ve en iyi koşunun (hayalet) kayıt anahtarı.
function kipBilgi(m) {
  if (m === 'hafta') return { tohum: haftalikTohum(), anahtar: haftalikAnahtar(undefined, zk()) };
  if (m === 'kod') return { tohum: kodTohum, anahtar: kodAnahtar(kodTohum, zk()) };
  return { tohum: gunlukTohum(), anahtar: gunlukAnahtar(undefined, zk()) };
}
// Oyun kipleri: 'yeni' (rastgele kule), 'hayalet' (en iyi oyunun kulesi ve yarı saydam kaydı), 'gunun' (bugünün sabit kulesi ve günlük en iyi kaydı).
function basla() {
  let tohum = yeniTohum(), kayit = null;
  if (mod === 'hayalet') { kayit = kayitOku(hayaletAnahtar(zk())); if (kayit) tohum = kayit.tohum; }
  else if (mod === 'gunun' || mod === 'hafta' || mod === 'kod') { const b = kipBilgi(mod); tohum = b.tohum; kayit = kayitOku(b.anahtar); }
  o = yeniOyun(tohum, AYAR.zorluk, AYAR.kaygan); o.kule = AYAR.kule; o.rekorKat = skorListesi(mod, zk()).reduce((m, k) => Math.max(m, k.kat), 0); yeniRekor = false; kaydedici = kayitBaslat();
  hayalet = kayit ? yeniOyun(tohum, AYAR.zorluk, AYAR.kaygan) : null; if (hayalet) hayalet.kule = AYAR.kule; hayaletGiris = kayit ? kayitCozC(kayit) : []; hayaletSonuc = '';
  durumDegistir('oyun', true); // odak tuvale geçer; Space odaktaki düğmeyi tekrar tıklamaz
}
function oyunBitti() {
  const s = skor(o);
  if (s > en) { en = s; yeniRekor = s > 0; try { localStorage.setItem('buzkule.en', String(s)); } catch { /* sessiz */ } }
  const anahtar = mod === 'gunun' || mod === 'hafta' || mod === 'kod' ? kipBilgi(mod).anahtar : hayaletAnahtar(oz(o)), eski = kayitOku(anahtar);
  if (s > (eski ? eski.skor : 0)) kayitYaz(anahtar, kayitBitir(kaydedici, o.tohum, s, o.enYuksek)); // en iyi oyun hayalet olarak saklanır
  hayaletSonuc = hayalet && eski ? (s > eski.skor ? t('j_hayalet_gecti', { n: eski.skor }) : t('j_hayalet_onde', { n: eski.skor })) : '';
  profilGuncelle(o); profilYaz(); sonSira = skorEkle(mod, s, o.enYuksek, oz(o)); sonMod = mod; kristalKazan(o.alinan.size); // toplanan kristaller kalıcı cüzdana eklenir (mağazada harcanır)
  durumDegistir('bitti');
}

// ---- Sekmeler (gösterge: ön kenar önce, arka kenar gecikmeli) ----
const sekmeAdlari = ['oyna', 'magaza', 'basarim', 'ayar', 'nasil'];
const gosterge = kimlik('gosterge');
function gostergeKonumla(hedef, yonSag) {
  const sol = hedef.offsetLeft, sag = hedef.offsetParent ? hedef.offsetParent.clientWidth - hedef.offsetLeft - hedef.offsetWidth : 0;
  gosterge.style.transition = AYAR.azaltilmisHareket ? 'none'
    : yonSag ? 'left 300ms cubic-bezier(.2,.9,.25,1.05) 70ms, right 220ms cubic-bezier(.2,.9,.25,1.05)'
             : 'left 220ms cubic-bezier(.2,.9,.25,1.05), right 300ms cubic-bezier(.2,.9,.25,1.05) 70ms';
  gosterge.style.left = sol + 'px'; gosterge.style.right = sag + 'px'; gosterge.style.width = 'auto';
}
function sekmeSec(ad, odakla) {
  const eskiIdx = sekmeAdlari.indexOf(sekme), yeniIdx = sekmeAdlari.indexOf(ad); sekme = ad;
  for (const a of sekmeAdlari) {
    const dugme = kimlik('t-' + a), sec = a === ad;
    dugme.setAttribute('aria-selected', String(sec)); dugme.tabIndex = sec ? 0 : -1; kimlik('p-' + a).hidden = !sec;
    if (sec) { gostergeKonumla(dugme, yeniIdx >= eskiIdx); if (odakla) dugme.focus(); }
  }
}
for (const a of sekmeAdlari) kimlik('t-' + a).addEventListener('click', () => sekmeSec(a, false));
kimlik('basla').addEventListener('click', basla);
kimlik('tekrar').addEventListener('click', basla);
gostergeKonumla(kimlik('t-oyna'), true);

// ---- Oyun kipi seçici ----
const modDugmeleri = { yeni: kimlik('mod-yeni'), hayalet: kimlik('mod-hayalet'), gunun: kimlik('mod-gunun'), hafta: kimlik('mod-hafta') };
function modYaz() {
  const var_ = !!kayitOku(hayaletAnahtar(zk()));
  if (mod === 'hayalet' && !var_) mod = 'yeni';
  modDugmeleri.hayalet.disabled = !var_;
  for (const [ad, b] of Object.entries(modDugmeleri)) { b.setAttribute('aria-pressed', String(mod === ad)); b.className = 'mod' + (mod === ad ? ' secili' : ''); }
}
for (const [ad, b] of Object.entries(modDugmeleri)) b.addEventListener('click', () => { mod = ad; modYaz(); listeYaz(kimlik('m-liste'), 5, 0); });
modYaz();
// ---- Kule kodu: oyun sonunda görünen kodla aynı kuleyi oynamak (arkadaşla yarış) ----
kimlik('kod-oyna').addEventListener('click', () => {
  const k = kodCoz(kimlik('kod-giris').value), hata = kimlik('kod-hata');
  hata.textContent = k === null ? t('j_kod_gecersiz') : ''; hata.hidden = k !== null;
  if (k === null) return; kodTohum = k; mod = 'kod'; modYaz(); basla();
});
// ---- Özet kartı: oyun sonu özetini panoya kopyalar ----
kimlik('ozet-kopyala').addEventListener('click', () => {
  const b = kimlik('ozet-kopyala'), metin = t('j_ozet_metin', { k: o.enYuksek, s: skor(o), c: o.enIyiKombo, kod: o.tohum == null ? '-' : o.tohum.toString(16) });
  const bitti = () => { b.textContent = t('j_kopyalandi'); setTimeout(() => { b.textContent = t('j_ozet_kopyala'); }, 1600); };
  // Electron kabuğu tüm izin isteklerini reddeder (navigator.clipboard reddedilebilir): reddedilirse kullanıcı tıklamasıyla eski yöntem (geçici metin alanı + execCommand) denenir.
  const eskiYontem = () => { try { const ta = document.createElement('textarea'); ta.value = metin; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); document.body.removeChild(ta); if (ok) bitti(); } catch { /* pano yoksa sessiz */ } };
  try { if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(metin).then(bitti, eskiYontem); else eskiYontem(); } catch { eskiYontem(); }
});
// ---- Zorluk seçici (kolay / orta / zor / çok zor) ----
const zorlukDugmeleri = [0, 1, 2, 3].map((i) => kimlik('zorluk-' + i));
function zorlukYaz() {
  zorlukDugmeleri.forEach((b, i) => { b.setAttribute('aria-pressed', String(AYAR.zorluk === i)); b.className = 'mod' + (AYAR.zorluk === i ? ' secili' : ''); });
  modYaz();
}
zorlukDugmeleri.forEach((b, i) => b.addEventListener('click', () => { AYAR.zorluk = i; ayarKaydet(); zorlukYaz(); listeYaz(kimlik('m-liste'), 5, 0); }));
zorlukYaz();
// ---- Skor tablosu ----
function listeYaz(ol, adet, vurgu, oyunMod = mod) {
  if (!ol) return; ol.textContent = '';
  skorListesi(oyunMod, zk()).slice(0, adet).forEach((kayit, i) => {
    const li = document.createElement('li'), a = document.createElement('span'), b = document.createElement('b');
    a.textContent = t('j_kat') + ' ' + kayit.kat; b.textContent = String(kayit.skor); li.appendChild(a); li.appendChild(b);
    li.className = i + 1 === vurgu ? 'yeni' : ''; ol.appendChild(li);
  });
}
// ---- Başarımlar ----
function basarimYaz() {
  const ol = kimlik('b-liste'); if (!ol) return; ol.textContent = ''; kimlik('b-sayi').textContent = ACIK.size + ' / ' + BASARIMLAR.length;
  for (const b of BASARIMLAR) {
    const li = document.createElement('li'), a = document.createElement('span'), r = document.createElement('b'), acik = ACIK.has(b.id);
    a.textContent = (acik ? '★ ' : '☆ ') + t('b_' + b.id + '_ad') + ' — ' + t('b_' + b.id + '_acik'); r.textContent = acik ? t('j_alindi') : '+' + b.odul + ' ◆';
    li.className = acik ? 'yeni' : ''; li.appendChild(a); li.appendChild(r); ol.appendChild(li);
  }
}
// ---- Kuleler: konsept seçimi (başarımla ya da kristalle açılır; kilitler Ayarlar'dan kapatılabilir) ----
kuleYukle(); kuleDogrula();
const kuleDugmeleri = [];
function kuleYaz() {
  kuleDogrula();
  kuleDugmeleri.forEach(({ b, ad, ek }, i) => {
    const k = KULELER[i], acik = kuleAcikMi(i), secili = AYAR.kule === i;
    ad.textContent = t('j_kule_' + k.id);
    ek.textContent = secili ? t('j_secili') : acik ? t('j_sec') : k.acik.tur === 'basarim' ? '🔒 ' + t('j_kule_basarim', { ad: t('b_' + k.acik.id + '_ad') }) : '🔒 ' + t('j_kule_fiyat', { n: k.acik.fiyat });
    b.className = 'iz' + (secili ? ' secili' : ''); b.setAttribute('aria-pressed', String(secili));
    b.disabled = !acik && !(k.acik.tur === 'kristal' && CUZDAN.kristal >= k.acik.fiyat);
  });
  const m = kimlik('m-kule'); if (m) m.textContent = t('j_kuleler') + ': ' + t('j_kule_' + KULELER[AYAR.kule].id);
}
KULELER.forEach((k, i) => {
  const b = document.createElement('button'), ad = document.createElement('span'), ek = document.createElement('span');
  b.type = 'button'; ad.className = 'iz-ad'; ek.className = 'iz-ek'; b.appendChild(ad); b.appendChild(ek);
  b.addEventListener('click', () => {
    if (!kuleAcikMi(i)) kuleAl(i);
    if (kuleSec(i)) { ayarKaydet(); } kuleYaz(); magazaYaz(); modYaz(); listeYaz(kimlik('m-liste'), 5, 0);
  });
  kimlik('kuleler').appendChild(b); kuleDugmeleri.push({ b, ad, ek });
});
// ---- Mağaza: iz renkleri (kristalle açılır, yalnız görünüm) ----
const izDugmeleri = [];
function magazaYaz() {
  if (typeof kuleYaz === 'function' && kuleDugmeleri.length) kuleYaz();
  kimlik('g-kristal').textContent = String(CUZDAN.kristal); kimlik('m-kristal').textContent = String(CUZDAN.kristal);
  izDugmeleri.forEach(({ b, ek, ad }, i) => {
    const acik = CUZDAN.acik.includes(i), secili = CUZDAN.secili === i;
    b.className = 'iz' + (secili ? ' secili' : ''); b.setAttribute('aria-pressed', String(secili));
    ek.textContent = secili ? t('j_secili') : acik ? t('j_sec') : IZLER[i].fiyat + ' ◆'; ad.textContent = t('iz_' + i);
    b.disabled = !acik && CUZDAN.kristal < IZLER[i].fiyat;
  });
}
IZLER.forEach((iz, i) => {
  const b = document.createElement('button'), ad = document.createElement('span'), ek = document.createElement('span');
  b.type = 'button'; ad.textContent = iz.ad; ad.className = 'iz-ad'; ek.className = 'iz-ek';
  b.appendChild(ad); b.appendChild(ek);
  b.addEventListener('click', () => { if (!CUZDAN.acik.includes(i)) izAl(i); izSec(i); magazaYaz(); });
  kimlik('izler').appendChild(b); izDugmeleri.push({ b, ek, ad });
});
magazaYaz(); listeYaz(kimlik('m-liste'), 5, 0); basarimYaz();

// ---- Ses ve müzik düğmeleri (aç/kapa) ----
function sesDugmeleriYaz() {
  for (const [a, id, ad] of [['efektAcik', 'a-efekt', t('j_efektler')], ['muzikAcik', 'a-muzik', t('j_muzik')], ['golge', 'a-golge', t('j_golge')], ['perde', 'a-perde', t('j_perde')], ['kaygan', 'a-kaygan', t('j_kaygan')], ['hayaletGoster', 'a-hayaletGoster', t('j_hayalet_goster')], ['kontrast', 'a-kontrast', t('j_kontrast')], ['mukemmel', 'a-mukemmel', t('j_mukemmel')], ['kuleKilidi', 'a-kuleKilidi', t('j_kule_kilidi')], ['kuleEfekt', 'a-kuleEfekt', t('j_kule_efekt')]]) {
    const b = kimlik(id), ac = !!AYAR[a]; b.setAttribute('aria-pressed', String(ac)); b.textContent = ad + ': ' + (ac ? t('j_acik') : t('j_kapali')); b.className = 'dugme ikincil ac' + (ac ? ' secili' : '');
  }
}
kimlik('a-efekt').addEventListener('click', () => { AYAR.efektAcik = AYAR.efektAcik ? 0 : 1; ayarKaydet(); sesDugmeleriYaz(); });
for (const [ayar, id] of [['golge', 'a-golge'], ['perde', 'a-perde'], ['kaygan', 'a-kaygan'], ['hayaletGoster', 'a-hayaletGoster'], ['kontrast', 'a-kontrast'], ['mukemmel', 'a-mukemmel'], ['kuleKilidi', 'a-kuleKilidi'], ['kuleEfekt', 'a-kuleEfekt']]) kimlik(id).addEventListener('click', () => {
  AYAR[ayar] = AYAR[ayar] ? 0 : 1; ayarKaydet(); sesDugmeleriYaz();
  if (ayar === 'kuleKilidi') { kuleYaz(); modYaz(); listeYaz(kimlik('m-liste'), 5, 0); }
  if (ayar === 'kaygan') { modYaz(); listeYaz(kimlik('m-liste'), 5, 0); } // kaygan buz skor ve hayalet kayıtlarını ayırır
});
kimlik('a-muzik').addEventListener('click', () => { AYAR.muzikAcik = AYAR.muzikAcik ? 0 : 1; ayarKaydet(); sesDugmeleriYaz(); muzikGuncelle(durum === 'oyun'); });
sesDugmeleriYaz();
// ---- Canlı ayar paneli ----
const ayarAnahtarlari = ['parilti', 'parcacik', 'sarsinti', 'hud', 'ses', 'muzikSes'];
function ayarYaz() {
  for (const a of ayarAnahtarlari) { kimlik('a-' + a).value = String(AYAR[a]); kimlik('o-' + a).textContent = Math.round(AYAR[a] * 100) + '%'; }
}
for (const a of ayarAnahtarlari) {
  kimlik('a-' + a).addEventListener('input', (e) => { AYAR[a] = Number(e.target.value); kimlik('o-' + a).textContent = Math.round(AYAR[a] * 100) + '%'; ayarKaydet(); });
}
kimlik('a-sifirla').addEventListener('click', () => { ayarSifirla(); ayarYaz(); karakterIsaretle(); sesDugmeleriYaz(); muzikGuncelle(false); });
// Karakter seçici (Kenney CC0 beş karakter)
const karakterDugmeleri = [];
function karakterIsaretle() { karakterDugmeleri.forEach((b, i) => { b.setAttribute('aria-pressed', String(AYAR.karakter === i)); b.className = 'karakter' + (AYAR.karakter === i ? ' secili' : ''); }); }
KARAKTERLER.forEach((ad, i) => {
  const b = document.createElement('button'), im = document.createElement('img');
  b.type = 'button'; b.setAttribute('aria-label', t('j_karakter', { ad: t('kar_' + i) })); b.title = t('kar_' + i);
  im.src = './varlik/kenney/karakter/' + ad + '/stand.png'; im.alt = ''; b.appendChild(im);
  b.addEventListener('click', () => { AYAR.karakter = i; ayarKaydet(); karakterIsaretle(); });
  kimlik('karakterler').appendChild(b); karakterDugmeleri.push(b);
});
karakterIsaretle();
ayarYaz();
if (!document.activeElement || document.activeElement === document.body) odakla(kimlik('t-' + sekme)); // açılışta odak menünün ilk düğmesinde
function profilYaz() { const e = kimlik('m-profil'); if (e) e.textContent = PROFIL.oyun ? t('j_profil', { n: PROFIL.oyun, k: PROFIL.enKat, c: PROFIL.enKombo }) : ''; }
profilYukle();
const notYaz = () => { kimlik('a-not').textContent = AYAR.azaltilmisHareket ? t('j_azalt_not') : t('j_ayar_not'); };
// Dil seçici: seçili dil kalıcıdır; değişince menü, ayar düğmeleri ve listeler yeniden yazılır.
const dilSec = kimlik('a-dil');
DILLER.forEach((d, i) => { const op = document.createElement('option'); op.value = String(i); op.textContent = d.ad; dilSec.appendChild(op); });
function dilYenile() {
  dilSec.value = String(AYAR.dil); dilUygula(); profilYaz(); kimlik('ozet-kopyala').textContent = t('j_ozet_kopyala'); // sekme etiketleri değişince genişlikler değişir: gösterge yeniden konumlanır
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => sekmeSec(sekme, false)); notYaz(); sesDugmeleriYaz(); basarimYaz(); magazaYaz(); listeYaz(kimlik('m-liste'), 5, 0);
  karakterDugmeleri.forEach((b, i) => { b.setAttribute('aria-label', t('j_karakter', { ad: t('kar_' + i) })); b.title = t('kar_' + i); });
}
dilSec.addEventListener('change', () => { AYAR.dil = Number(dilSec.value); ayarKaydet(); dilYenile(); });
kimlik('a-sifirla').addEventListener('click', () => dilYenile());
dilYenile();

// ---- Klavye ----
addEventListener('keydown', e => {
  const hedef = e.target && e.target.tagName;
  if (e.code === 'Space' && hedef !== 'BUTTON' && hedef !== 'INPUT') e.preventDefault();
  if (e.code.startsWith('Arrow') && hedef !== 'INPUT') e.preventDefault();
  if (e.repeat) return;
  k[e.code] = 1;
  // Menüde oklar sekme değiştirir; odak panel içindeki bir düğmedeyse (kip, iz, karakter...) oklar o düğmeye bırakılır, yalnız sekme ya da boş alan odaktayken çalışır.
  const sekmede = !!(e.target && e.target.getAttribute && e.target.getAttribute('role') === 'tab');
  if (durum === 'baslik' && hedef !== 'INPUT' && (hedef !== 'BUTTON' || sekmede)) {
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') { const i = sekmeAdlari.indexOf(sekme) + (e.code === 'ArrowRight' ? 1 : -1); sekmeSec(sekmeAdlari[(i + sekmeAdlari.length) % sekmeAdlari.length], true); return; }
    if (sekmede && (e.code === 'Home' || e.code === 'End')) { e.preventDefault(); sekmeSec(sekmeAdlari[e.code === 'Home' ? 0 : sekmeAdlari.length - 1], true); return; }
  }
  if (e.code === 'Space' && hedef !== 'BUTTON' && hedef !== 'INPUT' && (durum === 'bitti' || (durum === 'baslik' && sekme === 'oyna'))) basla();
  if (e.code === 'KeyR' && hedef !== 'INPUT') basla();
  if (e.code === 'KeyM' && hedef !== 'INPUT') { AYAR.muzikAcik = AYAR.muzikAcik ? 0 : 1; ayarKaydet(); sesDugmeleriYaz(); muzikGuncelle(durum === 'oyun'); } // M: müzik aç/kapa
  if (e.code === 'KeyP' && hedef !== 'INPUT') { if (durum === 'oyun') durumDegistir('duraklat'); else if (durum === 'duraklat') durumDegistir('oyun'); }
  if (e.code === 'Escape' && durum === 'duraklat') durumDegistir('baslik');
});
addEventListener('keyup', e => { k[e.code] = 0; });
// Sekme gizlenince ya da pencere odağı gidince oyun sürüyorsa otomatik duraklat; takılı kalan tuşlar bırakılır (yalnız arayüz, simülasyon kuralı değil).
function otoDuraklat() { for (const a in k) k[a] = 0; if (durum === 'oyun') durumDegistir('duraklat'); }
document.addEventListener('visibilitychange', () => { if (document.hidden) otoDuraklat(); });
addEventListener('blur', otoDuraklat);

// ---- Oyun kolu (gamepad): sol çubuk ya da yön tuşları koşar, A zıplar/başlatır, Start duraklatır ----
let oncekiA = false, oncekiStart = false;
function oyunKolu() {
  const bos = { sol: false, sag: false, zipla: false, a: false, start: false };
  if (typeof navigator === 'undefined' || !navigator.getGamepads) return bos;
  const kol = [...navigator.getGamepads()].find(g => g && g.connected); if (!kol) return bos;
  const eksen = kol.axes[0] || 0, dugme = (i) => !!(kol.buttons[i] && kol.buttons[i].pressed);
  return { sol: eksen < -0.4 || dugme(14), sag: eksen > 0.4 || dugme(15), zipla: dugme(0) || dugme(1) || dugme(2) || dugme(3), a: dugme(0), start: dugme(9) };
}

// ---- Döngü ----
function araDeger(g, a) {
  if (g.bitti || a >= 1 || !Number.isFinite(g.px)) return null;
  const s = { x: g.x, y: g.y, kamY: g.kamY };
  g.x = g.px + (s.x - g.px) * a; g.y = g.py + (s.y - g.py) * a; g.kamY = g.pk + (s.kamY - g.pk) * a; return s;
}
function araGeri(g, s) { if (s) { g.x = s.x; g.y = s.y; g.kamY = s.kamY; } }
let onceki = 0, acc = 0; const DT = 20;
function dongu(ms) {
  acc += Math.min(100, ms - onceki); onceki = ms;
  const kol = oyunKolu();
  if (kol.a && !oncekiA && (durum === 'bitti' || (durum === 'baslik' && sekme === 'oyna'))) basla();
  if (kol.start && !oncekiStart) { if (durum === 'oyun') durumDegistir('duraklat'); else if (durum === 'duraklat') durumDegistir('oyun'); }
  oncekiA = kol.a; oncekiStart = kol.start;
  while (acc >= DT) {
    if (durum === 'oyun') {
      const giris = { sol: k.ArrowLeft || kol.sol, sag: k.ArrowRight || kol.sag, zipla: k.Space || kol.zipla };
      kayitEkle(kaydedici, giris); adim(o, giris);
      if (hayalet && !hayalet.bitti) { const b = hayaletGiris[o.kare - 1]; adim(hayalet, b === undefined ? bitGiris(0) : bitGiris(b)); }
      if (o.bitti) oyunBitti(); else basarimKontrol(o);
    }
    bildirimAdim(); acc -= DT;
  }
  c.setTransform(olcek, 0, 0, olcek, 0, 0); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  // Çizim, 50 Hz adımlar arasında ara değerle yapılır (yüksek yenileme hızında takılma olmaz); durum çizimden sonra geri yüklenir.
  const a = durum === 'oyun' ? Math.max(0, Math.min(1, acc / DT)) : 1, s1 = araDeger(o, a), s2 = hayalet ? araDeger(hayalet, a) : null;
  ciz(c, o, hayalet);
  if (durum !== 'baslik') hudCiz(c, o, en, hayalet);
  araGeri(o, s1); if (s2) araGeri(hayalet, s2);
  requestAnimationFrame(dongu);
}
requestAnimationFrame(ms => { onceki = ms; dongu(ms); });

})();