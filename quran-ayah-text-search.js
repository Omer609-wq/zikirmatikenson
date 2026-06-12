/**
 * Meal ve (TR) okunuş metninde ayet araması — locale başına lazy indeks.
 */
import { parseQuranRefQuery, getSurahRefDisplayName } from './quran-ref-search.js';
import translitSearchIndex from './data/quran/search/translit-tr.json' with { type: 'json' };

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

function normalizeSearchLocale(locale = 'tr') {
    return String(locale || 'tr').toLowerCase().split('-')[0];
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

function getMealLocaleConfig(locale) {
    return MEAL_LOCALE_CONFIG[normalizeSearchLocale(locale)] || null;
}

export function localeSupportsMealTextSearch(locale = 'tr') {
    return Boolean(getMealLocaleConfig(locale));
}

export function localeSupportsTranslitTextSearch(locale = 'tr') {
    return normalizeSearchLocale(locale) === 'tr';
}

export function localeSupportsAyahTextSearch(locale = 'tr') {
    return localeSupportsMealTextSearch(locale) || localeSupportsTranslitTextSearch(locale);
}

export function isMealSearchIndexReady(locale = 'tr') {
    const code = normalizeSearchLocale(locale);
    return mealIndexCache.has(code);
}

export async function preloadMealSearchIndex(locale = 'tr') {
    const code = normalizeSearchLocale(locale);
    if (!getMealLocaleConfig(code)) return null;
    if (mealIndexCache.has(code)) return mealIndexCache.get(code);
    if (mealIndexLoading.has(code)) return mealIndexLoading.get(code);

    const loadPromise = import(`./data/quran/search/meal-${code}.json`, { with: { type: 'json' } })
        .then((mod) => {
            const index = mod.default || mod;
            mealIndexCache.set(code, index);
            mealIndexLoading.delete(code);
            return index;
        })
        .catch((err) => {
            mealIndexLoading.delete(code);
            throw err;
        });

    mealIndexLoading.set(code, loadPromise);
    return loadPromise;
}

function getLoadedMealSearchIndex(locale) {
    return mealIndexCache.get(normalizeSearchLocale(locale)) || null;
}

/**
 * Referans sorgusu değilse ve yeterince uzunsa meal/okunuş aramasına izin ver.
 */
export function meetsMinTextSearchQuery(raw, locale = 'tr') {
    const q = String(raw || '').trim();
    if (!q) return false;
    if (parseQuranRefQuery(q)) return false;

    const mealCfg = getMealLocaleConfig(locale);
    const normalize = mealCfg?.normalize || normalizeMealSearchText;
    const stopWords = mealCfg?.stopWords || TR_STOP_WORDS;

    const norm = normalize(q);
    const compact = norm.replace(/\s+/g, '');
    if (compact.length < MIN_TEXT_SEARCH_CHARS) return false;

    const tokens = norm.split(/\s+/).filter((t) => t.length >= 2 && !stopWords.has(t));
    if (!tokens.length) return compact.length >= MIN_TEXT_SEARCH_CHARS;
    return tokens.join('').length >= MIN_TEXT_SEARCH_CHARS;
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

function findTokenInHay(hay, token, from = 0, fuzzy = false) {
    const idx = hay.indexOf(token, from);
    if (idx >= 0) return { pos: idx, fuzz: 0 };

    if (!fuzzy || token.length < 4) return null;

    for (let i = from; i < hay.length; i += 1) {
        for (let len = token.length - 1; len <= token.length + 1; len += 1) {
            if (len < 3 || i + len > hay.length) continue;
            const slice = hay.slice(i, i + len);
            if (levenshteinAtMost1(slice, token) <= 1) {
                return { pos: i, fuzz: 1 };
            }
        }
    }
    return null;
}

function scoreHaystack(hay, tokens, fuzzy = false) {
    let searchFrom = 0;
    const positions = [];
    let fuzzPenalty = 0;

    for (const tok of tokens) {
        const hit = findTokenInHay(hay, tok, searchFrom, fuzzy);
        if (!hit) return null;
        positions.push(hit.pos);
        fuzzPenalty += hit.fuzz * 40;
        searchFrom = hit.pos + Math.max(tok.length, 1);
    }

    const span = positions[positions.length - 1] - positions[0];
    return span + positions[0] * 0.01 + fuzzPenalty;
}

function makeSnippet(text, rawQuery, cfg, maxLen = 72) {
    const original = String(text || '').trim();
    if (!original) return '';
    const normalize = cfg.normalize;
    const stopWords = cfg.stopWords;
    const localeTag = cfg.localeTag || 'tr';
    const tokens = searchTokensFromQuery(rawQuery, normalize, stopWords);
    const lower =
        localeTag === 'bn' || localeTag === 'ur'
            ? original
            : original.toLocaleLowerCase(localeTag === 'tr' ? 'tr' : localeTag);
    let hitAt = -1;
    for (const tok of tokens) {
        const plain = normalize(tok);
        const idx = normalize(lower).indexOf(plain);
        if (idx >= 0 && (hitAt < 0 || idx < hitAt)) hitAt = idx;
    }
    if (hitAt < 0) {
        return original.length <= maxLen ? original : `${original.slice(0, maxLen - 1)}…`;
    }
    const start = Math.max(0, hitAt - 18);
    const slice = original.slice(start, start + maxLen);
    const prefix = start > 0 ? '…' : '';
    const suffix = start + maxLen < original.length ? '…' : '';
    return `${prefix}${slice}${suffix}`;
}

function mapScoredHits(scored, surahIndex, locale, raw, kind, cfg, extras = {}) {
    return scored.map((hit) => {
        const meta = (surahIndex || []).find((s) => s.n === hit.surah);
        return {
            kind,
            surah: hit.surah,
            ayah: hit.ayah,
            displayName: getSurahRefDisplayName(meta || { n: hit.surah }, locale),
            snippet: makeSnippet(hit.text, raw, cfg),
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
        const score = scoreHaystack(hay, tokens, false);
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
    if (!meetsMinTextSearchQuery(raw, 'tr')) return [];

    const trCfg = MEAL_LOCALE_CONFIG.tr;
    const tokens = searchTokensFromQuery(raw, normalizeTranslitSearchText, TRANSLIT_STOP_WORDS);
    if (!tokens.length) return [];

    const limit = Number(options.limit) > 0 ? Number(options.limit) : 5;
    const rows = translitSearchIndex?.ayahs || [];
    const scored = [];

    for (const row of rows) {
        const hay = row.n || '';
        const score = scoreHaystack(hay, tokens, true);
        if (score == null) continue;
        scored.push({
            surah: row.s,
            ayah: row.a,
            score,
            text: row.t
        });
    }

    scored.sort((a, b) => a.score - b.score || a.surah - b.surah || a.ayah - b.ayah);

    const translitCfg = { localeTag: 'tr', normalize: normalizeTranslitSearchText, stopWords: TRANSLIT_STOP_WORDS };
    return mapScoredHits(scored.slice(0, limit), surahIndex, locale, raw, 'translit', translitCfg, {
        fields: () => ({ readModeId: 'translit-ar' })
    }).map(({ score, ...hit }) => hit);
}

/**
 * Meal + (TR) okunuş sonuçlarını birleştirir; aynı ayette en iyi eşleşmeyi seçer.
 */
export function searchAyahTextHits(raw, surahIndex, locale = 'tr', options = {}) {
    if (!localeSupportsAyahTextSearch(locale)) return [];
    if (!meetsMinTextSearchQuery(raw, locale)) return [];

    const limit = Number(options.limit) > 0 ? Number(options.limit) : 5;
    const poolLimit = Math.max(limit * 2, 8);
    const mealRows = searchMealAyahsInternal(raw, locale, { limit: poolLimit });
    const translitRows = localeSupportsTranslitTextSearch(locale)
        ? searchTranslitAyahsInternal(raw, { limit: poolLimit })
        : [];
    const bestByAyah = new Map();

    for (const hit of [...mealRows, ...translitRows]) {
        const key = `${hit.surah}:${hit.ayah}`;
        const prev = bestByAyah.get(key);
        if (!prev || hit.score < prev.score) bestByAyah.set(key, hit);
    }

    const merged = [...bestByAyah.values()];
    merged.sort((a, b) => a.score - b.score || a.surah - b.surah || a.ayah - b.ayah);

    return merged.slice(0, limit).map((hit) => {
        const meta = (surahIndex || []).find((s) => s.n === hit.surah);
        const base = {
            kind: hit.kind,
            surah: hit.surah,
            ayah: hit.ayah,
            displayName: getSurahRefDisplayName(meta || { n: hit.surah }, locale),
            snippet: hit.snippet
        };
        if (hit.kind === 'meal') return { ...base, mealId: hit.mealId };
        return { ...base, readModeId: hit.readModeId };
    });
}

function searchMealAyahsInternal(raw, locale, options = {}) {
    const code = normalizeSearchLocale(locale);
    const mealCfg = getMealLocaleConfig(code);
    if (!mealCfg) return [];

    const tokens = searchTokensFromQuery(raw, mealCfg.normalize, mealCfg.stopWords);
    if (!tokens.length) return [];

    const limit = Number(options.limit) > 0 ? Number(options.limit) : 5;
    const rows = getLoadedMealSearchIndex(code)?.ayahs || [];
    if (!rows.length) return [];

    const bestByAyah = new Map();

    for (const row of rows) {
        const score = scoreHaystack(row.n || '', tokens, false);
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
                snippet: makeSnippet(row.t, raw, mealCfg)
            });
        }
    }

    return [...bestByAyah.values()]
        .sort((a, b) => a.score - b.score || a.surah - b.surah || a.ayah - b.ayah)
        .slice(0, limit);
}

function searchTranslitAyahsInternal(raw, options = {}) {
    const tokens = searchTokensFromQuery(raw, normalizeTranslitSearchText, TRANSLIT_STOP_WORDS);
    if (!tokens.length) return [];
    const limit = Number(options.limit) > 0 ? Number(options.limit) : 5;
    const rows = translitSearchIndex?.ayahs || [];
    const translitCfg = { localeTag: 'tr', normalize: normalizeTranslitSearchText, stopWords: TRANSLIT_STOP_WORDS };
    const scored = [];

    for (const row of rows) {
        const score = scoreHaystack(row.n || '', tokens, true);
        if (score == null) continue;
        scored.push({
            kind: 'translit',
            surah: row.s,
            ayah: row.a,
            readModeId: 'translit-ar',
            score,
            snippet: makeSnippet(row.t, raw, translitCfg)
        });
    }

    return scored.sort((a, b) => a.score - b.score || a.surah - b.surah || a.ayah - b.ayah).slice(0, limit);
}
