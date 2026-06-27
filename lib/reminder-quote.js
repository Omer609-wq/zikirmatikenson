import { normalizeAppLocale } from './app-locale.js';
import { getSurahLocalizedName } from '../quran-surah-names.js';

export const REMINDER_AYAH_SURAH = 13;
export const REMINDER_AYAH_NUM = 28;

const TR_REMINDER_AYAH =
    "Kalpler ancak Allah'ı anmakla mutmain olur.";

// Bildirim, Rad 13:28'in tamamı yerine yalnızca vurgulu son cümlesini gösterir
// (Türkçe'deki gibi öz). Her cümle, o dilin otoriter mealinin (quotes-quran.json)
// son cümlesidir. Footer/günlük alıntı (quotes.js) tam ayeti kullanmaya devam eder.
const REMINDER_AYAH_SHORT = {
    tr: TR_REMINDER_AYAH,
    en: 'Unquestionably, by the remembrance of Allah hearts are assured.',
    id: 'Ingatlah, hanya dengan mengingati Allah-lah hati menjadi tenteram.',
    ms: 'Ketahuilah, hanya dengan mengingati Allah hati menjadi tenang tenteram.',
    fr: "Certes, c'est par l'évocation d'Allah que les cœurs se tranquillisent.",
    bn: 'জেনে রাখ, আল্লাহর যিকির দ্বারাই অন্তর সমূহ শান্তি পায়।',
    ur: 'خبردار! الله کی یاد ہی سے دل تسکین پاتے ہیں',
    ar: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ'
};

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
        .replace(/^[«"“]+/, '')
        .replace(/[»"”]+(?=[.!?,;:])/g, '')
        .replace(/\s*["”»]+$/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function getReminderAyahText(locale) {
    const code = normalizeAppLocale(locale);
    return REMINDER_AYAH_SHORT[code] || REMINDER_AYAH_SHORT.en;
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
