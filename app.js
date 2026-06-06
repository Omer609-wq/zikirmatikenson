import { applyNativeBottomInsetVar, isCapacitorNative, syncNativeDailyReminder } from './native-reminders.js';
import {
    clearUpdateBannerDom,
    placeUpdateBanner,
    refreshUpdateBannerConfig
} from './update-banner.js';
import { applyNativeStatusBarTheme } from './status-bar-theme.js';
import { runCounterVibration, runDragReorderNudge } from './haptics.js';
import { pickRandomQuote, REMINDER_FIXED_BODY } from './quotes.js';
import { ESMA_DEFAULT_FAZILET } from './esma-fazilet.js';

// ===================== DATA MODELS =====================
const DEFAULT_FOLDERS = [
    { id: 'f_default', name: 'Varsayılan Zikirler' },
    { id: 'f_esma', name: 'Esma\'ül Hüsna' }
];

const ESMA_LIST = [
    // Meanings: https://www.esmaulhusna.gen.tr/esmaul-husna.html
    // Targets (ebced/zikir adedi): https://www.esmaulhusna.gen.tr/ebced-hesabi-esmaul-husna.html
    { name: "Yâ Allah", target: 66, meaning: "Eşi benzeri olmayan, Tek ilah, isimlerin sultanı" },
    { name: "Yâ Rahman", target: 298, meaning: "Tüm yaratılanlara merhamet eden" },
    { name: "Yâ Rahîm", target: 258, meaning: "Ahirette inananlara sonsuz ihsan, ikram ve lütufta bulunan" },
    { name: "Yâ Melik", target: 91, meaning: "Tüm evrenin sahibi, saltanatı ve mülkü sürekli olan" },
    { name: "Yâ Kuddûs", target: 170, meaning: "Tüm eksikliklerden uzak" },
    { name: "Yâ Selâm", target: 131, meaning: "Tüm tehlikelerden selamete çıkaran" },
    { name: "Yâ Mü'min", target: 137, meaning: "Koruyan, Güvenilen" },
    { name: "Yâ Müheymin", target: 145, meaning: "Her şeyi gören ve gözeten" },
    { name: "Yâ Azîz", target: 94, meaning: "Her şeyin galibi ve izzet sahibi olan" },
    { name: "Yâ Cebbâr", target: 206, meaning: "Kudret sahibi olan" },
    { name: "Yâ Mütekebbir", target: 662, meaning: "Eşi benzeri olmayan büyüklükte olan" },
    { name: "Yâ Hâlik", target: 731, meaning: "Yaratan" },
    { name: "Yâ Bârî", target: 214, meaning: "Kusursuz ve eksiksiz yaratan" },
    { name: "Yâ Musavvir", target: 336, meaning: "Tüm varlıklara şekil veren" },
    { name: "Yâ Gaffâr", target: 1281, meaning: "Mağfireti bol olan" },
    { name: "Yâ Kahhâr", target: 306, meaning: "Her şeye hâkim olan" },
    { name: "Yâ Vehhâb", target: 196, meaning: "Karşılıksız veren" },
    { name: "Yâ Rezzâk", target: 308, meaning: "Rızık veren" },
    { name: "Yâ Fettâh", target: 489, meaning: "Dardan kurtaran" },
    { name: "Yâ Alîm", target: 150, meaning: "Her şeyi bilen ve gören" },
    { name: "Yâ Kâbıd", target: 903, meaning: "Dilediğine darlık verme gücü olan" },
    { name: "Yâ Bâsıt", target: 72, meaning: "İstediğine bolluk veren" },
    { name: "Yâ Hâfıd", target: 1481, meaning: "Kafirleri alçaltan" },
    { name: "Yâ Râfi'", target: 351, meaning: "İnananları yükselten" },
    { name: "Yâ Mu'izz", target: 117, meaning: "Aziz kılan, dilediğini yücelten" },
    { name: "Yâ Müzill", target: 770, meaning: "Dilediğini değersiz kılan" },
    { name: "Yâ Semî'", target: 180, meaning: "Her şeyi duyan" },
    { name: "Yâ Basîr", target: 112, meaning: "Her şeyi gören" },
    { name: "Yâ Hakem", target: 68, meaning: "Mutlak hakimiyete sahip olan" },
    { name: "Yâ 'Adl", target: 104, meaning: "Adil olan" },
    { name: "Yâ Latîf", target: 129, meaning: "Kullarına değer veren" },
    { name: "Yâ Habîr", target: 812, meaning: "Her şeyi bilen" },
    { name: "Yâ Halîm", target: 88, meaning: "Ceza verirken acele etmeyen" },
    { name: "Yâ Azîm", target: 1020, meaning: "Tek Yüce olan" },
    { name: "Yâ Gafûr", target: 1286, meaning: "Affedici olan" },
    { name: "Yâ Şekûr", target: 526, meaning: "Az amelde bile çok sevap veren" },
    { name: "Yâ Aliyy", target: 110, meaning: "Derecesi en Yüce olan" },
    { name: "Yâ Kebîr", target: 232, meaning: "Büyük olan" },
    { name: "Yâ Hafîz", target: 998, meaning: "Koruyan" },
    { name: "Yâ Mukît", target: 550, meaning: "Yaratılana rızkını veren" },
    { name: "Yâ Hasîb", target: 80, meaning: "Hesaba alan" },
    { name: "Yâ Celîl", target: 5329, meaning: "Yüksek sıfatları olan" },
    { name: "Yâ Kerîm", target: 270, meaning: "İkram eden" },
    { name: "Yâ Rakîb", target: 312, meaning: "Gören ve gözeten" },
    { name: "Yâ Mücîb", target: 3025, meaning: "Dualarını kabul eden" },
    { name: "Yâ Vâsi'", target: 137, meaning: "Rahmeti ve ilmi bol olan" },
    { name: "Yâ Hakîm", target: 6084, meaning: "Hikmetli" },
    { name: "Yâ Vedûd", target: 400, meaning: "Kullarını seven" },
    { name: "Yâ Mecîd", target: 3249, meaning: "Şerefi yüksek olan" },
    { name: "Yâ Bâ'is", target: 573, meaning: "Ölmüş olanları dirilten" },
    { name: "Yâ Şehîd", target: 319, meaning: "Her zaman ve her yerde hazır olan" },
    { name: "Yâ Hakk", target: 108, meaning: "Hakkı gösteren" },
    { name: "Yâ Vekîl", target: 66, meaning: "Tevekkül edenlerin işlerini yoluna koyan" },
    { name: "Yâ Kaviyy", target: 116, meaning: "Kudretli" },
    { name: "Yâ Metîn", target: 500, meaning: "Güçlü olan" },
    { name: "Yâ Veliyy", target: 2116, meaning: "İnananlara dost olan" },
    { name: "Yâ Hamîd", target: 3844, meaning: "Övgüye layık olan" },
    { name: "Yâ Muhsî", target: 148, meaning: "Tüm varlıkların sayısını bilen" },
    { name: "Yâ Mübdî", target: 57, meaning: "Yoktan var eden" },
    { name: "Yâ Mu'îd", target: 124, meaning: "Öldüren ve sonrasında tekrar dirilten" },
    { name: "Yâ Muhyî", target: 68, meaning: "Dirilten, can veren" },
    { name: "Yâ Mümît", target: 490, meaning: "Öldüren" },
    { name: "Yâ Hayy", target: 324, meaning: "Sonsuz hayata sahip olan" },
    { name: "Yâ Kayyûm", target: 156, meaning: "Varlıkları ayakta tutan" },
    { name: "Yâ Vâcid", target: 196, meaning: "İstediğini her zaman bulan" },
    { name: "Yâ Mâcid", target: 2304, meaning: "Şanı yüce olan" },
    { name: "Yâ Vâhid", target: 3669, meaning: "Eşi benzeri olmayan" },
    { name: "Yâ Samed", target: 134, meaning: "Muhtaç olunan" },
    { name: "Yâ Kâdir", target: 305, meaning: "Kudretli" },
    { name: "Yâ Muktedir", target: 774, meaning: "Her şeye gücü yeten" },
    { name: "Yâ Mukaddim", target: 184, meaning: "İstediğini yükselten" },
    { name: "Yâ Mu'ahhir", target: 847, meaning: "Dilediğini geri bırakan" },
    { name: "Yâ Evvel", target: 37, meaning: "Ezeli" },
    { name: "Yâ Âhir", target: 801, meaning: "Ebedi" },
    { name: "Yâ Zâhir", target: 1106, meaning: "Varlığı açık olan" },
    { name: "Yâ Bâtın", target: 62, meaning: "Mahiyeti gizli olan" },
    { name: "Yâ Vâlî", target: 47, meaning: "Sahip olan" },
    { name: "Yâ Müteâlî", target: 551, meaning: "Yüce" },
    { name: "Yâ Berr", target: 202, meaning: "İyiliği bol olan" },
    { name: "Yâ Tevvâb", target: 409, meaning: "Günahları affeden" },
    { name: "Yâ Müntekîm", target: 630, meaning: "İntikam alan" },
    { name: "Yâ Afüvv", target: 156, meaning: "Affeden" },
    { name: "Yâ Raûf", target: 287, meaning: "Merhametli olan" },
    { name: "Yâ Mâlikü'l-Mülk", target: 212, meaning: "Tüm varlıkların sahibi olan" },
    { name: "Yâ Zü'l-Celâli ve'l-İkrâm", target: 1155, meaning: "Celal ve ikram sahibi" },
    { name: "Yâ Muksit", target: 209, meaning: "Adaletli olan" },
    { name: "Yâ Câmi'", target: 114, meaning: "Mahşer günü bir araya toplayan" },
    { name: "Yâ Ganî", target: 1060, meaning: "Kimseye muhtaç olmayan" },
    { name: "Yâ Muğnî", target: 1100, meaning: "Müstahni" },
    { name: "Yâ Mâni'", target: 161, meaning: "İstediği bir şeye mâni olan" },
    { name: "Yâ Dârr", target: 1001, meaning: "İstediğine zarar veren" },
    { name: "Yâ Nâfi'", target: 201, meaning: "İstediğine fayda veren" },
    { name: "Yâ Nûr", target: 256, meaning: "Alemi aydınlatan" },
    { name: "Yâ Hâdî", target: 400, meaning: "Hidayet sahibi" },
    { name: "Yâ Bedî'", target: 86, meaning: "Benzersiz yaratan" },
    { name: "Yâ Bâkî", target: 113, meaning: "Ebedi" },
    { name: "Yâ Vâris", target: 707, meaning: "Tüm her şeyin tek sahibi" },
    { name: "Yâ Reşîd", target: 514, meaning: "Yol gösteren" },
    { name: "Yâ Sabûr", target: 298, meaning: "Ceza vermek için acele etmeyen" }
];

/** Esma sırası ESMA_LIST ile birebir aynı olmalı (99 adet). */
const ESMA_ARABIC = [].concat(
    ["يَا اللَّهُ", "يَا رَحْمَنُ", "يَا رَحِيمُ", "يَا مَلِكُ", "يَا قُدُّوسُ", "يَا سَلَامُ", "يَا مُؤْمِنُ", "يَا مُهَيْمِنُ", "يَا عَزِيزُ", "يَا جَبَّارُ", "يَا مُتَكَبِّرُ", "يَا خَالِقُ", "يَا بَارِئُ", "يَا مُصَوِّرُ", "يَا غَفَّارُ", "يَا قَهَّارُ", "يَا وَهَّابُ", "يَا رَزَّاقُ", "يَا فَتَّاحُ", "يَا عَلِيمُ"],
    ["يَا قَابِضُ", "يَا بَاسِطُ", "يَا خَافِضُ", "يَا رَافِعُ", "يَا مُعِزُّ", "يَا مُذِلُّ", "يَا سَمِيعُ", "يَا بَصِيرُ", "يَا حَكَمُ", "يَا عَدْلُ", "يَا لَطِيفُ", "يَا خَبِيرُ", "يَا حَلِيمُ", "يَا عَظِيمُ", "يَا غَفُورُ", "يَا شَكُورُ", "يَا عَلِيُّ", "يَا كَبِيرُ", "يَا حَفِيظُ", "يَا مُقِيتُ"],
    ["يَا حَسِيبُ", "يَا جَلِيلُ", "يَا كَرِيمُ", "يَا رَقِيبُ", "يَا مُجِيبُ", "يَا وَاسِعُ", "يَا حَكِيمُ", "يَا وَدُودُ", "يَا مَجِيدُ", "يَا بَاعِثُ", "يَا شَهِيدُ", "يَا حَقُّ", "يَا وَكِيلُ", "يَا قَوِيُّ", "يَا مَتِينُ", "يَا وَلِيُّ", "يَا حَمِيدُ", "يَا مُحْصِي", "يَا مُبْدِئُ", "يَا مُعِيدُ"],
    ["يَا مُحْيِي", "يَا مُمِيتُ", "يَا حَيُّ", "يَا قَيُّومُ", "يَا وَاجِدُ", "يَا مَاجِدُ", "يَا وَاحِدُ", "يَا صَمَدُ", "يَا قَادِرُ", "يَا مُقْتَدِرُ", "يَا مُقَدِّمُ", "يَا مُؤَخِّرُ", "يَا أَوَّلُ", "يَا آخِرُ", "يَا ظَاهِرُ", "يَا بَاطِنُ", "يَا وَالِي", "يَا مُتَعَالِي", "يَا بَرُّ", "يَا تَوَّابُ"],
    ["يَا مُنْتَقِمُ", "يَا عَفُوُّ", "يَا رَؤُوفُ", "يَا مَالِكَ الْمُلْكِ", "يَا ذَا الْجَلَالِ وَالْإِكْرَامِ", "يَا مُقْسِطُ", "يَا جَامِعُ", "يَا غَنِيُّ", "يَا مُغْنِي", "يَا مَانِعُ", "يَا ضَارُّ", "يَا نَافِعُ", "يَا نُورُ", "يَا هَادِي", "يَا بَدِيعُ", "يَا بَاقِي", "يَا وَارِثُ", "يَا رَشِيدُ", "يَا صَبُورُ"]
);
ESMA_LIST.forEach((e, i) => { e.arabic = ESMA_ARABIC[i] || ''; });
ESMA_DEFAULT_FAZILET.forEach((text, i) => {
    if (ESMA_LIST[i]) ESMA_LIST[i].fazilet = text;
});

const DEFAULT_ZIKIR_ARABIC_BY_ID = {
    z_1: 'سُبْحَانَ اللَّهِ',
    z_2: 'الْحَمْدُ لِلَّهِ',
    z_3: 'اللَّهُ أَكْبَرُ',
    z_4: 'لَا إِلَهَ إِلَّا اللَّهُ'
};

const DEFAULT_ZIKIRS = [
    { id: 'z_1', folderId: 'f_default', name: 'Subhanallah', arabic: DEFAULT_ZIKIR_ARABIC_BY_ID.z_1, target: 33, meaning: 'Allah her türlü eksiklikten münezzehtir.', count: 0, lastClicked: 0 },
    { id: 'z_2', folderId: 'f_default', name: 'Elhamdülillah', arabic: DEFAULT_ZIKIR_ARABIC_BY_ID.z_2, target: 33, meaning: "Hamd Allah'adır.", count: 0, lastClicked: 0 },
    { id: 'z_3', folderId: 'f_default', name: 'Allahü Ekber', arabic: DEFAULT_ZIKIR_ARABIC_BY_ID.z_3, target: 33, meaning: 'Allah en büyüktür.', count: 0, lastClicked: 0 },
    { id: 'z_4', folderId: 'f_default', name: 'La ilahe illallah', arabic: DEFAULT_ZIKIR_ARABIC_BY_ID.z_4, target: 100, meaning: "Allah'tan başka ilah yoktur.", count: 0, lastClicked: 0 }
];

ESMA_LIST.forEach((esma, index) => {
    DEFAULT_ZIKIRS.push({
        id: 'z_e_' + index, folderId: 'f_esma',
        name: esma.name, arabic: esma.arabic || '', target: esma.target, meaning: esma.meaning,
        count: 0, lastClicked: 0
    });
});

// category: 'dua' | 'zikir' — UI’da yalnızca bu iki sekme var.
// name: kart başlığı ve klasöre eklenince görünen isim (dua/zikir metni).
// context: fazilet / okunma durumu (dua ve zikirde kart + detayda aynı blok; kartta kısaltılır).
// Arama: name, meaning, context, source, keywords.
//
// ——— Kütüphane editoryal standardı (yeni dua/zikir eklerken zorunlu) ———
// Yanlış bilgi kullanıcıyı yanıltır; aşağıdakilere özellikle dikkat et:
// - meaning: Arapça/Türkçe karşılık doğru ve sade; kaynak metne dayan.
// - context (fazilet, ne zaman/nasıl): Rivayet veya muteber özet; “kesin vaat” iddiasından kaçın.
//   Birden fazla rivayet varsa kısaca belirt veya “yaygın rivayette…” de.
// - source: Mümkünse kitap/bab veya güvenilir derleme (ör. Nevevî Ezkar); şüpheliyse ekleme veya “kaynak tartışmalı” notu düş.
// - target: Tek doğru sayı çoğu metinde yoktur. Bilinen rivayette geçen sayıyı (ör. üçer defa) kullan;
//   genel tesbih (33/100) sadece o rivayetle uyumluysa. Uygun değilse target’ı düşük tut ve context’te açıkla.
// - keywords: Arama için; dini hüküm iddiası taşımasın.
const ZIKIR_LIBRARY = [
    {
        id: 'lib_d_tuvalet_giris', category: 'dua',
        name: 'Allahümme innî eûzü bike minel hubsi vel habâisi',
        meaning: 'Ya Allah, pislikten ve pis varlıklardan Sana sığınıyorum.',
        context: 'Tuvalete, helaya veya abdesthane gibi mahrem yere girilmeden önce okunur; Allah\'a sığınmak sünnettir.',
        source: 'Buhari, Vudu 23; Müslim, Taharet 16',
        target: 1,
        keywords: 'tuvalet hela wc lavabo abdesthane tuvalete mahrem hijyen'
    },
    {
        id: 'lib_d_tuvalet_cikis', category: 'dua',
        name: 'Ğufreâneke',
        meaning: 'Affını dilerim.',
        context: 'Tuvaletten veya heladan çıkarken okunur; kulun affını dilemesi edeptir.',
        source: 'Ebu Davud, Taharet 7; Tirmizi, Daavat 22',
        target: 1,
        keywords: 'tuvalet hela wc çıkış affetme'
    },
    {
        id: 'lib_d_eve_giris', category: 'dua',
        name: 'Allahümme inni esa\'elüke hayral mühlı ve hayral mahrı',
        meaning: 'Ya Allah, gireceğim yerin hayrını ve çıkacağım yerin hayrını Senden dilerim.',
        context: 'Eve, iş yerine veya misafirliğe kapıdan girerken; giriş ve çıkışın hayrını dilemek sünnettir.',
        source: 'Müslim, Salat 65; Ebu Davud, Edeb 101',
        target: 1,
        keywords: 'ev kapı giriş misafir iş yeri besmele'
    },
    {
        id: 'lib_d_yemek_once', category: 'dua',
        name: 'Bismillâh',
        meaning: 'Allah\'ın adıyla.',
        context: 'Yemeğe başlarken; besmele ile başlamak bereket ve şükür içindir.',
        source: 'Tirmizi, Daavat 14',
        target: 1,
        keywords: 'yemek sofra yemekten önce başlangıç'
    },
    {
        id: 'lib_d_yemek_sonra', category: 'dua',
        name: 'Elhamdülillâhillezî et\'amenâ ve sekânâ',
        meaning: 'Bizi yediren ve içiren Allah\'a hamd olsun.',
        context: 'Yemek bitince şükür ve hamd için; nimeti veren Allah\'a hamdetmek sünnettir.',
        source: 'Tirmizi, Daavat 11; Ebu Davud, At\'ime 13',
        target: 1,
        keywords: 'yemek sofra bitiş şükür hamd'
    },
    {
        id: 'lib_d_arac', category: 'dua',
        name: 'Sübhânellezî sehhara lenâ hâzâ',
        meaning: 'Bunu bizim emrimize veren Allah\'ı tesbih ederim.',
        context: 'Binek veya araca (otobüs, araba vb.) binildiğinde; yolculukta Allah\'ı anmak tavsiye edilir.',
        source: 'Müslim, Hac 15',
        target: 1,
        keywords: 'araç araba otobüs yolculuk binek seyahat'
    },
    {
        id: 'lib_d_uyku', category: 'dua',
        name: 'Bismike Allahümme ehya ve emût',
        meaning: 'Ey Allah\'ım! Senin adınla yaşarım ve ölürüm (uyurum).',
        context: 'Uyumadan önce yatağa yatınca; geceyi Allah\'a emanet etmek sünnettir.',
        source: 'Buhari, Daavat 11',
        target: 1,
        keywords: 'uyku yatmak gece yatak'
    },
    {
        id: 'lib_d_uyaninca', category: 'dua',
        name: 'Elhamdülillâhillezî ahyânâ ba\'de mâ emâtenâ ve ileyhin-nüşûr',
        meaning: 'Bizi ölüm gibi uyku sonrası dirilten Allah\'a hamd olsun; dönüş O\'nadır.',
        context: 'Sabah uyandığında, gözü açınca; uyku nimetine şükür ve güne Allah\'la başlamak için.',
        source: 'İmâm Nevevî, El-Ezkar (el-Adhkâr)',
        target: 1,
        keywords: 'sabah uyanmak göz gece gündüz şükür'
    },
    {
        id: 'lib_d_evden_cikis', category: 'dua',
        name: 'Bismillâhi tevekkeltü alallâhi, lâ havle ve lâ kuvvete illâ billâh',
        meaning: 'Allah\'ın adıyla; Allah\'a tevekkül ettim. Güç ve kuvvet ancak Allah\'tandır.',
        context: 'Evden, işten veya güvenli bir yerden çıkarken; yol ve iş için Allah\'a dayanmak içindir.',
        source: 'İmâm Nevevî, El-Ezkar (el-Adhkâr)',
        target: 1,
        keywords: 'ev çıkış kapı iş yol günlük tevekkül'
    },
    {
        id: 'lib_d_yeni_elbise', category: 'dua',
        name: 'Elhamdülillâhillezî kezâni hâzâ ve mâ kuntu muahhıran bi hâzâ',
        meaning: 'Bunu bana giydiren ve onsuz güç yetiremeyeceğim şeyi bana veren Allah\'a hamd olsun.',
        context: 'Yeni elbise veya örtü giyildiğinde; nimete şükür ve israf etmemeyi hatırlamak için.',
        source: 'İmâm Nevevî, El-Ezkar (el-Adhkâr)',
        target: 1,
        keywords: 'elbise kıyafet giyinmek yeni örtü'
    },
    {
        id: 'lib_d_ayna', category: 'dua',
        name: 'Allâhümme kemâ hassente halkî fehassin hulûkî',
        meaning: 'Ya Allah, dış görünüşümü güzel yaptığın gibi ahlâkımı da güzelleştir.',
        context: 'Aynaya bakıldığında; suret nimetine şükür ve iç güzelliği dilemek için.',
        source: 'İmâm Nevevî, El-Ezkar (el-Adhkâr)',
        target: 1,
        keywords: 'ayna suret yüz ahlâk şükür'
    },
    {
        id: 'lib_d_cami_giris', category: 'dua',
        name: 'Allâhümmeftah li ebvâbe rahmetik',
        meaning: 'Ya Allah, bana rahmetinin kapılarını aç.',
        context: 'Cami veya mescide girerken; ibadet yeri saygısı ve mağfiret ümidiyle.',
        source: 'İmâm Nevevî, El-Ezkar (el-Adhkâr)',
        target: 1,
        keywords: 'cami mescid giriş kapı namaz'
    },
    {
        id: 'lib_d_cami_cikis', category: 'dua',
        name: 'Allâhümme innî es\'elüke min fadlik',
        meaning: 'Ya Allah, Senin lütfundan (fadlından) Senden dilerim.',
        context: 'Cami veya mescidden çıkarken; ibadet sonrası hayır ve mağfiret dilemek için.',
        source: 'İmâm Nevevî, El-Ezkar (el-Adhkâr)',
        target: 1,
        keywords: 'cami mescid çıkış namaz hayır'
    },
    {
        id: 'lib_d_kabir', category: 'dua',
        name: 'Esselâmu aleykum ehle diyârin minel mü\'minîne vel müslimîn',
        meaning: 'Ey bu diyarın mümin ve Müslüman halkı, size selâm olsun.',
        context: 'Kabristana girildiğinde veya mezarlıkta; ölülere selâm ve ahiret hatırlatması için.',
        source: 'İmâm Nevevî, El-Ezkar (el-Adhkâr)',
        target: 1,
        keywords: 'kabir mezarlık ölü ziyaret ahiret'
    },
    {
        id: 'lib_d_kotu_ruya', category: 'dua',
        name: 'Na\'ûzü billâhi min şerri hâzâ ve min şerri mâ fîh',
        meaning: 'Bunun şerrinden ve içindeki şeylerin şerrinden Allah\'a sığınırım.',
        context: 'Rüyada kötü bir şey görülüp uyanınca; şer ve vesveseden Allah\'a sığınmak için.',
        source: 'İmâm Nevevî, El-Ezkar (el-Adhkâr)',
        target: 1,
        keywords: 'rüya uyku korku şer sığınma'
    },
    {
        id: 'lib_d_olum_haberi', category: 'dua',
        name: 'İnnâ lillâhi ve innâ ileyhi râciûn, Allâhümme\'curnî fî musîbetî ve\'hturni hayren minhâ',
        meaning: 'Biz Allah\'a aidiz ve O\'na döneceğiz. Ya Allah, musibetimde bana mükâfat yaz ve ondan hayırlı bir çıkış nasip et.',
        context: 'Ölüm veya büyük kayıp haberi işitilince; sabır ve karşılık dilemek için (ayet ve dua birlikte anılır).',
        source: 'İmâm Nevevî, El-Ezkar (el-Adhkâr)',
        target: 1,
        keywords: 'ölüm musibet kayıp sabır taziye'
    },
    {
        id: 'lib_d_yagmur_isteme', category: 'dua',
        name: 'Allâhümme eskıb seyyiban nâfi\'an',
        meaning: 'Ya Allah, bize faydalı bir yağmur yağdır.',
        context: 'Kuraklık veya yağmura ihtiyaç duyulduğunda çıplak veya hafif örtülü kıbleye dönerek dua edilir (sünnet adabına göre).',
        source: 'İmâm Nevevî, El-Ezkar (el-Adhkâr)',
        target: 1,
        keywords: 'yağmur kuraklık tarla çiftçi su isteme'
    },
    {
        id: 'lib_d_yagmur_yagarken', category: 'dua',
        name: 'Allâhümme sevvibenâ mâren mübâreken',
        meaning: 'Ya Allah, bize bereketli bir yağmur yağdır.',
        context: 'Yağmur yağmaya başlayınca; nimete şükür ve bereket dilemek için.',
        source: 'İmâm Nevevî, El-Ezkar (el-Adhkâr)',
        target: 1,
        keywords: 'yağmur gök yağış şükür bereket'
    },
    {
        id: 'lib_d_sikinti_yunus', category: 'dua',
        name: 'Lâ ilâhe illâ ente sübhâneke innî küntü minez-zâlimîn',
        meaning: 'Senden başka ilah yok; Seni noksan sıfatlardan tenzih ederim; ben zulmedenlerden oldum.',
        context: 'Sıkıntı, korku veya ümitsizlik anında; Yunus (a.s.) duası olarak kalbi Allah\'a yönlendirmek için.',
        source: 'İmâm Nevevî, El-Ezkar (el-Adhkâr)',
        target: 1,
        keywords: 'sıkıntı dert korku ümit tevekkül gemi'
    },
    {
        id: 'lib_d_ilim', category: 'dua',
        name: 'Rabbi zidnî ilmen nâfi\'an ve fehmen vâsian',
        meaning: 'Rabbim, bana faydalı ilim ve geniş bir anlayış artır.',
        context: 'Ders, Kur\'an okuma veya işe başlarken; ilim ve hikmet dilemek için.',
        source: 'İmâm Nevevî, El-Ezkar (el-Adhkâr)',
        target: 1,
        keywords: 'ilim ders okul Kuran çalışma hikmet'
    },
    {
        id: 'lib_1', category: 'zikir',
        name: 'Sübhanallahi ve bihamdihi',
        arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
        meaning: 'Allah\'ı noksan sıfatlardan tenzih eder, O\'na hamdederim',
        context: 'Günde yüz defa okuyanın günahları deniz köpüğü kadar olsa affedilir. Gün içinde istenen sıklıkta tekrarlanır.',
        source: 'Buhari, Daavat 65; Müslim, Zikir 28',
        target: 100,
        keywords: 'günah mağfiret günlük tesbih bağışlanma'
    },
    {
        id: 'lib_2', category: 'zikir',
        name: 'Hasbünallahü ve ni\'mel vekil',
        arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
        meaning: 'Allah bize yeter; O ne güzel vekildir.',
        context: 'Ayette geçer; sıkıntı ve korkuda kalbe huzur ve tevekkül verir. Zor anlarda okunması tavsiye edilir.',
        source: 'Kur\'an-ı Kerim, Al-i İmran: 173',
        target: 100,
        keywords: 'sıkıntı dert korku güven tevekkül ayet'
    },
    {
        id: 'lib_3', category: 'zikir',
        name: 'Elhamdülillah',
        arabic: 'الْحَمْدُ لِلَّهِ',
        meaning: 'Hamd (şükür ve övgü) Allah\'a mahsustur.',
        context: 'Mizanı ağırlatır, kalbi Allah\'a bağlar. Şükür ve günlük zikir olarak her an okunabilir.',
        source: 'Müslim, Taharet 1',
        target: 33,
        keywords: 'şükür hamd nimet mizan'
    },
    {
        id: 'lib_4', category: 'zikir',
        name: 'Lâ ilâhe illallah',
        arabic: 'لَا إِلَهَ إِلَّا اللَّهُ',
        meaning: 'Allah\'tan başka ilah yoktur.',
        context: 'Tevhid şuuru pekişir; sünnete uygun tekrarı faziletlidir. Sık tekrarlanan tevhid zikridir.',
        source: 'Hadis kaynakları (çeşitli rivayetler)',
        target: 100,
        keywords: 'tevhid kelime-i tevhid iman'
    },
    {
        id: 'lib_5', category: 'zikir',
        name: 'Allahu ekber',
        arabic: 'اللَّهُ أَكْبَرُ',
        meaning: 'Allah en büyüktür.',
        context: 'Namaz tesbihinde ve günlük zikirde; kalpte Allah\'ın büyüklüğünü tazelemek için sık tekrarlanır.',
        source: 'Müslim, Salât 158; genel sünnet',
        target: 33,
        keywords: 'tekbir büyük Allah namaz tesbih'
    },
    {
        id: 'lib_6', category: 'zikir',
        name: 'Sübhanallah',
        arabic: 'سُبْحَانَ اللَّهِ',
        meaning: 'Allah\'ı her türlü noksandan tenzih ederim.',
        context: 'Tesbihat ve günlük zikir; kalbi dünyadan söküp Allah\'ı anmaya yönlendirir.',
        source: 'Müslim, Zikr 22; Buhari, Müslim',
        target: 33,
        keywords: 'tesbih tenzih sübhan'
    },
    {
        id: 'lib_7', category: 'zikir',
        name: 'Lâ havle ve lâ kuvvete illâ billâh',
        arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
        meaning: 'Güç ve kuvvet ancak Allah\'tandır.',
        context: 'Sıkıntı, üzüntü veya zorluk anında; tevekkül ve Allah\'a dayanma zikridir.',
        source: 'Buhari, Müslim (tabii rivayetler)',
        target: 100,
        keywords: 'sıkıntı güç kuvvet tevekkül havl kuvve'
    },
    {
        id: 'lib_8', category: 'zikir',
        name: 'Estağfirullah',
        arabic: 'أَسْتَغْفِرُ اللَّهَ',
        meaning: 'Allah\'tan mağfiret dilerim.',
        context: 'Günah sonrası ve günlük tövbe alışkanlığı; kalbi temiz tutmaya yardım eder.',
        source: 'Buhari, Daavât 19; Müslim, Zikr 44',
        target: 100,
        keywords: 'istiğfar tövbe mağfiret günah af'
    },
    {
        id: 'lib_9', category: 'zikir',
        name: 'Allâhümme salli alâ Muhammed',
        arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ',
        meaning: 'Allah\'ım, Muhammed\'e salât eyle.',
        context: 'Salavat; günahların bağışlanmasına ve derecelere vesile olduğu bildirilen sünnet zikridir.',
        source: 'Tirmizi, Salât 22; Müslim, Salât 70',
        target: 100,
        keywords: 'salavat salat nebi peygamber müjde'
    },
    {
        id: 'lib_10', category: 'zikir',
        name: 'Allâhümme bârik alâ Muhammed',
        arabic: 'اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ',
        meaning: 'Allah\'ım, Muhammed\'e bereket ver.',
        context: 'Salavatın tamamlayıcısı olarak beraber veya ayrı okunabilir; Nebi\'ye hürmet ve şükür içindir.',
        source: 'Tirmizi, Salât 22; Ebu Davud, Salât 152',
        target: 100,
        keywords: 'salavat bereket nebi mübarek'
    },
    {
        id: 'lib_11', category: 'zikir',
        name: 'Sübhanallâhil-azîm ve bihamdihi',
        arabic: 'سُبْحَانَ اللَّهِ الْعَظِيمِ وَبِحَمْدِهِ',
        meaning: 'Azîm olan Allah\'ı hamd ile tenzih ederim.',
        context: 'Hadiste cennet ağacı veya sevapla müjdelenen zikirlerden; günde belirli sayıda okunması tavsiye edilir.',
        source: 'Tirmizi, Daavât 73; Buhari, Müslim (benzer rivayetler)',
        target: 100,
        keywords: 'cennet ağaç hamd azim tesbih'
    },
    {
        id: 'lib_12', category: 'zikir',
        name: 'Lâ ilâhe illallâhu vahdehu lâ şerîke leh',
        arabic: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
        meaning: 'Allah\'tan başka ilah yoktur, O tektir, ortağı yoktur; mülk O\'nundur, hamd O\'nadır; O her şeye kadirdir.',
        context: 'Sabah-akşam veya yatarken okunan tam kelime-i tevhid zikri; kalpte tevhidi pekiştirir.',
        source: 'Buhari, Müslim (çeşitli rivayetler)',
        target: 100,
        keywords: 'tevhid mülk hamd kudret kelime tam'
    },
    {
        id: 'lib_13', category: 'zikir',
        name: 'Hasbiyallâhu lâ ilâhe illâ hu',
        arabic: 'حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ، عَلَيْهِ تَوَكَّلْتُ',
        meaning: 'Allah bana yeter; O\'ndan başka ilah yoktur; yalnız O\'na tevekkül ettim.',
        context: 'Korku ve endişede Hz. İbrâhim ve Hz. Muhammed (s.a.v.) örneğiyle; kalbe güven veren ayet zikridir.',
        source: 'Kur\'an-ı Kerim, Tevbe 129',
        target: 100,
        keywords: 'tevekkül korku yeter Allah ayet'
    },
    {
        id: 'lib_14', category: 'zikir',
        name: 'Rabbîğfir ve rahhem',
        arabic: 'رَبِّ اغْفِرْ وَارْحَمْ وَأَنْتَ خَيْرُ الرَّاحِمِينَ',
        meaning: 'Rabbim, bağışla ve merhamet et; Sen merhamet edenlerin en hayırlısısın.',
        context: 'Tövbe ve mağfiret dilemek; Kur\'an\'da geçen dua/zikir olarak kalbi yumuşatır.',
        source: 'Kur\'an-ı Kerim, Mü\'minûn 118',
        target: 33,
        keywords: 'mağfiret rahmet tövbe bağışlanma'
    },
    {
        id: 'lib_15', category: 'zikir',
        name: 'Yâ Hayyu yâ Kayyûm',
        arabic: 'يَا حَيُّ يَا قَيُّومُ',
        meaning: 'Ey diri olan, ey her şeyi ayakta tutan.',
        context: 'İsmin şerifleriyle yakarış; sıkıntıda ve günde dua ile birleştirilen meşhur zikir başlangıcıdır.',
        source: 'Tirmizi, Daavât 91; genel sünnet',
        target: 100,
        keywords: 'hayy kayyum isim sıkıntı dua'
    },
    {
        id: 'lib_16', category: 'zikir',
        name: 'Sübhânellâhi ve bi hamdihi',
        arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ',
        meaning: 'Allah\'ı hamd ile tenzih ederim; Azîm olan Allah\'ı tenzih ederim.',
        context: 'Hadiste ağır basan mizanda hafif, dilde kolay zikir olarak övülür.',
        source: 'Buhari, Müslim (Tirmizi, Daavât 57)',
        target: 100,
        keywords: 'mizan hamd tesbih kolay ağır'
    },
    {
        id: 'lib_17', category: 'zikir',
        name: 'Radîtu billâhi Rabben',
        arabic: 'رَضِيتُ بِاللَّهِ رَبًّا وَبِالْإِسْلَامِ دِينًا وَبِمُحَمَّدٍ نَبِيًّا',
        meaning: 'Allah\'ı Rabb, İslam\'ı din, Muhammed\'i Nebi olarak razı oldum.',
        context: 'Yaygın rivayette sabah ve akşam (günde iki vakit) üçer defa okunması cennetle müjdelenmiştir. Uygulamada tek oturumda 3 tekrar hedefi; alışkanlığına göre hedefi düzenleyebilirsin.',
        source: 'Ebu Davud, Sünnet 1; Ahmed',
        target: 3,
        keywords: 'rıza iman İslam nebi cennet'
    },
    {
        id: 'lib_18', category: 'zikir',
        name: 'Allâhümmâ entes-selâm',
        arabic: 'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
        meaning: 'Allah\'ım, Sen Selâmsın; selâm Sendendir. Ey celâl ve ikram sahibi, mübarek olan Sensin.',
        context: 'Namaz selâmından sonra okunan dua-zikir; huzur ve selâmet dilemek içindir.',
        source: 'Müslim, Salât 288',
        target: 1,
        keywords: 'namaz selam huzur mübarek teşehhüd sonrası'
    },
    {
        id: 'lib_19', category: 'zikir',
        name: 'Lâ ilâhe illallâhu (mülk, hayât, hayy)',
        arabic: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، يُحْيِي وَيُمِيتُ، وَهُوَ حَيٌّ لَا يَمُوتُ، بِيَدِهِ الْخَيْرُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
        meaning: '(Tevhid ve mülk, hayat ölüm, O\'nun elinde hayır ve her şeye güç yetirme sıfatlarıyla tam zikir.)',
        context: 'Yatarken veya gündüzün okunan uzun tevhid; kalpte Allah\'ın rububiyet ve uluhiyetini hatırlatır.',
        source: 'Buhari, Daavât 39; Müslim, Zikr 63',
        target: 1,
        keywords: 'yatarken gece mülk hayat ölüm tevhid tam'
    },
    {
        id: 'lib_20', category: 'zikir',
        name: 'Sübhânellâhi ve bi hamdihi adede halkihi',
        arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ عَدَدَ خَلْقِهِ وَرِضَا نَفْسِهِ وَزِنَةَ عَرْشِهِ وَمِدَادَ كَلِمَاتِهِ',
        meaning: 'Allah\'ı yaratıklarının sayısı kadar, nefsinin rızası, Arş\'ının ağırlığı ve kelimelerinin mürekkebi kadar hamd ile tesbih ederim.',
        context: 'Geniş tesbih; günde bir kez veya sünnete uygun aralıklarla okunması tavsiye edilen zikirdir.',
        source: 'Müslim, Zikir 33',
        target: 1,
        keywords: 'tesbih geniş hamd yaratık arş kelime'
    },
    {
        id: 'lib_21', category: 'zikir',
        name: 'Lâ ilâhe illallâhü\'l-melikü\'l-hakkü\'l-mübîn',
        arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ الْمَلِكُ الْحَقُّ الْمُبِينُ',
        meaning: 'Allah\'tan başka ilah yoktur; O, mülkün gerçek sahibi (Melik), hak ve adaletle hükmeden (Hakk), birliği ve hakkı apaçık olan (Mübîn) Allah\'tır.',
        context: 'Hz. Ali (r.a.)\'dan rivayet edilen bir hadiste günde yüz defa okuyanın fakirlikten emin olacağı, kabirde yoldaş bulacağı ve tevhid sevabına vesile olacağı bildirilir; bazı kaynaklarda Cuma günü iki yüz defa okunması da zikredilir. Bu rivayetin senedi zayıf görüldüğünden tam itikadi sonuçlar için âlim görüşüne başvurulmalıdır; tevhid ve Allah\'ı anma niyetiyle okunması caiz görülür.',
        source: 'Hz. Ali (r.a.) rivayeti (Kenzü\'l-Ummâl, 5058; senedi tenkit edilmiş)',
        target: 100,
        keywords: 'melik hakk mubin tevhid kelime cuma yüz fakirlik kabir zenginlik'
    }
];

// Premium: extra library items — yukarıdaki kütüphane editoryal standardına aynen uy.
const PREMIUM_LIBRARY_EXTRA = [
    {
        id: 'plib_01', category: 'dua',
        name: 'Sefer Duası',
        arabic: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هٰذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلٰى رَبِّنَا لَمُنْقَلِبُونَ',
        meaning: 'Bunu bize boyun eğdiren Allah’ı tesbih ederiz; biz buna güç yetiremezdik. Biz mutlaka Rabbimize döneceğiz.',
        context: 'Yolculuğa binerken okunur; teslimiyet ve emniyet duygusunu güçlendirir.',
        source: 'Kur\'an, Zuhruf 13-14',
        target: 1,
        keywords: 'sefer yolculuk binerken emniyet teslimiyet'
    },
    {
        id: 'plib_02', category: 'dua',
        name: 'Sıkıntı Anında Dua',
        arabic: 'لَا إِلٰهَ إِلَّا اللهُ الْعَظِيمُ الْحَلِيمُ لَا إِلٰهَ إِلَّا اللهُ رَبُّ الْعَرْشِ الْعَظِيمِ',
        meaning: 'Azîm ve Halîm olan Allah’tan başka ilah yoktur. Büyük Arş’ın Rabbi Allah’tan başka ilah yoktur.',
        context: 'Zor anlarda kalbi sakinleştiren bir zikir/dua.',
        source: 'Buhari, Daavât',
        target: 1,
        keywords: 'sıkıntı stres korku sakin'
    },
    {
        id: 'plib_03', category: 'zikir',
        name: 'Hasbiyallahu lâ ilâhe illâ Hû',
        arabic: 'حَسْبِيَ اللهُ لَا إِلٰهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
        meaning: 'Allah bana yeter. O’ndan başka ilah yoktur. O’na tevekkül ettim. O büyük Arş’ın Rabbidir.',
        context: 'Tevekkül ve güven zikri; gün içinde tekrar edilebilir.',
        source: 'Kur\'an, Tevbe 129',
        target: 7,
        keywords: 'hasbiyallahu tevekkül güven arş'
    },
    {
        id: 'plib_04', category: 'zikir',
        name: 'Estağfirullah el-azîm (Tevbe)',
        arabic: 'أَسْتَغْفِرُ اللهَ الْعَظِيمَ',
        meaning: 'Azîm olan Allah’tan bağışlanma dilerim.',
        context: 'Gün içinde istiğfar; niyete göre sayılı tekrar edilir.',
        source: 'Genel rivayet',
        target: 100,
        keywords: 'istiğfar tevbe günah bağışlanma'
    },
    {
        id: 'plib_05', category: 'dua',
        name: 'Anne-Baba Duası',
        arabic: 'رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا',
        meaning: 'Rabbim! Küçüklüğümde beni yetiştirdikleri gibi onlara merhamet et.',
        context: 'Anne-baba için okunur.',
        source: 'Kur\'an, İsra 24',
        target: 1,
        keywords: 'anne baba merhamet isrâ'
    },
    {
        id: 'plib_06', category: 'zikir',
        name: 'Sübhânallâhi’l-azîm',
        arabic: 'سُبْحَانَ اللهِ الْعَظِيمِ',
        meaning: 'Azîm olan Allah’ı tesbih ederim.',
        context: 'Kısa tesbih; gün içine yayılabilir.',
        source: 'Genel rivayet',
        target: 33,
        keywords: 'tesbih azîm kısa'
    }
];

// State
let folders = [];
let zikirs = [];
let history = {};
let appSettings = { vibrationTap: true, vibrationTarget: true, sound: false, wakeLock: false, theme: 'navy' };
let reminderSettings = { enabled: false, time: '21:00', lastFiredYmd: null };
let entitlements = { premium: false };
let trash = { v: 1, entries: [] }; // soft-deleted items
let persistedDataWriteBlocked = false;
let persistedDataWriteBlockReason = '';

let currentFolderId = null;
let currentZikirId = null;
let activeStatTab = 'daily';
let activeZikirStatTab = 'daily';
let folderSearchQuery = '';
let folderFavOnly = false;
let suppressListNavigation = false;

/** Tur tamamlama parlaması; arka arkaya forced reflow + animasyon titremesin */
let lastCounterGlowBurstAt = 0;
const COUNTER_GLOW_BURST_MIN_MS = 420;

let folderSelectMode = false;
let folderSelectBarVisible = false;
let selectedFolderIds = new Set();
let zikirSelectMode = false;
let zikirSelectBarVisible = false;
let selectedZikirIds = new Set();

/** Sürükle tutamacı: üç yatay çizgi */
const GRIP_3LINES_HTML =
    '<span class="grip-lines" aria-hidden="true"><span></span><span></span><span></span></span>';

// Limits
const MAX_FOLDERS = Infinity;
/** Klasör başına zikir üst sınırı (tek cihaz uygulaması; ileride ayrı limit istenirse değişir) */
const MAX_ZIKIRS_PER_FOLDER = 40;

// Premium daha yayınlanmadan önce: sadece klasör/zikir limitleri sınırsız kalsın.
// Premium yayınlandığında bunu true yapacağız.
const PREMIUM_LIVE = false;

function getMaxFolders() {
    if (!PREMIUM_LIVE) return Infinity;
    return isPremium() ? Infinity : MAX_FOLDERS;
}

function getMaxZikirsPerFolder() {
    if (!PREMIUM_LIVE) return Infinity;
    return isPremium() ? Infinity : MAX_ZIKIRS_PER_FOLDER;
}

/** Bu klasörler silinemez (varsayılan içerik). */
const PROTECTED_FOLDER_IDS = new Set(['f_default', 'f_esma']);

// Circle Constants
const CIRCLE_RADIUS = 130;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

// ===================== DOM ELEMENTS =====================
const views = document.querySelectorAll('.view');
// Home View
const folderGrid = document.getElementById('folderGrid');
const updateBannerSlot = document.getElementById('updateBannerSlot');
const newFolderBtn = document.getElementById('newFolderBtn');
const dailyQuoteText = document.getElementById('dailyQuoteText');
const homeQuoteFooter = document.getElementById('homeQuoteFooter');
const folderMultiSelectBar = document.getElementById('folderMultiSelectBar');
const folderSelectCancelBtn = document.getElementById('folderSelectCancelBtn');
const folderSelectDeleteBtn = document.getElementById('folderSelectDeleteBtn');
const folderSelectCountEl = document.getElementById('folderSelectCount');
const folderHomeDragHint = document.getElementById('folderHomeDragHint');
const zikirMultiSelectBar = document.getElementById('zikirMultiSelectBar');
const zikirSelectCancelBtn = document.getElementById('zikirSelectCancelBtn');
const zikirSelectDeleteBtn = document.getElementById('zikirSelectDeleteBtn');
const zikirSelectCountEl = document.getElementById('zikirSelectCount');
// Folder Detail View
const folderDetailTitle = document.getElementById('folderDetailTitle');
const folderZikirList = document.getElementById('folderZikirList');
const zikirLimitWarning = document.getElementById('zikirLimitWarning');
const openAddZikirModalBtn = document.getElementById('openAddZikirModalBtn');
const folderSearchInput = document.getElementById('folderSearchInput');
const folderFavoritesOnly = document.getElementById('folderFavoritesOnly');
const folderZikirDragHint = document.getElementById('folderZikirDragHint');
// Counter View
const countDisplay = document.getElementById('countDisplay');
const targetDisplay = document.getElementById('targetDisplay');
const totalDisplay = document.getElementById('totalDisplay');
const roundDisplay = document.getElementById('roundDisplay');
const zikirTitle = document.getElementById('zikirTitle');
const zikirArabicHeader = document.getElementById('zikirArabic');
const zikirNote = document.getElementById('zikirNote');
const progressCircle = document.getElementById('progressCircle');
const mainCounterBtn = document.getElementById('mainCounterBtn');
const decrementBtn = document.getElementById('decrementBtn');
const resetBtn = document.getElementById('resetBtn');
const openZikirStatsBtn = document.getElementById('openZikirStatsBtn');
const zikirStatsOverlay = document.getElementById('zikirStatsOverlay');
const zikirActivityChart = document.getElementById('zikirActivityChart');
const zikirChartYAxis = document.getElementById('zikirChartYAxis');
const zikirStatsTitle = document.getElementById('zikirStatsTitle');
const zikirStatsSummaryLabel = document.getElementById('zikirStatsSummaryLabel');
const zikirStatsSummaryValue = document.getElementById('zikirStatsSummaryValue');
const zikirStatsSummarySub = document.getElementById('zikirStatsSummarySub');
const zikirStatsChartHeading = document.getElementById('zikirStatsChartHeading');
const zikirStatTabBtns = document.querySelectorAll('#zikirStatsOverlay .zikir-stats-tabs .tab-btn');

// Stats View
const statTabBtns = document.querySelectorAll('#statsView .stats-tabs .tab-btn');
const statMostClicked = document.getElementById('statMostClicked');
const statMostClickedCount = document.getElementById('statMostClickedCount');
const statLastClicked = document.getElementById('statLastClicked');
const statBestDayDate = document.getElementById('statBestDayDate');
const statBestDayCount = document.getElementById('statBestDayCount');
const activityChart = document.getElementById('activityChart');

// Stealth View
const enterStealthBtn = document.getElementById('enterStealthBtn');
const stealthZikirName = document.getElementById('stealthZikirName');
const stealthCounter = document.getElementById('stealthCounter');
const stealthClickArea = document.getElementById('stealthClickArea');
const exitStealthBtn = document.getElementById('exitStealthBtn');

// Library View
const libraryGrid = document.getElementById('libraryGrid');
const libraryCategoryTabs = document.querySelectorAll('#libraryCategoryTabs .tab-btn');
const librarySearchInput = document.getElementById('librarySearchInput');
const libraryDetailOverlay = document.getElementById('libraryDetailOverlay');
const libDetailName = document.getElementById('libDetailName');
const libDetailMeaning = document.getElementById('libDetailMeaning');
const libDetailContext = document.getElementById('libDetailContext');
const libDetailContextLabel = document.getElementById('libDetailContextLabel');
const prepLibraryAddBtn = document.getElementById('prepLibraryAddBtn');
const libraryFolderSelectOverlay = document.getElementById('libraryFolderSelectOverlay');
const libDestFolder = document.getElementById('libDestFolder');
const confirmLibraryAddBtn = document.getElementById('confirmLibraryAddBtn');

let selectedLibraryItem = null;
let activeLibraryCat = 'dua';
let librarySearchQuery = '';

// Settings
const openSettingsBtn = document.getElementById('openSettingsBtn');
const settingsOverlay = document.getElementById('settingsOverlay');
const trashOverlay = document.getElementById('trashOverlay');
const cbVibrationTap = document.getElementById('settingVibrationTap');
const cbVibrationTarget = document.getElementById('settingVibrationTarget');
const cbSound = document.getElementById('settingSound');
const cbWakeLock = document.getElementById('settingWakeLock');
const openPrivacyBtn = document.getElementById('openPrivacyBtn');
const cbReminderEnabled = document.getElementById('settingReminderEnabled');
const reminderTimeInput = document.getElementById('settingReminderTime');
const bottomNav = document.getElementById('bottomNav');
const themeChoiceBtns = document.querySelectorAll('[data-theme-choice]');
const THEME_META_COLORS = { navy: '#0a0e16', light: '#faf8f5', black: '#000000' };

/** @returns {'navy'|'light'|'black'} */
function normalizeAppTheme(theme) {
    if (theme === 'light') return 'light';
    if (theme === 'black') return 'black';
    return 'navy';
}

// Modals
const addModalOverlay = document.getElementById('addModalOverlay');
const saveZikirBtn = document.getElementById('saveZikirBtn');
const editModalOverlay = document.getElementById('editModalOverlay');
const saveEditBtn = document.getElementById('saveEditBtn');
const editZikirNameInp = document.getElementById('editZikirName');
const editZikirTargetInp = document.getElementById('editZikirTarget');
const editZikirMeaningInp = document.getElementById('editZikirMeaning');
const editZikirFaziletInp = document.getElementById('editZikirFazilet');
const editZikirArabicInp = document.getElementById('editZikirArabic');
let editingZikirIdMap = null; // tracking edit

const copyModalOverlay = document.getElementById('copyModalOverlay');
const copyDestFolder = document.getElementById('copyDestFolder');
const saveCopyBtn = document.getElementById('saveCopyBtn');
const saveMoveBtn = document.getElementById('saveMoveBtn');
let copyingZikirId = null;

// Uygulama temalı alert / confirm / prompt
const appDialogOverlay = document.getElementById('appDialogOverlay');
const appDialogTitle = document.getElementById('appDialogTitle');
const appDialogBody = document.getElementById('appDialogBody');
const appDialogInputWrap = document.getElementById('appDialogInputWrap');
const appDialogInputLabel = document.getElementById('appDialogInputLabel');
const appDialogInput = document.getElementById('appDialogInput');
const appDialogCancelBtn = document.getElementById('appDialogCancelBtn');
const appDialogOkBtn = document.getElementById('appDialogOkBtn');

let appDialogKind = 'alert';
let appDialogResolve = null;

function onAppDialogOk() {
    if (!appDialogResolve) return;
    const res = appDialogResolve;
    appDialogResolve = null;
    if (appDialogOverlay) appDialogOverlay.classList.remove('active');
    if (appDialogKind === 'prompt') res(appDialogInput ? appDialogInput.value : '');
    else if (appDialogKind === 'confirm') res(true);
    else res();
}

function onAppDialogCancel() {
    if (!appDialogResolve) return;
    const res = appDialogResolve;
    appDialogResolve = null;
    if (appDialogOverlay) appDialogOverlay.classList.remove('active');
    if (appDialogKind === 'prompt') res(null);
    else if (appDialogKind === 'confirm') res(false);
}

function onAppDialogBackdrop() {
    if (appDialogKind === 'alert') onAppDialogOk();
    else onAppDialogCancel();
}

function onAppDialogKeydown(e) {
    if (!appDialogOverlay || !appDialogOverlay.classList.contains('active')) return;
    if (e.key === 'Escape') {
        e.preventDefault();
        onAppDialogBackdrop();
    }
}

function showAppAlert(message, options = {}) {
    return new Promise((resolve) => {
        if (!appDialogOverlay || !appDialogOkBtn) {
            window.alert(message);
            resolve();
            return;
        }
        appDialogKind = 'alert';
        appDialogTitle.textContent = options.title || 'Bilgi';
        appDialogBody.textContent = message;
        if (appDialogInputWrap) appDialogInputWrap.hidden = true;
        if (appDialogCancelBtn) appDialogCancelBtn.hidden = true;
        appDialogOkBtn.textContent = options.okLabel || 'Tamam';
        appDialogResolve = resolve;
        appDialogOverlay.classList.add('active');
        requestAnimationFrame(() => appDialogOkBtn.focus());
    });
}

function showAppConfirm(message, options = {}) {
    return new Promise((resolve) => {
        if (!appDialogOverlay || !appDialogOkBtn) {
            resolve(window.confirm(message));
            return;
        }
        appDialogKind = 'confirm';
        appDialogTitle.textContent = options.title || 'Onay';
        appDialogBody.textContent = message;
        if (appDialogInputWrap) appDialogInputWrap.hidden = true;
        if (appDialogCancelBtn) appDialogCancelBtn.hidden = false;
        appDialogOkBtn.textContent = options.confirmLabel || 'Tamam';
        appDialogResolve = resolve;
        appDialogOverlay.classList.add('active');
        requestAnimationFrame(() => appDialogOkBtn.focus());
    });
}

function showAppPrompt(message, defaultValue = '', options = {}) {
    return new Promise((resolve) => {
        if (!appDialogOverlay || !appDialogOkBtn || !appDialogInput) {
            resolve(window.prompt(message, defaultValue));
            return;
        }
        appDialogKind = 'prompt';
        appDialogTitle.textContent = options.title || 'Giriş';
        appDialogBody.textContent = message;
        if (appDialogInputWrap) appDialogInputWrap.hidden = false;
        if (appDialogInputLabel) appDialogInputLabel.textContent = options.inputLabel || 'Ad';
        appDialogInput.value = defaultValue ?? '';
        if (appDialogCancelBtn) appDialogCancelBtn.hidden = false;
        appDialogOkBtn.textContent = options.okLabel || 'Tamam';
        appDialogResolve = resolve;
        appDialogOverlay.classList.add('active');
        requestAnimationFrame(() => {
            appDialogInput.focus();
            appDialogInput.select();
        });
    });
}

function setupAppDialog() {
    if (!appDialogOverlay || !appDialogOkBtn || !appDialogCancelBtn) return;
    appDialogOkBtn.addEventListener('click', onAppDialogOk);
    appDialogCancelBtn.addEventListener('click', onAppDialogCancel);
    appDialogOverlay.addEventListener('click', (e) => {
        if (e.target === appDialogOverlay) onAppDialogBackdrop();
    });
    if (appDialogInput) {
        appDialogInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                onAppDialogOk();
            }
        });
    }
    document.addEventListener('keydown', onAppDialogKeydown);
}


// ===================== INIT =====================
function init() {
    if (progressCircle) {
        progressCircle.style.strokeDasharray = `${CIRCLE_CIRCUMFERENCE} ${CIRCLE_CIRCUMFERENCE}`;
        progressCircle.style.strokeDashoffset = CIRCLE_CIRCUMFERENCE;
    }

    applyNativeBottomInsetVar();
    loadData();
    setupEventListeners();
    setDailyQuote();
    setMultiSelectBarShown(folderMultiSelectBar, false);
    setMultiSelectBarShown(zikirMultiSelectBar, false);
    // Do not push on first paint; set the baseline history state.
    showView('homeView', null, { push: false });
    ensureInitialHistoryState();
    setInAppStackTo(getViewState('homeView', null));
    syncTrashButtonUI();

    if (!isCapacitorNative() && 'serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(console.error);
    }
    if (reminderSettings && reminderSettings.enabled) {
        if (!isCapacitorNative()) maybeRequestNotificationPermission();
        ensureReminderSchedule().catch(console.error);
    }
    document.addEventListener('visibilitychange', onAppBecameVisibleForReminders);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible') return;
        refreshUpdateBannerConfig().then(() => {
            if (document.getElementById('homeView')?.classList.contains('active')) renderFolders();
        });
    });
    window.addEventListener('pageshow', onPageShowForReminders);
    // Make Android/iOS/WebView back follow in-app navigation.
    window.addEventListener('popstate', (e) => {
        const st = e && e.state ? e.state : null;
        closeAllOverlays();
        if (isOverlayState(st)) {
            const el = document.getElementById(st.overlayId);
            if (el) el.classList.add('active');
            if (st.overlayId === 'zikirStatsOverlay') renderZikirStats();
            return;
        }
        if (!st || typeof st !== 'object' || typeof st.viewId !== 'string') return;
        showView(st.viewId, st.param ?? null, { push: false });
    });
    // Some WebViews don't produce reliable history for internal tabs; keep a robust fallback stack.
    document.addEventListener('keydown', (e) => {
        // Desktop browsers sometimes map Backspace to back-navigation; don't steal when typing.
        if (e.key !== 'Backspace') return;
        const t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
        // Prevent browser default back and use in-app back instead.
        e.preventDefault();
        goBackInApp();
    });
    if (ESMA_LIST.length !== ESMA_ARABIC.length) {
        console.warn('Zikirmatik: ESMA_LIST ile ESMA_ARABIC uzunlukları eşleşmiyor.');
    }

    refreshUpdateBannerConfig().then(() => {
        if (document.getElementById('homeView')?.classList.contains('active')) renderFolders();
    });
}

function getTodayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function safeZikirTarget(z) {
    const t = parseInt(z && z.target, 10);
    return Number.isFinite(t) && t > 0 ? t : 33;
}

function escapeHtml(str) {
    if (str == null || str === '') return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
    // Minimal attribute escaping; also strips control chars.
    if (str == null) return '';
    return String(str)
        .replace(/[\u0000-\u001F\u007F]/g, '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function isPlainObject(v) {
    if (!v || typeof v !== 'object') return false;
    const p = Object.getPrototypeOf(v);
    return p === Object.prototype || p === null;
}

function blockPersistedDataWrites(reason) {
    persistedDataWriteBlocked = true;
    persistedDataWriteBlockReason = reason || 'invalid persisted data';
}

function coerceString(v, maxLen = 240) {
    if (v == null) return '';
    const s = String(v).replace(/\s+/g, ' ').trim();
    if (s.length <= maxLen) return s;
    return s.slice(0, maxLen);
}

function coerceId(v, fallbackPrefix) {
    const raw = coerceString(v, 64);
    // Allow only safe id chars for attribute usage and DOM datasets.
    const ok = /^[a-zA-Z0-9_-]+$/.test(raw);
    if (ok) return raw;
    return mintId(fallbackPrefix);
}

function clampNumber(v, { min = 0, max = Number.MAX_SAFE_INTEGER, fallback = 0 } = {}) {
    const n = typeof v === 'number' ? v : parseFloat(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
}

function sanitizeLoadedData(d) {
    const safe = isPlainObject(d) ? d : {};

    // folders
    let fArr = Array.isArray(safe.folders) ? safe.folders : [];
    fArr = fArr
        .filter((x) => isPlainObject(x))
        .slice(0, 5000)
        .map((f, idx) => ({
            id: coerceId(f.id, 'f'),
            name: coerceString(f.name || 'Klasör', 60) || `Klasör ${idx + 1}`,
            order: (typeof f.order === 'number' && Number.isFinite(f.order)) ? f.order : idx
        }));

    // zikirs
    let zArr = Array.isArray(safe.zikirs) ? safe.zikirs : [];
    zArr = zArr
        .filter((x) => isPlainObject(x))
        .slice(0, 200000)
        .map((z, idx) => ({
            id: coerceId(z.id, 'z'),
            folderId: coerceId(z.folderId || 'f_default', 'f'),
            name: coerceString(z.name || 'Zikir', 80) || `Zikir ${idx + 1}`,
            arabic: coerceString(z.arabic || '', 1200),
            target: clampNumber(z.target, { min: 1, max: 1000000, fallback: 33 }),
            meaning: coerceString(z.meaning || '', 1600),
            count: clampNumber(z.count, { min: 0, max: 1000000000, fallback: 0 }),
            lastClicked: clampNumber(z.lastClicked, { min: 0, max: 9e15, fallback: 0 }),
            order: (typeof z.order === 'number' && Number.isFinite(z.order)) ? z.order : idx,
            favorite: typeof z.favorite === 'boolean' ? z.favorite : false,
            fazilet: z.fazilet != null ? coerceString(z.fazilet, 2000) : undefined
        }));

    // history (keep existing pruning rules later too)
    const hist = isPlainObject(safe.history) ? safe.history : {};
    // Use a null-prototype map to reduce prototype pollution surface.
    const historyOut = Object.create(null);
    Object.keys(hist).slice(0, 2000).forEach((day) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
        const block = hist[day];
        if (!isPlainObject(block)) return;
        const outBlock = Object.create(null);
        Object.keys(block).slice(0, 40000).forEach((zid) => {
            const id = coerceId(zid, 'z');
            const v = block[zid];
            const num = clampNumber(v, { min: 0, max: 1000000000, fallback: 0 });
            if (num > 0) outBlock[id] = num;
        });
        historyOut[day] = outBlock;
    });

    // settings/reminders/entitlements
    const s = isPlainObject(safe.settings) ? safe.settings : {};
    const oldVib = (typeof s.vibration === 'boolean') ? s.vibration : true;
    const settingsOut = {
        vibrationTap: (typeof s.vibrationTap === 'boolean') ? s.vibrationTap : oldVib,
        vibrationTarget: (typeof s.vibrationTarget === 'boolean') ? s.vibrationTarget : oldVib,
        sound: (typeof s.sound === 'boolean') ? s.sound : false,
        wakeLock: (typeof s.wakeLock === 'boolean') ? s.wakeLock : false,
        theme: normalizeAppTheme(s.theme)
    };

    const r = isPlainObject(safe.reminders) ? safe.reminders : (isPlainObject(safe.reminderSettings) ? safe.reminderSettings : {});
    const remindersOut = {
        enabled: (typeof r.enabled === 'boolean') ? r.enabled : false,
        time: /^\d{2}:\d{2}$/.test(String(r.time || '')) ? String(r.time) : '21:00',
        lastFiredYmd: (typeof r.lastFiredYmd === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.lastFiredYmd)) ? r.lastFiredYmd : null
    };

    const e = isPlainObject(safe.entitlements) ? safe.entitlements : {};
    const entOut = { premium: !!e.premium };

    // trash
    const t = isPlainObject(safe.trash) ? safe.trash : {};
    const entries = Array.isArray(t.entries) ? t.entries : [];
    const trashOut = {
        v: 1,
        entries: entries
            .filter((x) => isPlainObject(x))
            .slice(0, 500) // prevent unbounded growth
            .map((x) => ({
                kind: x.kind === 'folder' ? 'folder' : 'zikir',
                deletedAt: clampNumber(x.deletedAt, { min: 0, max: 9e15, fallback: Date.now() }),
                folder: x.folder && isPlainObject(x.folder) ? { id: coerceId(x.folder.id, 'f'), name: coerceString(x.folder.name, 60), order: clampNumber(x.folder.order, { min: 0, max: 1e9, fallback: 0 }) } : undefined,
                zikirs: Array.isArray(x.zikirs)
                    ? x.zikirs.filter(isPlainObject).slice(0, 2000).map((z) => ({
                        id: coerceId(z.id, 'z'),
                        folderId: coerceId(z.folderId || 'f_default', 'f'),
                        name: coerceString(z.name || 'Zikir', 80),
                        arabic: coerceString(z.arabic || '', 1200),
                        target: clampNumber(z.target, { min: 1, max: 1000000, fallback: 33 }),
                        meaning: coerceString(z.meaning || '', 1600),
                        count: clampNumber(z.count, { min: 0, max: 1000000000, fallback: 0 }),
                        lastClicked: clampNumber(z.lastClicked, { min: 0, max: 9e15, fallback: 0 }),
                        order: clampNumber(z.order, { min: 0, max: 1e9, fallback: 0 })
                    }))
                    : undefined,
                zikir: x.zikir && isPlainObject(x.zikir)
                    ? {
                        id: coerceId(x.zikir.id, 'z'),
                        folderId: coerceId(x.zikir.folderId || 'f_default', 'f'),
                        name: coerceString(x.zikir.name || 'Zikir', 80),
                        arabic: coerceString(x.zikir.arabic || '', 1200),
                        target: clampNumber(x.zikir.target, { min: 1, max: 1000000, fallback: 33 }),
                        meaning: coerceString(x.zikir.meaning || '', 1600),
                        count: clampNumber(x.zikir.count, { min: 0, max: 1000000000, fallback: 0 }),
                        lastClicked: clampNumber(x.zikir.lastClicked, { min: 0, max: 9e15, fallback: 0 }),
                        order: clampNumber(x.zikir.order, { min: 0, max: 1e9, fallback: 0 })
                    }
                    : undefined,
                originalFolderId: x.originalFolderId != null ? coerceId(x.originalFolderId, 'f') : null
            }))
    };

    // Deduplicate IDs (keep first, mint new for collisions)
    const seenF = new Set();
    fArr.forEach((f) => {
        if (seenF.has(f.id)) f.id = mintId('f');
        seenF.add(f.id);
    });
    const seenZ = new Set();
    zArr.forEach((z) => {
        if (seenZ.has(z.id)) z.id = mintId('z');
        seenZ.add(z.id);
    });

    // Ensure zikir folderId exists; otherwise move to default folder.
    const folderIds = new Set(fArr.map((f) => f.id));
    zArr.forEach((z) => {
        if (!folderIds.has(z.folderId)) z.folderId = 'f_default';
    });

    return {
        folders: fArr,
        zikirs: zArr,
        history: historyOut,
        settings: settingsOut,
        reminders: remindersOut,
        entitlements: entOut,
        trash: trashOut
    };
}

// Günlük tıklama geçmişi: grafik ~7 gün kullanır; eski günleri tutmak istatistik için faydalı,
// ama localStorage şişmesin diye çok eskiyi budarız (silinen günlerin özeti uygulamada yok).
const HISTORY_RETENTION_DAYS = 400;

// ===================== DATA =====================
function pruneHistory() {
    if (!history || typeof history !== 'object') return false;
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - HISTORY_RETENTION_DAYS);
    const cy = cutoff.getFullYear();
    const cm = String(cutoff.getMonth() + 1).padStart(2, '0');
    const cd = String(cutoff.getDate()).padStart(2, '0');
    const cutoffStr = `${cy}-${cm}-${cd}`;
    let changed = false;
    Object.keys(history).forEach((day) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day < cutoffStr) {
            delete history[day];
            changed = true;
        }
    });
    return changed;
}

function sanitizeHistory() {
    if (!history || typeof history !== 'object') return false;
    let changed = false;
    Object.keys(history).forEach((day) => {
        const block = history[day];
        if (!block || typeof block !== 'object') {
            delete history[day];
            changed = true;
            return;
        }
        Object.keys(block).forEach((zid) => {
            let v = block[zid];
            if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) {
                delete block[zid];
                changed = true;
            } else if (v === 0) {
                delete block[zid];
                changed = true;
            }
        });
        if (Object.keys(block).length === 0) {
            delete history[day];
            changed = true;
        }
    });
    return changed;
}

function applyAppTheme(theme) {
    const t = normalizeAppTheme(theme);
    document.documentElement.setAttribute('data-theme', t);
    const meta = document.getElementById('metaThemeColor');
    if (meta) meta.setAttribute('content', THEME_META_COLORS[t]);
    const appleStatus = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (appleStatus) {
        appleStatus.setAttribute('content', t === 'light' ? 'default' : 'black-translucent');
    }
    void applyNativeStatusBarTheme(t);
}

function syncThemeUI() {
    const t = normalizeAppTheme(appSettings.theme);
    themeChoiceBtns.forEach((btn) => {
        const on = btn.getAttribute('data-theme-choice') === t;
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
}

function syncSettingsUI() {
    if (cbVibrationTap) cbVibrationTap.checked = !!appSettings.vibrationTap;
    if (cbVibrationTarget) cbVibrationTarget.checked = !!appSettings.vibrationTarget;
    if (cbSound) cbSound.checked = !!appSettings.sound;
    if (cbWakeLock) cbWakeLock.checked = !!appSettings.wakeLock;
    if (cbReminderEnabled) cbReminderEnabled.checked = !!reminderSettings.enabled;
    if (reminderTimeInput) reminderTimeInput.value = reminderSettings.time || '21:00';
    applyAppTheme(appSettings.theme);
    syncThemeUI();
}

function loadData() {
    const sv = localStorage.getItem('zikirmatik_data_v2');
    if (sv) {
        let d;
        try {
            d = JSON.parse(sv);
        } catch (e) {
            console.error('zikirmatik_data_v2 okunamadı, varsayılan veri:', e);
            blockPersistedDataWrites('zikirmatik_data_v2 parse failed');
            folders = [...DEFAULT_FOLDERS];
            zikirs = [...DEFAULT_ZIKIRS];
            history = {};
            appSettings = { vibrationTap: true, vibrationTarget: true, sound: false, wakeLock: false, theme: 'navy' };
            reminderSettings = { enabled: false, time: '21:00', lastFiredYmd: null };
            entitlements = { premium: false };
            trash = { v: 1, entries: [] };
            syncSettingsUI();
            return;
        }
        if (!isPlainObject(d) || !Array.isArray(d.zikirs)) {
            console.error('zikirmatik_data_v2 geçersiz; mevcut kayıt korunuyor.');
            blockPersistedDataWrites('zikirmatik_data_v2 has invalid shape');
            folders = [...DEFAULT_FOLDERS];
            zikirs = [...DEFAULT_ZIKIRS];
            history = {};
            appSettings = { vibrationTap: true, vibrationTarget: true, sound: false, wakeLock: false, theme: 'navy' };
            reminderSettings = { enabled: false, time: '21:00', lastFiredYmd: null };
            entitlements = { premium: false };
            trash = { v: 1, entries: [] };
            syncSettingsUI();
            return;
        }
        persistedDataWriteBlocked = false;
        persistedDataWriteBlockReason = '';
        const loadedZikirsWereExplicitlyEmpty = d.zikirs.length === 0;
        const sanitized = sanitizeLoadedData(d);
        folders = sanitized.folders.length ? sanitized.folders : [...DEFAULT_FOLDERS];
        zikirs = sanitized.zikirs;
        history = sanitized.history || {};
        appSettings = sanitized.settings || appSettings;
        reminderSettings = {
            enabled: false,
            time: '21:00',
            lastFiredYmd: null,
            ...(sanitized.reminders || {})
        };
        entitlements = sanitized.entitlements || { premium: false };
        trash = sanitized.trash || { v: 1, entries: [] };

        // Ordering (folders + zikirs)
        let touched = false;
        folders.forEach((f, idx) => {
            if (typeof f.order !== 'number') { f.order = idx; touched = true; }
        });
        const perFolderCounters = {};
        zikirs.forEach((z) => {
            if (typeof z.order === 'number') return;
            const key = z.folderId || '_';
            perFolderCounters[key] = (perFolderCounters[key] ?? 0) + 1;
            z.order = perFolderCounters[key];
            touched = true;
        });
        if (touched) saveData();

        // Migration for Esma folder (for existing users)
        if (!folders.find(f => f.id === 'f_esma')) {
            folders.push({ id: 'f_esma', name: 'Esma\'ül Hüsna' });
            ESMA_LIST.forEach((esma, index) => {
                zikirs.push({
                    id: 'z_e_' + index, folderId: 'f_esma',
                    name: esma.name, arabic: esma.arabic || '', target: esma.target, meaning: esma.meaning,
                    count: 0, lastClicked: 0
                });
            });
            saveData();
        } else if (!loadedZikirsWereExplicitlyEmpty) {
            // Ensure all Esma items exist (if ESMA_LIST was expanded in later versions)
            let changed = false;
            ESMA_LIST.forEach((esma, index) => {
                const id = 'z_e_' + index;
                if (!zikirs.find(z => z.id === id)) {
                    zikirs.push({
                        id,
                        folderId: 'f_esma',
                        name: esma.name,
                        arabic: esma.arabic || '',
                        target: esma.target,
                        meaning: esma.meaning,
                        count: 0,
                        lastClicked: 0
                    });
                    changed = true;
                }
            });
            if (changed) saveData();
        }

        // Arapça metin yoksa Esma / varsayılan zikirlere doldur (eski kayıtlar)
        let arFix = false;
        zikirs.forEach((z) => {
            if (z.arabic && String(z.arabic).trim()) return;
            const m = /^z_e_(\d+)$/.exec(z.id);
            if (m) {
                const idx = parseInt(m[1], 10);
                if (ESMA_LIST[idx] && ESMA_LIST[idx].arabic) {
                    z.arabic = ESMA_LIST[idx].arabic;
                    arFix = true;
                }
            } else if (DEFAULT_ZIKIR_ARABIC_BY_ID[z.id]) {
                z.arabic = DEFAULT_ZIKIR_ARABIC_BY_ID[z.id];
                arFix = true;
            }
        });
        if (arFix) saveData();

        if (sanitizeHistory() || pruneHistory()) saveData();
    } else {
        persistedDataWriteBlocked = false;
        persistedDataWriteBlockReason = '';
        folders = [...DEFAULT_FOLDERS];
        zikirs = [...DEFAULT_ZIKIRS];
        history = {};
        trash = { v: 1, entries: [] };
    }

    syncSettingsUI();
}
function saveData() {
    if (persistedDataWriteBlocked) {
        console.error(`saveData engellendi: ${persistedDataWriteBlockReason || 'geçersiz mevcut kayıt'}`);
        return;
    }
    const payload = {
        folders,
        zikirs,
        history,
        settings: appSettings,
        reminders: reminderSettings,
        entitlements,
        trash
    };
    try {
        localStorage.setItem('zikirmatik_data_v2', JSON.stringify(payload));
    } catch (e) {
        const isQuota =
            e &&
            (e.name === 'QuotaExceededError' ||
                e.code === 22 ||
                e.code === 1014);
        if (isQuota && (pruneHistory() || sanitizeHistory())) {
            try {
                localStorage.setItem('zikirmatik_data_v2', JSON.stringify(payload));
            } catch (e2) {
                console.error('saveData: kota dolu, eski geçmiş budandıktan sonra da yazılamadı.', e2);
            }
        } else {
            console.error('saveData', e);
        }
    }
}

function isPremium() {
    return !!(entitlements && entitlements.premium);
}

function syncTrashButtonUI() {
    const btn = document.getElementById('openTrashBtn');
    if (!btn) return;
    const locked = !isPremium();
    btn.classList.toggle('is-locked', locked);
    btn.setAttribute('aria-disabled', locked ? 'true' : 'false');
    btn.title = locked ? 'Çöp Kutusu (Premium)' : 'Çöp Kutusu';
}

function deepClone(obj) {
    try {
        if (typeof structuredClone === 'function') return structuredClone(obj);
    } catch {
        // ignore
    }
    return JSON.parse(JSON.stringify(obj));
}

function formatRelativeTime(ts) {
    if (!ts) return '';
    const diffMs = Date.now() - ts;
    const min = Math.floor(diffMs / 60000);
    if (min < 1) return 'az önce';
    if (min < 60) return `${min} dk önce`;
    const h = Math.floor(min / 60);
    if (h < 48) return `${h} sa önce`;
    const d = Math.floor(h / 24);
    return `${d} gün önce`;
}

function ensureRestoredFolder() {
    const id = 'f_restored';
    let f = folders.find((x) => x.id === id);
    if (!f) {
        const maxOrder = folders.reduce((m, ff) => Math.max(m, typeof ff.order === 'number' ? ff.order : -1), -1);
        f = { id, name: 'Geri Yüklenenler', order: maxOrder + 1 };
        folders.push(f);
    }
    return id;
}

function mintId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

function capTrashEntries() {
    if (!trash || !Array.isArray(trash.entries)) return;
    const MAX_TRASH = 500;
    if (trash.entries.length > MAX_TRASH) trash.entries.length = MAX_TRASH;
}

function restoreTrashEntry(index) {
    const e = trash && Array.isArray(trash.entries) ? trash.entries[index] : null;
    if (!e) return false;

    if (e.kind === 'zikir' && e.zikir) {
        const z = deepClone(e.zikir);
        if (zikirs.find((x) => x.id === z.id)) z.id = mintId('z');
        const targetFolder = (z.folderId && folders.find((f) => f.id === z.folderId)) ? z.folderId : ensureRestoredFolder();
        z.folderId = targetFolder;
        // Put at end of folder order.
        const maxOrder = zikirs
            .filter((x) => x.folderId === targetFolder)
            .reduce((m, x) => Math.max(m, typeof x.order === 'number' ? x.order : -1), -1);
        z.order = maxOrder + 1;
        zikirs.push(z);
        trash.entries.splice(index, 1);
        saveData();
        return true;
    }

    if (e.kind === 'folder' && e.folder && Array.isArray(e.zikirs)) {
        const f = deepClone(e.folder);
        if (folders.find((x) => x.id === f.id)) f.id = mintId('f');
        // Ensure order at end.
        const maxOrder = folders.reduce((m, ff) => Math.max(m, typeof ff.order === 'number' ? ff.order : -1), -1);
        f.order = maxOrder + 1;
        folders.push(f);

        const existingZIds = new Set(zikirs.map((x) => x.id));
        let maxZOrder = zikirs
            .filter((x) => x.folderId === f.id)
            .reduce((m, x) => Math.max(m, typeof x.order === 'number' ? x.order : -1), -1);
        e.zikirs.forEach((orig) => {
            const z = deepClone(orig);
            z.folderId = f.id;
            if (existingZIds.has(z.id)) z.id = mintId('z');
            maxZOrder += 1;
            z.order = maxZOrder;
            zikirs.push(z);
        });

        trash.entries.splice(index, 1);
        saveData();
        return true;
    }

    return false;
}

function deleteTrashEntry(index) {
    const e = trash && Array.isArray(trash.entries) ? trash.entries[index] : null;
    if (!e) return false;
    // Now it's a permanent delete: remove history for the affected zikir ids.
    const zIds = new Set();
    if (e.kind === 'zikir' && e.zikir && e.zikir.id) zIds.add(e.zikir.id);
    if (e.kind === 'folder' && Array.isArray(e.zikirs)) {
        e.zikirs.forEach((z) => {
            if (z && z.id) zIds.add(z.id);
        });
    }
    if (zIds.size) removeHistoryForZikirIds(zIds);
    trash.entries.splice(index, 1);
    saveData();
    return true;
}

async function clearTrashAll() {
    const n = trash && Array.isArray(trash.entries) ? trash.entries.length : 0;
    if (n === 0) return;
    if (!(await showAppConfirm('Çöp kutusundaki her şey kalıcı olarak silinsin mi? Bu işlem geri alınamaz.', { title: 'Çöp kutusunu boşalt', confirmLabel: 'Boşalt' }))) {
        return;
    }
    const zIds = new Set();
    trash.entries.forEach((e) => {
        if (e.kind === 'zikir' && e.zikir && e.zikir.id) zIds.add(e.zikir.id);
        if (e.kind === 'folder' && Array.isArray(e.zikirs)) e.zikirs.forEach((z) => z && z.id && zIds.add(z.id));
    });
    if (zIds.size) removeHistoryForZikirIds(zIds);
    trash.entries = [];
    saveData();
}

function renderPremiumTrash() {
    // Backwards-compat (old ids): no-op if elements removed from DOM.
    const list = document.getElementById('premiumTrashList');
    const empty = document.getElementById('premiumTrashEmpty');
    const clearBtn = document.getElementById('premiumTrashClearBtn');
    if (!list || !empty) return;
    const entries = trash && Array.isArray(trash.entries) ? trash.entries : [];
    list.innerHTML = '';
    empty.hidden = entries.length !== 0;
    if (clearBtn) clearBtn.disabled = entries.length === 0;

    entries.slice(0, 60).forEach((e, i) => {
        const title =
            e.kind === 'zikir' ? (e.zikir && e.zikir.name ? e.zikir.name : 'Zikir') :
            e.kind === 'folder' ? (e.folder && e.folder.name ? e.folder.name : 'Klasör') :
            'Öğe';
        const sub =
            e.kind === 'zikir'
                ? `Zikir • ${formatRelativeTime(e.deletedAt)}`
                : `Klasör (${Array.isArray(e.zikirs) ? e.zikirs.length : 0} zikir) • ${formatRelativeTime(e.deletedAt)}`;

        const row = document.createElement('div');
        row.className = 'premium-trash-item';
        row.innerHTML = `
            <div class="premium-trash-item__main">
                <div class="premium-trash-item__title">${escapeHtml(title)}</div>
                <div class="premium-trash-item__meta">${escapeHtml(sub)}</div>
            </div>
            <div class="premium-trash-item__actions">
                <button type="button" class="premium-mini-btn premium-mini-btn--restore" data-trash-action="restore" data-trash-index="${i}">
                    <span class="material-icons-outlined">restore</span>
                    Geri al
                </button>
                <button type="button" class="premium-mini-btn premium-mini-btn--delete" data-trash-action="delete" data-trash-index="${i}">
                    <span class="material-icons-outlined">delete_forever</span>
                    Sil
                </button>
            </div>
        `;
        list.appendChild(row);
    });
}

function renderTrashOverlay() {
    const list = document.getElementById('trashList');
    const empty = document.getElementById('trashEmpty');
    const clearBtn = document.getElementById('trashClearBtn');
    if (!list || !empty) return;
    const entries = trash && Array.isArray(trash.entries) ? trash.entries : [];
    list.innerHTML = '';
    empty.hidden = entries.length !== 0;
    if (clearBtn) clearBtn.disabled = entries.length === 0;

    entries.slice(0, 80).forEach((e, i) => {
        const title =
            e.kind === 'zikir' ? (e.zikir && e.zikir.name ? e.zikir.name : 'Zikir') :
            e.kind === 'folder' ? (e.folder && e.folder.name ? e.folder.name : 'Klasör') :
            'Öğe';
        const sub =
            e.kind === 'zikir'
                ? `Zikir • ${formatRelativeTime(e.deletedAt)}`
                : `Klasör (${Array.isArray(e.zikirs) ? e.zikirs.length : 0} zikir) • ${formatRelativeTime(e.deletedAt)}`;

        const row = document.createElement('div');
        row.className = 'premium-trash-item';
        row.innerHTML = `
            <div class="premium-trash-item__main">
                <div class="premium-trash-item__title">${escapeHtml(title)}</div>
                <div class="premium-trash-item__meta">${escapeHtml(sub)}</div>
            </div>
            <div class="premium-trash-item__actions">
                <button type="button" class="premium-mini-btn premium-mini-btn--restore" data-trash-action="restore" data-trash-index="${i}">
                    <span class="material-icons-outlined">restore</span>
                    Geri al
                </button>
                <button type="button" class="premium-mini-btn premium-mini-btn--delete" data-trash-action="delete" data-trash-index="${i}">
                    <span class="material-icons-outlined">delete_forever</span>
                    Sil
                </button>
            </div>
        `;
        list.appendChild(row);
    });
}

function maybeRequestNotificationPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
    }
}

function reminderNotificationPayload() {
    const base = new URL('icon.svg', window.location.href).href;
    /* Başlık boş: ana sayfa hadis şeridindeki gibi yalnızca hadis/ayet metni öne çıksın (OS kendi satırında uygulama adını gösterebilir). */
    return {
        title: '',
        options: {
            body: REMINDER_FIXED_BODY,
            icon: base,
            badge: base,
            tag: 'zikir-gunluk-hatir',
            renotify: false,
            lang: 'tr',
            data: { url: window.location.origin + window.location.pathname + window.location.search }
        }
    };
}

/** Mobil/PWA: service worker bildirimi genelde sayfadaki new Notification’dan daha güvenilir */
function showDailyReminderNotification() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const { title, options } = reminderNotificationPayload();
    const markFired = () => {
        reminderSettings.lastFiredYmd = getTodayString();
        saveData();
    };
    const fallback = () => {
        try {
            new Notification(title, options);
            markFired();
        } catch (e) {
            console.error('Zikirmatik: bildirim gösterilemedi', e);
        }
    };
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
            .then((reg) => {
                if (reg && typeof reg.showNotification === 'function') {
                    const ret = reg.showNotification(title, options);
                    if (ret && typeof ret.then === 'function') {
                        return ret.then(() => markFired()).catch(fallback);
                    }
                    markFired();
                    return;
                }
                fallback();
            })
            .catch(fallback);
    } else {
        fallback();
    }
}

/** Uygulama kapalıyken zamanlayıcı çalışmaz; hatır saatinden sonra açılırsa bir kez telafi */
function maybeCatchUpMissedReminder() {
    if (!('Notification' in window)) return;
    if (!reminderSettings.enabled) return;
    if (Notification.permission !== 'granted') return;
    const today = getTodayString();
    if (reminderSettings.lastFiredYmd === today) return;
    const [hh, mm] = String(reminderSettings.time || '21:00').split(':').map((x) => parseInt(x, 10));
    if (Number.isNaN(hh) || Number.isNaN(mm)) return;
    const now = new Date();
    const deadline = new Date(now);
    deadline.setHours(hh, mm, 0, 0);
    if (now.getTime() <= deadline.getTime()) return;
    showDailyReminderNotification();
}

let reminderTimeoutId = null;

function clearInAppReminderTick() {
    if (reminderTimeoutId != null) {
        clearTimeout(reminderTimeoutId);
        reminderTimeoutId = null;
    }
}

function scheduleInAppReminderTick() {
    /* Tam saatinde yalnızca sekme/PWA açıkken tetiklenir; arka planda OS genelde zamanlayıcıyı durdurur. */
    clearInAppReminderTick();
    if (!('Notification' in window)) return;
    if (!reminderSettings.enabled) return;
    if (Notification.permission !== 'granted') return;
    const now = new Date();
    const [hh, mm] = String(reminderSettings.time || '21:00').split(':').map((x) => parseInt(x, 10));
    if (Number.isNaN(hh) || Number.isNaN(mm)) return;
    const target = new Date(now);
    target.setHours(hh, mm, 0, 0);
    if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
    const ms = Math.min(target.getTime() - now.getTime(), 2147483647); // setTimeout limit
    reminderTimeoutId = setTimeout(() => {
        reminderTimeoutId = null;
        if (reminderSettings.lastFiredYmd === getTodayString()) {
            scheduleInAppReminderTick();
            return;
        }
        showDailyReminderNotification();
        scheduleInAppReminderTick();
    }, ms);
}

async function ensureReminderSchedule() {
    if (isCapacitorNative()) {
        clearInAppReminderTick();
        const r = await syncNativeDailyReminder(reminderSettings.enabled, reminderSettings.time);
        if (reminderSettings.enabled && !r.ok && r.reason === 'denied') {
            await showAppAlert(
                'Hatırlatıcı için bildirim izni gerekli. Android: Uygulama bilgisi → Bildirimler bölümünden açabilirsin.',
                { title: 'Bildirim izni' }
            );
        } else if (reminderSettings.enabled && r.warnExactAlarm) {
            await showAppAlert(
                'Hatırlatıcının seçtiğin saatte çalışması için tam zamanlı alarm izni gerekli.\n\nAndroid: Ayarlar → Uygulamalar → Zikirmatik → Zamanlanmış alarmlar veya Bildirimler → tam zamanlı alarmları aç.',
                { title: 'Alarm izni' }
            );
        } else if (reminderSettings.enabled && !r.ok && r.reason === 'schedule') {
            await showAppAlert(
                'Günlük hatırlatıcı zamanlanamadı. Uygulamayı güncelleyip tekrar dene; sorun sürerse Ayarlar → Bildirimler bölümünü kontrol et.',
                { title: 'Hatırlatıcı' }
            );
        }
        return;
    }
    if (!reminderSettings.enabled) {
        clearInAppReminderTick();
        return;
    }
    maybeCatchUpMissedReminder();
    scheduleInAppReminderTick();
}

function onAppBecameVisibleForReminders() {
    if (document.visibilityState !== 'visible') return;
    if (!reminderSettings.enabled) return;
    /* Native: çoklu günlük alarmlar tükendikçe uygulama açılınca yeniden planlanır */
    ensureReminderSchedule().catch(console.error);
}

function onPageShowForReminders() {
    if (!reminderSettings.enabled) return;
    ensureReminderSchedule().catch(console.error);
}

function logClick(zId) {
    const today = getTodayString();
    if (!history[today]) history[today] = {};
    if (!history[today][zId]) history[today][zId] = 0;
    history[today][zId]++;
    
    // Update lastClicked
    const z = zikirs.find(x => x.id === zId);
    if (z) z.lastClicked = Date.now();
    
    saveData();
}

function logDecrement(zId) {
    const today = getTodayString();
    if (history[today] && history[today][zId] > 0) {
        history[today][zId]--;
        if (history[today][zId] <= 0) delete history[today][zId];
        if (Object.keys(history[today]).length === 0) delete history[today];
    }
    saveData();
}

function removeHistoryForZikirIds(zidSet) {
    if (!history || !zidSet || zidSet.size === 0) return;
    Object.keys(history).forEach((day) => {
        const block = history[day];
        if (!block || typeof block !== 'object') return;
        zidSet.forEach((zid) => {
            delete block[zid];
        });
        if (Object.keys(block).length === 0) delete history[day];
    });
}

function updateFolderSelectChrome() {
    if (folderSelectCountEl) {
        folderSelectCountEl.textContent =
            selectedFolderIds.size === 0 ? 'Seçim yok' : `${selectedFolderIds.size} klasör seçili`;
    }
    if (folderSelectDeleteBtn) {
        folderSelectDeleteBtn.disabled = selectedFolderIds.size === 0;
    }
}

function updateZikirSelectChrome() {
    if (zikirSelectCountEl) {
        zikirSelectCountEl.textContent =
            selectedZikirIds.size === 0 ? 'Seçim yok' : `${selectedZikirIds.size} zikir seçili`;
    }
    if (zikirSelectDeleteBtn) {
        zikirSelectDeleteBtn.disabled = selectedZikirIds.size === 0;
    }
}

/** Android WebView: yalnızca .hidden bazen yeterli olmuyor; [hidden] + !important CSS ile eşle */
function setMultiSelectBarShown(barEl, show) {
    if (!barEl) return;
    if (show) {
        barEl.removeAttribute('hidden');
        barEl.hidden = false;
    } else {
        barEl.hidden = true;
        barEl.setAttribute('hidden', '');
    }
}

function exitFolderSelectMode(skipRender) {
    folderSelectMode = false;
    folderSelectBarVisible = false;
    selectedFolderIds.clear();
    const hv = document.getElementById('homeView');
    if (hv) hv.classList.remove('home-view--select-mode');
    if (folderGrid) folderGrid.classList.remove('folder-grid--select-mode');
    setMultiSelectBarShown(folderMultiSelectBar, false);
    if (homeQuoteFooter) homeQuoteFooter.hidden = false;
    updateFolderSelectChrome();
    if (!skipRender && hv && hv.classList.contains('active')) renderFolders();
}

function exitZikirSelectMode(skipRender) {
    zikirSelectMode = false;
    zikirSelectBarVisible = false;
    selectedZikirIds.clear();
    const fd = document.getElementById('folderDetailView');
    if (fd) fd.classList.remove('folder-detail--select-mode');
    if (folderZikirList) folderZikirList.classList.remove('zikir-list--select-mode');
    setMultiSelectBarShown(zikirMultiSelectBar, false);
    updateZikirSelectChrome();
    if (!skipRender && fd && fd.classList.contains('active')) renderFolderDetail();
}

function onFolderLongPressSelect(id) {
    if (!folderSelectMode) {
        folderSelectMode = true;
        selectedFolderIds = new Set([id]);
    } else if (selectedFolderIds.has(id)) {
        selectedFolderIds.delete(id);
    } else {
        selectedFolderIds.add(id);
    }
    folderSelectBarVisible = true;
    const hv = document.getElementById('homeView');
    if (hv) hv.classList.add('home-view--select-mode');
    if (folderGrid) folderGrid.classList.add('folder-grid--select-mode');
    setMultiSelectBarShown(folderMultiSelectBar, true);
    if (homeQuoteFooter) homeQuoteFooter.hidden = folderSelectMode;
    updateFolderSelectChrome();
    renderFolders();
}

function onZikirLongPressSelect(id) {
    if (!zikirSelectMode) {
        zikirSelectMode = true;
        selectedZikirIds = new Set([id]);
    } else if (selectedZikirIds.has(id)) {
        selectedZikirIds.delete(id);
    } else {
        selectedZikirIds.add(id);
    }
    zikirSelectBarVisible = true;
    const fd = document.getElementById('folderDetailView');
    if (fd) fd.classList.add('folder-detail--select-mode');
    if (folderZikirList) folderZikirList.classList.add('zikir-list--select-mode');
    setMultiSelectBarShown(zikirMultiSelectBar, true);
    updateZikirSelectChrome();
    renderFolderDetail();
}

function toggleFolderSelected(id) {
    if (selectedFolderIds.has(id)) selectedFolderIds.delete(id);
    else selectedFolderIds.add(id);
    /* Sil çubuğu seçim yaparken açık kalsın; kapanış: İptal veya silme tamamlanınca */
    folderSelectBarVisible = true;
    setMultiSelectBarShown(folderMultiSelectBar, true);
    updateFolderSelectChrome();
    renderFolders();
}

function toggleZikirSelected(id) {
    if (selectedZikirIds.has(id)) selectedZikirIds.delete(id);
    else selectedZikirIds.add(id);
    zikirSelectBarVisible = true;
    setMultiSelectBarShown(zikirMultiSelectBar, true);
    updateZikirSelectChrome();
    renderFolderDetail();
}

async function deleteSelectedFolders() {
    const ids = [...selectedFolderIds];
    if (ids.length === 0) return;
    const blocked = ids.filter((fid) => PROTECTED_FOLDER_IDS.has(fid));
    if (blocked.length > 0) {
        await showAppAlert('“Varsayılan Zikirler” ve “Esma\'ül Hüsna” klasörleri silinemez. Seçimden çıkarın.', {
            title: 'Silinemez'
        });
        folderSelectBarVisible = false;
        setMultiSelectBarShown(folderMultiSelectBar, false);
        renderFolders();
        return;
    }
    const zikirIdsToRemove = new Set(
        zikirs.filter((z) => ids.includes(z.folderId)).map((z) => z.id)
    );
    const nFolders = ids.length;
    const nZikirs = zikirIdsToRemove.size;
    const msg = `Seçilen ${nFolders} klasör ve içindeki ${nZikirs} zikir kalıcı olarak silinsin mi? Bu işlem geri alınamaz.`;
    if (!(await showAppConfirm(msg, { title: 'Klasörleri sil', confirmLabel: 'Sil' }))) {
        folderSelectBarVisible = false;
        setMultiSelectBarShown(folderMultiSelectBar, false);
        renderFolders();
        return;
    }
    if (isPremium()) {
        // Soft-delete into Trash (Premium).
        const deletedAt = Date.now();
        const deletedFolders = folders.filter((f) => ids.includes(f.id));
        const deletedZikirs = zikirs.filter((z) => ids.includes(z.folderId));
        deletedFolders.forEach((f) => {
            trash.entries.unshift({
                kind: 'folder',
                deletedAt,
                folder: deepClone(f),
                zikirs: deletedZikirs
                    .filter((z) => z.folderId === f.id)
                    .map((z) => deepClone(z))
            });
        });
        capTrashEntries();
    } else {
        // Non-premium: permanent delete (old behavior).
        removeHistoryForZikirIds(zikirIdsToRemove);
    }
    zikirs = zikirs.filter((z) => !ids.includes(z.folderId));
    folders = folders.filter((f) => !ids.includes(f.id));
    exitFolderSelectMode(false);
    saveData();
    renderFolders();
}

async function deleteSelectedZikirs() {
    const ids = [...selectedZikirIds];
    if (ids.length === 0) return;
    const msg = `Seçilen ${ids.length} zikir kalıcı olarak silinsin mi? Okuma geçmişi bu zikirler için temizlenir. Bu işlem geri alınamaz.`;
    if (!(await showAppConfirm(msg, { title: 'Zikirleri sil', confirmLabel: 'Sil' }))) {
        zikirSelectBarVisible = false;
        setMultiSelectBarShown(zikirMultiSelectBar, false);
        renderFolderDetail();
        return;
    }
    if (isPremium()) {
        // Soft-delete into Trash (Premium).
        const deletedAt = Date.now();
        const deleted = zikirs.filter((z) => ids.includes(z.id));
        deleted.forEach((z) => {
            trash.entries.unshift({
                kind: 'zikir',
                deletedAt,
                zikir: deepClone(z),
                originalFolderId: z.folderId ?? null
            });
        });
        capTrashEntries();
    } else {
        // Non-premium: permanent delete (old behavior).
        removeHistoryForZikirIds(new Set(ids));
    }
    zikirs = zikirs.filter((z) => !ids.includes(z.id));
    if (currentZikirId && ids.includes(currentZikirId)) {
        currentZikirId = null;
    }
    exitZikirSelectMode(false);
    saveData();
    renderFolderDetail();
}

// ===================== ROUTING =====================
function clearFolderSearch() {
    folderSearchQuery = '';
    if (folderSearchInput) folderSearchInput.value = '';
}

function clearLibrarySearch() {
    librarySearchQuery = '';
    if (librarySearchInput) librarySearchInput.value = '';
}

let currentViewId = null;
let inAppViewStack = [];

function viewStateEquals(a, b) {
    if (!a || !b) return false;
    return a.viewId === b.viewId && (a.param ?? null) === (b.param ?? null);
}

function getViewState(viewId, param = null) {
    const p = param ?? null;
    return { viewId, param: p };
}

function isOverlayState(st) {
    return !!(st && typeof st === 'object' && typeof st.overlayId === 'string');
}

function getOverlayState(overlayId) {
    return { overlayId: String(overlayId) };
}

function isOverlayActive(el) {
    return !!(el && el.classList && el.classList.contains('active'));
}

function closeAllOverlays() {
    [
        appDialogOverlay,
        copyModalOverlay,
        editModalOverlay,
        addModalOverlay,
        trashOverlay,
        libraryFolderSelectOverlay,
        libraryDetailOverlay,
        settingsOverlay,
        zikirStatsOverlay
    ].forEach((el) => {
        if (el) el.classList.remove('active');
    });
}

function openOverlay(overlayId, { onOpen } = {}) {
    const el = document.getElementById(overlayId);
    if (!el) return;
    ensureInitialHistoryState();
    try {
        const cur = history && history.state ? history.state : null;
        const next = getOverlayState(overlayId);
        if (!isOverlayState(cur) || cur.overlayId !== next.overlayId) history.pushState(next, '');
    } catch (_) {
        // ignore
    }
    el.classList.add('active');
    if (typeof onOpen === 'function') onOpen();
}

function closeOverlayPreferHistory(overlayId) {
    const el = document.getElementById(overlayId);
    if (!el) return false;
    if (!isOverlayActive(el)) return false;
    try {
        const st = history && history.state ? history.state : null;
        if (isOverlayState(st) && st.overlayId === overlayId) {
            history.back();
            return true;
        }
    } catch (_) {
        // ignore
    }
    el.classList.remove('active');
    return true;
}

function ensureInitialHistoryState() {
    try {
        const st = history && history.state ? history.state : null;
        // If we already have an in-app state (view or overlay), don't clobber it.
        if (st && typeof st === 'object') {
            if (typeof st.viewId === 'string') return;
            if (typeof st.overlayId === 'string') return;
        }
        history.replaceState(getViewState('homeView', null), '');
    } catch (_) {
        // ignore: some WebViews may block history state
    }
}

function setInAppStackTo(state) {
    inAppViewStack = [state];
}

function pushInAppStack(state) {
    const last = inAppViewStack.length ? inAppViewStack[inAppViewStack.length - 1] : null;
    if (last && viewStateEquals(last, state)) return;
    inAppViewStack.push(state);
}

function goBackInApp({ fallbackViewId = 'homeView' } = {}) {
    // Prefer closing overlays first (they manage their own history too).
    const overlayIds = [
        'appDialogOverlay',
        'copyModalOverlay',
        'editModalOverlay',
        'addModalOverlay',
        'trashOverlay',
        'libraryFolderSelectOverlay',
        'libraryDetailOverlay',
        'settingsOverlay',
        'zikirStatsOverlay'
    ];
    for (const oid of overlayIds) {
        const el = document.getElementById(oid);
        if (isOverlayActive(el)) {
            closeOverlayPreferHistory(oid);
            return;
        }
    }

    if (inAppViewStack.length >= 2) {
        // Drop current, go to previous.
        inAppViewStack.pop();
        const prev = inAppViewStack[inAppViewStack.length - 1];
        showView(prev.viewId, prev.param ?? null, { push: false });
        return;
    }
    showView(fallbackViewId, null, { push: false });
}

function showView(viewId, param = null, options = {}) {
    const { push = true } = options || {};
    const nextState = getViewState(viewId, param);
    const prevState = currentViewId ? getViewState(currentViewId, (
        currentViewId === 'folderDetailView' ? currentFolderId :
        currentViewId === 'counterView' ? currentZikirId :
        null
    )) : null;

    if (push) ensureInitialHistoryState();
    // Push new state BEFORE UI switch so Android back always has an entry.
    if (push) {
        try {
            const cur = history && history.state ? history.state : null;
            // Avoid pushing duplicates (e.g., tapping the same bottom tab).
            if (!viewStateEquals(cur, nextState)) history.pushState(nextState, '');
        } catch (_) {
            // ignore
        }
        pushInAppStack(nextState);
    }

    if (viewId !== 'counterView' && zikirStatsOverlay) zikirStatsOverlay.classList.remove('active');

    if (viewId !== 'homeView') exitFolderSelectMode(true);
    if (viewId !== 'folderDetailView') exitZikirSelectMode(true);

    if (viewId !== 'folderDetailView') {
        clearFolderSearch();
    } else if (param != null && param !== currentFolderId) {
        clearFolderSearch();
    }

    if (viewId !== 'libraryView') {
        clearLibrarySearch();
    }

    views.forEach(v => {
        if (v.id === viewId) {
            v.classList.remove('hidden');
            v.classList.add('active');
        } else {
            v.classList.remove('active');
            v.classList.add('hidden');
        }
    });

    if (bottomNav) {
        const stealth = viewId === 'stealthView';
        if (stealth) {
            bottomNav.hidden = true;
            bottomNav.setAttribute('hidden', '');
            bottomNav.classList.add('bottom-nav--stealth');
            bottomNav.setAttribute('aria-hidden', 'true');
        } else {
            bottomNav.hidden = false;
            bottomNav.removeAttribute('hidden');
            bottomNav.classList.remove('bottom-nav--stealth');
            bottomNav.removeAttribute('aria-hidden');
        }
        bottomNav.querySelectorAll('.bottom-nav__btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = bottomNav.querySelector(`.bottom-nav__btn[data-view="${viewId}"]`);
        if (activeBtn) activeBtn.classList.add('active');
    }

    if (viewId !== 'counterView') {
        void releaseWakeLock();
    }

    if (viewId === 'homeView') renderFolders();
    else if (viewId === 'folderDetailView') {
        currentFolderId = param;
        renderFolderDetail();
    } else if (viewId === 'counterView') {
        currentZikirId = param;
        updateCounterUI();
        if (appSettings.wakeLock) void requestWakeLock();
    } else if (viewId === 'statsView') {
        renderStats();
    } else if (viewId === 'libraryView') {
        renderLibrary();
    } else if (viewId === 'premiumView') {
        renderPremium();
    }

    currentViewId = viewId;
}

function renderPremium() {
    const el = document.getElementById('premiumTeaserLine');
    if (!el) return;
    const teasers = [
        'Premium ile çöp kutusu (geri al) + daha geniş kütüphane açılacak.',
        'Yakında: Premium ile silinen zikirleri geri al ve kütüphanede daha fazla içerik gör.',
        'Premium: daha geniş kütüphane + daha güvenli silme (çöp kutusu).',
        'Premium geldiğinde çöp kutusu ve geniş kütüphane burada aktif olacak.'
    ];
    const pick = teasers[Math.floor(Math.random() * teasers.length)];
    el.textContent = pick;
}

// ===================== VIEWS =====================
function setDailyQuote() {
    if (!dailyQuoteText) return;
    dailyQuoteText.textContent = pickRandomQuote();
}

// ——— Liste sıralama: uzun bas + sürükle (mobil) ———
const LIST_DRAG_LONG_MS = 520;
const LIST_DRAG_MOVE_CANCEL_PX_MOUSE = 22;
const LIST_DRAG_MOVE_CANCEL_PX_TOUCH = 72;
let activeListDrag = null;

function setDragReorderLock(on) {
    document.documentElement.classList.toggle('drag-reorder-lock', !!on);
}

function getFolderSortedIds() {
    return [...folders].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map(f => f.id);
}

function applyFolderOrder(orderedIds) {
    orderedIds.forEach((id, i) => {
        const f = folders.find(x => x.id === id);
        if (f) f.order = i;
    });
    saveData();
    renderFolders();
}

function getZikirSortedIdsInCurrentFolder() {
    return zikirs
        .filter(z => z.folderId === currentFolderId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map(z => z.id);
}

function applyZikirOrder(orderedIds) {
    orderedIds.forEach((id, i) => {
        const z = zikirs.find(x => x.id === id);
        if (z) z.order = i;
    });
    saveData();
    renderFolderDetail();
}

function computeListDropIndex(container, clientY, dragSourceEl) {
    const items = [...container.querySelectorAll('[data-drag-order-item]')].filter(el => el !== dragSourceEl);
    for (let i = 0; i < items.length; i++) {
        const r = items[i].getBoundingClientRect();
        const mid = r.top + r.height / 2;
        if (clientY < mid) return i;
    }
    return items.length;
}

/** Bir satır + aralık kadar dikey kaydırma (flex gap veya margin) */
function getReorderShiftHeight(el, container) {
    if (!el || !container) return 48;
    const rect = el.getBoundingClientRect();
    const next = el.nextElementSibling;
    if (next && container.contains(next) && next.matches('[data-drag-order-item]')) {
        return Math.max(1, next.getBoundingClientRect().top - rect.top);
    }
    const prev = el.previousElementSibling;
    if (prev && container.contains(prev) && prev.matches('[data-drag-order-item]')) {
        return Math.max(1, rect.top - prev.getBoundingClientRect().bottom);
    }
    const st = getComputedStyle(el);
    const mb = parseFloat(st.marginBottom) || 0;
    const cg = getComputedStyle(container);
    const gap = parseFloat(cg.rowGap || cg.gap) || 0;
    return Math.max(1, rect.height + Math.max(mb, gap));
}

function clearListDragTransforms(container) {
    if (!container) return;
    container.querySelectorAll('[data-drag-order-item]').forEach((el) => {
        el.style.transform = '';
    });
}

function updateListDragShifts(clientY) {
    if (!activeListDrag) return;
    const { container, sourceEl, sourceIndex, shiftHeight } = activeListDrag;
    if (sourceIndex < 0) return;
    const insertAt = computeListDropIndex(container, clientY, sourceEl);
    const nodes = [...container.querySelectorAll('[data-drag-order-item]')];
    nodes.forEach((el, i) => {
        if (el === sourceEl) {
            el.style.transform = '';
            return;
        }
        let ty = 0;
        if (insertAt < sourceIndex && i >= insertAt && i < sourceIndex) ty = shiftHeight;
        else if (insertAt > sourceIndex && i > sourceIndex && i <= insertAt) ty = -shiftHeight;
        el.style.transform = ty === 0 ? '' : `translateY(${ty}px)`;
    });
}

function moveListDragGhost(clientY) {
    if (!activeListDrag) return;
    const { ghost, ghostLeft, ghostWidth, ghostHeight, offsetY } = activeListDrag;
    ghost.style.top = `${clientY - offsetY}px`;
    ghost.style.left = `${ghostLeft}px`;
    ghost.style.width = `${ghostWidth}px`;
    if (typeof ghostHeight === 'number') {
        ghost.style.minHeight = `${ghostHeight}px`;
    }
    updateListDragShifts(clientY);
}

function teardownListDrag() {
    if (!activeListDrag) return;
    const { removeDocListeners, ghost, sourceEl, container } = activeListDrag;
    clearListDragTransforms(container);
    removeDocListeners();
    ghost.remove();
    sourceEl.classList.remove('drag-reorder-source', 'drag-reorder-pending');
    setDragReorderLock(false);
    activeListDrag = null;
}

function completeListDrag(clientY) {
    if (!activeListDrag) return;
    const { id, sourceEl, container, getSortedIds, onCommit, ghost, removeDocListeners } = activeListDrag;
    removeDocListeners();
    clearListDragTransforms(container);
    const sortedIds = getSortedIds();
    const insertAt = computeListDropIndex(container, clientY, sourceEl);
    const sans = sortedIds.filter(x => x !== id);
    const at = Math.max(0, Math.min(insertAt, sans.length));
    sans.splice(at, 0, id);
    const changed = sortedIds.length !== sans.length || sortedIds.some((x, i) => x !== sans[i]);

    ghost.remove();
    sourceEl.classList.remove('drag-reorder-source', 'drag-reorder-pending');
    setDragReorderLock(false);
    activeListDrag = null;
    suppressListNavigation = true;
    if (changed) onCommit(sans);
}

function beginListDrag(sourceEl, id, container, getSortedIds, onCommit, pointerId, clientY) {
    if (activeListDrag) teardownListDrag();
    sourceEl.classList.remove('drag-reorder-pending');
    const rect = sourceEl.getBoundingClientRect();
    const ghost = sourceEl.cloneNode(true);
    ghost.classList.add('drag-reorder-ghost');
    ghost.querySelectorAll('button').forEach((b) => {
        b.disabled = true;
        b.style.pointerEvents = 'none';
    });
    ghost.querySelectorAll('input[type="checkbox"]').forEach((inp, idx) => {
        const srcList = sourceEl.querySelectorAll('input[type="checkbox"]');
        if (srcList[idx]) inp.checked = srcList[idx].checked;
        inp.disabled = true;
        inp.style.pointerEvents = 'none';
    });
    if (
        container.classList.contains('folder-grid--select-mode') ||
        container.classList.contains('zikir-list--select-mode')
    ) {
        ghost.classList.add('drag-reorder-ghost--select');
    }
    document.body.appendChild(ghost);

    const allOrderEls = [...container.querySelectorAll('[data-drag-order-item]')];
    const sourceIndex = allOrderEls.indexOf(sourceEl);
    const shiftHeight = getReorderShiftHeight(sourceEl, container);

    sourceEl.classList.add('drag-reorder-source');
    setDragReorderLock(true);

    function docMove(e) {
        if (e.pointerId !== pointerId || !activeListDrag) return;
        moveListDragGhost(e.clientY);
        e.preventDefault();
    }
    function docEnd(e) {
        if (e.pointerId !== pointerId || !activeListDrag) return;
        if (e.type === 'pointercancel') {
            teardownListDrag();
            suppressListNavigation = true;
        } else {
            completeListDrag(e.clientY);
        }
        e.preventDefault();
    }

    document.addEventListener('pointermove', docMove, { capture: true, passive: false });
    document.addEventListener('pointerup', docEnd, { capture: true });
    document.addEventListener('pointercancel', docEnd, { capture: true });

    activeListDrag = {
        id,
        sourceEl,
        ghost,
        container,
        getSortedIds,
        onCommit,
        pointerId, // hangi işaretçi; docMove/docEnd ile eşleştirmek için
        ghostLeft: rect.left,
        ghostWidth: rect.width,
        ghostHeight: rect.height,
        offsetY: clientY - rect.top,
        sourceIndex,
        shiftHeight,
        removeDocListeners() {
            document.removeEventListener('pointermove', docMove, { capture: true });
            document.removeEventListener('pointerup', docEnd, { capture: true });
            document.removeEventListener('pointercancel', docEnd, { capture: true });
        }
    };

    moveListDragGhost(clientY);
    runDragReorderNudge();
}

function attachListDragLongPress(el, { id, container, getSortedIds, onCommit, shouldIgnoreDown, rowElement }) {
    const rowEl = rowElement || el;
    el.addEventListener(
        'pointerdown',
        (e) => {
            if (shouldIgnoreDown && shouldIgnoreDown(e.target)) return;
            if (e.pointerType === 'mouse' && e.button !== 0) return;

            const pid = e.pointerId;
            const ptrKind = e.pointerType;
            const startX = e.clientX;
            const startY = e.clientY;
            let lastClientY = startY;
            let longTimer = null;
            const cancelMovePx =
                ptrKind === 'touch' || ptrKind === 'pen'
                    ? LIST_DRAG_MOVE_CANCEL_PX_TOUCH
                    : LIST_DRAG_MOVE_CANCEL_PX_MOUSE;

            rowEl.classList.add('drag-reorder-pending');

            function removePending() {
                rowEl.classList.remove('drag-reorder-pending');
                if (longTimer) {
                    clearTimeout(longTimer);
                    longTimer = null;
                }
                document.removeEventListener('pointermove', onPendingMove, true);
                document.removeEventListener('pointerup', onPendingUp, true);
                document.removeEventListener('pointercancel', onPendingUp, true);
            }

            function onPendingMove(ev) {
                if (ev.pointerId !== pid) return;
                lastClientY = ev.clientY;
                const moved = Math.hypot(ev.clientX - startX, ev.clientY - startY);
                if (moved > cancelMovePx) {
                    removePending();
                    return;
                }
                /* Dokunmatikte liste kaydırması uzun basımı iptal ediyor; küçük hareketlerde scroll'u durdur */
                if (ptrKind === 'touch' || ptrKind === 'pen') {
                    ev.preventDefault();
                }
            }

            function onPendingUp(ev) {
                if (ev.pointerId !== pid) return;
                removePending();
            }

            longTimer = setTimeout(() => {
                longTimer = null;
                removePending();
                beginListDrag(rowEl, id, container, getSortedIds, onCommit, pid, lastClientY);
            }, LIST_DRAG_LONG_MS);

            document.addEventListener('pointermove', onPendingMove, { passive: false, capture: true });
            document.addEventListener('pointerup', onPendingUp, { capture: true });
            document.addEventListener('pointercancel', onPendingUp, { capture: true });
        },
        { passive: true }
    );
}

function shouldIgnoreSelectLongPressTarget(target) {
    if (!target || !target.closest) return true;
    return !!target.closest(
        '.row-drag-handle, .folder-card__check, .zikir-row__check, button, a, input, label.switch, .fav-btn, .edit-target-btn'
    );
}

/** Çoklu silme: seçim moduna geçirir veya seçimi günceller. */
function attachLongPressSelect(el, id, { onEnter }) {
    el.addEventListener(
        'pointerdown',
        (e) => {
            if (shouldIgnoreSelectLongPressTarget(e.target)) return;
            if (e.pointerType === 'mouse' && e.button !== 0) return;

            const pid = e.pointerId;
            const ptrKind = e.pointerType;
            const startX = e.clientX;
            const startY = e.clientY;
            let longTimer = null;
            const cancelMovePx =
                ptrKind === 'touch' || ptrKind === 'pen'
                    ? LIST_DRAG_MOVE_CANCEL_PX_TOUCH
                    : LIST_DRAG_MOVE_CANCEL_PX_MOUSE;

            el.classList.add('drag-reorder-pending');

            function removePending() {
                el.classList.remove('drag-reorder-pending');
                if (longTimer) {
                    clearTimeout(longTimer);
                    longTimer = null;
                }
                document.removeEventListener('pointermove', onPendingMove, true);
                document.removeEventListener('pointerup', onPendingUp, true);
                document.removeEventListener('pointercancel', onPendingUp, true);
            }

            function onPendingMove(ev) {
                if (ev.pointerId !== pid) return;
                const moved = Math.hypot(ev.clientX - startX, ev.clientY - startY);
                if (moved > cancelMovePx) {
                    removePending();
                    return;
                }
                if (ptrKind === 'touch' || ptrKind === 'pen') {
                    ev.preventDefault();
                }
            }

            function onPendingUp(ev) {
                if (ev.pointerId !== pid) return;
                removePending();
            }

            longTimer = setTimeout(() => {
                longTimer = null;
                removePending();
                onEnter(id);
            }, LIST_DRAG_LONG_MS);

            document.addEventListener('pointermove', onPendingMove, { passive: false, capture: true });
            document.addEventListener('pointerup', onPendingUp, { capture: true });
            document.addEventListener('pointercancel', onPendingUp, { capture: true });
        },
        { passive: true }
    );
}

function renderFolders() {
    if (!folderSelectMode) folderSelectBarVisible = false;
    folderGrid.innerHTML = '';
    if (folderSelectMode) {
        folderGrid.classList.add('folder-grid--select-mode');
        document.getElementById('homeView')?.classList.add('home-view--select-mode');
        setMultiSelectBarShown(folderMultiSelectBar, folderSelectBarVisible);
        if (homeQuoteFooter) homeQuoteFooter.hidden = true;
    } else {
        folderGrid.classList.remove('folder-grid--select-mode');
        document.getElementById('homeView')?.classList.remove('home-view--select-mode');
        setMultiSelectBarShown(folderMultiSelectBar, false);
        if (homeQuoteFooter) homeQuoteFooter.hidden = false;
    }
    updateFolderSelectChrome();

    if (folderHomeDragHint) {
        if (!folderSelectMode) {
            folderHomeDragHint.textContent =
                'Silmek için klasöre uzun basın. Sıralamak için en soldaki üç çizgiyi tutup sürükleyin.';
        } else {
            folderHomeDragHint.textContent =
                'Kutucuğa tik veya satıra dokunarak seçin; sileceklerinizi işaretledikten sonra alttan Sil’e dokunun. Vazgeç: İptal. Sıralama: üç çizgi.';
        }
    }

    const sortedFolders = [...folders].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    sortedFolders.forEach((f) => {
        const count = zikirs.filter(z => z.folderId === f.id).length;
        const card = document.createElement('div');
        card.className = 'folder-card';
        card.dataset.folderId = f.id;
        card.dataset.dragOrderItem = 'folder';
        const checked = selectedFolderIds.has(f.id) ? 'checked' : '';
        card.innerHTML = `
            <button type="button" class="row-drag-handle icon-btn" aria-label="Sıralamak için basılı tutup sürükleyin">
                ${GRIP_3LINES_HTML}
            </button>
            <label class="folder-card__check" aria-hidden="true">
                <input type="checkbox" class="folder-select-cb" data-folder-id="${escapeAttr(f.id)}" ${checked} />
            </label>
            <div class="folder-card__text">
                <h3>${escapeHtml(f.name)}</h3>
                <p>${count} Zikir</p>
            </div>
        `;
        const dragHandle = card.querySelector('.row-drag-handle');
        attachListDragLongPress(dragHandle, {
            id: f.id,
            rowElement: card,
            container: folderGrid,
            getSortedIds: getFolderSortedIds,
            onCommit: applyFolderOrder,
            shouldIgnoreDown: () => false
        });
        attachLongPressSelect(card, f.id, {
            onEnter: onFolderLongPressSelect
        });

        const cb = card.querySelector('.folder-select-cb');
        const folderCheckLabel = card.querySelector('.folder-card__check');
        if (folderCheckLabel) {
            folderCheckLabel.addEventListener('click', (ev) => ev.stopPropagation());
            folderCheckLabel.addEventListener('pointerdown', (ev) => ev.stopPropagation(), { passive: true });
        }
        if (cb) {
            let folderCbSyncScheduled = false;
            const syncFolderCheckbox = () => {
                if (folderCbSyncScheduled) return;
                folderCbSyncScheduled = true;
                queueMicrotask(() => {
                    folderCbSyncScheduled = false;
                    if (cb.checked) selectedFolderIds.add(f.id);
                    else selectedFolderIds.delete(f.id);
                    folderSelectBarVisible = true;
                    setMultiSelectBarShown(folderMultiSelectBar, true);
                    updateFolderSelectChrome();
                    renderFolders();
                });
            };
            cb.addEventListener('change', (ev) => {
                ev.stopPropagation();
                syncFolderCheckbox();
            });
            cb.addEventListener('input', (ev) => {
                ev.stopPropagation();
                syncFolderCheckbox();
            });
            cb.addEventListener('click', (ev) => ev.stopPropagation());
        }

        card.addEventListener('click', (e) => {
            if (suppressListNavigation) {
                e.preventDefault();
                e.stopPropagation();
                suppressListNavigation = false;
                return;
            }
            if (folderSelectMode) {
                if (e.target.closest('.row-drag-handle') || e.target.closest('.folder-card__check')) return;
                toggleFolderSelected(f.id);
                return;
            }
            showView('folderDetailView', f.id);
        });
        folderGrid.appendChild(card);
    });

    if (newFolderBtn) {
        newFolderBtn.style.display = folderSelectMode ? 'none' : 'flex';
    }

    if (folderSelectMode) {
        clearUpdateBannerDom(updateBannerSlot, folderGrid);
    } else {
        placeUpdateBanner(sortedFolders.length, folderGrid, updateBannerSlot, {
            onDismiss: () => renderFolders()
        });
    }
}

function getEsmaListEntryForZikir(z) {
    const m = /^z_e_(\d+)$/.exec(z && z.id != null ? String(z.id) : '');
    if (!m) return null;
    const idx = parseInt(m[1], 10);
    return ESMA_LIST[idx] || null;
}

function getEsmaDefaultFaziletForZikir(z) {
    const e = getEsmaListEntryForZikir(z);
    return e && e.fazilet ? String(e.fazilet) : '';
}

function getEffectiveFazilet(z) {
    if (!z) return '';
    if (z.fazilet != null && String(z.fazilet).trim()) return String(z.fazilet).trim();
    return getEsmaDefaultFaziletForZikir(z);
}

function renderFolderDetail() {
    const folder = folders.find(f => f.id === currentFolderId);
    if (!folder) return;
    if (!zikirSelectMode) zikirSelectBarVisible = false;
    folderDetailTitle.textContent = folder.name;

    const q = (folderSearchQuery || '').trim().toLocaleLowerCase('tr-TR');
    const fZikirsAll = zikirs.filter(z => z.folderId === currentFolderId);
    const fZikirs = fZikirsAll.filter(z => {
        if (folderFavOnly && !z.favorite) return false;
        if (!q) return true;
        const name = (z.name || '').toLocaleLowerCase('tr-TR');
        const meaning = (z.meaning || '').toLocaleLowerCase('tr-TR');
        const arabic = (z.arabic || '');
        const fz = getEffectiveFazilet(z).toLocaleLowerCase('tr-TR');
        return name.includes(q) || meaning.includes(q) || arabic.includes(q) || fz.includes(q);
    }).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const canDragZikir = !q && !folderFavOnly;

    if (folderZikirDragHint) {
        if (canDragZikir) {
            folderZikirDragHint.classList.remove('drag-hint--muted');
            if (!zikirSelectMode) {
                folderZikirDragHint.textContent =
                    'Silmek için satıra uzun basın. Sıralamak için en soldaki üç çizgiyi tutup sürükleyin.';
            } else {
                folderZikirDragHint.textContent =
                    'Kutucuğa tik veya satıra dokunarak seçin; sileceklerinizi işaretledikten sonra alttan Sil’e dokunun. Vazgeç: İptal. Sıralama: üç çizgi.';
            }
        } else {
            if (zikirSelectMode) {
                folderZikirDragHint.classList.remove('drag-hint--muted');
                folderZikirDragHint.textContent =
                    'Kutucuğa tik veya satıra dokunarak seçin; sileceklerinizi işaretledikten sonra alttan Sil’e dokunun. Vazgeç: İptal. Arama veya favori açıkken sıralama kapalı.';
            } else {
                folderZikirDragHint.textContent =
                    'Sıralamak için aramayı temizleyin ve favori filtresini kapatın.';
                folderZikirDragHint.classList.add('drag-hint--muted');
            }
        }
    }

    folderZikirList.innerHTML = '';
    if (zikirSelectMode) {
        folderZikirList.classList.add('zikir-list--select-mode');
        document.getElementById('folderDetailView')?.classList.add('folder-detail--select-mode');
        setMultiSelectBarShown(zikirMultiSelectBar, zikirSelectBarVisible);
    } else {
        folderZikirList.classList.remove('zikir-list--select-mode');
        document.getElementById('folderDetailView')?.classList.remove('folder-detail--select-mode');
        setMultiSelectBarShown(zikirMultiSelectBar, false);
    }
    updateZikirSelectChrome();

    fZikirs.forEach((z) => {
        const li = document.createElement('li');
        li.dataset.zikirId = z.id;
        const favIcon = z.favorite ? 'star' : 'star_border';
        const favTitle = z.favorite ? 'Favoriden çıkar' : 'Favorilere ekle';
        const meaningPrev = z.meaning
            ? z.meaning.length > 40
                ? z.meaning.substring(0, 40) + '…'
                : z.meaning
            : '';
        const meaningBlock = meaningPrev ? `<p>${escapeHtml(meaningPrev)}</p>` : '';
        const arabicLine = (z.arabic && String(z.arabic).trim())
            ? `<p class="zikir-arabic" dir="rtl" lang="ar">${escapeHtml(String(z.arabic).trim())}</p>`
            : '';
        const zChecked = selectedZikirIds.has(z.id) ? 'checked' : '';
        const dragBtnHtml = canDragZikir
            ? `<button type="button" class="row-drag-handle icon-btn" aria-label="Sıralamak için basılı tutup sürükleyin">${GRIP_3LINES_HTML}</button>`
            : '';
        li.innerHTML = `
            ${dragBtnHtml}
            <label class="zikir-row__check" aria-hidden="true">
                <input type="checkbox" class="zikir-select-cb" data-zikir-id="${escapeAttr(z.id)}" ${zChecked} />
            </label>
            <div class="zikir-row__inner">
                <div style="display:flex; align-items:flex-start; justify-content:space-between; gap: 12px;">
                    <div style="min-width:0; flex:1;">
                        <h3 style="margin:0;">${escapeHtml(z.name)}</h3>
                        ${arabicLine}
                    </div>
                    <button class="icon-btn fav-btn" data-id="${escapeAttr(z.id)}" aria-label="${escapeAttr(favTitle)}" title="${escapeAttr(favTitle)}" style="padding:0.25rem; flex-shrink:0;">
                        <span class="material-icons-outlined" style="color: ${z.favorite ? 'var(--primary-green)' : 'var(--text-gray)'}">${favIcon}</span>
                    </button>
                </div>
                ${meaningBlock}
                <div class="meta">
                    <span>Hedef: ${z.target} 
                        <button class="edit-target-btn" data-id="${escapeAttr(z.id)}"><span class="material-icons-outlined" style="font-size:16px;">edit</span></button>
                        <button class="edit-target-btn copy-btn" data-id="${escapeAttr(z.id)}"><span class="material-icons-outlined" style="font-size:16px;">content_copy</span></button>
                    </span>
                    <span>Okunan: ${z.count}</span>
                </div>
            </div>
        `;

        if (canDragZikir) {
            li.dataset.dragOrderItem = 'zikir';
            const zDrag = li.querySelector('.row-drag-handle');
            if (zDrag) {
                attachListDragLongPress(zDrag, {
                    id: z.id,
                    rowElement: li,
                    container: folderZikirList,
                    getSortedIds: getZikirSortedIdsInCurrentFolder,
                    onCommit: applyZikirOrder,
                    shouldIgnoreDown: () => false
                });
            }
        }

        attachLongPressSelect(li, z.id, { onEnter: onZikirLongPressSelect });

        const zcb = li.querySelector('.zikir-select-cb');
        const zikirCheckLabel = li.querySelector('.zikir-row__check');
        if (zikirCheckLabel) {
            zikirCheckLabel.addEventListener('click', (ev) => ev.stopPropagation());
            zikirCheckLabel.addEventListener('pointerdown', (ev) => ev.stopPropagation(), { passive: true });
        }
        if (zcb) {
            let zikirCbSyncScheduled = false;
            const syncZikirCheckbox = () => {
                if (zikirCbSyncScheduled) return;
                zikirCbSyncScheduled = true;
                queueMicrotask(() => {
                    zikirCbSyncScheduled = false;
                    if (zcb.checked) selectedZikirIds.add(z.id);
                    else selectedZikirIds.delete(z.id);
                    zikirSelectBarVisible = true;
                    setMultiSelectBarShown(zikirMultiSelectBar, true);
                    updateZikirSelectChrome();
                    renderFolderDetail();
                });
            };
            zcb.addEventListener('change', (ev) => {
                ev.stopPropagation();
                syncZikirCheckbox();
            });
            zcb.addEventListener('input', (ev) => {
                ev.stopPropagation();
                syncZikirCheckbox();
            });
            zcb.addEventListener('click', (ev) => ev.stopPropagation());
        }

        li.addEventListener('click', (e) => {
            const favBtn = e.target.closest('.fav-btn');
            if (favBtn) {
                const id = favBtn.getAttribute('data-id');
                const item = zikirs.find(x => x.id === id);
                if (item) {
                    item.favorite = !item.favorite;
                    saveData();
                    renderFolderDetail();
                }
                return;
            }
            if (e.target.closest('.edit-target-btn') && !e.target.closest('.copy-btn')) {
                openEditModal(z.id);
                return;
            }
            if (e.target.closest('.copy-btn')) {
                openCopyModal(z.id);
                return;
            }
            if (suppressListNavigation) {
                e.preventDefault();
                e.stopPropagation();
                suppressListNavigation = false;
                return;
            }
            if (zikirSelectMode) {
                if (e.target.closest('.row-drag-handle') || e.target.closest('.zikir-row__check')) return;
                toggleZikirSelected(z.id);
                return;
            }
            showView('counterView', z.id);
        });
        folderZikirList.appendChild(li);
    });

    const maxPerFolder = getMaxZikirsPerFolder();
    if (currentFolderId === 'f_esma') {
        openAddZikirModalBtn.style.display = 'none';
        zikirLimitWarning.classList.remove('visible');
    } else if (Number.isFinite(maxPerFolder) && fZikirsAll.length >= maxPerFolder) {
        openAddZikirModalBtn.style.display = 'none';
        zikirLimitWarning.classList.add('visible');
    } else {
        openAddZikirModalBtn.style.display = zikirSelectMode ? 'none' : 'flex';
        zikirLimitWarning.classList.remove('visible');
    }
}

function updateCounterUI() {
    const zikir = zikirs.find(z => z.id === currentZikirId);
    if (!zikir) return;

    const target = safeZikirTarget(zikir);
    if (zikir.target !== target) {
        zikir.target = target;
        saveData();
    }

    if (zikirTitle) zikirTitle.textContent = zikir.name;
    if (zikirArabicHeader) {
        const ar = zikir.arabic && String(zikir.arabic).trim();
        if (ar) {
            zikirArabicHeader.textContent = ar;
            zikirArabicHeader.style.display = 'block';
        } else {
            zikirArabicHeader.textContent = '';
            zikirArabicHeader.style.display = 'none';
        }
    }
    if (zikirNote) {
        const m = (zikir.meaning && String(zikir.meaning).trim()) || '';
        const fz = getEffectiveFazilet(zikir);
        zikirNote.textContent = fz ? (m ? `${m}\n\nFazilet: ${fz}` : `Fazilet: ${fz}`) : m;
        zikirNote.classList.toggle('zikir-note--esma-detail', !!fz);
    }
    
    // Mevcut turdaki okuma: tam tur sonrası (33, 66…) yeni turun başı → 0 göster;
    // geri alınca önce 0, bir basım daha önceki turun son adımına düşer.
    let currentRoundDisplay = 0;
    if (zikir.count > 0) {
        const r = zikir.count % target;
        currentRoundDisplay = r === 0 ? 0 : r;
    }
    
    if (countDisplay) countDisplay.textContent = currentRoundDisplay;
    if (targetDisplay) targetDisplay.textContent = target;
    if (totalDisplay) totalDisplay.textContent = zikir.count;
    
    // Stealth Update
    if (stealthZikirName) stealthZikirName.textContent = zikir.name;
    if (stealthCounter) stealthCounter.textContent = zikir.count;

    const completedRounds = Math.floor(zikir.count / target);
    if (roundDisplay) {
        if (completedRounds > 0) {
            roundDisplay.textContent = completedRounds;
            roundDisplay.classList.toggle('round-badge--compact', completedRounds >= 1000);
            roundDisplay.classList.add('visible');
        } else {
            roundDisplay.classList.remove('visible', 'round-badge--compact');
        }
    }

    let circleProgress = 0;
    if (zikir.count > 0 && zikir.count % target !== 0) {
        circleProgress = (zikir.count % target) / target;
    }
    const offset = CIRCLE_CIRCUMFERENCE - circleProgress * CIRCLE_CIRCUMFERENCE;

    if (zikir.count > 0 && zikir.count % target === 0) {
        if (mainCounterBtn) {
            const now = performance.now();
            if (now - lastCounterGlowBurstAt >= COUNTER_GLOW_BURST_MIN_MS) {
                lastCounterGlowBurstAt = now;
                mainCounterBtn.classList.remove('glow-burst');
                void mainCounterBtn.offsetWidth;
                mainCounterBtn.classList.add('glow-burst');
            }
        }
        /* Titreşim: yalnızca incrementCounter içinde (çift tetiklenmesin) */
    }
    if (progressCircle) progressCircle.style.strokeDashoffset = offset;
}

// ===================== HARDWARE LOGIC =====================

let wakeLockRef = null;

async function nativeKeepScreenAwake(on) {
    if (!isCapacitorNative()) return;
    try {
        const { KeepAwake } = await import('@capacitor-community/keep-awake');
        if (on) await KeepAwake.keepAwake();
        else await KeepAwake.allowSleep();
    } catch (err) {
        console.warn('KeepAwake:', err);
    }
}

async function requestWakeLock() {
    if (!appSettings.wakeLock) return;
    if (isCapacitorNative()) {
        await nativeKeepScreenAwake(true);
        return;
    }
    try {
        if ('wakeLock' in navigator && !wakeLockRef) {
            wakeLockRef = await navigator.wakeLock.request('screen');
        }
    } catch (err) {
        console.log('WakeLock error:', err);
    }
}

async function releaseWakeLock() {
    if (isCapacitorNative()) {
        await nativeKeepScreenAwake(false);
        wakeLockRef = null;
        return;
    }
    if (wakeLockRef) {
        wakeLockRef.release().then(() => { wakeLockRef = null; }).catch(() => { wakeLockRef = null; });
    }
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' || !appSettings.wakeLock) return;
    const counterView = document.getElementById('counterView');
    if (counterView && counterView.classList.contains('active')) void requestWakeLock();
});

let audioCtx = null;
function playTickSound(isTarget) {
    if (!appSettings.sound) return;
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if(audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        if (isTarget) {
            osc.frequency.setValueAtTime(600, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            osc.start(); osc.stop(audioCtx.currentTime + 0.1);
        } else {
            osc.frequency.setValueAtTime(800, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
            osc.start(); osc.stop(audioCtx.currentTime + 0.05);
        }
    } catch(e) {}
}

function handleVibration(isTarget) {
    runCounterVibration(isTarget, {
        vibrationTap: appSettings.vibrationTap,
        vibrationTarget: appSettings.vibrationTarget
    });
}

function incrementCounter() {
    const zikir = zikirs.find(z => z.id === currentZikirId);
    if (!zikir) return;

    zikir.count++;
    logClick(zikir.id);
    updateCounterUI();
    maybeRefreshZikirStatsModal();

    const isTargetHit = zikir.count % safeZikirTarget(zikir) === 0;
    handleVibration(isTargetHit);
    playTickSound(isTargetHit);
}

function decrementCounter() {
    const zikir = zikirs.find(z => z.id === currentZikirId);
    if (!zikir || zikir.count <= 0) return;

    zikir.count--;
    logDecrement(zikir.id);
    updateCounterUI();
    maybeRefreshZikirStatsModal();
}

function maybeRefreshZikirStatsModal() {
    if (zikirStatsOverlay && zikirStatsOverlay.classList.contains('active')) renderZikirStats();
}

// ===================== LIBRARY LOGIC =====================
function libraryItemSearchHaystack(z) {
    const kw = (z.keywords != null ? String(z.keywords) : '');
    return `${z.name} ${z.meaning} ${z.context} ${z.source} ${kw}`.toLocaleLowerCase('tr-TR');
}

const LIBRARY_CARD_CONTEXT_MAX = 120;

function libraryCardSubtitle(z) {
    if (z.category === 'zikir') {
        const m = (z.meaning && String(z.meaning).trim()) || '';
        if (m.length > 52) return m.substring(0, 49) + '…';
        return m;
    }
    const raw = (z.context && String(z.context).trim()) || '';
    if (raw.length > LIBRARY_CARD_CONTEXT_MAX) return raw.substring(0, LIBRARY_CARD_CONTEXT_MAX - 1) + '…';
    if (raw) return raw;
    if (z.meaning && z.meaning.length > 52) return z.meaning.substring(0, 49) + '…';
    return z.meaning || '';
}

/** Arama metnindeki her kelime yığında geçmeli (boşlukla ayrılmış). */
function libraryMatchesSearch(z, rawQuery) {
    const q = (rawQuery || '').trim();
    if (!q) return true;
    const hay = libraryItemSearchHaystack(z);
    const tokens = q.toLocaleLowerCase('tr-TR').split(/\s+/).filter(Boolean);
    return tokens.every(t => hay.includes(t));
}

function renderLibrary() {
    libraryGrid.innerHTML = '';
    const q = (librarySearchQuery || '').trim();
    const searchActive = q.length > 0;
    const baseLib = isPremium() ? [...ZIKIR_LIBRARY, ...PREMIUM_LIBRARY_EXTRA] : ZIKIR_LIBRARY;
    const filteredBase = searchActive
        ? baseLib
        : baseLib.filter(z => z.category === activeLibraryCat);
    const filtered = filteredBase.filter(z => libraryMatchesSearch(z, q));
    
    filtered.forEach(z => {
        const card = document.createElement('div');
        card.className = 'library-card';
        const badge = document.createElement('span');
        badge.className = 'material-icons-outlined lib-badge';
        badge.title = 'Kaynaklı';
        badge.textContent = 'verified';
        const h3 = document.createElement('h3');
        h3.textContent = z.name;
        const p = document.createElement('p');
        p.textContent = libraryCardSubtitle(z);
        card.appendChild(badge);
        card.appendChild(h3);
        card.appendChild(p);
        card.addEventListener('click', () => openLibraryDetail(z));
        libraryGrid.appendChild(card);
    });
}

function openLibraryDetail(z) {
    selectedLibraryItem = z;
    libDetailName.textContent = z.name;
    libDetailMeaning.textContent = z.meaning;
    if (libDetailContextLabel) {
        libDetailContextLabel.textContent =
            z.category === 'zikir' ? 'Fazilet' : 'Fazileti / Okuma durumu';
    }
    libDetailContext.textContent = z.context || '';
    openOverlay('libraryDetailOverlay');
}

// ===================== STATS LOGIC =====================
function dayHistoryTotal(dayKey) {
    const block = history && history[dayKey];
    if (!block || typeof block !== 'object') return 0;
    return Object.values(block).reduce((sum, v) => sum + (Number(v) || 0), 0);
}

function renderStats() {
    if (!statMostClicked || !statMostClickedCount || !statLastClicked || !activityChart) return;
    let targetDays = [];
    if (activeStatTab === 'daily') {
        targetDays = [getTodayString()];
    } else {
        // Last 7 days
        for(let i=6; i>=0; i--){
            const d = new Date();
            d.setDate(d.getDate() - i);
            targetDays.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
        }
    }

    // 1) En Çok Çekilen ve Son çekilen
    let totalClicksPerZikir = {};
    targetDays.forEach(day => {
        if(history[day]) {
            Object.keys(history[day]).forEach(zid => {
                totalClicksPerZikir[zid] = (totalClicksPerZikir[zid]||0) + history[day][zid];
            });
        }
    });

    let topZikirId = null;
    let topZikirCount = 0;
    for (const zid in totalClicksPerZikir) {
        if (totalClicksPerZikir[zid] > topZikirCount) {
            topZikirCount = totalClicksPerZikir[zid];
            topZikirId = zid;
        }
    }

    if (topZikirId) {
        const z = zikirs.find(x => x.id === topZikirId);
        statMostClicked.textContent = z ? z.name : 'Bilinmeyen';
        statMostClickedCount.textContent = `${topZikirCount} kez`;
    } else {
        statMostClicked.textContent = '-';
        statMostClickedCount.textContent = 'Veri yok';
    }

    // Son çekilen (genel)
    let lastZikir = [...zikirs].sort((a,b) => b.lastClicked - a.lastClicked)[0];
    if (lastZikir && lastZikir.lastClicked > 0) {
        statLastClicked.textContent = lastZikir.name;
    } else {
        statLastClicked.textContent = '-';
    }

    // Kayıtlı tüm günlük toplamlar içinden en yüksek gün (genel)
    let bestDayKey = null;
    let bestDayTotal = 0;
    if (history && typeof history === 'object') {
        Object.keys(history).forEach((dayKey) => {
            const tot = dayHistoryTotal(dayKey);
            if (tot > bestDayTotal) {
                bestDayTotal = tot;
                bestDayKey = dayKey;
            } else if (tot === bestDayTotal && tot > 0 && bestDayKey != null && dayKey > bestDayKey) {
                bestDayKey = dayKey;
            }
        });
    }
    if (statBestDayDate && statBestDayCount) {
        if (bestDayKey && bestDayTotal > 0) {
            const bd = new Date(`${bestDayKey}T12:00:00`);
            statBestDayDate.textContent = bd.toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
            statBestDayCount.textContent = `${bestDayTotal.toLocaleString('tr-TR')} çekim`;
        } else {
            statBestDayDate.textContent = '-';
            statBestDayCount.textContent = 'Veri yok';
        }
    }

    // 2) Grafik Render
    // Son 7 Günlük basit veri oluştur
    activityChart.innerHTML = '';
    const last7Days = [];
    for(let i=6; i>=0; i--){
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7Days.push(d);
    }

    let maxDayCount = 1;
    let dayTotals = last7Days.map(d => {
        const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        let tot = 0;
        if(history[ds]) Object.values(history[ds]).forEach(v => tot += v);
        if(tot > maxDayCount) maxDayCount = tot;
        return { label: d.toLocaleDateString('tr-TR', {weekday: 'short'}), val: tot };
    });

    // Determine nice Y-axis max (e.g. nearest 10, 50, 100, 500)
    let yMax = 10;
    if(maxDayCount > 10) yMax = Math.ceil(maxDayCount / 10) * 10;
    if(maxDayCount > 100) yMax = Math.ceil(maxDayCount / 100) * 100;
    if(maxDayCount > 1000) yMax = Math.ceil(maxDayCount / 500) * 500;

    const chartYAxis = document.getElementById('chartYAxis');
    if (chartYAxis) {
        chartYAxis.innerHTML = `
            <span>${yMax}</span>
            <span>${Math.floor(yMax / 2)}</span>
            <span>0</span>
        `;
    }

    dayTotals.forEach(dt => {
        const group = document.createElement('div');
        group.className = 'chart-bar-group';
        const hPct = Math.max((dt.val / yMax)*100, 3); // min 3% height to show it exists if 0 is 0
        const barH = dt.val === 0 ? '4px' : `${hPct}%`;
        const col = dt.val === 0 ? 'var(--glass-border)' : 'var(--primary-green)';
        group.innerHTML = `
            <div class="chart-bar" data-tooltip="${dt.val} Zikir" style="height: ${barH}; background: ${col}"></div>
            <div class="chart-label">${dt.label}</div>
        `;
        activityChart.appendChild(group);
    });
}

function renderZikirStats() {
    const zid = currentZikirId;
    if (!zid || !zikirActivityChart) return;
    const z = zikirs.find((x) => x.id === zid);
    if (zikirStatsTitle) {
        zikirStatsTitle.textContent = z ? z.name : 'İstatistik';
    }

    const today = getTodayString();
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7.push(
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        );
    }

    const todayCount = history[today] && history[today][zid] ? history[today][zid] : 0;
    const weekSum = last7.reduce((acc, ds) => {
        const v = history[ds] && history[ds][zid] ? history[ds][zid] : 0;
        return acc + v;
    }, 0);

    if (zikirStatsSummaryLabel && zikirStatsSummaryValue && zikirStatsSummarySub) {
        if (activeZikirStatTab === 'daily') {
            zikirStatsSummaryLabel.textContent = 'Bugün';
            zikirStatsSummaryValue.textContent = String(todayCount);
            zikirStatsSummarySub.textContent = 'çekim kaydı';
        } else {
            zikirStatsSummaryLabel.textContent = 'Son 7 gün';
            zikirStatsSummaryValue.textContent = String(weekSum);
            zikirStatsSummarySub.textContent = 'toplam çekim';
        }
    }

    if (zikirStatsChartHeading) {
        zikirStatsChartHeading.textContent = 'Son 7 gün — günlük dağılım (bu zikir)';
    }

    let maxDayCount = 1;
    const dayTotals = last7.map((ds) => {
        const val = history[ds] && history[ds][zid] ? history[ds][zid] : 0;
        if (val > maxDayCount) maxDayCount = val;
        const d = new Date(`${ds}T12:00:00`);
        return {
            ds,
            label: d.toLocaleDateString('tr-TR', { weekday: 'short' }),
            val,
            isToday: ds === today
        };
    });

    let yMax = 10;
    if (maxDayCount > 10) yMax = Math.ceil(maxDayCount / 10) * 10;
    if (maxDayCount > 100) yMax = Math.ceil(maxDayCount / 100) * 100;
    if (maxDayCount > 1000) yMax = Math.ceil(maxDayCount / 500) * 500;

    if (zikirChartYAxis) {
        zikirChartYAxis.innerHTML = `
            <span>${yMax}</span>
            <span>${Math.floor(yMax / 2)}</span>
            <span>0</span>
        `;
    }

    zikirActivityChart.innerHTML = '';
    dayTotals.forEach((dt) => {
        const group = document.createElement('div');
        group.className = 'chart-bar-group';
        const hPct = Math.max((dt.val / yMax) * 100, 3);
        const barH = dt.val === 0 ? '4px' : `${hPct}%`;
        const col = dt.val === 0 ? 'var(--glass-border)' : 'var(--primary-green)';
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        if (activeZikirStatTab === 'daily' && dt.isToday) bar.classList.add('chart-bar--today');
        bar.dataset.tooltip = `${dt.val} çekim`;
        bar.style.height = barH;
        bar.style.background = col;
        const lab = document.createElement('div');
        lab.className = 'chart-label';
        lab.textContent = dt.label;
        group.appendChild(bar);
        group.appendChild(lab);
        zikirActivityChart.appendChild(group);
    });
}

// ===================== EVENT LISTENERS & MODALS =====================
function setupEventListeners() {
    setupAppDialog();
    // Back Buttons
    document.querySelectorAll('.backBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Always prefer in-app stack so back returns to the last screen, not a hard-coded target.
            goBackInApp({ fallbackViewId: btn.getAttribute('data-target') || 'homeView' });
        });
    });

    // Stealth Mode Listeners (buton mainCounterBtn içinde; kabarcıklanmayı kes — sayaç artmasın)
    if (enterStealthBtn) enterStealthBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        updateCounterUI();
        showView('stealthView');
    });
    if(stealthClickArea) stealthClickArea.addEventListener('click', incrementCounter);
    // Exiting stealth should NOT push a new history entry; otherwise Back can bounce into stealth again.
    if (exitStealthBtn) exitStealthBtn.addEventListener('click', (e) => {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
        goBackInApp({ fallbackViewId: 'counterView' });
    });

    // Bottom navigation
    if (bottomNav) {
        bottomNav.querySelectorAll('.bottom-nav__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.disabled) return;
                const view = btn.getAttribute('data-view');
                const action = btn.getAttribute('data-action');
                if (action === 'settings') {
                    if (settingsOverlay) settingsOverlay.classList.add('active');
                    return;
                }
                if (view) showView(view);
            });
        });
    }

    const openTrashBtn = document.getElementById('openTrashBtn');
    if (openTrashBtn) {
        openTrashBtn.addEventListener('click', async () => {
            if (!isPremium()) {
                await showAppAlert('Çöp Kutusu Premium ile açılacak.', { title: 'Premium' });
                showView('premiumView');
                return;
            }
            openOverlay('trashOverlay', { onOpen: renderTrashOverlay });
        });
    }

    const trashClearBtn = document.getElementById('trashClearBtn');
    if (trashClearBtn) trashClearBtn.addEventListener('click', () => {
        if (!isPremium()) return;
        void clearTrashAll().then(() => renderTrashOverlay());
    });
    const trashList = document.getElementById('trashList');
    if (trashList) {
        trashList.addEventListener('click', async (e) => {
            if (!isPremium()) return;
            const btn = e.target && e.target.closest ? e.target.closest('[data-trash-action]') : null;
            if (!btn) return;
            const action = btn.getAttribute('data-trash-action');
            const idx = parseInt(btn.getAttribute('data-trash-index') || '', 10);
            if (!Number.isFinite(idx)) return;
            if (action === 'restore') {
                restoreTrashEntry(idx);
                renderTrashOverlay();
                return;
            }
            if (action === 'delete') {
                if (!(await showAppConfirm('Bu öğe çöp kutusundan kalıcı olarak silinsin mi? Bu işlem geri alınamaz.', { title: 'Kalıcı sil', confirmLabel: 'Sil' }))) return;
                deleteTrashEntry(idx);
                renderTrashOverlay();
            }
        });
    }

    const weeklyReportStarBtn = document.getElementById('weeklyReportStarBtn');
    const weeklyReportDetails = document.getElementById('weeklyReportDetails');
    if (weeklyReportStarBtn && weeklyReportDetails) {
        weeklyReportStarBtn.addEventListener('click', () => {
            const expanded = weeklyReportStarBtn.getAttribute('aria-expanded') === 'true';
            const next = !expanded;
            weeklyReportStarBtn.setAttribute('aria-expanded', next ? 'true' : 'false');
            weeklyReportDetails.hidden = !next;
        });
    }
    
    libraryCategoryTabs.forEach(btn => {
        btn.addEventListener('click', () => {
            libraryCategoryTabs.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeLibraryCat = btn.getAttribute('data-cat');
            renderLibrary();
        });
    });

    if (librarySearchInput) librarySearchInput.addEventListener('input', () => {
        librarySearchQuery = librarySearchInput.value || '';
        renderLibrary();
    });

    if(prepLibraryAddBtn) prepLibraryAddBtn.addEventListener('click', async () => {
        if(!selectedLibraryItem) return;
        closeOverlayPreferHistory('libraryDetailOverlay');
        
        libDestFolder.innerHTML = '';
        folders.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f.id;
            opt.textContent = f.name;
            libDestFolder.appendChild(opt);
        });

        if(libDestFolder.options.length === 0) {
            await showAppAlert('Lütfen önce bir klasör oluşturun.', { title: 'Klasör yok' });
            return;
        }
        openOverlay('libraryFolderSelectOverlay');
    });

    if(confirmLibraryAddBtn) confirmLibraryAddBtn.addEventListener('click', async () => {
        const destId = libDestFolder.value;
        if(!destId) return;
        const destCount = zikirs.filter(x => x.folderId === destId).length;
        const maxPerFolder = getMaxZikirsPerFolder();
        if (Number.isFinite(maxPerFolder) && destCount >= maxPerFolder) {
            await showAppAlert(`Hedef klasör dolu (en fazla ${maxPerFolder} zikir).`, { title: 'Klasör dolu' });
            return;
        }

        const libZ = selectedLibraryItem;
        const newZ = {
            id: 'z_' + Date.now(),
            folderId: destId,
            name: libZ.name,
            arabic: (libZ.arabic && String(libZ.arabic).trim()) || '',
            target: libZ.target,
            meaning: libZ.meaning,
            count: 0,
            lastClicked: 0,
            order:
                zikirs
                    .filter((x) => x.folderId === destId)
                    .reduce((m2, x) => Math.max(m2, typeof x.order === 'number' ? x.order : -1), -1) + 1
        };
        if (libZ.category === 'zikir' && libZ.context && String(libZ.context).trim()) {
            newZ.fazilet = String(libZ.context).trim();
        }
        zikirs.push(newZ);
        saveData();
        libraryFolderSelectOverlay.classList.remove('active');
        showView('folderDetailView', destId);
    });

    if (folderSelectCancelBtn) {
        folderSelectCancelBtn.addEventListener('click', () => exitFolderSelectMode(false));
    }
    if (folderSelectDeleteBtn) {
        folderSelectDeleteBtn.addEventListener('click', () => deleteSelectedFolders());
    }
    if (zikirSelectCancelBtn) {
        zikirSelectCancelBtn.addEventListener('click', () => exitZikirSelectMode(false));
    }
    if (zikirSelectDeleteBtn) {
        zikirSelectDeleteBtn.addEventListener('click', () => deleteSelectedZikirs());
    }

    // Custom Folders
    newFolderBtn.addEventListener('click', async () => {
        if (folderSelectMode) return;
        const name = await showAppPrompt('Yeni klasör için bir ad yazın.', '', {
            title: 'Yeni klasör',
            inputLabel: 'Klasör adı'
        });
        if (name != null && name.trim()) {
            const maxOrder = folders.reduce((m, f) => Math.max(m, typeof f.order === 'number' ? f.order : -1), -1);
            folders.push({ id: 'f_' + Date.now(), name: name.trim(), order: maxOrder + 1 });
            saveData();
            renderFolders();
        }
    });

    // ZikirmatiK Counter
    mainCounterBtn.addEventListener('click', (e) => {
        if (e.target.closest('#enterStealthBtn')) return;
        incrementCounter();
    });
    if(decrementBtn) decrementBtn.addEventListener('click', decrementCounter);
    if (openZikirStatsBtn && zikirStatsOverlay) {
        openZikirStatsBtn.addEventListener('click', () => {
            activeZikirStatTab = 'daily';
            zikirStatTabBtns.forEach((b) => {
                b.classList.toggle('active', b.getAttribute('data-zikir-stat-tab') === 'daily');
            });
            openOverlay('zikirStatsOverlay', { onOpen: renderZikirStats });
        });
    }
    zikirStatTabBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            zikirStatTabBtns.forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            activeZikirStatTab = btn.getAttribute('data-zikir-stat-tab') || 'daily';
            renderZikirStats();
        });
    });
    resetBtn.addEventListener('click', async () => {
        const z = zikirs.find(x => x.id === currentZikirId);
        if (
            z &&
            (await showAppConfirm(`'${z.name}' sıfırlanacak. Onaylıyor musunuz?`, {
                title: 'Sayaç sıfırla',
                confirmLabel: 'Sıfırla'
            }))
        ) {
            z.count = 0;
            saveData();
            updateCounterUI();
        }
    });

    // Settings
    if (openSettingsBtn) openSettingsBtn.addEventListener('click', () => {
        syncTrashButtonUI();
        openOverlay('settingsOverlay');
    });
    
    const updateSettings = () => {
        if(cbVibrationTap) appSettings.vibrationTap = cbVibrationTap.checked;
        if(cbVibrationTarget) appSettings.vibrationTarget = cbVibrationTarget.checked;
        if(cbSound) appSettings.sound = cbSound.checked;
        if (cbWakeLock) {
            appSettings.wakeLock = cbWakeLock.checked;
            const counterView = document.getElementById('counterView');
            if (counterView && counterView.classList.contains('active')) {
                if (appSettings.wakeLock) void requestWakeLock();
                else void releaseWakeLock();
            }
        }
        saveData();
    };
    if(cbVibrationTap) cbVibrationTap.addEventListener('change', updateSettings);
    if(cbVibrationTarget) cbVibrationTarget.addEventListener('change', updateSettings);
    if(cbSound) cbSound.addEventListener('change', updateSettings);
    if(cbWakeLock) cbWakeLock.addEventListener('change', updateSettings);

    themeChoiceBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            const choice = btn.getAttribute('data-theme-choice');
            if (choice !== 'light' && choice !== 'black' && choice !== 'navy') return;
            if (appSettings.theme === choice) return;
            appSettings.theme = choice;
            applyAppTheme(choice);
            syncThemeUI();
            saveData();
        });
    });

    const updateReminders = () => {
        if (cbReminderEnabled) reminderSettings.enabled = cbReminderEnabled.checked;
        if (reminderTimeInput) reminderSettings.time = reminderTimeInput.value || '21:00';
        saveData();
        (async () => {
            if (reminderSettings.enabled && !isCapacitorNative()) {
                if (!('Notification' in window)) {
                    await showAppAlert('Bu tarayıcı veya görünüm bildirim desteklemiyor.', { title: 'Bildirim' });
                    return;
                }
                let perm = Notification.permission;
                if (perm === 'default') {
                    perm = await Notification.requestPermission();
                }
                if (perm !== 'granted') {
                    if (perm === 'denied') {
                        await showAppAlert(
                            'Bildirim izni kapalı. Hatırlatıcı için telefon veya tarayıcı ayarlarından bu siteye bildirim vermen gerekir.',
                            { title: 'Bildirim izni' }
                        );
                    }
                    clearInAppReminderTick();
                    return;
                }
            }
            await ensureReminderSchedule();
        })().catch(console.error);
    };
    if (cbReminderEnabled) cbReminderEnabled.addEventListener('change', updateReminders);
    if (reminderTimeInput) reminderTimeInput.addEventListener('change', updateReminders);

    if (openPrivacyBtn) openPrivacyBtn.addEventListener('click', () => {
        closeOverlayPreferHistory('settingsOverlay');
        showView('privacyView');
    });

    if (folderSearchInput) folderSearchInput.addEventListener('input', () => {
        folderSearchQuery = folderSearchInput.value || '';
        renderFolderDetail();
    });
    if (folderFavoritesOnly) folderFavoritesOnly.addEventListener('change', () => {
        folderFavOnly = folderFavoritesOnly.checked;
        renderFolderDetail();
    });

    // Modals Handling
    document.querySelectorAll('.closeModalBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            const mid = btn.getAttribute('data-modal');
            if (mid) {
                if (closeOverlayPreferHistory(mid)) return;
                const el = document.getElementById(mid);
                if (el) el.classList.remove('active');
            }
        });
    });

    openAddZikirModalBtn.addEventListener('click', () => {
        openOverlay('addModalOverlay');
    });

    saveZikirBtn.addEventListener('click', async () => {
        const n = document.getElementById('newZikirName').value.trim();
        const t = parseInt(document.getElementById('newZikirTarget').value);
        const m = document.getElementById('newZikirMeaning').value.trim();
        const ar = document.getElementById('newZikirArabic').value.trim();
        
        if(!n) {
            await showAppAlert('Zikir adı gerekli.', { title: 'Eksik bilgi' });
            return;
        }
        if(isNaN(t) || t < 1) {
            await showAppAlert('Geçerli hedef yazın.', { title: 'Geçersiz hedef' });
            return;
        }

        const maxOrder = zikirs
            .filter(x => x.folderId === currentFolderId)
            .reduce((m2, x) => Math.max(m2, typeof x.order === 'number' ? x.order : -1), -1);
        zikirs.push({
            id: 'z_' + Date.now(),
            folderId: currentFolderId,
            name: n,
            arabic: ar,
            target: t, meaning: m, count: 0, lastClicked: 0,
            order: maxOrder + 1
        });
        saveData();
        addModalOverlay.classList.remove('active');
        renderFolderDetail();

        // clear
        document.getElementById('newZikirName').value = '';
        document.getElementById('newZikirTarget').value = '33';
        document.getElementById('newZikirMeaning').value = '';
        document.getElementById('newZikirArabic').value = '';
    });

    // Edit Target Handle
    saveEditBtn.addEventListener('click', async () => {
        if (!editingZikirIdMap) return;
        const nameVal = editZikirNameInp ? editZikirNameInp.value.trim() : '';
        if (!nameVal) {
            await showAppAlert('Zikir adı boş olamaz.', { title: 'Eksik bilgi' });
            return;
        }
        const val = parseInt(editZikirTargetInp.value, 10);
        if (isNaN(val) || val < 1) {
            await showAppAlert('Geçerli bir hedef sayısı yazın.', { title: 'Geçersiz hedef' });
            return;
        }
        const z = zikirs.find((x) => x.id === editingZikirIdMap);
        if (!z) return;
        z.name = nameVal;
        z.target = val;
        z.meaning = editZikirMeaningInp.value.trim();
        if (editZikirArabicInp) z.arabic = editZikirArabicInp.value.trim();
        const fzVal = editZikirFaziletInp ? editZikirFaziletInp.value.trim() : '';
        const defF = getEsmaDefaultFaziletForZikir(z);
        if (getEsmaListEntryForZikir(z)) {
            if (!fzVal || fzVal === defF) delete z.fazilet;
            else z.fazilet = fzVal;
        } else if (fzVal) {
            z.fazilet = fzVal;
        } else {
            delete z.fazilet;
        }
        saveData();
        renderFolderDetail();
        if (currentZikirId === z.id) updateCounterUI();
        editModalOverlay.classList.remove('active');
        editingZikirIdMap = null;
    });

    // Copy / Move
    saveCopyBtn.addEventListener('click', () => void processCopyMove('copy'));
    saveMoveBtn.addEventListener('click', () => void processCopyMove('move'));

    statTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            statTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeStatTab = btn.getAttribute('data-tab') || 'daily';
            renderStats();
        });
    });
}

function openEditModal(zId) {
    const z = zikirs.find(x => x.id === zId);
    if (!z) return;
    editingZikirIdMap = zId;
    if (editZikirNameInp) editZikirNameInp.value = z.name || '';
    editZikirTargetInp.value = z.target;
    editZikirMeaningInp.value = z.meaning || '';
    if (editZikirArabicInp) editZikirArabicInp.value = z.arabic || '';
    if (editZikirFaziletInp) {
        const stored = z.fazilet != null && String(z.fazilet).trim();
        editZikirFaziletInp.value = stored ? String(z.fazilet).trim() : getEsmaDefaultFaziletForZikir(z);
    }
    openOverlay('editModalOverlay');
}

async function openCopyModal(zId) {
    copyingZikirId = zId;
    copyDestFolder.innerHTML = '';
    folders.forEach(f => {
        if(f.id !== currentFolderId) {
            const opt = document.createElement('option');
            opt.value = f.id;
            opt.textContent = f.name;
            copyDestFolder.appendChild(opt);
        }
    });

    if(copyDestFolder.options.length === 0) {
        await showAppAlert('Hedeflenecek başka klasör yok. Lütfen önce yeni bir klasör oluşturun.', {
            title: 'Klasör yok'
        });
        return;
    }
    
    openOverlay('copyModalOverlay');
}

async function processCopyMove(actionType) {
    if(!copyingZikirId) return;
    const destFolderId = copyDestFolder.value;
    if(!destFolderId) return;

    // Limit check in destination
    const destCount = zikirs.filter(z => z.folderId === destFolderId).length;
    const maxPerFolder = getMaxZikirsPerFolder();
    if (Number.isFinite(maxPerFolder) && destCount >= maxPerFolder) {
        await showAppAlert(`Hedef klasör dolu (en fazla ${maxPerFolder} zikir).`, { title: 'Klasör dolu' });
        return;
    }

    const z = zikirs.find(x => x.id === copyingZikirId);
    if(z) {
        if(actionType === 'copy') {
            const maxOrder = zikirs
                .filter(x => x.folderId === destFolderId)
                .reduce((m2, x) => Math.max(m2, typeof x.order === 'number' ? x.order : -1), -1);
            zikirs.push({
                ...z,
                id: 'z_' + Date.now(),
                folderId: destFolderId,
                count: 0,
                order: maxOrder + 1
            });
        } else if (actionType === 'move') {
            z.folderId = destFolderId;
        }
        saveData();
        renderFolderDetail();
        copyModalOverlay.classList.remove('active');
    }
}

window.addEventListener('DOMContentLoaded', init);
