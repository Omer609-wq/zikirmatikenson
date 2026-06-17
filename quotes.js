/**
 * Ana sayfa alt şeridi (#dailyQuoteText): her girişte rastgele bir satır.
 * Günlük hatırlatıcı bildirimi sabit metin kullanır (REMINDER_FIXED_BODY).
 */
export const APP_QUOTES = [
    'Ölmeden önce tövbe etmekte acele ediniz. (Hadis-i Şerif)',
    "Kalpler ancak Allah'ı anmakla mutmain olur. (Rad Suresi 28)",
    'Dua, müminin silahıdır. (Hadis-i Şerif)',
    'Kim bir iyilik yaparsa ona on katı vardır. (Enam Suresi 160)',
    'Zorlukla beraber şüphesiz bir kolaylık vardır. (İnşirah Suresi 5)',
    "Sizin en hayırlınız Kur'an'ı öğrenen ve öğretendir. (Hadis-i Şerif)",
    'Namaz dinin direğidir. (Hadis-i Şerif)',
    'Öyleyse Beni anın ki Ben de sizi anayım; Bana şükredin, nankörlük etmeyin. (Bakara Suresi 152)',
    'Ey iman edenler! Allah\'ı çok zikredin. (Ahzab Suresi 41)',
    'Rabbinin adını zikret ve her şeyden yüz çevir. (Müzzemmil Suresi 8)',
    'Şüphesiz Allah, sabredenlerle beraberdir. (Bakara Suresi 153)',
    "Biz Kur'an'ı müminlere şifa ve rahmet olarak indirdik. (İsrâ Suresi 82)",
    'İyilikler kötülükleri giderir. (Hud Suresi 114)',
    "Kim Allah'tan korkarsa, Allah ona bir çıkış yolu yaratır. (Talak Suresi 2)",
    'Müminler ancak kardeştir. (Hucurât Suresi 10)',
    'De ki: Benim namazım, kurbanım, hayatım ve ölümüm âlemlerin Rabbi Allah içindir. (Enam Suresi 162)',
    'Karşılaştığınız ordulara karşı sebat edin ve Allah\'ı çok zikredin ki kurtuluşa eresiniz. (Enfal Suresi 45)',
    'Şüphesiz namaz, müminler üzerine vakitleri belirlenmiş bir farzdır. (Nisa Suresi 103)',
    'Rabbinizi içinden ürperti duyarak ve alçak sesle zikredin. (Araf Suresi 205)',
    'Allah\'ı anan ile anmayanı, dirilerle ölülere benzetebilirsiniz. (Buhari, Müslim)',
    'Kulum Beni andığında Ben onunla beraberim. (Hadis-i Kudsi, Buhari, Müslim)'
    'Şüphesiz dua ibadetin özüdür. (Tirmizi)',
    'İnsan ancak dua ile ayakta durur. (Tirmizi)',
    'Kim bana bir defa salât ederse, Allah ona on salât eder. (Müslim)',
    'Allah ve melekleri Nebi\'ye salât eder; ey iman edenler, O\'na salât ve selâm edin. (Ahzab Suresi 56)',
    'Allah katında en sevdiğim ameller, en devamlı olanıdır, çok olmasa bile. (Müslim)',
    'Az ama devamlı olan amel, çok ama kesilen amelden Allah katında daha hayırlıdır. (Müslim)',
    'Allah güzeldir, güzeli sever. (Müslim)',
    'Müslüman, Müslümanların elinden ve dilinden güvende olduğu kimsedir. (Buhari, Müslim)',
    'Gülümsemek bile sadakadır. (Tirmizi)',
    'Güzel söz sadakadır. (Buhari, Müslim)',
    'Merhamet etmeyene merhamet olunmaz. (Buhari, Müslim)',
    'Din nasihattır. (Müslim)',
    'Allah sabredenleri sever. (Al-i İmrân Suresi 146)',
    'Allah, tevbe edenleri ve tertemiz olanları sever. (Bakara Suresi 222)',
    'Lâ ilâhe illallah, dil ile kalp uyum içinde söylenmedikçe kişi cennete giremez. (Buhari, Müslim)',
    'Lâ havle ve lâ kuvvete illâ billâh, Cennet hazinelerinden bir hazinedir. (Buhari, Müslim)',
    'Ölümü çokça anın; o, dünya sevgisini giderir. (Tirmizi)',
    'Kabrin sıkışmasından Allah\'a sığının. (Tirmizi, Ebu Davud)',
    'Sahurda bereket vardır. (Buhari, Müslim)',
    'Oruçlunun iftar anındaki duası reddolunmaz. (Tirmizi)',
    'Kim Allah için bir karış yol yürürse, Allah ona iki karış yol yürütür. (Buhari, Müslim)',
    'Allah yolunda atılan her adım, bir sadakadır. (Buhari, Müslim)'
];

export function pickRandomQuote() {
    return APP_QUOTES[Math.floor(Math.random() * APP_QUOTES.length)];
}

/** Günlük hatırlatıcı: sabit Rad 28 — zikirmatik ruhuna uygun, her seferinde tanınır. */
export const REMINDER_FIXED_BODY =
    "Kalpler ancak Allah'ı anmakla mutmain olur. (Rad Suresi 28)";
