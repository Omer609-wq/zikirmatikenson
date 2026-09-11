/**
 * Sure + ayet referans araması: "Bakara 12", "2:12", "Al-Baqarah 12", Arapça ad vb.
 */
import latinSurahNames from './data/quran/surah-names-latin.json' with { type: 'json' };
import { getSurahLocalizedName, getSurahLocalizedNamesRow } from './quran-surah-names.js';

const LATIN_BY_N = new Map((latinSurahNames || []).map((row) => [row.n, row]));

const REF_SUFFIX_RE =
    /(?:\.?\s*(?:ayet|âyet|verse|verses|ayah|ayat|verset|v\.?|آية|اية))\s*$/iu;

/**
 * NFD noktasız `ı`yı çözemez; katlanmazsa aşağıdaki `[^a-z0-9\s]` onu boşluğa
 * çevirip kelimeyi ikiye böler ("Kıyâmet" → "k yamet"). Türkçe `I` de küçükken
 * `ı` olduğu için mobil klavyenin otomatik büyük harfi aynı tuzağa düşer.
 */
const DOTLESS_I_RE = /ı/g;

export function normalizeTrSearchText(value) {
    return String(value || '')
        .toLocaleLowerCase('tr')
        .replace(DOTLESS_I_RE, 'i')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[''`´]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export function normalizeLatinSearchText(value) {
    return String(value || '')
        .toLocaleLowerCase('en')
        .replace(DOTLESS_I_RE, 'i')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[''`´]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export function normalizeArabicSearchText(value) {
    return String(value || '')
        .replace(/\u0670/g, 'ا')
        .replace(/[\u064B-\u065F\u06D6-\u06ED\u08F0-\u08FF]/g, '')
        .replace(/\u0640/g, '')
        .replace(/[أإآٱء]/g, 'ا')
        .replace(/ى/g, 'ي')
        .replace(/ة/g, 'ه')
        .replace(/[^\u0600-\u06FF\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeAppLocaleCode(locale) {
    const code = String(locale || 'tr').toLowerCase().split('-')[0];
    return code || 'tr';
}

function normalizeSearchText(value, locale) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (/[\u0600-\u06FF]/.test(raw)) return normalizeArabicSearchText(raw);
    if (normalizeAppLocaleCode(locale) === 'tr') return normalizeTrSearchText(raw);
    return normalizeLatinSearchText(raw);
}

function getLatinMeta(surahN) {
    return LATIN_BY_N.get(Number(surahN)) || null;
}

/** @returns {string[]} */
export function getSurahSearchNames(surah, locale = 'tr') {
    if (!surah) return [];
    const code = normalizeAppLocaleCode(locale);
    const names = [];

    if (code === 'ar') {
        if (surah.nameAr) names.push(surah.nameAr);
        return names;
    }

    const row = getSurahLocalizedNamesRow(surah.n);
    if (row) {
        Object.values(row).forEach((name) => names.push(name));
    }

    const latin = getLatinMeta(surah.n);
    if (latin?.en) names.push(latin.en);
    if (latin?.short && latin.short !== latin.en) names.push(latin.short);
    if (surah.nameTr) names.push(surah.nameTr);
    if (surah.nameAr) names.push(surah.nameAr);

    return [...new Set(names.filter(Boolean))];
}

export function getSurahRefDisplayName(surah, locale = 'tr') {
    if (!surah) return '';
    return getSurahLocalizedName(surah, locale);
}

function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    const row = new Array(b.length + 1);
    for (let j = 0; j <= b.length; j++) row[j] = j;
    for (let i = 1; i <= a.length; i++) {
        let prev = i - 1;
        row[0] = i;
        for (let j = 1; j <= b.length; j++) {
            const tmp = row[j];
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
            prev = tmp;
        }
    }
    return row[b.length];
}

function scoreNameMatch(queryNorm, nameNorm) {
    if (!queryNorm || !nameNorm) return null;
    if (nameNorm === queryNorm) return 0;
    if (nameNorm.startsWith(queryNorm) || queryNorm.startsWith(nameNorm)) return 2;
    const shorter = Math.min(nameNorm.length, queryNorm.length);
    const longer = Math.max(nameNorm.length, queryNorm.length);
    if (shorter >= 4 && shorter / longer >= 0.45) {
        if (nameNorm.includes(queryNorm) || queryNorm.includes(nameNorm)) return 4;
    }
    const dist = levenshtein(queryNorm, nameNorm);
    const limit = queryNorm.length <= 4 ? 1 : 2;
    if (dist <= limit) return 10 + dist;
    return null;
}

/**
 * `scoreNameMatch` bu puana kadar "adı gerçekten tuttu" sayar (tam / ön ek /
 * içerir); üstü yazım hatası katmanıdır.
 */
export const SOLID_NAME_SCORE_MAX = 4;

/**
 * Ad net eşleştiyse yazım hatası adaylarını ele. Sure adları her dilde
 * arandığı için uzak bir dilin adı ("Marie" ↔ "tarik") iki harf farkla
 * listeye sızabiliyor; net eşleşme varken bunların işi yok.
 * @param {Array<{ score: number }>} rows puana göre sıralı olmalı
 */
export function dropWeakSurahMatches(rows) {
    if (!rows.length || rows[0].score > SOLID_NAME_SCORE_MAX) return rows;
    return rows.filter((row) => row.score <= SOLID_NAME_SCORE_MAX);
}

function normalizeSurahName(name, locale) {
    return /[\u0600-\u06FF]/.test(name)
        ? normalizeArabicSearchText(name)
        : normalizeSearchText(name, locale);
}

/** Sorgunun bu surenin adlarından aldığı en iyi puan; eşleşme yoksa null. */
function scoreSurahNames(surah, queryNorm, locale) {
    let best = null;
    for (const name of getSurahSearchNames(surah, locale)) {
        const score = scoreNameMatch(queryNorm, normalizeSurahName(name, locale));
        if (score != null && (best == null || score < best)) best = score;
    }
    return best;
}

/**
 * @param {string} namePart
 * @param {Array<{ n: number, nameTr?: string, nameAr?: string, ayahCount: number }>} surahIndex
 * @param {string} [locale]
 */
export function findSurahByFuzzyName(namePart, surahIndex, locale = 'tr') {
    const nq = normalizeSearchText(namePart, locale);
    if (!nq) return [];

    const scored = [];
    for (const surah of surahIndex || []) {
        const best = scoreSurahNames(surah, nq, locale);
        if (best != null) scored.push({ surah, score: best });
    }

    scored.sort((a, b) => a.score - b.score || a.surah.n - b.surah.n);
    return scored;
}

/**
 * @returns {{ type: 'ref', surahHint?: number, namePart?: string, ayah: number } | null}
 */
export function parseQuranRefQuery(raw) {
    let q = String(raw || '').trim();
    if (!q) return null;
    q = q.replace(REF_SUFFIX_RE, '').trim();
    if (!q) return null;

    let m = q.match(/^(\d{1,3})\s*[:\.]\s*(\d{1,3})$/);
    if (m) {
        return { type: 'ref', surahHint: Number(m[1]), ayah: Number(m[2]) };
    }

    m = q.match(/^(\d{1,3})\s+(\d{1,3})$/);
    if (m) {
        const surahN = Number(m[1]);
        const ayahN = Number(m[2]);
        if (surahN >= 1 && surahN <= 114 && ayahN >= 1) {
            return { type: 'ref', surahHint: surahN, ayah: ayahN };
        }
    }

    m = q.match(/^(.+?)\s+(\d{1,3})\.?$/u);
    if (m) {
        const namePart = m[1].trim();
        if (namePart) {
            return { type: 'ref', namePart, ayah: Number(m[2]) };
        }
    }

    return null;
}

/**
 * @returns {Array<{ surah: number, ayah: number, displayName: string }>}
 */
export function resolveQuranRefSuggestions(raw, surahIndex, locale = 'tr') {
    const parsed = parseQuranRefQuery(raw);
    if (!parsed || parsed.type !== 'ref') return [];

    const ayahN = Number(parsed.ayah);
    if (!Number.isFinite(ayahN) || ayahN < 1) return [];

    let candidates = [];
    if (parsed.surahHint != null) {
        const hit = (surahIndex || []).find((s) => s.n === parsed.surahHint);
        if (hit) candidates = [{ surah: hit, score: 0 }];
    } else if (parsed.namePart) {
        // Eleme ayet sayısı süzgecinden ÖNCE: "tarik 45"te Târık'ın 45. ayeti
        // olmadığı için sıradaki uzak adaya (Meryem) düşmek yanlış sonuç üretiyordu.
        candidates = dropWeakSurahMatches(findSurahByFuzzyName(parsed.namePart, surahIndex, locale));
    }

    const out = [];
    for (const item of candidates) {
        const surah = item.surah;
        if (!surah || ayahN > surah.ayahCount) continue;
        out.push({
            surah: surah.n,
            ayah: ayahN,
            displayName: getSurahRefDisplayName(surah, locale)
        });
        if (out.length >= 3) break;
    }
    return out;
}

/**
 * @returns {{ surah: object } | { ambiguous: true, count: number } | null}
 */
export function resolveSurahNameQuery(raw, surahIndex, locale = 'tr') {
    const q = String(raw || '').trim();
    if (!q) return null;

    if (/^\d+$/.test(q)) {
        const n = Number(q);
        if (n >= 1 && n <= 114) {
            const hit = (surahIndex || []).find((s) => s.n === n);
            return hit ? { surah: hit } : null;
        }
        return null;
    }

    const compactQ = q.replace(/\s+/g, '');
    const nameArExact = (surahIndex || []).find((s) => {
        const nameAr = s.nameAr || '';
        return nameAr === q || nameAr.replace(/\s+/g, '') === compactQ;
    });
    if (nameArExact) return { surah: nameArExact };

    const nq = normalizeSearchText(q, locale);
    const exact = (surahIndex || []).find((s) =>
        getSurahSearchNames(s, locale).some((name) => {
            const norm = /[\u0600-\u06FF]/.test(name)
                ? normalizeArabicSearchText(name)
                : normalizeSearchText(name, locale);
            return norm === nq;
        })
    );
    if (exact) return { surah: exact };

    const fuzzy = findSurahByFuzzyName(q, surahIndex, locale);
    if (!fuzzy.length) return null;
    if (fuzzy.length === 1) return { surah: fuzzy[0].surah };
    if (fuzzy[0].score === 0) return { surah: fuzzy[0].surah };
    if (fuzzy[0].score < fuzzy[1].score) return { surah: fuzzy[0].surah };
    return { ambiguous: true, count: fuzzy.length };
}

/**
 * Sure adı + meal/okunuş metni: "kehf hidayet", "yasin rahman".
 * @returns {{ surah: number, text: string, surahName: string } | null}
 */
export function parseScopedMealSearchQuery(raw, surahIndex, locale = 'tr') {
    const q = String(raw || '').trim();
    if (!q || parseQuranRefQuery(q)) return null;

    const tokens = normalizeSearchText(q, locale).split(/\s+/).filter(Boolean);
    if (tokens.length < 2) return null;

    for (let prefixLen = tokens.length - 1; prefixLen >= 1; prefixLen -= 1) {
        const namePart = tokens.slice(0, prefixLen).join(' ');
        const textPart = tokens.slice(prefixLen).join(' ');
        const fuzzy = findSurahByFuzzyName(namePart, surahIndex, locale);
        if (!fuzzy.length || fuzzy[0].score > 2) continue;
        if (fuzzy.length > 1 && fuzzy[1].score === fuzzy[0].score) continue;
        if (textPart.replace(/\s+/g, '').length < 3) continue;
        const surah = fuzzy[0].surah;
        return {
            surah: surah.n,
            text: textPart,
            surahName: getSurahRefDisplayName(surah, locale)
        };
    }
    return null;
}

/** Ad dışı eşleşme (sure numarası, ayet sayısı, çok parçalı sorgu) puanı. */
const SURAH_TOKEN_MATCH_SCORE = 6;

/**
 * Sure listesi filtresi + sıralaması.
 * @returns {number|null} alaka puanı (küçük = daha iyi); eşleşme yoksa `null`
 */
export function scoreSurahRefSearch(surah, rawQuery, locale = 'tr') {
    const q = (rawQuery || '').trim();
    if (!q) return 0;

    const hay = [
        String(surah.n),
        ...getSurahSearchNames(surah, locale).map((name) => normalizeSurahName(name, locale)),
        String(surah.ayahCount)
    ].join(' ');
    const nq = normalizeSearchText(q, locale);
    const tokens = nq.split(/\s+/).filter(Boolean);

    // Öneri satırıyla aynı puanlayıcı: aynı sorgu için liste ile öneriler
    // ayrışmasın ("bakra" önerilerde çıkıp listede kaybolmasın).
    const nameScore = scoreSurahNames(surah, nq, locale);
    if (nameScore != null) return nameScore;

    // Boş token listesi eskiden beri "eşleşti" sayılır: sadeleşince hiçbir şey
    // kalmayan sorguda liste daralmadan durur.
    return tokens.every((tok) => hay.includes(tok)) ? SURAH_TOKEN_MATCH_SCORE : null;
}

export function surahMatchesRefSearch(surah, rawQuery, locale = 'tr') {
    return scoreSurahRefSearch(surah, rawQuery, locale) != null;
}
