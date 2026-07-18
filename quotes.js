/**
 * Ana sayfa alt şeridi (#dailyQuoteText): her girişte rastgele bir satır.
 * Günlük hatırlatıcı: sabit Rad 13:28 — locale’e göre meal (lib/reminder-quote.js).
 *
 * Uzaktan güncelleme: public/daily-quotes.json (jsDelivr CDN, kaynak: GitHub @main).
 * Git push ile satırlar store güncellemesi olmadan değişir; dosya yoksa/bozuksa
 * gömülü listeler kullanılır. Acil güncellemede cache purge:
 * https://purge.jsdelivr.net/gh/Omer609-wq/zikirmatikenson@main/public/daily-quotes.json
 */
import { Capacitor } from '@capacitor/core';
import quranQuotesData from './data/quotes-quran.json';
import { normalizeRemoteDailyQuotes } from './lib/daily-quotes.js';
import { getReminderQuoteBody, getReminderQuoteNotificationPayload } from './lib/reminder-quote.js';

export { getReminderQuoteBody, getReminderQuoteNotificationPayload } from './lib/reminder-quote.js';

export const DAILY_QUOTES_URL =
    'https://cdn.jsdelivr.net/gh/Omer609-wq/zikirmatikenson@main/public/daily-quotes.json';

const DAILY_QUOTES_CACHE_KEY = 'zikirmatik_daily_quotes_cache';

/** @type {ReturnType<typeof normalizeRemoteDailyQuotes>} */
let remoteDailyQuotes = null;

function applyRemoteDailyQuotes(raw) {
    const normalized = normalizeRemoteDailyQuotes(raw);
    if (normalized) remoteDailyQuotes = normalized;
    return !!normalized;
}

/** Açılışta, ağ beklemeden: son indirilen listeyi önbellekten uygula. */
export function applyCachedRemoteDailyQuotes() {
    try {
        const raw = localStorage.getItem(DAILY_QUOTES_CACHE_KEY);
        if (!raw) return false;
        return applyRemoteDailyQuotes(JSON.parse(raw));
    } catch {
        return false;
    }
}

/** CDN'den günün sözü listesini çek; başarısızsa önbellek/gömülü liste kalır. */
export async function refreshRemoteDailyQuotes() {
    const urls = [`${DAILY_QUOTES_URL}?t=${Date.now()}`];
    if (Capacitor.isNativePlatform()) {
        // Paketle gelen kopya: ilk kurulumda çevrimdışıyken bile en az build anındaki liste.
        urls.push(`./daily-quotes.json?t=${Date.now()}`);
    }
    for (const url of urls) {
        try {
            const res = await fetch(url, { cache: 'no-store' });
            if (!res.ok) continue;
            const raw = await res.json();
            if (applyRemoteDailyQuotes(raw)) {
                try {
                    localStorage.setItem(DAILY_QUOTES_CACHE_KEY, JSON.stringify(raw));
                } catch {
                    /* quota / private mode */
                }
                return true;
            }
        } catch (e) {
            console.warn('daily-quotes fetch', url, e);
        }
    }
    return false;
}

export const APP_QUOTES = [
    'Ölmeden önce tövbe etmekte acele ediniz. (Hadis-i Şerif)',
    "Kalpler ancak Allah'ı anmakla mutmain olur. (Rad Suresi 28)",
    'Dua, müminin silahıdır. (Hadis-i Şerif)',
    'Kim bir iyilik yaparsa ona on katı vardır. (Enam Suresi 160)',
    'Zorlukla beraber şüphesiz bir kolaylık vardır. (İnşirah Suresi 5–6)',
    "Sizin en hayırlınız Kur'an'ı öğrenen ve öğretendir. (Hadis-i Şerif)",
    'Namaz dinin direğidir. (Hadis-i Şerif)',
    'Öyleyse Beni anın ki Ben de sizi anayım; Bana şükredin, nankörlük etmeyin. (Bakara Suresi 152)',
    'Ey iman edenler! Allah\'ı çok zikredin. (Ahzab Suresi 41)',
    'Rabbinin adını an ve bütün varlığınla O\'na yönel. (Müzzemmil Suresi 8)',
    'Şüphesiz Allah, sabredenlerle beraberdir. (Bakara Suresi 153)',
    "Biz Kur'an'ı müminlere şifa ve rahmet olarak indirdik. (İsrâ Suresi 82)",
    'İyilikler kötülükleri giderir. (Hud Suresi 114)',
    'De ki: Benim namazım, kurbanım, hayatım ve ölümüm âlemlerin Rabbi Allah içindir. (Enam Suresi 162)',
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
    'Şüphesiz Ben Allah\'ım; Bana kulluk et, Beni anmak için namaz kıl. (Tâhâ Suresi 14)',
    'Yüce Rabbinin adını tesbih et. (A\'lâ Suresi 1)',
    'Arınmış olan, Rabbinin adını anıp namaz kılan saadete erişir. (A\'lâ Suresi 14–15)',
    'Bir işi bitirince diğerine giriş; ümidini yalnız Rabbinden iste. (İnşirah Suresi 7–8)',
    'Rabbini hamd ile an; ölünceye kadar Rabbine kulluk et. (Hicr Suresi 98–99)',
    'Allah\'ın yardımı ve zafer gelince Rabbini överek tesbih et ve O\'ndan bağışlanma dile. (Nasr Suresi 1–3)',
    'Öğüt ver; doğrusu öğüt inananlara fayda verir. (Zâriyât Suresi 55)',
    'Kullarım sana Beni sorarsa: Ben onlara yakınım; dua edene icabet ederim. (Bakara Suresi 186)',
    'Rabbin seni bırakmadı; ahiret senin için daha hayırlıdır, Rabbin sana verecek ve sen hoşnut olacaksın. (Duhâ Suresi 3–5)',
    'İnanmış olarak iyi iş işleyene hoş bir hayat yaşatırız. (Nahl Suresi 97)',
    'Allah kullarına lütufta bulunandır; dilediğini rızıklandırır. (Şûrâ Suresi 19)',
    'Lâ ilâhe illallah, dil ile kalp uyum içinde söylenmedikçe kişi cennete giremez. (Buhari, Müslim)',
    'Lâ havle ve lâ kuvvete illâ billâh, Cennet hazinelerinden bir hazinedir. (Buhari, Müslim)',
    'Ölümü çokça anın; o, dünya sevgisini giderir. (Tirmizi)',
    'Kabrin sıkışmasından Allah\'a sığının. (Tirmizi, Ebu Davud)',
    'Sahurda bereket vardır. (Buhari, Müslim)',
    'Oruçlunun iftar anındaki duası reddolunmaz. (Tirmizi)',
    'Kim Allah için bir karış yol yürürse, Allah ona iki karış yol yürütür. (Buhari, Müslim)',
    'Allah yolunda atılan her adım, bir sadakadır. (Buhari, Müslim)',
    'De ki: Ey kendilerine zulmeden kullarım! Allah\'ın rahmetinden ümit kesmeyin. (Zümer Suresi 53)',
    'Kalpler ancak Allah\'ı anmakla huzur bulur. (Ra\'d Suresi 28)',
    'Allah Teâlâ buyurur: Ben kulumun zannı gibiyim. (Buhari, Müslim)',
    'Allah, kulunun tövbesine çok sevinir. (Müslim)',
    'Ameller niyetlere göredir. (Buhari, Müslim)',
    'Kolaylaştırın, zorlaştırmayın; müjdeleyin, nefret ettirmeyin. (Buhari, Müslim)',
    'Allah, kullarına karşı annesinin çocuğuna merhametinden daha merhametlidir. (Buhari, Müslim)',
    'Müminin işi ne güzeldir! Her hali onun için hayırdır. (Müslim)',
    'Allah, sizin suretlerinize ve mallarınıza değil; kalplerinize ve amellerinize bakar. (Müslim)',
    'Kim bir müminin sıkıntısını giderirse, Allah da onun kıyamet sıkıntılarından birini giderir. (Müslim)',
    'Biriniz, kendisi için sevdiğini kardeşi için de sevmedikçe iman etmiş olmaz. (Buhari, Müslim)',
    'Yarım hurma ile de olsa ateşten korunun. (Buhari, Müslim)',
    'Radîtu billâhi Rabben ve bil-İslâmi dînen ve bi-Muhammedin nebiyyan. (Hadis-i Şerif)',
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

function formatQuranRef(surah, ayah, endAyah) {
    const end = Number(endAyah);
    if (Number.isFinite(end) && end > ayah) return `(${surah}:${ayah}–${end})`;
    return `(${surah}:${ayah})`;
}

function pickRandomQuranQuoteEntry(locale) {
    const code = normalizeQuoteLocale(locale);
    const list =
        remoteDailyQuotes?.quranQuotes?.[code] ||
        quranQuotesData?.quotes?.[code] ||
        remoteDailyQuotes?.quranQuotes?.en ||
        quranQuotesData?.quotes?.en ||
        [];
    if (!Array.isArray(list) || !list.length) return null;
    const row = list[Math.floor(Math.random() * list.length)];
    const s = Number(row[0]);
    const a = Number(row[1]);
    const body = cleanQuoteText(row[2]);
    const ref = formatQuranRef(s, a, row[3]);
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
    const trQuotes = remoteDailyQuotes?.appQuotes || APP_QUOTES;
    const full = trQuotes[Math.floor(Math.random() * trQuotes.length)];
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
