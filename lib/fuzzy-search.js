/**
 * Klasör ve keşfet aramaları için yazım hatasına toleranslı eşleştirme.
 *
 * İki aşama var:
 *  1) Sadeleştirme — aksan (â/î/û), Türkçe özel harf (ı/ş/ğ/ç/ö/ü) ve Arapça
 *     hareke farkları silinir. Böylece "Rahmân" ile "rahman", "Bâsıt" ile
 *     "basit" aynı metne iner.
 *  2) Kelime eşleştirme — her arama kelimesi sırasıyla tam / ön ek / içerir /
 *     "en fazla 1-2 harf şaşmış" olarak aranır. Bitişik yazımlar (Mu'izz →
 *     "muizz") için boşluksuz yığın da denenir.
 *
 * Sonuç bir puandır (küçük = daha alakalı), böylece liste alaka sırasına dizilir.
 */

/** Birleşen aksan işaretleri + Arapça hareke/tatvil: sadeleştirmede atılır. */
const MARKS_RE = /[̀-ͯؐ-ًؚ-ٰٟۖ-ۭـ]/g;

/** NFKD'nin ayrıştıramadığı latin harfler elle eşlenir (ı gibi). */
const LATIN_FOLD = {
    ı: 'i',
    İ: 'i',
    ł: 'l',
    ø: 'o',
    đ: 'd',
    ð: 'd',
    þ: 't',
    ß: 'ss',
    æ: 'ae',
    œ: 'oe'
};
const LATIN_FOLD_RE = /[ıİłøđðþßæœ]/g;

/** Arapça/Urduca yazım varyantları tek biçime indirilir. */
const ARABIC_FOLD = {
    أ: 'ا',
    إ: 'ا',
    آ: 'ا',
    ٱ: 'ا',
    ى: 'ي',
    ی: 'ي',
    ئ: 'ي',
    ؤ: 'و',
    ة: 'ه',
    ۃ: 'ه',
    ہ: 'ه',
    ھ: 'ه',
    ک: 'ك',
    ء: ''
};
const ARABIC_FOLD_RE = /[أإآٱىیئؤةۃہھکء]/g;

/** Bu uzunluktan kısa kelimelerde yazım toleransı yok (gürültü olurdu). */
const FUZZY_MIN_LEN = 4;
/** Bu uzunluktan itibaren iki harf şaşmaya izin verilir. */
const FUZZY_MIN_LEN_2 = 7;

const RANK_EXACT = 0;
const RANK_PREFIX = 1;
const RANK_CONTAINS = 2;
const RANK_FUZZY = 3;
const RANK_COMPACT = 5;
const RANK_COMPACT_FUZZY = 6;

const RANK_WEIGHT = 1000;
const POS_WEIGHT = 0.01;

/** Tuş başına yeniden normalize etmemek için küçük bir önbellek. */
const NORMALIZE_CACHE_LIMIT = 4000;
const normalizeCache = new Map();

/**
 * Aramada karşılaştırılacak sade biçim: küçük harf, aksansız, noktalamasız.
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeSearchText(value) {
    const raw = value == null ? '' : String(value);
    if (!raw) return '';

    const cached = normalizeCache.get(raw);
    if (cached !== undefined) return cached;

    const out = raw
        .normalize('NFKD')
        .replace(MARKS_RE, '')
        .toLowerCase()
        .replace(LATIN_FOLD_RE, (ch) => LATIN_FOLD[ch] ?? ch)
        .replace(ARABIC_FOLD_RE, (ch) => ARABIC_FOLD[ch] ?? ch)
        // \p{M} korunmalı: latin aksanı ve Arapça hareke yukarıda zaten atıldı, geriye
        // Bengalce ünlü işaretleri gibi harfin parçası olan işaretler kalır.
        .replace(/[^\p{L}\p{N}\p{M}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (normalizeCache.size >= NORMALIZE_CACHE_LIMIT) normalizeCache.clear();
    normalizeCache.set(raw, out);
    return out;
}

/** Sade biçimin boşluksuz hâli; "Mu'izz" → "muizz" gibi bitişik aramalar için. */
export function compactSearchText(value) {
    return normalizeSearchText(value).replace(/\s+/g, '');
}

/**
 * Arapça belirtme takısı. Kayıtta "رحمن" varken kullanıcı "الرحمن" yazabilir;
 * takı atılınca kelime yığında alt dizi olarak bulunur. Ardından en az üç harf
 * kalmalı ki "الله" gibi takısız kelimeler budanmasın.
 */
const ARABIC_ARTICLE_RE = /^ال(?=[؀-ۿ]{3,}$)/;

/**
 * Arama kutusundaki metni eşleştirilecek kelimelere böler.
 * @param {unknown} query
 * @returns {string[]}
 */
export function toSearchTokens(query) {
    const norm = normalizeSearchText(query);
    if (!norm) return [];
    return norm
        .split(' ')
        .filter(Boolean)
        .map((token) => token.replace(ARABIC_ARTICLE_RE, ''));
}

/**
 * Bir kaydın aranabilir alanlarını aranabilir yığına toplar.
 * Boşluksuz biçim alan başına ayrı tutulur; iki farklı alanın uçları birleşip
 * sahte eşleşme üretmesin.
 * @param {Array<unknown>|unknown} parts
 * @returns {{ words: Array<{ w: string, pos: number }>, compacts: Array<{ text: string, pos: number }> }}
 */
export function buildSearchHaystack(parts) {
    const list = Array.isArray(parts) ? parts : [parts];
    const words = [];
    const compacts = [];
    let pos = 0;

    for (const part of list) {
        const norm = normalizeSearchText(part);
        if (!norm) continue;
        const fieldPos = pos;
        for (const w of norm.split(' ')) {
            if (!w) continue;
            words.push({ w, pos });
            pos += w.length + 1;
        }
        compacts.push({ text: norm.replace(/ /g, ''), pos: fieldPos });
    }

    return { words, compacts };
}

function allowedEdits(token) {
    if (token.length >= FUZZY_MIN_LEN_2) return 2;
    if (token.length >= FUZZY_MIN_LEN) return 1;
    return 0;
}

/**
 * `token`, `word`'ün baştan bir parçasına en fazla `max` düzeltmeyle uyuyor mu?
 * Bitişik harf yer değiştirmesi (hüsna → hünsa) tek düzeltme sayılır.
 * @returns {number} bulunan en küçük uzaklık; eşleşme yoksa `max + 1`
 */
function prefixEditDistance(word, token, max) {
    const la = word.length;
    const lb = token.length;
    if (lb === 0) return 0;
    if (la + max < lb) return max + 1;

    let prev2 = null;
    let prev = new Array(lb + 1);
    let cur = new Array(lb + 1);
    for (let j = 0; j <= lb; j += 1) prev[j] = j;

    let best = prev[lb];

    for (let i = 1; i <= la; i += 1) {
        cur[0] = i;
        let rowMin = cur[0];
        for (let j = 1; j <= lb; j += 1) {
            const cost = word[i - 1] === token[j - 1] ? 0 : 1;
            let d = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
            if (
                prev2 &&
                i > 1 &&
                j > 1 &&
                word[i - 1] === token[j - 2] &&
                word[i - 2] === token[j - 1]
            ) {
                d = Math.min(d, prev2[j - 2] + 1);
            }
            cur[j] = d;
            if (d < rowMin) rowMin = d;
        }
        if (cur[lb] < best) best = cur[lb];
        // Satır minimumu Levenshtein'de azalmaz; eşiği aştıysa devamı boşuna.
        if (rowMin > max) break;

        const spare = prev2;
        prev2 = prev;
        prev = cur;
        cur = spare || new Array(lb + 1);
    }

    return best <= max ? best : max + 1;
}

/** Bir arama kelimesinin yığındaki en iyi eşleşme puanı; yoksa `null`. */
function scoreToken(haystack, token) {
    if (!token) return 0;

    let best = null;
    const max = allowedEdits(token);
    const fuzzyCandidates = [];

    for (const { w, pos } of haystack.words) {
        if (w === token) return RANK_EXACT * RANK_WEIGHT + pos * POS_WEIGHT;

        if (w.startsWith(token)) {
            const score = RANK_PREFIX * RANK_WEIGHT + pos * POS_WEIGHT;
            if (best == null || score < best) best = score;
            continue;
        }

        const at = w.indexOf(token);
        if (at >= 0) {
            const score = RANK_CONTAINS * RANK_WEIGHT + (pos + at) * POS_WEIGHT;
            if (best == null || score < best) best = score;
            continue;
        }

        // Uzaklık hesabı pahalı; kelime en az token kadar uzun değilse atla.
        if (max > 0 && w.length + max >= token.length) fuzzyCandidates.push({ w, pos });
    }

    if (best != null) return best;

    for (const { w, pos } of fuzzyCandidates) {
        const dist = prefixEditDistance(w, token, max);
        if (dist > max) continue;
        const score = (RANK_FUZZY + dist - 1) * RANK_WEIGHT + pos * POS_WEIGHT;
        if (best == null || score < best) best = score;
    }

    if (best != null) return best;

    // Son çare: alanın boşluksuz hâli ("Mu'izz" → "muizz") aranan kelimeyi tutuyor mu?
    for (const { text, pos } of haystack.compacts) {
        const at = text.indexOf(token);
        if (at < 0) continue;
        const score = RANK_COMPACT * RANK_WEIGHT + (pos + at) * POS_WEIGHT;
        if (best == null || score < best) best = score;
    }

    if (best != null) return best;

    if (max > 0) {
        for (const { text, pos } of haystack.compacts) {
            const dist = prefixEditDistance(text, token, max);
            if (dist > max) continue;
            const score = (RANK_COMPACT_FUZZY + dist - 1) * RANK_WEIGHT + pos * POS_WEIGHT;
            if (best == null || score < best) best = score;
        }
    }

    return best;
}

/**
 * Yığın, arama kelimelerinin hepsini karşılıyor mu?
 * @param {{ words: Array<{ w: string, pos: number }>, compacts: Array<{ text: string, pos: number }> }} haystack
 * @param {string[]} tokens `toSearchTokens` çıktısı
 * @returns {number|null} alaka puanı (küçük = daha iyi); eşleşme yoksa `null`
 */
export function scoreSearchMatch(haystack, tokens) {
    if (!tokens || tokens.length === 0) return 0;
    if (!haystack || !haystack.words) return null;

    let total = 0;
    for (const token of tokens) {
        const score = scoreToken(haystack, token);
        if (score == null) return null;
        total += score;
    }
    return total;
}

/**
 * Tek seferlik kullanım kolaylığı: alanlar + ham sorgu ile doğrudan eşleştirir.
 * @param {Array<unknown>|unknown} parts
 * @param {unknown} query
 */
export function matchesSearchQuery(parts, query) {
    return scoreSearchMatch(buildSearchHaystack(parts), toSearchTokens(query)) != null;
}
