import surahIndex from './data/quran/index.json' with { type: 'json' };
import latinSurahNames from './data/quran/surah-names-latin.json' with { type: 'json' };
import surahNamesI18n from './data/quran/surah-names-i18n.json' with { type: 'json' };

const latinByN = new Map((latinSurahNames || []).map((row) => [row.n, row]));
const i18nByN = new Map((surahNamesI18n || []).map((row) => [row.n, row]));
const indexByN = new Map((surahIndex || []).map((row) => [row.n, row]));

const localizedByN = new Map();

surahIndex.forEach((surah) => {
    const latin = latinByN.get(surah.n) || {};
    const extra = i18nByN.get(surah.n) || {};
    const en = latin.en || surah.nameTr || String(surah.n);
    localizedByN.set(surah.n, {
        tr: surah.nameTr || en,
        ar: surah.nameAr || en,
        en,
        fr: extra.fr || en,
        id: en,
        ms: en,
        bn: extra.bn || en,
        ur: extra.ur || surah.nameAr || en
    });
});

function normalizeLocaleCode(locale) {
    const code = String(locale || 'tr').toLowerCase().split('-')[0];
    return code || 'tr';
}

/**
 * @param {number | { n: number }} surahOrN
 * @param {string} [locale]
 */
export function getSurahLocalizedName(surahOrN, locale = 'tr') {
    const n =
        surahOrN != null && typeof surahOrN === 'object'
            ? Number(surahOrN.n)
            : Number(surahOrN);
    if (!Number.isFinite(n) || n < 1) return '';
    const row = localizedByN.get(n);
    const code = normalizeLocaleCode(locale);
    if (!row) return String(n);
    return row[code] || row.en || row.tr || String(n);
}

export function getSurahMeta(n) {
    return indexByN.get(Number(n)) || null;
}

export function getSurahLocalizedNamesRow(n) {
    return localizedByN.get(Number(n)) || null;
}
