/**
 * data/quran/surah-names-i18n.json üretir (fr, bn, ur).
 * Kaynak: KMF / Hamidullah (fr), বাংলা তাফসীর ইবনে কাসীর (bn), اردو نام (ur).
 */
const fs = require('fs');
const path = require('path');

const FR = `L'Ouverture
La vache
La famille de Imran
Les femmes
La table servie
Les bestiaux
Al-A'raf
Le butin
Le repentir
Jonas
Houd
Joseph
Le tonnerre
Abraham
Al-Hijr
Les abeilles
Le voyage nocturne
La caverne
Marie
Ta-Ha
Les prophètes
Le pèlerinage
Les croyants
La lumière
Le discernement
Les poètes
Les fourmis
Le récit
L'araignée
Les Romains
Luqman
La prosternation
Les clans
Saba
Le Créateur
Ya-Sin
Les rangés
Sad
Les groupes
Le Pardonneur
Les versets détaillés
La consultation
L'ornement
La fumée
L'agenouillée
Al-Ahqaf
Muhammad
La victoire éclatante
Les appartements
Qaf
Qui éparpillent
La montagne
L'étoile
La lune
Le Tout Miséricordieux
L'événement
Le fer
La discussion
L'exode
L'éprouvée
Le rang
Le vendredi
Les hypocrites
La grande perte
Le divorce
L'interdiction
La royauté
La plume
Celle qui montre la vérité
Les voies d'ascension
Noé
Les djinns
L'enveloppé
Le revêtu d'un manteau
La résurrection
L'homme
Les envoyés
La nouvelle
Les anges qui arrachent les âmes
Il s'est renfrogné
L'obscurcissement
La rupture
Les fraudeurs
La déchirure
Les constellations
L'astre nocturne
Le Très-Haut
L'enveloppante
L'aube
La cité
Le soleil
La nuit
Le jour montant
L'ouverture
Le figuier
L'adhérence
La destinée
La preuve
Le tremblement
Les coursiers
Le fracas
La course aux richesses
Le temps
Les calomniateurs
L'éléphant
Les Qoraïch
L'ustensile
L'abondance
Les infidèles
Le secours
Les fibres
Le monothéisme pur
L'aube naissante
Les hommes`.split('\n');

const BN = `আল-ফাতিহাহ
আল-বাকারাহ
আল-ই-ইমরান
নিসা
আল-মায়িদাহ
আল-আনআম
আল-আ'রাফ
আল-আনফাল
আত-তাওবাহ
ইউনুস
হুদ
ইউসুফ
আর-রা'দ
ইব্রাহীম
আল-হিজর
আন-নাহল
আল-ইসরা
আল-কাহফ
মারইয়াম
তা-হা
আল-আম্বিয়া
আল-হাজ্জ
আল-মু'মিনুন
আন-নূর
আল-ফুরকান
আশ-শুআরা
আন-নামল
আল-কাসাস
আল-আনকাবুত
আর-রূম
লুকমান
আস-সাজদাহ
আল-আহযাব
সাবা
ফাতির
ইয়া-সীন
আস-সাফফাত
সাদ
আয-যুমার
গাফির
ফুসসিলাত
আশ-শূরা
আয-যুখরুফ
আদ-দুখান
আল-জাসিয়াহ
আল-আহকাফ
মুহাম্মাদ
আল-ফাতহ
আল-হুজুরাত
কাফ
আয-যারিয়াত
আত-তূর
আন-নাজম
আল-কামার
আর-রাহমান
আল-ওয়াকি'আহ
আল-হাদীদ
আল-মুজাদিলাহ
আল-হাশর
আল-মুমতাহিনাহ
আস-সাফ
আল-জুমুআহ
আল-মুনাফিকুন
আত-তাগাবুন
আত-তালাক
আত-তাহরীম
আল-মুলক
আল-কালাম
আল-হাক্কাহ
আল-মাআরিজ
নূহ
আল-জিন
আল-মুযযাম্মিল
আল-মুদ্দাস্সির
আল-কিয়ামাহ
আল-ইনসান
আল-মুরসালাত
আন-নাবা
আন-নাযি'আত
আবাসা
আত-তাকবীর
আল-ইনফিতার
আল-মুতাফফিফীন
আল-ইনশিকাক
আল-বুরুজ
আত-তারিক
আল-আ'লা
আল-গাশিয়াহ
আল-ফজর
আল-বালাদ
আশ-শামস
আল-লাইল
আদ-দুহা
আশ-শারহ
আত-তীন
আল-আলাক
আল-কাদর
আল-বাইয়িনাহ
আয-যিলযাল
আল-আদিয়াত
আল-কারি'আহ
আত-তাকাসুর
আল-আসর
আল-হুমাযাহ
আল-ফীল
কুরাইশ
আল-মাউন
আল-কাওসার
আল-কাফিরুন
আন-নাসর
আল-মাসাদ
আল-ইখলাস
আল-ফালাক
আন-নাস`.split('\n');

const UR = `الفاتحہ
البقرہ
آل عمران
النساء
المائدہ
الانعام
الاعراف
الانفال
التوبہ
یونس
ہود
یوسف
الرعد
ابراہیم
الحجر
النحل
الاسراء
الکہف
مریم
طہ
الانبیاء
الحج
المؤمنون
النور
الفرقان
الشعراء
النمل
القصص
العنکبوت
الروم
لقمان
السجدہ
الاحزاب
سبا
فاطر
یس
الصافات
ص
الزمر
غافر
فصلت
الشوری
الزخرف
الدخان
الجاثیہ
الاحقاف
محمد
الفتح
الحجرات
ق
الذاریات
الطور
النجم
القمر
الرحمن
الواقعہ
الحدید
المجادلہ
الحشر
الممتحنہ
الصف
الجمعہ
المنافقون
التغابن
الطلاق
التحریم
الملک
القلم
الحاقہ
المعارج
نوح
الجن
المزمل
المدثر
القیامہ
الانسان
المرسلات
النبا
النازعات
عبس
التکویر
الانفطار
المطففین
الانشقاق
البروج
الطارق
الاعلی
الغاشیہ
الفجر
البلد
الشمس
اللیل
الضحی
الشرح
التین
العلق
القدر
البینہ
الزلزلہ
العادیات
القارعہ
التکاثر
العصر
الہمزہ
الفیل
قریش
الماعون
الکوثر
الکافرون
النصر
المسد
الاخلاص
الفلق
الناس`.split('\n');

if (FR.length !== 114 || BN.length !== 114 || UR.length !== 114) {
    throw new Error(`Expected 114 names, got fr=${FR.length} bn=${BN.length} ur=${UR.length}`);
}

const out = [];
for (let i = 0; i < 114; i++) {
    out.push({ n: i + 1, fr: FR[i], bn: BN[i], ur: UR[i] });
}

const dest = path.join(__dirname, '..', 'data', 'quran', 'surah-names-i18n.json');
fs.writeFileSync(dest, JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log('Wrote', dest);
