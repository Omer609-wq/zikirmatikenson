/**
 * Uzaktan (CDN) günün sözü içeriği — public/daily-quotes.json doğrulama.
 * Şema (iki alan da isteğe bağlı; geçersiz/boş alan gömülü listeye düşer):
 *   appQuotes:  ["Metin (Kaynak)", ...]           → TR ana sayfa şeridi
 *   quranQuotes: { en: [[sure, ayet, "metin"], [sure, ayet, "metin", bitisAyet?]] }  → TR dışı diller
 */

export const DAILY_QUOTE_LOCALES = ['tr', 'ar', 'id', 'ms', 'en', 'fr', 'bn', 'ur'];

/** Tek satır sınırı: şerit önizlemesi zaten ~160 karakterde kısaltılıyor. */
const MAX_QUOTE_LEN = 400;
const MAX_QUOTES_PER_LIST = 500;

function cleanQuoteLine(value) {
    if (typeof value !== 'string') return '';
    return value
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, MAX_QUOTE_LEN);
}

/**
 * Uzak JSON'u doğrular; kullanılabilir hiçbir alan yoksa null döner.
 * @returns {{ appQuotes: string[] | null, quranQuotes: Record<string, Array<[number, number, string] | [number, number, string, number]>> | null } | null}
 */
export function normalizeRemoteDailyQuotes(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;

    let appQuotes = null;
    if (Array.isArray(raw.appQuotes)) {
        const list = raw.appQuotes
            .slice(0, MAX_QUOTES_PER_LIST)
            .map(cleanQuoteLine)
            .filter(Boolean);
        if (list.length) appQuotes = list;
    }

    let quranQuotes = null;
    if (raw.quranQuotes && typeof raw.quranQuotes === 'object' && !Array.isArray(raw.quranQuotes)) {
        const out = {};
        for (const code of DAILY_QUOTE_LOCALES) {
            const rows = raw.quranQuotes[code];
            if (!Array.isArray(rows)) continue;
            const valid = [];
            for (const row of rows.slice(0, MAX_QUOTES_PER_LIST)) {
                if (!Array.isArray(row) || row.length < 3) continue;
                const surah = Number(row[0]);
                const ayah = Number(row[1]);
                const text = cleanQuoteLine(row[2]);
                const endAyah = row.length >= 4 ? Number(row[3]) : NaN;
                if (!Number.isFinite(surah) || surah < 1 || surah > 114) continue;
                if (!Number.isFinite(ayah) || ayah < 1 || ayah > 286) continue;
                if (!text) continue;
                if (Number.isFinite(endAyah) && endAyah > ayah && endAyah <= 286) {
                    valid.push([surah, ayah, text, endAyah]);
                } else {
                    valid.push([surah, ayah, text]);
                }
            }
            if (valid.length) out[code] = valid;
        }
        if (Object.keys(out).length) quranQuotes = out;
    }

    if (!appQuotes && !quranQuotes) return null;
    return { appQuotes, quranQuotes };
}
