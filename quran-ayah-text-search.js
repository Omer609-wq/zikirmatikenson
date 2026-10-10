/**
 * Meal, Arapça mushaf ve (TR) okunuş metninde ayet araması — locale başına lazy indeks.
 */
import { parseQuranRefQuery, getSurahRefDisplayName, normalizeArabicSearchText } from './quran-ref-search.js';

/** Gürültüyü azaltmak için minimum arama uzunluğu (boşluksuz). */
export const MIN_TEXT_SEARCH_CHARS = 3;

const TR_STOP_WORDS = new Set([
    've',
    'bir',
    'ile',
    'icin',
    'için',
    'de',
    'da',
    'ki',
    'bu',
    'su',
    'şu',
    'o',
    'ne',
    'en',
    'var',
    'her',
    'olan',
    'gibi',
    'olanlar',
    'onlar',
    'ise',
    'mi',
    'mu',
    'mü',
    'mı'
]);

const EN_STOP_WORDS = new Set([
    'a',
    'an',
    'the',
    'and',
    'or',
    'of',
    'in',
    'on',
    'at',
    'to',
    'for',
    'is',
    'are',
    'was',
    'were',
    'be',
    'been',
    'being',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'shall',
    'should',
    'may',
    'might',
    'must',
    'can',
    'could',
    'who',
    'whom',
    'which',
    'that',
    'this',
    'these',
    'those',
    'it',
    'its',
    'they',
    'them',
    'their',
    'we',
    'our',
    'you',
    'your',
    'he',
    'she',
    'his',
    'her',
    'not',
    'no',
    'nor',
    'but',
    'if',
    'as',
    'by',
    'with',
    'from',
    'into',
    'about',
    'than',
    'then',
    'so',
    'up',
    'out',
    'also',
    'very',
    'all',
    'any',
    'each',
    'few',
    'more',
    'most',
    'other',
    'some',
    'such',
    'only',
    'own',
    'same',
    'too'
]);

const ID_STOP_WORDS = new Set([
    'yang',
    'dan',
    'di',
    'ke',
    'dari',
    'pada',
    'untuk',
    'dengan',
    'ini',
    'itu',
    'ada',
    'tidak',
    'mereka',
    'atau',
    'juga',
    'akan',
    'telah',
    'oleh',
    'karena',
    'adalah',
    'ia',
    'kami',
    'kita',
    'anda',
    'sebuah',
    'suatu',
    'bahwa',
    'dalam',
    'bagi',
    'serta',
    'lebih',
    'sangat'
]);

const MS_STOP_WORDS = new Set([
    'yang',
    'dan',
    'di',
    'ke',
    'dari',
    'pada',
    'untuk',
    'dengan',
    'ini',
    'itu',
    'ada',
    'tidak',
    'tiada',
    'mereka',
    'atau',
    'juga',
    'akan',
    'telah',
    'oleh',
    'kerana',
    'adalah',
    'ia',
    'kami',
    'kita',
    'anda',
    'sebuah',
    'suatu',
    'bahawa',
    'dalam',
    'bagi',
    'serta',
    'lebih',
    'sangat'
]);

const FR_STOP_WORDS = new Set([
    'le',
    'la',
    'les',
    'un',
    'une',
    'des',
    'du',
    'de',
    'et',
    'ou',
    'en',
    'au',
    'aux',
    'pour',
    'par',
    'sur',
    'dans',
    'avec',
    'ce',
    'cette',
    'ces',
    'qui',
    'que',
    'dont',
    'il',
    'elle',
    'ils',
    'elles',
    'nous',
    'vous',
    'je',
    'tu',
    'se',
    'ne',
    'pas',
    'plus',
    'tres',
    'aussi',
    'leur',
    'leurs',
    'son',
    'sa',
    'ses',
    'est',
    'sont',
    'ete',
    'etre',
    'a',
    'ont',
    'avait',
    'au',
    'y'
]);

const BN_STOP_WORDS = new Set([
    'এবং',
    'এর',
    'এক',
    'এই',
    'সে',
    'যে',
    'থেকে',
    'করে',
    'হয়',
    'না',
    'কি',
    'তা',
    'তবে',
    'যদি',
    'বা',
    'জন্য',
    'মধ্যে',
    'আর',
    'তার',
    'হয়ে',
    'ছিল',
    'কোন',
    'কোনো'
]);

const UR_STOP_WORDS = new Set([
    'و',
    'في',
    'من',
    'الى',
    'على',
    'هذا',
    'هذه',
    'ذلك',
    'التي',
    'الذي',
    'ان',
    'انه',
    'ما',
    'لا',
    'هل',
    'كان',
    'قد',
    'ثم',
    'او',
    'به',
    'بها',
    'لهم',
    'لها',
    'الذين',
    'هو',
    'هي',
    'هم',
    'كي',
    'كل'
]);

const TRANSLIT_STOP_WORDS = new Set(['ve', 'el', 'lil', 'fi', 'min', 'vem', 'iley', 'min']);

const EN_TRANSLIT_STOP_WORDS = new Set([
    ...EN_STOP_WORDS,
    'al',
    'ar',
    'as',
    'ash',
    'ad',
    'an',
    'ab',
    'ibn',
    'bin',
    'li',
    'lil',
    'wa',
    'fi',
    'min',
    'ila',
    'bi',
    'hu',
    'ha',
    'huwa',
    'hiya',
    'hum',
    'hunna',
    'inna',
    'anna'
]);

const AR_STOP_WORDS = new Set([
    'في',
    'من',
    'ال',
    'و',
    'ب',
    'ل',
    'ك',
    'عن',
    'الى',
    'علي',
    'على',
    'ما',
    'لا',
    'ان',
    'ان',
    'او',
    'هذا',
    'هذه',
    'ذلك',
    'التي',
    'الذي',
    'الذين',
    'هم',
    'هن',
    'هو',
    'هي',
    'قد',
    'كان',
    'قال',
    'ان',
    'لم',
    'لن',
    'كل',
    'ذلك',
    'ثم',
    'بل',
    'مع',
    'عند',
    'حتي',
    'اذا',
    'اذ',
    'انما',
    'الا',
    'غير',
    'بين',
    'عليه',
    'عليهم',
    'اليه',
    'اليكم',
    'ربكم',
    'الله',
    'رب',
    'ان',
    'يا'
]);

const AR_AYAH_SEARCH_CONFIG = {
    localeTag: 'ar',
    normalize: normalizeArabicAyahSearchText,
    stopWords: AR_STOP_WORDS
};

const MEAL_LOCALE_CONFIG = {
    tr: {
        localeTag: 'tr',
        normalize: normalizeMealSearchText,
        stopWords: TR_STOP_WORDS
    },
    en: {
        localeTag: 'en',
        normalize: normalizeLatinMealSearchText,
        stopWords: EN_STOP_WORDS
    },
    id: {
        localeTag: 'id',
        normalize: (value) => normalizeLatinMealSearchText(value, 'id'),
        stopWords: ID_STOP_WORDS
    },
    ms: {
        localeTag: 'ms',
        normalize: (value) => normalizeLatinMealSearchText(value, 'ms'),
        stopWords: MS_STOP_WORDS
    },
    fr: {
        localeTag: 'fr',
        normalize: (value) => normalizeLatinMealSearchText(value, 'fr'),
        stopWords: FR_STOP_WORDS
    },
    bn: {
        localeTag: 'bn',
        normalize: normalizeBnMealSearchText,
        stopWords: BN_STOP_WORDS
    },
    ur: {
        localeTag: 'ur',
        normalize: normalizeUrMealSearchText,
        stopWords: UR_STOP_WORDS
    }
};

const mealIndexCache = new Map();
const mealIndexLoading = new Map();
const arabicAyahIndexCache = new Map();
let arabicAyahIndexLoading = null;
const translitIndexCache = new Map();
const translitIndexLoading = new Map();
const indexLoadErrors = new Map();
/** @type {((fileName: string) => Promise<unknown>) | null} */
let searchIndexLoaderOverride = null;

/** Node testleri için dosyadan okuma; üretim bundle'ına dahil edilmez. */
export function __setSearchIndexLoaderForTests(loader) {
    searchIndexLoaderOverride = typeof loader === 'function' ? loader : null;
}

const SEARCH_INDEX_FETCH_MS = 30000;

function searchIndexUrl(fileName) {
    const base = import.meta.env?.BASE_URL || './';
    const normalizedBase = base.endsWith('/') ? base : `${base}/`;
    return `${normalizedBase}data/quran/search/${fileName}`;
}

async function fetchSearchIndexJson(fileName) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SEARCH_INDEX_FETCH_MS);
    try {
        const res = await fetch(searchIndexUrl(fileName), { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    } finally {
        clearTimeout(timer);
    }
}

async function loadSearchIndexJson(fileName, cacheKey) {
    try {
        const index = searchIndexLoaderOverride
            ? await searchIndexLoaderOverride(fileName)
            : await fetchSearchIndexJson(fileName);
        indexLoadErrors.delete(cacheKey);
        return index;
    } catch (cause) {
        const err = new Error(`Search index load failed: ${fileName}`);
        err.cause = cause;
        indexLoadErrors.set(cacheKey, err);
        throw err;
    }
}

export function getAyahTextSearchIndexError(locale = 'tr') {
    const code = normalizeSearchLocale(locale);
    if (code === 'ar') {
        return indexLoadErrors.get('ar') || indexLoadErrors.get('translit-en') || null;
    }
    const mealErr = indexLoadErrors.get(code);
    if (mealErr) return mealErr;
    const translitPack = getTranslitSearchPackId(code);
    return indexLoadErrors.get(translitPack) || null;
}

function normalizeSearchLocale(locale = 'tr') {
    return String(locale || 'tr').toLowerCase().split('-')[0];
}

export function normalizeArabicAyahSearchText(value) {
    return normalizeArabicSearchText(value);
}

export function normalizeMealSearchText(value) {
    return String(value || '')
        .toLocaleLowerCase('tr')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[''`´]/g, '')
        .replace(/[^a-z0-9çğıöşüâîû\s]/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export function normalizeLatinMealSearchText(value, localeTag = 'en') {
    return String(value || '')
        .toLocaleLowerCase(localeTag)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[''`´]/g, '')
        .replace(/[^a-z0-9\s]/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export function normalizeEnMealSearchText(value) {
    return normalizeLatinMealSearchText(value, 'en');
}

export function normalizeBnMealSearchText(value) {
    return String(value || '')
        .replace(/[^\u0980-\u09FF\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export function normalizeUrMealSearchText(value) {
    return String(value || '')
        .normalize('NFKD')
        .replace(/[\u064B-\u065F\u0670\u0610-\u061A\u06D6-\u06ED\u0640]/g, '')
        .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\s]/g, ' ')
        .replace(/[أإآٱ]/g, 'ا')
        .replace(/ى/g, 'ي')
        .replace(/ؤ/g, 'و')
        .replace(/ئ/g, 'ي')
        .replace(/ة/g, 'ه')
        .replace(/\s+/g, ' ')
        .trim();
}

export function normalizeTranslitSearchText(value) {
    return String(value || '')
        .toLocaleLowerCase('tr')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[âîûôêāīū]/g, (ch) => ({ â: 'a', î: 'i', û: 'u', ô: 'o', ê: 'e', ā: 'a', ī: 'i', ū: 'u' })[ch] || ch)
        .replace(/[ẕẔḳḲṣṢṭṬḥḤḫḪ]/g, (ch) =>
            ({ ẕ: 'z', Ẕ: 'z', ḳ: 'k', Ḳ: 'k', ṣ: 's', Ṣ: 's', ṭ: 't', Ṭ: 't', ḥ: 'h', Ḥ: 'h', ḫ: 'h', Ḫ: 'h' })[ch] || ch
        )
        .replace(/[''`´ʻʿ]/g, '')
        .replace(/[-]/g, ' ')
        .replace(/[^a-z0-9çğıöşü\s]/gi, ' ')
        .replace(/ç/g, 'c')
        .replace(/ğ/g, 'g')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ş/g, 's')
        .replace(/ü/g, 'u')
        .replace(/\s+/g, ' ')
        .trim();
}

export function compactTranslitSearchText(value) {
    return normalizeTranslitSearchText(value).replace(/\s+/g, '');
}

export function normalizeEnTranslitSearchText(value) {
    return String(value || '')
        .toLocaleLowerCase('en')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[''`´ʻʿ]/g, '')
        .replace(/[-]/g, ' ')
        .replace(/[^a-z0-9\s]/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export function compactEnTranslitSearchText(value) {
    return normalizeEnTranslitSearchText(value).replace(/\s+/g, '');
}

export function getTranslitSearchPackId(locale = 'tr') {
    return normalizeSearchLocale(locale) === 'tr' ? 'translit-tr' : 'translit-en';
}

// Okunuş metni her zaman latin alfabededir. Bu yüzden okunuş aramasının
// min-uzunluk/geçerlilik geçidi, dilin meal-normalize'ı yerine okunuş pack'inin
// latin diliyle (tr veya en) yapılmalıdır. Aksi halde bn/ur/ar gibi non-latin
// meal-normalize'ları latin sorguyu silip okunuş aramasını tamamen engeller.
function getTranslitGateLocale(locale = 'tr') {
    return getTranslitSearchPackId(locale) === 'translit-tr' ? 'tr' : 'en';
}

function getTranslitSearchConfig(locale = 'tr') {
    if (getTranslitSearchPackId(locale) === 'translit-tr') {
        return {
            packId: 'translit-tr',
            normalize: normalizeTranslitSearchText,
            compact: compactTranslitSearchText,
            stopWords: TRANSLIT_STOP_WORDS,
            localeTag: 'tr'
        };
    }
    return {
        packId: 'translit-en',
        normalize: normalizeEnTranslitSearchText,
        compact: compactEnTranslitSearchText,
        stopWords: EN_TRANSLIT_STOP_WORDS,
        localeTag: 'en'
    };
}

function prepareTranslitIndexRows(ayahs, normalize) {
    return (ayahs || []).map((row) => {
        const text = String(row.t || '').trim();
        const norm = normalize(text);
        return {
            s: row.s,
            a: row.a,
            t: text,
            n: norm,
            c: norm.replace(/\s+/g, '')
        };
    });
}

function getMealLocaleConfig(locale) {
    return MEAL_LOCALE_CONFIG[normalizeSearchLocale(locale)] || null;
}

export function localeSupportsMealTextSearch(locale = 'tr') {
    return Boolean(getMealLocaleConfig(locale));
}

export function localeSupportsArabicAyahTextSearch(locale = 'tr') {
    return normalizeSearchLocale(locale) === 'ar';
}

export function localeSupportsTranslitTextSearch(locale = 'tr') {
    const code = normalizeSearchLocale(locale);
    if (code === 'tr') return true;
    return localeSupportsMealTextSearch(locale) || localeSupportsArabicAyahTextSearch(locale);
}

export function localeSupportsAyahTextSearch(locale = 'tr') {
    return (
        localeSupportsMealTextSearch(locale) ||
        localeSupportsArabicAyahTextSearch(locale) ||
        localeSupportsTranslitTextSearch(locale)
    );
}

export function isAyahTextSearchIndexReady(locale = 'tr') {
    const code = normalizeSearchLocale(locale);
    if (code === 'ar') {
        return arabicAyahIndexCache.has('ar') && translitIndexCache.has('translit-en');
    }
    if (!mealIndexCache.has(code)) return false;
    if (localeSupportsTranslitTextSearch(locale)) {
        return translitIndexCache.has(getTranslitSearchPackId(code));
    }
    return true;
}

export function isMealSearchIndexReady(locale = 'tr') {
    const code = normalizeSearchLocale(locale);
    if (code === 'ar') return false;
    return mealIndexCache.has(code);
}

export async function preloadArabicAyahSearchIndex() {
    if (arabicAyahIndexCache.has('ar')) return arabicAyahIndexCache.get('ar');
    if (arabicAyahIndexLoading) return arabicAyahIndexLoading;

    arabicAyahIndexLoading = loadSearchIndexJson('ar-ayah.json', 'ar')
        .then((index) => {
            arabicAyahIndexCache.set('ar', index);
            arabicAyahIndexLoading = null;
            return index;
        })
        .catch((err) => {
            indexLoadErrors.set('ar', err);
            arabicAyahIndexLoading = null;
            throw err;
        });

    return arabicAyahIndexLoading;
}

export async function preloadAyahTextSearchIndex(locale = 'tr') {
    const code = normalizeSearchLocale(locale);
    if (code === 'ar') {
        const results = await Promise.all([
            preloadArabicAyahSearchIndex(),
            preloadTranslitSearchIndex('translit-en')
        ]);
        return results[0];
    }
    const tasks = [preloadMealSearchIndex(locale)];
    if (localeSupportsTranslitTextSearch(locale)) {
        tasks.push(preloadTranslitSearchIndex(getTranslitSearchPackId(locale)));
    }
    const results = await Promise.all(tasks);
    return results[0];
}

export async function preloadTranslitSearchIndex(packId = 'translit-tr') {
    const id = packId === 'translit-en' ? 'translit-en' : 'translit-tr';
    if (translitIndexCache.has(id)) return translitIndexCache.get(id);
    if (translitIndexLoading.has(id)) return translitIndexLoading.get(id);

    const normalize =
        id === 'translit-tr' ? normalizeTranslitSearchText : normalizeEnTranslitSearchText;
    const fileName = `${id}.json`;

    const loadPromise = loadSearchIndexJson(fileName, id)
        .then((index) => {
            const prepared = {
                ...index,
                ayahs: prepareTranslitIndexRows(index.ayahs, normalize)
            };
            translitIndexCache.set(id, prepared);
            translitIndexLoading.delete(id);
            return prepared;
        })
        .catch((err) => {
            indexLoadErrors.set(id, err);
            translitIndexLoading.delete(id);
            throw err;
        });

    translitIndexLoading.set(id, loadPromise);
    return loadPromise;
}

export async function preloadMealSearchIndex(locale = 'tr') {
    const code = normalizeSearchLocale(locale);
    if (!getMealLocaleConfig(code)) return null;
    if (mealIndexCache.has(code)) return mealIndexCache.get(code);
    if (mealIndexLoading.has(code)) return mealIndexLoading.get(code);

    const loadPromise = loadSearchIndexJson(`meal-${code}.json`, code)
        .then((index) => {
            mealIndexCache.set(code, index);
            mealIndexLoading.delete(code);
            return index;
        })
        .catch((err) => {
            indexLoadErrors.set(code, err);
            mealIndexLoading.delete(code);
            throw err;
        });

    mealIndexLoading.set(code, loadPromise);
    return loadPromise;
}

function getLoadedMealSearchIndex(locale) {
    return mealIndexCache.get(normalizeSearchLocale(locale)) || null;
}

function getLoadedTranslitSearchIndex(locale = 'tr') {
    return translitIndexCache.get(getTranslitSearchPackId(locale)) || null;
}

/**
 * Referans sorgusu değilse ve yeterince uzunsa meal/okunuş aramasına izin ver.
 */
export function meetsMinTextSearchQuery(raw, locale = 'tr') {
    const q = String(raw || '').trim();
    if (!q) return false;
    if (parseQuranRefQuery(q)) return false;

    const code = normalizeSearchLocale(locale);
    const arCfg = code === 'ar' ? AR_AYAH_SEARCH_CONFIG : null;
    const mealCfg = getMealLocaleConfig(locale);
    const normalize = arCfg?.normalize || mealCfg?.normalize || normalizeMealSearchText;
    const stopWords = arCfg?.stopWords || mealCfg?.stopWords || TR_STOP_WORDS;

    const norm = normalize(q);
    const compact = norm.replace(/\s+/g, '');
    if (compact.length < MIN_TEXT_SEARCH_CHARS) return false;

    const tokens = norm.split(/\s+/).filter((t) => t.length >= 2 && !stopWords.has(t));
    if (!tokens.length) return compact.length >= MIN_TEXT_SEARCH_CHARS;
    return tokens.join('').length >= MIN_TEXT_SEARCH_CHARS;
}

/** Meal/Arapça veya latin okunuş geçidinden biri geçerliyse metin aramasına izin ver. */
export function passesAyahTextSearchQueryGate(raw, locale = 'tr') {
    if (meetsMinTextSearchQuery(raw, locale)) return true;
    return (
        localeSupportsTranslitTextSearch(locale) &&
        meetsMinTextSearchQuery(raw, getTranslitGateLocale(locale))
    );
}

function searchTokensFromQuery(raw, normalize, stopWords) {
    const norm = normalize(raw);
    const tokens = norm.split(/\s+/).filter((t) => t.length >= 2 && !stopWords.has(t));
    if (tokens.length) return tokens;
    return norm ? [norm] : [];
}

function levenshteinAtMost1(a, b) {
    if (a === b) return 0;
    const la = a.length;
    const lb = b.length;
    if (Math.abs(la - lb) > 1) return 2;
    if (la === lb) {
        let diff = 0;
        for (let i = 0; i < la; i += 1) {
            if (a[i] !== b[i]) {
                diff += 1;
                if (diff > 1) return 2;
            }
        }
        return diff;
    }
    const longer = la > lb ? a : b;
    const shorter = la > lb ? b : a;
    let i = 0;
    let j = 0;
    let edits = 0;
    while (i < longer.length && j < shorter.length) {
        if (longer[i] === shorter[j]) {
            i += 1;
            j += 1;
            continue;
        }
        edits += 1;
        if (edits > 1) return 2;
        i += 1;
    }
    return edits + (longer.length - i);
}

function compareTokenHit(a, b) {
    if (!a) return b;
    if (!b) return a;
    if (a.rank !== b.rank) return a.rank < b.rank ? a : b;
    if (a.fuzz !== b.fuzz) return a.fuzz < b.fuzz ? a : b;
    return a.pos <= b.pos ? a : b;
}

function turkishTokenStemMatch(token, word) {
    if (token.length < 5 || word.length < 5) return 0;
    const maxStem = Math.min(token.length, word.length);
    for (let len = maxStem; len >= 5; len -= 1) {
        if (token.slice(0, len) === word.slice(0, len)) return len;
    }
    return 0;
}

function findTokenInHay(hay, token, from = 0, fuzzy = false) {
    let best = null;
    let i = from;
    while (i < hay.length) {
        while (i < hay.length && hay[i] === ' ') i += 1;
        const wordStart = i;
        let j = i;
        while (j < hay.length && hay[j] !== ' ') j += 1;
        const word = hay.slice(wordStart, j);
        i = j + 1;

        if (!word) continue;

        if (word === token) {
            return { pos: wordStart, fuzz: 0, rank: 0 };
        }
        if (word.startsWith(token)) {
            best = compareTokenHit(best, { pos: wordStart, fuzz: 0, rank: 1 });
        } else if (token.startsWith(word) && word.length >= 4) {
            best = compareTokenHit(best, { pos: wordStart, fuzz: 0, rank: 2 });
        } else if (word.includes(token)) {
            best = compareTokenHit(best, {
                pos: wordStart + word.indexOf(token),
                fuzz: 0,
                rank: 2
            });
        } else {
            const stemLen = turkishTokenStemMatch(token, word);
            if (stemLen >= 5) {
                best = compareTokenHit(best, { pos: wordStart, fuzz: 0, rank: 3 });
            } else if (fuzzy && token.length >= 4 && levenshteinAtMost1(word, token) <= 1) {
                best = compareTokenHit(best, { pos: wordStart, fuzz: 1, rank: 4 });
            }
        }
    }

    const idx = hay.indexOf(token, from);
    if (idx >= 0) {
        return compareTokenHit(best, { pos: idx, fuzz: 0, rank: 5 }) || { pos: idx, fuzz: 0, rank: 5 };
    }

    return best;
}

function findFuzzySubstringFrom(hay, token, from = 0) {
    const minLen = Math.max(3, token.length - 1);
    const maxLen = Math.min(hay.length - from, token.length + 1);
    for (let start = from; start < hay.length; start += 1) {
        for (let len = minLen; len <= maxLen; len += 1) {
            if (start + len > hay.length) break;
            const slice = hay.slice(start, start + len);
            if (levenshteinAtMost1(slice, token) <= 1) {
                return { pos: start, fuzz: 1, end: start + len };
            }
        }
    }
    return null;
}

function scoreTokensInCompact(hayCompact, tokens, fuzzy = false) {
    let pos = 0;
    let total = 0;

    for (const tok of tokens) {
        if (!tok) continue;
        let idx = hayCompact.indexOf(tok, pos);
        let fuzz = 0;
        let end = idx >= 0 ? idx + tok.length : -1;

        if (idx < 0 && fuzzy && tok.length >= 4) {
            const found = findFuzzySubstringFrom(hayCompact, tok, pos);
            if (!found) return null;
            idx = found.pos;
            fuzz = found.fuzz;
            end = found.end;
        } else if (idx < 0) {
            return null;
        }

        total += idx * 0.01 + tok.length * 0.001 + fuzz * 40;
        pos = Math.max(end, idx + 1);
    }

    return total;
}

function scoreTranslitHaystack(hay, hayCompact, tokens, raw, compactFn = compactTranslitSearchText) {
    const spacedScore = scoreHaystack(hay, tokens, true);
    const rawCompact = compactFn(raw);
    const compactCandidates = [];

    if (rawCompact.length >= MIN_TEXT_SEARCH_CHARS) {
        compactCandidates.push(rawCompact);
    }
    if (tokens.length > 1) {
        compactCandidates.push(tokens.join(''));
    }

    let bestCompact = null;
    for (const needle of compactCandidates) {
        if (needle.length < MIN_TEXT_SEARCH_CHARS) continue;
        const idx = hayCompact.indexOf(needle);
        if (idx >= 0) {
            const score = idx * 0.01 + needle.length * 0.001;
            bestCompact = bestCompact == null ? score : Math.min(bestCompact, score);
        }
    }

    const orderedCompact = scoreTokensInCompact(hayCompact, tokens, true);
    if (orderedCompact != null) {
        bestCompact = bestCompact == null ? orderedCompact + 8 : Math.min(bestCompact, orderedCompact + 8);
    }

    if (spacedScore == null) return bestCompact;
    if (bestCompact == null) return spacedScore;
    return Math.min(spacedScore, bestCompact);
}

function scoreHaystack(hay, tokens, fuzzy = false) {
    let searchFrom = 0;
    let total = 0;

    for (const tok of tokens) {
        const hit = findTokenInHay(hay, tok, searchFrom, fuzzy);
        if (!hit) return null;
        total += hit.rank * 1000 + hit.pos * 0.01 + hit.fuzz * 40;
        searchFrom = hit.pos + Math.max(tok.length, 1);
    }

    return total;
}

/** Meal: tüm kelimeler ayette geçmeli; sıralı eşleşme varsa öncelikli, yoksa sıra bağımsız AND. */
function scoreHaystackMeal(hay, tokens, fuzzy = false) {
    if (!tokens.length) return null;

    const sequential = tokens.length > 1 ? scoreHaystack(hay, tokens, fuzzy) : null;

    let total = 0;
    const positions = [];
    for (const tok of tokens) {
        const hit = findTokenInHay(hay, tok, 0, fuzzy);
        if (!hit) return null;
        total += hit.rank * 1000 + hit.pos * 0.01 + hit.fuzz * 40;
        positions.push(hit.pos);
    }

    if (sequential != null) return sequential;

    if (tokens.length === 1) return total;

    positions.sort((a, b) => a - b);
    const span = positions[positions.length - 1] - positions[0];
    return total + span * 0.02 + 2500;
}

/** Parça için kelime: harf, hareke, rakam ve kelime içi kesme/ayn işaretleri. Tire ve boşluk ayırır. */
const SNIPPET_WORD_RE = /[\p{L}\p{M}\p{N}'’`´ʻʿ]+/gu;
/** Eşleşmenin önünde bırakılan bağlam (karakter). */
const SNIPPET_LEAD_CHARS = 22;

function snippetWords(text, normalize) {
    const words = [];
    for (const m of text.matchAll(SNIPPET_WORD_RE)) {
        const norm = normalize(m[0]).replace(/\s+/g, '');
        if (!norm) continue;
        words.push({ start: m.index, end: m.index + m[0].length, norm });
    }
    return words;
}

/** findTokenInHay ile aynı sıralama: 0 tam, 1 önek, 2 içerir, 3 kök, 4 tek harf hatası; -1 yok. */
function snippetWordRank(token, word) {
    if (word === token) return 0;
    if (word.startsWith(token)) return 1;
    if (word.includes(token)) return 2;
    if (token.startsWith(word) && word.length >= 4) return 2;
    if (turkishTokenStemMatch(token, word) >= 5) return 3;
    if (token.length >= 4 && levenshteinAtMost1(word, token) <= 1) return 4;
    return -1;
}

/** Çakışan ya da yalnız tireyle ayrılan vurguları birleştirir ("[Vehüve]-[lḳaviyyü]" -> tek vurgu). */
function mergeSnippetMarks(marks, text) {
    const sorted = marks.filter(([a, b]) => b > a).sort((x, y) => x[0] - y[0]);
    const out = [];
    for (const m of sorted) {
        const last = out[out.length - 1];
        if (last && (m[0] <= last[1] || /^[-‐–]$/.test(text.slice(last[1], m[0])))) {
            last[1] = Math.max(last[1], m[1]);
        } else {
            out.push([m[0], m[1]]);
        }
    }
    return out;
}

/**
 * Öneri satırındaki ayet parçası: aranan kelimeyi içeren pencere + vurgu aralıkları.
 * Konum normalize edilmiş metinde değil, orijinal metnin kelimelerinde bulunur:
 * hareke/noktalama/kesme silindiği için normalize metindeki sıra orijinalden kayıyor,
 * uzun ayetlerde ve Arapça/okunuşta parça aranan kelimenin önünde bitiyordu.
 * @returns {{ text: string, marks: Array<[number, number]> }}
 */
function buildSnippet(text, rawQuery, cfg, maxLen = cfg.localeTag === 'ar' ? 120 : 72) {
    const original = String(text || '').trim();
    if (!original) return { text: '', marks: [] };
    const normalize = cfg.normalize;
    const tokens = searchTokensFromQuery(rawQuery, normalize, cfg.stopWords);
    const words = snippetWords(original, normalize);

    // Okunuşta eşleşme kelime sınırını aşabiliyor (ör. "lareybefih"): birleşik
    // metinde ara, karakterden kelimeye geri eşle.
    let compactAll = '';
    const owner = [];
    words.forEach((w, i) => {
        compactAll += w.norm;
        for (let k = 0; k < w.norm.length; k += 1) owner.push(i);
    });
    const compactHit = (needle, fuzzy) => {
        if (!needle || needle.length < MIN_TEXT_SEARCH_CHARS) return null;
        let idx = compactAll.indexOf(needle);
        let end = idx + needle.length;
        if (idx < 0 && fuzzy && needle.length >= 4) {
            const found = findFuzzySubstringFrom(compactAll, needle, 0);
            if (!found) return null;
            idx = found.pos;
            end = found.end;
        }
        if (idx < 0) return null;
        return { from: owner[idx], to: owner[end - 1] };
    };

    const hits = [];
    const normQuery = normalize(rawQuery);
    if (tokens.length > 1 || /\s/.test(normQuery)) {
        const phrase = compactHit(normQuery.replace(/\s+/g, ''), false);
        if (phrase) hits.push({ ...phrase, tok: -1 });
    }
    tokens.forEach((tok, ti) => {
        let best = 5;
        let idxs = [];
        words.forEach((w, wi) => {
            const r = snippetWordRank(tok, w.norm);
            if (r < 0 || r > best) return;
            if (r < best) {
                best = r;
                idxs = [];
            }
            idxs.push(wi);
        });
        // Tam ya da önek eşleşmesi kelimenin kendisi; daha zayıfsa sorgu kelimesi
        // ayette birden çok kelimeye yayılmış olabilir ("ruhulkudüs" ->
        // "rûḥu-lḳudüsi"): birleşik metindeki tam eşleşme o zaman daha doğru.
        if (best >= 2) {
            const exact = compactHit(tok, false);
            if (exact && exact.to > exact.from) {
                hits.push({ ...exact, tok: ti });
                return;
            }
        }
        if (idxs.length) {
            idxs.forEach((wi) => hits.push({ from: wi, to: wi, tok: ti }));
            return;
        }
        const c = compactHit(tok, true);
        if (c) hits.push({ ...c, tok: ti });
    });

    if (!hits.length) {
        const head = original.length <= maxLen ? original : `${original.slice(0, maxLen - 1)}…`;
        return { text: head, marks: [] };
    }

    const ranges = hits
        .map((h) => ({ start: words[h.from].start, end: words[h.to].end, tok: h.tok }))
        .sort((a, b) => a.start - b.start);

    // Pencerenin çapası: kendisinden sonra en çok farklı kelimeyi sığdıran eşleşme.
    let anchor = ranges[0];
    let bestCover = -1;
    for (const a of ranges) {
        const limitEnd = a.start + maxLen - SNIPPET_LEAD_CHARS;
        const covered = new Set();
        for (const r of ranges) {
            if (r.start < a.start || r.end > limitEnd) continue;
            if (r.tok === -1) tokens.forEach((_, i) => covered.add(i));
            else covered.add(r.tok);
        }
        const cover = covered.size + (a.tok === -1 ? 0.5 : 0);
        if (cover > bestCover) {
            bestCover = cover;
            anchor = a;
        }
    }

    const isSpace = (ch) => /\s/.test(ch);
    // Başlangıcı kelime ortasından değil, kelime başından al.
    const snapStart = (s) => {
        if (s <= 0) return 0;
        if (isSpace(original[s - 1])) return s;
        const sp = original.indexOf(' ', s);
        return sp >= 0 && sp < anchor.start ? sp + 1 : anchor.start;
    };
    let start = snapStart(Math.max(0, anchor.start - SNIPPET_LEAD_CHARS));
    let end = start + maxLen;
    if (end >= original.length) {
        // Eşleşme ayetin sonunda: pencereyi geriye doldur.
        end = original.length;
        start = Math.min(start, snapStart(Math.max(0, end - maxLen)));
    } else {
        const sp = original.lastIndexOf(' ', end);
        if (sp > anchor.end) end = sp;
    }
    end = Math.max(end, anchor.end);
    while (start < end && isSpace(original[start])) start += 1;
    while (end > start && isSpace(original[end - 1])) end -= 1;

    const prefix = start > 0 ? '…' : '';
    const suffix = end < original.length ? '…' : '';
    const shift = prefix.length - start;
    const snippet = `${prefix}${original.slice(start, end)}${suffix}`;
    const marks = mergeSnippetMarks(
        ranges
            .filter((r) => r.end > start && r.start < end)
            .map((r) => [Math.max(r.start, start) + shift, Math.min(r.end, end) + shift]),
        snippet
    );
    return { text: snippet, marks };
}

/** Sıralama bittikten sonra yalnız gösterilecek satırlar için parça üretir. */
function withSnippet(hit, raw, cfg) {
    const { text, ...rest } = hit;
    const sn = buildSnippet(text, raw, cfg);
    return { ...rest, snippet: sn.text, snippetMarks: sn.marks };
}

function mapScoredHits(scored, surahIndex, locale, raw, kind, cfg, extras = {}) {
    return scored.map((hit) => {
        const meta = (surahIndex || []).find((s) => s.n === hit.surah);
        const sn = buildSnippet(hit.text, raw, cfg);
        return {
            kind,
            surah: hit.surah,
            ayah: hit.ayah,
            displayName: getSurahRefDisplayName(meta || { n: hit.surah }, locale),
            snippet: sn.text,
            snippetMarks: sn.marks,
            score: hit.score,
            ...extras.fields?.(hit)
        };
    });
}

/**
 * @param {Array<{ n: number, nameTr?: string, nameAr?: string, ayahCount: number }>} surahIndex
 */
export function searchMealAyahs(raw, surahIndex, locale = 'tr', options = {}) {
    const code = normalizeSearchLocale(locale);
    const mealCfg = getMealLocaleConfig(code);
    if (!mealCfg) return [];
    if (!meetsMinTextSearchQuery(raw, code)) return [];

    const tokens = searchTokensFromQuery(raw, mealCfg.normalize, mealCfg.stopWords);
    if (!tokens.length) return [];

    const limit = Number(options.limit) > 0 ? Number(options.limit) : 5;
    const rows = getLoadedMealSearchIndex(code)?.ayahs || [];
    if (!rows.length) return [];

    const bestByAyah = new Map();

    for (const row of rows) {
        const hay = row.n || '';
        const score = scoreHaystackMeal(hay, tokens, true);
        if (score == null) continue;

        const key = `${row.s}:${row.a}`;
        const prev = bestByAyah.get(key);
        if (!prev || score < prev.score || (score === prev.score && row.m < prev.mealId)) {
            bestByAyah.set(key, {
                surah: row.s,
                ayah: row.a,
                mealId: row.m,
                score,
                text: row.t
            });
        }
    }

    const scored = [...bestByAyah.values()];
    scored.sort(
        (a, b) =>
            a.score - b.score ||
            a.surah - b.surah ||
            a.ayah - b.ayah ||
            a.mealId.localeCompare(b.mealId)
    );

    return mapScoredHits(scored.slice(0, limit), surahIndex, locale, raw, 'meal', mealCfg, {
        fields: (hit) => ({ mealId: hit.mealId })
    }).map(({ score, ...hit }) => hit);
}

/**
 * @param {Array<{ n: number, nameTr?: string, nameAr?: string, ayahCount: number }>} surahIndex
 */
export function searchTranslitAyahs(raw, surahIndex, locale = 'tr', options = {}) {
    if (!localeSupportsTranslitTextSearch(locale)) return [];
    if (!meetsMinTextSearchQuery(raw, getTranslitGateLocale(locale))) return [];

    const cfg = getTranslitSearchConfig(locale);
    const tokens = searchTokensFromQuery(raw, cfg.normalize, cfg.stopWords);
    if (!tokens.length) return [];

    const limit = Number(options.limit) > 0 ? Number(options.limit) : 5;
    const rows = getLoadedTranslitSearchIndex(locale)?.ayahs || [];
    const scored = [];

    for (const row of rows) {
        const hay = row.n || '';
        const hayCompact = row.c || hay.replace(/\s+/g, '');
        const score = scoreTranslitHaystack(hay, hayCompact, tokens, raw, cfg.compact);
        if (score == null) continue;
        scored.push({
            surah: row.s,
            ayah: row.a,
            score,
            text: row.t
        });
    }

    scored.sort((a, b) => a.score - b.score || a.surah - b.surah || a.ayah - b.ayah);

    const translitCfg = {
        localeTag: cfg.localeTag,
        normalize: cfg.normalize,
        stopWords: cfg.stopWords
    };
    return mapScoredHits(scored.slice(0, limit), surahIndex, locale, raw, 'translit', translitCfg, {
        fields: () => ({ readModeId: 'translit-ar' })
    }).map(({ score, ...hit }) => hit);
}

function combineDistinctTextSearchHits(rows, limit) {
    return [...rows]
        .sort(
            (a, b) =>
                a.score - b.score ||
                a.surah - b.surah ||
                a.ayah - b.ayah ||
                (a.kind === 'meal' || a.kind === 'ar' ? 0 : 1)
        )
        .slice(0, limit);
}

/**
 * Meal + okunuş sonuçlarını birleştirir; aynı ayette meal ve okunuş ayrı satır kalır.
 */
export function searchAyahTextHits(raw, surahIndex, locale = 'tr', options = {}) {
    if (!localeSupportsAyahTextSearch(locale)) return [];
    if (!passesAyahTextSearchQueryGate(raw, locale)) return [];

    const limit = Number(options.limit) > 0 ? Number(options.limit) : 5;
    const poolLimit = Math.max(limit * 2, 8);
    const surahFilter = Number(options.surah);
    const scopedSurah = Number.isFinite(surahFilter) && surahFilter >= 1 ? surahFilter : null;
    const code = normalizeSearchLocale(locale);

    if (code === 'ar') {
        const arRows = searchArabicAyahsInternal(raw, { limit: poolLimit, surah: scopedSurah });
        const translitRows = searchTranslitAyahsInternal(raw, locale, {
            limit: poolLimit,
            surah: scopedSurah
        });
        const merged = combineDistinctTextSearchHits([...arRows, ...translitRows], limit);
        return merged.map((hit) => {
            const meta = (surahIndex || []).find((s) => s.n === hit.surah);
            const base = {
                kind: hit.kind,
                surah: hit.surah,
                ayah: hit.ayah,
                displayName: getSurahRefDisplayName(meta || { n: hit.surah }, locale),
                snippet: hit.snippet,
                snippetMarks: hit.snippetMarks
            };
            if (hit.kind === 'ar') return { ...base, readModeId: 'ar-only' };
            return { ...base, readModeId: hit.readModeId };
        });
    }

    const mealRows = searchMealAyahsInternal(raw, locale, { limit: poolLimit, surah: scopedSurah });
    const translitRows = localeSupportsTranslitTextSearch(locale)
        ? searchTranslitAyahsInternal(raw, locale, { limit: poolLimit, surah: scopedSurah })
        : [];
    const merged = combineDistinctTextSearchHits([...mealRows, ...translitRows], limit);

    return merged.map((hit) => {
        const meta = (surahIndex || []).find((s) => s.n === hit.surah);
        const base = {
            kind: hit.kind,
            surah: hit.surah,
            ayah: hit.ayah,
            displayName: getSurahRefDisplayName(meta || { n: hit.surah }, locale),
            snippet: hit.snippet,
            snippetMarks: hit.snippetMarks
        };
        if (hit.kind === 'meal') return { ...base, mealId: hit.mealId };
        return { ...base, readModeId: hit.readModeId };
    });
}

/**
 * @param {Array<{ n: number, nameTr?: string, nameAr?: string, ayahCount: number }>} surahIndex
 */
export function searchArabicAyahs(raw, surahIndex, locale = 'ar', options = {}) {
    if (!localeSupportsArabicAyahTextSearch(locale)) return [];
    if (!meetsMinTextSearchQuery(raw, locale)) return [];

    const limit = Number(options.limit) > 0 ? Number(options.limit) : 5;
    const surahFilter = Number(options.surah);
    const scopedSurah = Number.isFinite(surahFilter) && surahFilter >= 1 ? surahFilter : null;

    return searchArabicAyahsInternal(raw, { limit, surah: scopedSurah }).map((hit) => {
        const meta = (surahIndex || []).find((s) => s.n === hit.surah);
        return {
            kind: 'ar',
            surah: hit.surah,
            ayah: hit.ayah,
            displayName: getSurahRefDisplayName(meta || { n: hit.surah }, locale),
            snippet: hit.snippet,
            snippetMarks: hit.snippetMarks,
            readModeId: 'ar-only'
        };
    });
}

function searchArabicAyahsInternal(raw, options = {}) {
    const tokens = searchTokensFromQuery(raw, AR_AYAH_SEARCH_CONFIG.normalize, AR_AYAH_SEARCH_CONFIG.stopWords);
    if (!tokens.length) return [];

    const limit = Number(options.limit) > 0 ? Number(options.limit) : 5;
    const surahFilter = Number(options.surah);
    const scopedSurah = Number.isFinite(surahFilter) && surahFilter >= 1 ? surahFilter : null;
    const rows = arabicAyahIndexCache.get('ar')?.ayahs || [];
    if (!rows.length) return [];

    const scored = [];

    for (const row of rows) {
        if (scopedSurah != null && row.s !== scopedSurah) continue;
        const score = scoreHaystack(row.n || '', tokens, false);
        if (score == null) continue;
        scored.push({
            kind: 'ar',
            surah: row.s,
            ayah: row.a,
            score,
            text: row.t
        });
    }

    return scored
        .sort((a, b) => a.score - b.score || a.surah - b.surah || a.ayah - b.ayah)
        .slice(0, limit)
        .map((hit) => withSnippet(hit, raw, AR_AYAH_SEARCH_CONFIG));
}

function searchMealAyahsInternal(raw, locale, options = {}) {
    const code = normalizeSearchLocale(locale);
    const mealCfg = getMealLocaleConfig(code);
    if (!mealCfg) return [];

    const tokens = searchTokensFromQuery(raw, mealCfg.normalize, mealCfg.stopWords);
    if (!tokens.length) return [];

    const limit = Number(options.limit) > 0 ? Number(options.limit) : 5;
    const surahFilter = Number(options.surah);
    const scopedSurah = Number.isFinite(surahFilter) && surahFilter >= 1 ? surahFilter : null;
    const rows = getLoadedMealSearchIndex(code)?.ayahs || [];
    if (!rows.length) return [];

    const bestByAyah = new Map();

    for (const row of rows) {
        if (scopedSurah != null && row.s !== scopedSurah) continue;
        const score = scoreHaystackMeal(row.n || '', tokens, true);
        if (score == null) continue;
        const key = `${row.s}:${row.a}`;
        const prev = bestByAyah.get(key);
        if (!prev || score < prev.score || (score === prev.score && row.m < prev.mealId)) {
            bestByAyah.set(key, {
                kind: 'meal',
                surah: row.s,
                ayah: row.a,
                mealId: row.m,
                score,
                text: row.t
            });
        }
    }

    return [...bestByAyah.values()]
        .sort((a, b) => a.score - b.score || a.surah - b.surah || a.ayah - b.ayah)
        .slice(0, limit)
        .map((hit) => withSnippet(hit, raw, mealCfg));
}

function searchTranslitAyahsInternal(raw, locale = 'tr', options = {}) {
    const cfg = getTranslitSearchConfig(locale);
    const tokens = searchTokensFromQuery(raw, cfg.normalize, cfg.stopWords);
    if (!tokens.length) return [];
    const limit = Number(options.limit) > 0 ? Number(options.limit) : 5;
    const surahFilter = Number(options.surah);
    const scopedSurah = Number.isFinite(surahFilter) && surahFilter >= 1 ? surahFilter : null;
    const rows = getLoadedTranslitSearchIndex(locale)?.ayahs || [];
    const translitCfg = {
        localeTag: cfg.localeTag,
        normalize: cfg.normalize,
        stopWords: cfg.stopWords
    };
    const scored = [];

    for (const row of rows) {
        if (scopedSurah != null && row.s !== scopedSurah) continue;
        const hay = row.n || '';
        const hayCompact = row.c || hay.replace(/\s+/g, '');
        const score = scoreTranslitHaystack(hay, hayCompact, tokens, raw, cfg.compact);
        if (score == null) continue;
        scored.push({
            kind: 'translit',
            surah: row.s,
            ayah: row.a,
            readModeId: 'translit-ar',
            score,
            text: row.t
        });
    }

    return scored
        .sort((a, b) => a.score - b.score || a.surah - b.surah || a.ayah - b.ayah)
        .slice(0, limit)
        .map((hit) => withSnippet(hit, raw, translitCfg));
}
