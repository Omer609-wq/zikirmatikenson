import trUi from './locales/tr.json';
import enUi from './locales/en.json';
import idUi from './locales/id.json';
import msUi from './locales/ms.json';

import libraryTr from './data/library/tr.json';
import libraryPremiumTr from './data/library/premium-tr.json';
import libraryId from './data/library/id.json';
import libraryPremiumId from './data/library/premium-id.json';

/** Urduca (RTL) şimdilik listede yok. */
export const SUPPORTED_LOCALES = [
    { code: 'tr', labelKey: 'settings.localeTr', bcp47: 'tr-TR', dir: 'ltr' },
    { code: 'id', labelKey: 'settings.localeId', bcp47: 'id-ID', dir: 'ltr' },
    { code: 'ms', labelKey: 'settings.localeMs', bcp47: 'ms-MY', dir: 'ltr' },
    { code: 'en', labelKey: 'settings.localeEn', bcp47: 'en-US', dir: 'ltr' }
];

const UI_BY_LOCALE = { tr: trUi, en: enUi, id: idUi, ms: msUi };

const LIBRARY_BY_LOCALE = {
    tr: { base: libraryTr, premium: libraryPremiumTr },
    id: { base: libraryId, premium: libraryPremiumId },
    ms: { base: libraryId, premium: libraryPremiumId },
    en: { base: [], premium: [] }
};

let currentLocale = 'tr';
let uiStrings = trUi;
const fallbackUi = trUi;

function nestedGet(obj, path) {
    return path.split('.').reduce((o, k) => (o && o[k] != null ? o[k] : undefined), obj);
}

export function normalizeAppLocale(locale) {
    const code = String(locale || 'tr').toLowerCase();
    return SUPPORTED_LOCALES.some((l) => l.code === code) ? code : 'tr';
}

export function getLocale() {
    return currentLocale;
}

export function getLocaleTag() {
    const meta = SUPPORTED_LOCALES.find((l) => l.code === currentLocale);
    return meta?.bcp47 || 'tr-TR';
}

export function getLocaleDir() {
    const meta = SUPPORTED_LOCALES.find((l) => l.code === currentLocale);
    return meta?.dir || 'ltr';
}

/**
 * @param {string} key — örn. "nav.folders"
 * @param {Record<string, string|number>} [vars]
 */
export function t(key, vars) {
    let str = nestedGet(uiStrings, key);
    if (str == null) str = nestedGet(fallbackUi, key);
    if (str == null) return key;
    if (!vars) return String(str);
    return String(str).replace(/\{(\w+)\}/g, (_, k) =>
        vars[k] != null ? String(vars[k]) : `{${k}}`
    );
}

/** Belirli bir locale için arayüz metni (zikir anlamı senkronu vb.). */
export function tForLocale(locale, key) {
    const pack = UI_BY_LOCALE[normalizeAppLocale(locale)] || trUi;
    let str = nestedGet(pack, key);
    if (str == null) str = nestedGet(fallbackUi, key);
    return str == null ? null : String(str);
}

function mergeLibraryItem(base, overlay) {
    if (!overlay) return base;
    const merged = { ...base };
    for (const k of ['name', 'meaning', 'context', 'source', 'keywords', 'arabic']) {
        if (overlay[k] != null && String(overlay[k]).trim() !== '') merged[k] = overlay[k];
    }
    if (overlay.target != null) merged.target = overlay.target;
    if (overlay.category) merged.category = overlay.category;
    return merged;
}

function buildLibrary(locale, includePremium) {
    const pack = LIBRARY_BY_LOCALE[normalizeAppLocale(locale)] || LIBRARY_BY_LOCALE.tr;
    const overlayById = new Map((pack.base || []).map((item) => [item.id, item]));
    let list = libraryTr.map((item) => mergeLibraryItem(item, overlayById.get(item.id)));
    if (includePremium) {
        const premOverlay = new Map((pack.premium || []).map((item) => [item.id, item]));
        list = list.concat(
            libraryPremiumTr.map((item) => mergeLibraryItem(item, premOverlay.get(item.id)))
        );
    }
    return list;
}

export function getZikirLibrary(includePremium = false) {
    return buildLibrary(currentLocale, includePremium);
}

export function applyLocaleToDocument(locale) {
    const code = normalizeAppLocale(locale);
    currentLocale = code;
    uiStrings = UI_BY_LOCALE[code] || trUi;

    const html = document.documentElement;
    html.setAttribute('lang', code);
    html.setAttribute('dir', getLocaleDir());

    const title = nestedGet(uiStrings, 'app.title');
    if (title) document.title = title;

    document.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        if (!key) return;
        const val = t(key);
        if (val === key) return;
        if (el.hasAttribute('data-i18n-title')) {
            el.title = t(el.getAttribute('data-i18n-title'));
        }
        if (el.hasAttribute('data-i18n-attr')) {
            el.setAttribute(el.getAttribute('data-i18n-attr'), val);
        } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            if (el.hasAttribute('data-i18n-placeholder') || el.getAttribute('type') === 'text' || el.getAttribute('type') === 'search') {
                el.placeholder = val;
            } else {
                el.value = val;
            }
        } else {
            el.textContent = val;
        }
    });

    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
        const key = el.getAttribute('data-i18n-html');
        if (key) el.innerHTML = t(key);
    });
}

export function initI18n(locale) {
    applyLocaleToDocument(locale);
}
