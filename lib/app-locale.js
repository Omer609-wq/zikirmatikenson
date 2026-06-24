export const DEFAULT_APP_LOCALE = 'en';

export const SUPPORTED_APP_LOCALE_CODES = Object.freeze([
    'tr', 'ar', 'id', 'ms', 'en', 'fr', 'bn', 'ur'
]);

export function resolveLocaleFromTag(tag) {
    const raw = String(tag || '').trim().replace(/_/g, '-');
    if (!raw) return null;
    const lower = raw.toLowerCase();
    const primary = lower.split('-')[0];
    for (const code of SUPPORTED_APP_LOCALE_CODES) {
        if (lower === code || primary === code) return code;
    }
    return null;
}

/** İlk kurulum: cihaz dili destekleniyorsa onu, değilse İngilizce. */
export function resolveLocaleFromSystem(options = {}) {
    const candidates = Array.isArray(options.candidates) ? options.candidates : getSystemLocaleCandidates();
    for (const tag of candidates) {
        const code = resolveLocaleFromTag(tag);
        if (code) return code;
    }
    return DEFAULT_APP_LOCALE;
}

function getSystemLocaleCandidates() {
    if (typeof navigator === 'undefined') return [];
    const out = [];
    if (Array.isArray(navigator.languages)) out.push(...navigator.languages);
    if (navigator.language) out.push(navigator.language);
    return out;
}

export function normalizeAppLocale(locale) {
    const code = String(locale || '').trim().toLowerCase();
    if (SUPPORTED_APP_LOCALE_CODES.includes(code)) return code;
    return DEFAULT_APP_LOCALE;
}
