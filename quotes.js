/**
 * Ana sayfa alt şeridi (#dailyQuoteText): her girişte rastgele bir satır.
 * Günlük hatırlatıcı: sabit Rad 13:28 — locale’e göre meal (getReminderQuoteBody).
 */
import quranQuotesData from './data/quotes-quran.json';

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
    'Rabbinin adını an ve bütün varlığınla O\'na yönel. (Müzzemmil Suresi 8)',
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
    'Kulum Beni andığında Ben onunla beraberim. (Hadis-i Kudsi, Buhari, Müslim)',
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
    'Allah yolunda atılan her adım, bir sadakadır. (Buhari, Müslim)',
    'De ki: Ey kendilerine zulmeden kullarım! Allah\'ın rahmetinden ümit kesmeyin. (Zümer Suresi 53)',
    'Şüphesiz Allah, kendisine dayanıp güvenenleri sever. (Al-i İmrân Suresi 159)',
    'Kim Allah\'a tevekkül ederse, Allah ona yeter. (Talak Suresi 3)',
    'Şüphesiz Allah, zorlukla beraber kolaylık verir. (İnşirah Suresi 6)',
    'Allah bir toplumu, onlar kendilerini değiştirmedikçe değiştirmez. (Ra\'d Suresi 11)',
    'Kalpler ancak Allah\'ı anmakla huzur bulur. (Ra\'d Suresi 28)',
    'Muhakkak her zorlukla beraber bir ferahlık vardır. (İnşirah Suresi 5)',
    'Allah Teâlâ buyurur: Ben kulumun zannı gibiyim. (Buhari, Müslim)',
    'Allah, kulunun tövbesine çok sevinir. (Müslim)',
    'Şükrederseniz elbette nimetimi artırırım. (İbrahim Suresi 7)',
    'Ameller niyetlere göredir. (Buhari, Müslim)',
    'Kolaylaştırın, zorlaştırmayın; müjdeleyin, nefret ettirmeyin. (Buhari, Müslim)',
    'Allah, kullarına karşı annesinin çocuğuna merhametinden daha merhametlidir. (Buhari, Müslim)',
    'Müminin işi ne güzeldir! Her hali onun için hayırdır. (Müslim)',
    'Allah, sizin suretlerinize ve mallarınıza değil; kalplerinize ve amellerinize bakar. (Müslim)',
    'Kim bir müminin sıkıntısını giderirse, Allah da onun kıyamet sıkıntılarından birini giderir. (Müslim)',
    'Biriniz, kendisi için sevdiğini kardeşi için de sevmedikçe iman etmiş olmaz. (Buhari, Müslim)',
    'Yarım hurma ile de olsa ateşten korunun. (Buhari, Müslim)',
];

function normalizeQuoteLocale(locale) {
    return String(locale || 'tr').toLowerCase().split('-')[0];
}

function cleanQuoteText(text) {
    return String(text || '')
        .replace(/\s*["”]+$/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function truncateQuote(text, maxLen = 160) {
    const s = cleanQuoteText(text);
    if (s.length <= maxLen) return s;
    const cut = s.slice(0, maxLen - 1);
    const lastSpace = cut.lastIndexOf(' ');
    return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

function buildPreview(full, maxBodyLen) {
    const { body, ref } = splitTrailingRef(full);
    if (body.length <= maxBodyLen) return full;
    const shortBody = truncateQuote(body, maxBodyLen);
    return ref ? `${shortBody} ${ref}` : shortBody;
}

function splitTrailingRef(text) {
    const m = String(text || '').match(/^(.+)\s+(\([^)]+\))$/);
    return m ? { body: m[1].trim(), ref: m[2] } : { body: String(text || '').trim(), ref: '' };
}

/** Kapalı şeritte önizleme uzunluğu (gövde; sure:ayet / kaynak parantezi ayrı). */
function quoteBodyMaxLen(locale) {
    const code = normalizeQuoteLocale(locale);
    const limits = {
        ar: 130,
        bn: 115,
        ur: 120,
        en: 120,
        fr: 115,
        id: 125,
        ms: 100,
        tr: 110,
    };
    return limits[code] ?? 120;
}

/** Bu uzunluğu aşan gövdeler küçük punto + dokununca genişletme alır. */
function quoteCompactThreshold(locale) {
    const code = normalizeQuoteLocale(locale);
    const limits = {
        ar: 95,
        bn: 85,
        ur: 90,
        en: 90,
        fr: 85,
        id: 95,
        ms: 75,
        tr: 95,
    };
    return limits[code] ?? 90;
}

function pickRandomQuranQuoteEntry(locale) {
    const code = normalizeQuoteLocale(locale);
    const list = quranQuotesData?.quotes?.[code] || quranQuotesData?.quotes?.en || [];
    if (!Array.isArray(list) || !list.length) return null;
    const [s, a, t] = list[Math.floor(Math.random() * list.length)];
    const body = cleanQuoteText(t);
    const ref = `(${s}:${a})`;
    const full = `${body} ${ref}`;
    const preview = buildPreview(full, quoteBodyMaxLen(code));
    return {
        full,
        preview,
        expandable: body.length > quoteCompactThreshold(code),
    };
}

/**
 * @returns {{ full: string, preview: string, expandable: boolean }}
 */
export function pickRandomQuoteEntry(locale = 'tr') {
    const code = normalizeQuoteLocale(locale);
    if (code !== 'tr') {
        const q = pickRandomQuranQuoteEntry(code);
        if (q) return q;
    }
    const full = APP_QUOTES[Math.floor(Math.random() * APP_QUOTES.length)];
    const { body } = splitTrailingRef(full);
    const preview = buildPreview(full, quoteBodyMaxLen(code));
    return {
        full,
        preview,
        expandable: body.length > quoteCompactThreshold(code),
    };
}

export function pickRandomQuote(locale = 'tr') {
    return pickRandomQuoteEntry(locale).preview;
}

const REMINDER_AYAH_SURAH = 13;
const REMINDER_AYAH_NUM = 28;

/** Günlük hatırlatıcı bildirimi: Rad 13:28, uygulama diline göre. */
export function getReminderQuoteBody(locale = 'tr') {
    const code = normalizeQuoteLocale(locale);
    if (code === 'tr') {
        return "Kalpler ancak Allah'ı anmakla mutmain olur. (Rad Suresi 28)";
    }
    const list = quranQuotesData?.quotes?.[code] || quranQuotesData?.quotes?.en || [];
    const hit = list.find((row) => row[0] === REMINDER_AYAH_SURAH && row[1] === REMINDER_AYAH_NUM);
    const text = hit ? cleanQuoteText(hit[2]) : '';
    if (text) {
        return `${text} (${REMINDER_AYAH_SURAH}:${REMINDER_AYAH_NUM})`;
    }
    return "Kalpler ancak Allah'ı anmakla mutmain olur. (Rad Suresi 28)";
}
