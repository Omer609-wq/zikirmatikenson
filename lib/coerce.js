export function isPlainObject(v) {
    if (!v || typeof v !== 'object') return false;
    const p = Object.getPrototypeOf(v);
    return p === Object.prototype || p === null;
}

export function coerceString(v, maxLen = 240) {
    if (v == null) return '';
    const s = String(v).replace(/\s+/g, ' ').trim();
    if (s.length <= maxLen) return s;
    return truncateText(s, maxLen).trimEnd();
}

/**
 * Çok satırlı metin (not, Arapça, fazilet): satır sonları kalır. coerceString bütün
 * boşlukları tek boşluğa indiriyordu; paragraflı not yeniden açılışta tek satır oluyordu.
 * Satır içi boşluklar yine tek boşluğa, art arda boş satırlar bire iner.
 */
export function coerceMultilineString(v, maxLen = 240) {
    if (v == null) return '';
    const s = String(v)
        .replace(/\r\n?/g, '\n')
        .replace(/[^\S\n]+/g, ' ')
        .replace(/ ?\n ?/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    if (s.length <= maxLen) return s;
    return truncateText(s, maxLen).trimEnd();
}

const graphemeSegmenter =
    typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
        ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
        : null;

/** Eşi olmayan yarım emoji parçası (tek başına kalmış UTF-16 vekil birimi). */
function isLoneSurrogate(ch) {
    if (ch.length !== 1) return false;
    const code = ch.charCodeAt(0);
    return code >= 0xd800 && code <= 0xdfff;
}

/**
 * Uzunluğu en fazla `max` UTF-16 birimi olacak şekilde kısaltır, ama hiçbir
 * harfi ortadan bölmeden.
 *
 * Birim UTF-16, çünkü sunucu kuralındaki `size()` onu sayıyor (emülatörde
 * ölçüldü: 40 "ş" kabul, 37 harf + 2 emoji = 41 birim ret). Düz `slice` aynı
 * birimi sayar ama emojiyi (2 birim) ortasından bölebilir: yarım, bozuk bir
 * karakter kalır. Burada kesme görünen harf sınırında yapılır; 👨‍👩‍👧 ya da
 * bayrak gibi birleşik emoji de yarıda kalmaz, sığmıyorsa bütünüyle dışarıda
 * kalır. Girdide tek başına kalmış yarım parçalar (yapıştırmada bölünmüş emoji) atılır.
 *
 * @param {unknown} value
 * @param {number} max UTF-16 birimi (JS `.length`) cinsinden
 */
export function truncateText(value, max) {
    const text = String(value ?? '');
    const limit = Math.max(0, Math.floor(Number(max) || 0));
    const parts = graphemeSegmenter
        ? Array.from(graphemeSegmenter.segment(text), (s) => s.segment)
        : Array.from(text);
    let out = '';
    for (const part of parts) {
        const clean = Array.from(part).filter((ch) => !isLoneSurrogate(ch)).join('');
        if (!clean) continue;
        if (out.length + clean.length > limit) break;
        out += clean;
    }
    return out;
}

export function mintId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

export function coerceId(v, fallbackPrefix) {
    const raw = coerceString(v, 64);
    const ok = /^[a-zA-Z0-9_-]+$/.test(raw);
    if (ok) return raw;
    return mintId(fallbackPrefix);
}

export function clampNumber(v, { min = 0, max = Number.MAX_SAFE_INTEGER, fallback = 0 } = {}) {
    const n = typeof v === 'number' ? v : parseFloat(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
}
