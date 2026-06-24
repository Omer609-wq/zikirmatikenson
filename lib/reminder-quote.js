import quranQuotesData from '../data/quotes-quran.json' with { type: 'json' };
import { normalizeAppLocale } from './app-locale.js';
import { getSurahLocalizedName } from '../quran-surah-names.js';

export const REMINDER_AYAH_SURAH = 13;
export const REMINDER_AYAH_NUM = 28;

const TR_REMINDER_AYAH =
    "Kalpler ancak Allah'ı anmakla mutmain olur.";

const LINE_LEN_BY_LOCALE = {
    ar: 42,
    bn: 38,
    ur: 40,
    en: 46,
    fr: 44,
    id: 48,
    ms: 46,
    tr: 44
};

function cleanQuoteText(text) {
    return String(text || '')
        .replace(/\s*["”]+$/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function getReminderAyahText(locale) {
    const code = normalizeAppLocale(locale);
    if (code === 'tr') return TR_REMINDER_AYAH;
    const list = quranQuotesData?.quotes?.[code] || quranQuotesData?.quotes?.en || [];
    const hit = list.find((row) => row[0] === REMINDER_AYAH_SURAH && row[1] === REMINDER_AYAH_NUM);
    return hit ? cleanQuoteText(hit[2]) : '';
}

export function formatReminderAyahRef(locale) {
    const code = normalizeAppLocale(locale);
    if (code === 'tr') return `(Rad Suresi ${REMINDER_AYAH_NUM})`;
    const name = getSurahLocalizedName(REMINDER_AYAH_SURAH, code);
    if (code === 'ar') return `(${REMINDER_AYAH_SURAH}:${REMINDER_AYAH_NUM})`;
    return `(${name} ${REMINDER_AYAH_SURAH}:${REMINDER_AYAH_NUM})`;
}

/** Bildirimde … kullanmadan satırlara böl (Android inbox / çok satırlı gövde). */
export function wrapReminderNotificationLines(text, locale, maxLines = 5) {
    const raw = cleanQuoteText(text);
    if (!raw) return [];

    const maxLen = LINE_LEN_BY_LOCALE[normalizeAppLocale(locale)] ?? 44;
    const words = raw.split(/\s+/).filter(Boolean);
    const lines = [];
    let i = 0;

    while (i < words.length && lines.length < maxLines) {
        let line = '';
        while (i < words.length) {
            const next = line ? `${line} ${words[i]}` : words[i];
            if (next.length > maxLen && line) break;
            line = next;
            i += 1;
            if (line.length >= maxLen && i < words.length) break;
        }
        if (line) lines.push(line);
    }

    if (i < words.length && lines.length) {
        lines[lines.length - 1] = `${lines[lines.length - 1]} ${words.slice(i).join(' ')}`.trim();
    }

    return lines.slice(0, maxLines);
}

/**
 * @returns {{ full: string, body: string, largeBody: string, inboxLines: string[] }}
 */
export function getReminderQuoteNotificationPayload(locale = 'tr') {
    const code = normalizeAppLocale(locale);
    const ayah = getReminderAyahText(code);
    const ref = formatReminderAyahRef(code);
    const fallback = `${TR_REMINDER_AYAH} (Rad Suresi ${REMINDER_AYAH_NUM})`;
    const full = ayah ? `${ayah} ${ref}` : fallback;

    const ayahLines = wrapReminderNotificationLines(ayah || TR_REMINDER_AYAH, code);
    const inboxLines = [...ayahLines, ref].filter(Boolean).slice(0, 5);
    const body = inboxLines.join('\n');

    return {
        full,
        body,
        largeBody: full,
        inboxLines
    };
}

export function getReminderQuoteBody(locale = 'tr') {
    return getReminderQuoteNotificationPayload(locale).full;
}
