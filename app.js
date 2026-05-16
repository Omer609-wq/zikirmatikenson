// ===================== DATA MODELS =====================
const APP_QUOTES = [
    "Ölmeden önce tövbe etmekte acele ediniz. (Hadis-i Şerif)",
    "Kalpler ancak Allah'ı anmakla mutmain olur. (Rad Suresi 28)",
    "Dua, müminin silahıdır. (Hadis-i Şerif)",
    "Kim bir iyilik yaparsa ona on katı vardır. (Enam Suresi 160)",
    "Zorlukla beraber şüphesiz bir kolaylık vardır. (İnşirah Suresi 5)",
    "Sizin en hayırlınız Kuran'ı öğrenen ve öğretendir. (Hadis-i Şerif)",
    "Namaz dinin direğidir. (Hadis-i Şerif)"
];

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
    }
];

// State
let folders = [];
let zikirs = [];
let history = {};
let appSettings = { vibrationTap: true, vibrationTarget: true, sound: false, wakeLock: false }; // { 'YYYY-MM-DD': { 'z_1': 15, 'z_2': 5 } }
let reminderSettings = { enabled: false, time: '21:00' };
let entitlements = { premium: false };

let currentFolderId = null;
let currentZikirId = null;
let activeStatTab = 'daily';
let folderSearchQuery = '';
let folderFavOnly = false;
let suppressListNavigation = false;

// Limits
const MAX_FOLDERS = Infinity;
const MAX_ZIKIRS_PER_FOLDER = 6;

// Circle Constants
const CIRCLE_RADIUS = 130;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

// ===================== DOM ELEMENTS =====================
const views = document.querySelectorAll('.view');
// Home View
const folderGrid = document.getElementById('folderGrid');
const newFolderBtn = document.getElementById('newFolderBtn');
const dailyQuoteText = document.getElementById('dailyQuoteText');
// Folder Detail View
const folderDetailTitle = document.getElementById('folderDetailTitle');
const folderZikirList = document.getElementById('folderZikirList');
const zikirLimitWarning = document.getElementById('zikirLimitWarning');
const openAddZikirModalBtn = document.getElementById('openAddZikirModalBtn');
const folderSearchInput = document.getElementById('folderSearchInput');
const folderFavoritesOnly = document.getElementById('folderFavoritesOnly');
const folderZikirDragHint = document.getElementById('folderZikirDragHint');
const toggleZikirReorderHintBtn = document.getElementById('toggleZikirReorderHintBtn');
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

// Stats View
const statTabBtns = document.querySelectorAll('#statsView .stats-tabs .tab-btn');
const statMostClicked = document.getElementById('statMostClicked');
const statMostClickedCount = document.getElementById('statMostClickedCount');
const statLastClicked = document.getElementById('statLastClicked');
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
const libDetailSource = document.getElementById('libDetailSource');
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
const cbVibrationTap = document.getElementById('settingVibrationTap');
const cbVibrationTarget = document.getElementById('settingVibrationTarget');
const cbSound = document.getElementById('settingSound');
const cbWakeLock = document.getElementById('settingWakeLock');
const openPrivacyBtn = document.getElementById('openPrivacyBtn');
const cbReminderEnabled = document.getElementById('settingReminderEnabled');
const reminderTimeInput = document.getElementById('settingReminderTime');
const bottomNav = document.getElementById('bottomNav');

// Modals
const addModalOverlay = document.getElementById('addModalOverlay');
const saveZikirBtn = document.getElementById('saveZikirBtn');
const editModalOverlay = document.getElementById('editModalOverlay');
const saveEditBtn = document.getElementById('saveEditBtn');
const editZikirTargetInp = document.getElementById('editZikirTarget');
const editZikirMeaningInp = document.getElementById('editZikirMeaning');
const editZikirArabicInp = document.getElementById('editZikirArabic');
let editingZikirIdMap = null; // tracking edit

const copyModalOverlay = document.getElementById('copyModalOverlay');
const copyDestFolder = document.getElementById('copyDestFolder');
const saveCopyBtn = document.getElementById('saveCopyBtn');
const saveMoveBtn = document.getElementById('saveMoveBtn');
let copyingZikirId = null;


// ===================== INIT =====================
function init() {
    if (progressCircle) {
        progressCircle.style.strokeDasharray = `${CIRCLE_CIRCUMFERENCE} ${CIRCLE_CIRCUMFERENCE}`;
        progressCircle.style.strokeDashoffset = CIRCLE_CIRCUMFERENCE;
    }

    loadData();
    setupEventListeners();
    setDailyQuote();
    showView('homeView');

    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(console.error);
    if (reminderSettings && reminderSettings.enabled) {
        maybeRequestNotificationPermission();
        scheduleInAppReminderTick();
    }
    if (ESMA_LIST.length !== ESMA_ARABIC.length) {
        console.warn('Zikirmatik: ESMA_LIST ile ESMA_ARABIC uzunlukları eşleşmiyor.');
    }
}

function getTodayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function safeZikirTarget(z) {
    const t = parseInt(z && z.target, 10);
    return Number.isFinite(t) && t > 0 ? t : 33;
}

function syncZikirReorderHintButton() {
    if (!toggleZikirReorderHintBtn || !folderZikirDragHint) return;
    const open = !folderZikirDragHint.hidden;
    toggleZikirReorderHintBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggleZikirReorderHintBtn.classList.toggle('icon-btn--reorder-hint-on', open);
    toggleZikirReorderHintBtn.setAttribute(
        'aria-label',
        open ? 'Sıralama ipucunu gizle' : 'Sıralama ipucunu göster'
    );
}

function escapeHtml(str) {
    if (str == null || str === '') return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function normalizeEsmaName(name) {
    return String(name || '')
        .toLocaleLowerCase('tr-TR')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9ğüşöçı]/g, '');
}

function makeCanonicalEsmaZikir(esma, index) {
    return {
        id: 'z_e_' + index,
        folderId: 'f_esma',
        name: esma.name,
        arabic: esma.arabic || '',
        target: esma.target,
        meaning: esma.meaning,
        count: 0,
        lastClicked: 0,
        order: index
    };
}

function remapHistoryIds(idMap) {
    if (!history || typeof history !== 'object') return false;
    let changed = false;
    Object.keys(history).forEach((day) => {
        const block = history[day];
        if (!block || typeof block !== 'object') return;
        const additions = {};
        Object.keys(block).forEach((oldId) => {
            const newId = idMap[oldId];
            if (!newId || newId === oldId) return;
            const value = block[oldId];
            if (typeof value === 'number' && Number.isFinite(value)) {
                additions[newId] = (additions[newId] || 0) + value;
            }
            delete block[oldId];
            changed = true;
        });
        Object.keys(additions).forEach((newId) => {
            block[newId] = (typeof block[newId] === 'number' ? block[newId] : 0) + additions[newId];
        });
    });
    return changed;
}

function syncCanonicalEsmaZikirs() {
    if (!folders.find(f => f.id === 'f_esma')) {
        folders.push({ id: 'f_esma', name: 'Esma\'ül Hüsna' });
    }

    const canonicalIndexByName = new Map();
    ESMA_LIST.forEach((esma, index) => {
        canonicalIndexByName.set(normalizeEsmaName(esma.name), index);
    });

    const esmaByIndex = new Map();
    const remappedIds = {};
    const unknownEsmaItems = [];
    const nonEsmaItems = [];

    zikirs.forEach((z) => {
        if (z.folderId !== 'f_esma') {
            nonEsmaItems.push(z);
            return;
        }

        let index = canonicalIndexByName.get(normalizeEsmaName(z.name));
        if (index == null) {
            const idMatch = /^z_e_(\d+)$/.exec(String(z.id || ''));
            const idIndex = idMatch ? parseInt(idMatch[1], 10) : NaN;
            if (Number.isInteger(idIndex) && idIndex >= 0 && idIndex < ESMA_LIST.length) {
                index = idIndex;
            }
        }

        if (index == null) {
            unknownEsmaItems.push(z);
            return;
        }

        const current = esmaByIndex.get(index);
        if (current) {
            current.count += Number.isFinite(Number(z.count)) ? Number(z.count) : 0;
            current.lastClicked = Math.max(current.lastClicked || 0, Number(z.lastClicked) || 0);
            current.favorite = !!(current.favorite || z.favorite);
        } else {
            esmaByIndex.set(index, {
                count: Number.isFinite(Number(z.count)) ? Number(z.count) : 0,
                lastClicked: Number(z.lastClicked) || 0,
                favorite: !!z.favorite
            });
        }

        const canonicalId = 'z_e_' + index;
        if (z.id !== canonicalId) {
            remappedIds[z.id] = canonicalId;
        }
    });

    const canonicalEsmaItems = ESMA_LIST.map((esma, index) => {
        const item = makeCanonicalEsmaZikir(esma, index);
        const existing = esmaByIndex.get(index);
        if (existing) {
            item.count = existing.count;
            item.lastClicked = existing.lastClicked;
            if (existing.favorite) item.favorite = true;
        }
        return item;
    });

    let changed =
        remapHistoryIds(remappedIds) ||
        zikirs.filter(z => z.folderId === 'f_esma').length !== canonicalEsmaItems.length + unknownEsmaItems.length;

    canonicalEsmaItems.forEach((item, index) => {
        const current = zikirs.find(z => z.id === item.id && z.folderId === 'f_esma');
        if (!current ||
            current.name !== item.name ||
            current.arabic !== item.arabic ||
            current.target !== item.target ||
            current.meaning !== item.meaning ||
            current.count !== item.count ||
            current.lastClicked !== item.lastClicked ||
            current.order !== index ||
            !!current.favorite !== !!item.favorite) {
            changed = true;
        }
    });

    if (unknownEsmaItems.length) {
        unknownEsmaItems.forEach((item, offset) => {
            item.order = ESMA_LIST.length + offset;
        });
    }
    zikirs = nonEsmaItems.concat(canonicalEsmaItems, unknownEsmaItems);
    return changed;
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

function syncSettingsUI() {
    if (cbVibrationTap) cbVibrationTap.checked = !!appSettings.vibrationTap;
    if (cbVibrationTarget) cbVibrationTarget.checked = !!appSettings.vibrationTarget;
    if (cbSound) cbSound.checked = !!appSettings.sound;
    if (cbWakeLock) cbWakeLock.checked = !!appSettings.wakeLock;
    if (cbReminderEnabled) cbReminderEnabled.checked = !!reminderSettings.enabled;
    if (reminderTimeInput) reminderTimeInput.value = reminderSettings.time || '21:00';
}

function loadData() {
    const sv = localStorage.getItem('zikirmatik_data_v2');
    if (sv) {
        let d;
        try {
            d = JSON.parse(sv);
        } catch (e) {
            console.error('zikirmatik_data_v2 okunamadı, varsayılan veri:', e);
            folders = [...DEFAULT_FOLDERS];
            zikirs = [...DEFAULT_ZIKIRS];
            history = {};
            appSettings = { vibrationTap: true, vibrationTarget: true, sound: false, wakeLock: false };
            reminderSettings = { enabled: false, time: '21:00' };
            entitlements = { premium: false };
            syncSettingsUI();
            return;
        }
        folders = Array.isArray(d.folders) ? d.folders : [...DEFAULT_FOLDERS];
        zikirs = Array.isArray(d.zikirs) ? d.zikirs : [...DEFAULT_ZIKIRS];
        history = d.history && typeof d.history === 'object' ? d.history : {};
        const s = d.settings || {};
        // Backward compatible: old `vibration` means both.
        const oldVib = (typeof s.vibration === 'boolean') ? s.vibration : true;
        appSettings = {
            vibrationTap: (typeof s.vibrationTap === 'boolean') ? s.vibrationTap : oldVib,
            vibrationTarget: (typeof s.vibrationTarget === 'boolean') ? s.vibrationTarget : oldVib,
            sound: (typeof s.sound === 'boolean') ? s.sound : false,
            wakeLock: (typeof s.wakeLock === 'boolean') ? s.wakeLock : false
        };
        reminderSettings = d.reminders || { enabled: false, time: '21:00' };
        entitlements = d.entitlements || { premium: false };

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

        if (syncCanonicalEsmaZikirs()) saveData();

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
        folders = [...DEFAULT_FOLDERS];
        zikirs = [...DEFAULT_ZIKIRS];
        history = {};
    }

    syncSettingsUI();
}
function saveData() {
    const payload = {
        folders,
        zikirs,
        history,
        settings: appSettings,
        reminders: reminderSettings,
        entitlements
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

function requirePremium(featureName) {
    if (isPremium()) return true;
    alert(`${featureName} Premium özelliğidir. (Üyelik sistemi eklenince otomatik açılacak)`);
    return false;
}

function downloadJson(filename, obj) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function maybeRequestNotificationPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
    }
}

let reminderTimeoutId = null;

function clearInAppReminderTick() {
    if (reminderTimeoutId != null) {
        clearTimeout(reminderTimeoutId);
        reminderTimeoutId = null;
    }
}

function scheduleInAppReminderTick() {
    // Web fallback: works only while app is open. On Android build we will replace with native scheduling.
    clearInAppReminderTick();
    if (!('Notification' in window)) return;
    if (!reminderSettings.enabled) return;
    if (Notification.permission !== 'granted') return;
    const now = new Date();
    const [hh, mm] = String(reminderSettings.time || '21:00').split(':').map(x => parseInt(x, 10));
    if (Number.isNaN(hh) || Number.isNaN(mm)) return;
    const target = new Date(now);
    target.setHours(hh, mm, 0, 0);
    if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
    const ms = Math.min(target.getTime() - now.getTime(), 2147483647); // setTimeout limit
    reminderTimeoutId = setTimeout(() => {
        reminderTimeoutId = null;
        try {
            new Notification('Zikirmatik', { body: 'Bugünün zikrini tamamlamak ister misin?' });
        } catch (e) {
            console.error(e);
        }
        scheduleInAppReminderTick();
    }, ms);
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

// ===================== ROUTING =====================
function showView(viewId, param = null) {
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
        bottomNav.querySelectorAll('.bottom-nav__btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = bottomNav.querySelector(`.bottom-nav__btn[data-view="${viewId}"]`);
        if (activeBtn) activeBtn.classList.add('active');
    }

    if (viewId !== 'counterView') {
        releaseWakeLock();
    }

    if (viewId === 'homeView') renderFolders();
    else if (viewId === 'folderDetailView') {
        currentFolderId = param;
        if (folderZikirDragHint) folderZikirDragHint.hidden = true;
        syncZikirReorderHintButton();
        renderFolderDetail();
    } else if (viewId === 'counterView') {
        currentZikirId = param;
        updateCounterUI();
        if (appSettings.wakeLock) requestWakeLock();
    } else if (viewId === 'statsView') {
        renderStats();
    } else if (viewId === 'libraryView') {
        renderLibrary();
    }
}

// ===================== VIEWS =====================
function setDailyQuote() {
    if (!dailyQuoteText) return;
    const randomQuote = APP_QUOTES[Math.floor(Math.random() * APP_QUOTES.length)];
    dailyQuoteText.textContent = randomQuote;
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

function moveListDragGhost(clientY) {
    if (!activeListDrag) return;
    const { ghost, ghostLeft, ghostWidth, ghostHeight, offsetY } = activeListDrag;
    ghost.style.top = `${clientY - offsetY}px`;
    ghost.style.left = `${ghostLeft}px`;
    ghost.style.width = `${ghostWidth}px`;
    if (typeof ghostHeight === 'number') {
        ghost.style.minHeight = `${ghostHeight}px`;
    }
}

function teardownListDrag() {
    if (!activeListDrag) return;
    const { removeDocListeners, ghost, sourceEl } = activeListDrag;
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
    document.body.appendChild(ghost);

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
        removeDocListeners() {
            document.removeEventListener('pointermove', docMove, { capture: true });
            document.removeEventListener('pointerup', docEnd, { capture: true });
            document.removeEventListener('pointercancel', docEnd, { capture: true });
        }
    };

    moveListDragGhost(clientY);
    if (navigator.vibrate) navigator.vibrate(15);
}

function attachListDragLongPress(el, { id, container, getSortedIds, onCommit, shouldIgnoreDown }) {
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
                beginListDrag(el, id, container, getSortedIds, onCommit, pid, lastClientY);
            }, LIST_DRAG_LONG_MS);

            document.addEventListener('pointermove', onPendingMove, { passive: false, capture: true });
            document.addEventListener('pointerup', onPendingUp, { capture: true });
            document.addEventListener('pointercancel', onPendingUp, { capture: true });
        },
        { passive: true }
    );
}

function renderFolders() {
    folderGrid.innerHTML = '';
    const sortedFolders = [...folders].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    sortedFolders.forEach((f) => {
        const count = zikirs.filter(z => z.folderId === f.id).length;
        const card = document.createElement('div');
        card.className = 'folder-card';
        card.dataset.dragOrderItem = 'folder';
        card.innerHTML = `
            <span class="folder-card__mark" aria-hidden="true"></span>
            <div class="folder-card__text">
                <h3>${f.name}</h3>
                <p>${count} Zikir</p>
            </div>
        `;
        attachListDragLongPress(card, {
            id: f.id,
            container: folderGrid,
            getSortedIds: getFolderSortedIds,
            onCommit: applyFolderOrder,
            shouldIgnoreDown: (t) => t.closest && t.closest('button, a')
        });
        card.addEventListener('click', (e) => {
            if (suppressListNavigation) {
                e.preventDefault();
                e.stopPropagation();
                suppressListNavigation = false;
                return;
            }
            showView('folderDetailView', f.id);
        });
        folderGrid.appendChild(card);
    });

    newFolderBtn.style.display = 'flex';
}

function renderFolderDetail() {
    const folder = folders.find(f => f.id === currentFolderId);
    if (!folder) return;
    folderDetailTitle.textContent = folder.name;

    const q = (folderSearchQuery || '').trim().toLocaleLowerCase('tr-TR');
    const fZikirsAll = zikirs.filter(z => z.folderId === currentFolderId);
    const fZikirs = fZikirsAll.filter(z => {
        if (folderFavOnly && !z.favorite) return false;
        if (!q) return true;
        const name = (z.name || '').toLocaleLowerCase('tr-TR');
        const meaning = (z.meaning || '').toLocaleLowerCase('tr-TR');
        const arabic = (z.arabic || '');
        return name.includes(q) || meaning.includes(q) || arabic.includes(q);
    }).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const canDragZikir = !q && !folderFavOnly;

    if (folderZikirDragHint) {
        if (canDragZikir) {
            folderZikirDragHint.textContent = 'Zikre basılı tutup sürükleyerek sıralayın.';
            folderZikirDragHint.classList.remove('drag-hint--muted');
        } else {
            folderZikirDragHint.textContent = 'Sıralamak için aramayı temizleyin ve favori filtresini kapatın.';
            folderZikirDragHint.classList.add('drag-hint--muted');
        }
        syncZikirReorderHintButton();
    }

    folderZikirList.innerHTML = '';
    
    fZikirs.forEach((z) => {
        const li = document.createElement('li');
        const favIcon = z.favorite ? 'star' : 'star_border';
        const favTitle = z.favorite ? 'Favoriden çıkar' : 'Favorilere ekle';
        const meaningPrev = z.meaning
            ? (z.meaning.length > 40 ? z.meaning.substring(0, 40) + '…' : z.meaning)
            : '';
        const arabicLine = (z.arabic && String(z.arabic).trim())
            ? `<p class="zikir-arabic" dir="rtl" lang="ar">${escapeHtml(String(z.arabic).trim())}</p>`
            : '';
        li.innerHTML = `
            <div style="display:flex; align-items:flex-start; justify-content:space-between; gap: 12px;">
                <div style="min-width:0; flex:1;">
                    <h3 style="margin:0;">${escapeHtml(z.name)}</h3>
                    ${arabicLine}
                </div>
                <button class="icon-btn fav-btn" data-id="${z.id}" aria-label="${favTitle}" title="${favTitle}" style="padding:0.25rem; flex-shrink:0;">
                    <span class="material-icons-outlined" style="color: ${z.favorite ? 'var(--primary-green)' : 'var(--text-gray)'}">${favIcon}</span>
                </button>
            </div>
            ${meaningPrev ? `<p>${escapeHtml(meaningPrev)}</p>` : ''}
            <div class="meta">
                <span>Hedef: ${z.target} 
                    <button class="edit-target-btn" data-id="${z.id}"><span class="material-icons-outlined" style="font-size:16px;">edit</span></button>
                    <button class="edit-target-btn copy-btn" data-id="${z.id}"><span class="material-icons-outlined" style="font-size:16px;">content_copy</span></button>
                </span>
                <span>Okunan: ${z.count}</span>
            </div>
        `;

        if (canDragZikir) {
            li.dataset.dragOrderItem = 'zikir';
            attachListDragLongPress(li, {
                id: z.id,
                container: folderZikirList,
                getSortedIds: getZikirSortedIdsInCurrentFolder,
                onCommit: applyZikirOrder,
                shouldIgnoreDown: (t) => t.closest && t.closest('.fav-btn, .edit-target-btn, button')
            });
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
            showView('counterView', z.id);
        });
        folderZikirList.appendChild(li);
    });

    if (currentFolderId === 'f_esma') {
        openAddZikirModalBtn.style.display = 'none';
        zikirLimitWarning.classList.remove('visible');
    } else if (fZikirsAll.length >= MAX_ZIKIRS_PER_FOLDER) {
        openAddZikirModalBtn.style.display = 'none';
        zikirLimitWarning.classList.add('visible');
    } else {
        openAddZikirModalBtn.style.display = 'flex';
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
    if (zikirNote) zikirNote.textContent = zikir.meaning || '';
    
    // Yalnızca mevcut turun sayısını hesapla
    let currentRoundDisplay = zikir.count % target;
    if (currentRoundDisplay === 0 && zikir.count > 0) currentRoundDisplay = target;
    if (zikir.count === 0) currentRoundDisplay = 0;
    
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
            roundDisplay.classList.add('visible');
        } else {
            roundDisplay.classList.remove('visible');
        }
    }

    const progress = Math.min((zikir.count % target) / target, 1);
    let offset = CIRCLE_CIRCUMFERENCE - (progress * CIRCLE_CIRCUMFERENCE);
    
    if (zikir.count > 0 && zikir.count % target === 0) {
        offset = 0;
        if (mainCounterBtn) {
            mainCounterBtn.classList.remove('glow-burst');
            void mainCounterBtn.offsetWidth;
            mainCounterBtn.classList.add('glow-burst');
        }
        handleVibration(true);
    }
    if (progressCircle) progressCircle.style.strokeDashoffset = offset;
}

// ===================== HARDWARE LOGIC =====================

let wakeLockRef = null;
async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator && appSettings.wakeLock && !wakeLockRef) {
            wakeLockRef = await navigator.wakeLock.request('screen');
        }
    } catch (err) {
        console.log('WakeLock error:', err);
    }
}
function releaseWakeLock() {
    if (wakeLockRef) {
        wakeLockRef.release().then(() => { wakeLockRef = null; }).catch(() => { wakeLockRef = null; });
    }
}
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' || !appSettings.wakeLock) return;
    const counterView = document.getElementById('counterView');
    if (counterView && counterView.classList.contains('active')) requestWakeLock();
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
    if (!navigator.vibrate) return;
    if (isTarget) {
        if (!appSettings.vibrationTarget) return;
        navigator.vibrate([100, 50, 100]); // Uzun çift titreşim
    } else {
        if (!appSettings.vibrationTap) return;
        navigator.vibrate(40); // Kısa titreşim
    }
}

function incrementCounter() {
    const zikir = zikirs.find(z => z.id === currentZikirId);
    if (!zikir) return;

    zikir.count++;
    logClick(zikir.id);
    updateCounterUI();
    
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
}

// ===================== LIBRARY LOGIC =====================
function libraryItemSearchHaystack(z) {
    const kw = (z.keywords != null ? String(z.keywords) : '');
    return `${z.name} ${z.meaning} ${z.context} ${z.source} ${kw}`.toLocaleLowerCase('tr-TR');
}

const LIBRARY_CARD_CONTEXT_MAX = 120;

function libraryCardSubtitle(z) {
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
    const filteredBase = searchActive
        ? ZIKIR_LIBRARY
        : ZIKIR_LIBRARY.filter(z => z.category === activeLibraryCat);
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
    libDetailContext.textContent = z.context;
    libDetailSource.textContent = z.source;
    libraryDetailOverlay.classList.add('active');
}

// ===================== STATS LOGIC =====================
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

// ===================== EVENT LISTENERS & MODALS =====================
function setupEventListeners() {
    // Back Buttons
    document.querySelectorAll('.backBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            showView(btn.getAttribute('data-target'), currentFolderId);
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
    if(exitStealthBtn) exitStealthBtn.addEventListener('click', () => showView('counterView', currentZikirId));

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

    if(prepLibraryAddBtn) prepLibraryAddBtn.addEventListener('click', () => {
        if(!selectedLibraryItem) return;
        libraryDetailOverlay.classList.remove('active');
        
        libDestFolder.innerHTML = '';
        folders.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f.id;
            opt.textContent = f.name;
            libDestFolder.appendChild(opt);
        });

        if(libDestFolder.options.length === 0) return alert("Lütfen önce bir klasör oluşturun.");
        libraryFolderSelectOverlay.classList.add('active');
    });

    if(confirmLibraryAddBtn) confirmLibraryAddBtn.addEventListener('click', () => {
        const destId = libDestFolder.value;
        if(!destId) return;
        const destCount = zikirs.filter(x => x.folderId === destId).length;
        if(destCount >= MAX_ZIKIRS_PER_FOLDER) return alert("Hedef klasör dolu (Maks 6 zikir).");

        zikirs.push({
            id: 'z_' + Date.now(),
            folderId: destId,
            name: selectedLibraryItem.name,
            arabic: (selectedLibraryItem.arabic && String(selectedLibraryItem.arabic).trim()) || '',
            target: selectedLibraryItem.target,
            meaning: selectedLibraryItem.meaning,
            count: 0, lastClicked: 0,
            order: (zikirs.filter(x => x.folderId === destId).reduce((m2, x) => Math.max(m2, typeof x.order === 'number' ? x.order : -1), -1) + 1)
        });
        saveData();
        libraryFolderSelectOverlay.classList.remove('active');
        showView('folderDetailView', destId);
    });

    // Custom Folders
    newFolderBtn.addEventListener('click', () => {
        const name = prompt('Yeni Klasör Adı:');
        if (name && name.trim()) {
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
    resetBtn.addEventListener('click', () => {
        const z = zikirs.find(x => x.id === currentZikirId);
        if (z && confirm(`'${z.name}' sıfırlanacak. Onaylıyor musunuz?`)) {
            z.count = 0;
            saveData();
            updateCounterUI();
        }
    });

    // Settings
    if(openSettingsBtn) openSettingsBtn.addEventListener('click', () => settingsOverlay.classList.add('active'));
    
    const updateSettings = () => {
        if(cbVibrationTap) appSettings.vibrationTap = cbVibrationTap.checked;
        if(cbVibrationTarget) appSettings.vibrationTarget = cbVibrationTarget.checked;
        if(cbSound) appSettings.sound = cbSound.checked;
        if(cbWakeLock) appSettings.wakeLock = cbWakeLock.checked;
        saveData();
    };
    if(cbVibrationTap) cbVibrationTap.addEventListener('change', updateSettings);
    if(cbVibrationTarget) cbVibrationTarget.addEventListener('change', updateSettings);
    if(cbSound) cbSound.addEventListener('change', updateSettings);
    if(cbWakeLock) cbWakeLock.addEventListener('change', updateSettings);

    const updateReminders = () => {
        if (cbReminderEnabled) reminderSettings.enabled = cbReminderEnabled.checked;
        if (reminderTimeInput) reminderSettings.time = reminderTimeInput.value || '21:00';
        saveData();
        if (reminderSettings.enabled) {
            maybeRequestNotificationPermission();
            scheduleInAppReminderTick();
        } else {
            clearInAppReminderTick();
        }
    };
    if (cbReminderEnabled) cbReminderEnabled.addEventListener('change', updateReminders);
    if (reminderTimeInput) reminderTimeInput.addEventListener('change', updateReminders);

    if (openPrivacyBtn) openPrivacyBtn.addEventListener('click', () => {
        if (settingsOverlay) settingsOverlay.classList.remove('active');
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

    if (toggleZikirReorderHintBtn && folderZikirDragHint) {
        toggleZikirReorderHintBtn.addEventListener('click', () => {
            folderZikirDragHint.hidden = !folderZikirDragHint.hidden;
            syncZikirReorderHintButton();
        });
    }

    // Modals Handling
    document.querySelectorAll('.closeModalBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            const mid = btn.getAttribute('data-modal');
            const el = mid && document.getElementById(mid);
            if (el) el.classList.remove('active');
        });
    });

    openAddZikirModalBtn.addEventListener('click', () => {
        addModalOverlay.classList.add('active');
    });

    saveZikirBtn.addEventListener('click', () => {
        const n = document.getElementById('newZikirName').value.trim();
        const t = parseInt(document.getElementById('newZikirTarget').value);
        const m = document.getElementById('newZikirMeaning').value.trim();
        const ar = document.getElementById('newZikirArabic').value.trim();
        
        if(!n) return alert('Zikir adı gerekli.');
        if(isNaN(t) || t < 1) return alert('Geçerli hedef yazın.');

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
    saveEditBtn.addEventListener('click', () => {
        const val = parseInt(editZikirTargetInp.value);
        if(!isNaN(val) && val > 0 && editingZikirIdMap) {
            const z = zikirs.find(x => x.id === editingZikirIdMap);
            if(z) {
                z.target = val;
                z.meaning = editZikirMeaningInp.value.trim();
                if (editZikirArabicInp) z.arabic = editZikirArabicInp.value.trim();
                saveData();
                renderFolderDetail();
                if (currentZikirId === z.id) updateCounterUI();
            }
            editModalOverlay.classList.remove('active');
            editingZikirIdMap = null;
        }
    });

    // Copy / Move
    saveCopyBtn.addEventListener('click', () => processCopyMove('copy'));
    saveMoveBtn.addEventListener('click', () => processCopyMove('move'));

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
    editZikirTargetInp.value = z.target;
    editZikirMeaningInp.value = z.meaning || '';
    if (editZikirArabicInp) editZikirArabicInp.value = z.arabic || '';
    editModalOverlay.classList.add('active');
}

function openCopyModal(zId) {
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
        alert("Hedeflenecek başka klasör yok. Lütfen önce yeni bir klasör oluşturun.");
        return;
    }
    
    copyModalOverlay.classList.add('active');
}

function processCopyMove(actionType) {
    if(!copyingZikirId) return;
    const destFolderId = copyDestFolder.value;
    if(!destFolderId) return;

    // Limit check in destination
    const destCount = zikirs.filter(z => z.folderId === destFolderId).length;
    if(destCount >= MAX_ZIKIRS_PER_FOLDER) {
        alert("Hedef klasör dolu (Maks 6 zikir).");
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
