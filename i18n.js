import trUi from './locales/tr.json';
import enUi from './locales/en.json';
import idUi from './locales/id.json';
import msUi from './locales/ms.json';
import frUi from './locales/fr.json';
import bnUi from './locales/bn.json';
import arUi from './locales/ar.json';
import urUi from './locales/ur.json';

import libraryTr from './data/library/tr.json';
import libraryEn from './data/library/en.json';
import libraryBn from './data/library/bn.json';
import libraryAr from './data/library/ar.json';
import libraryPremiumTr from './data/library/premium-tr.json';
import libraryPremiumId from './data/library/premium-id.json';

import {
    DEFAULT_APP_LOCALE,
    normalizeAppLocale,
    resolveLocaleFromSystem,
    resolveLocaleFromTag
} from './lib/app-locale.js';

export { DEFAULT_APP_LOCALE, normalizeAppLocale, resolveLocaleFromSystem, resolveLocaleFromTag };

/** TR dışında meal + kütüphane dua bağlamı için ortak İngilizce katman. */
export function localeUsesEnglishMeals(locale) {
    return normalizeAppLocale(locale || currentLocale) !== 'tr';
}

/** Arapça: başlıkta Arapça metin; Latin okunuş yok. */
export function localeUsesArabicScript(locale) {
    return normalizeAppLocale(locale || currentLocale) === 'ar';
}

/** Arapça / Urduca: arayüz LTR; RTL yalnızca metin öğelerinde (Arapça ile aynı model). */
export function localeUsesRtlUiScript(locale) {
    const code = normalizeAppLocale(locale || currentLocale);
    return code === 'ar' || code === 'ur';
}

/** Arapça alt satır (zikir/dua) boyutu — Arapça arayüz hariç. */
export const ARABIC_SUBLINE_FONT_STEP_MIN = -2;
export const ARABIC_SUBLINE_FONT_STEP_MAX = 8;
/** Klasör listesinde sabit: en küçük (−2) + 2 tık = 0 */
export const ARABIC_SUBLINE_LIST_FONT_STEP = ARABIC_SUBLINE_FONT_STEP_MIN + 2;
export const ARABIC_SUBLINE_FONT_BASE_REM = 0.6875;
export const ARABIC_SUBLINE_FONT_STEP_REM = 0.0625;

export function clampArabicSublineFontStep(step) {
    const n = Number(step);
    const rounded = Number.isFinite(n) ? Math.round(n) : 0;
    return Math.max(
        ARABIC_SUBLINE_FONT_STEP_MIN,
        Math.min(ARABIC_SUBLINE_FONT_STEP_MAX, rounded)
    );
}

export function applyArabicSublineFontStep(step) {
    const clamped = clampArabicSublineFontStep(step);
    document.documentElement.style.setProperty('--arabic-subline-step', String(clamped));
    document.documentElement.style.setProperty(
        '--arabic-subline-list-step',
        String(ARABIC_SUBLINE_LIST_FONT_STEP)
    );
    return clamped;
}

/** Bengalce / Arapça: sayaçta yerel rakam seçeneği sunulur. */
export function localeSupportsNativeNumerals(locale) {
    const code = normalizeAppLocale(locale || currentLocale);
    return code === 'bn' || code === 'ar' || code === 'ur';
}

/** Sayaç ekranı rakamları; varsayılan Latin (0-9), isteğe bağlı yerel rakam. */
export function formatCounterNumber(value, locale, useNativeNumerals) {
    const n = Number(value);
    if (!Number.isFinite(n)) return String(value ?? '');
    if (!useNativeNumerals || !localeSupportsNativeNumerals(locale)) return String(n);
    const code = normalizeAppLocale(locale);
    try {
        if (code === 'bn') {
            return new Intl.NumberFormat('bn-BD', { numberingSystem: 'beng' }).format(n);
        }
        if (code === 'ar') {
            return new Intl.NumberFormat('ar', { numberingSystem: 'arab' }).format(n);
        }
        if (code === 'ur') {
            return new Intl.NumberFormat('ur-PK', { numberingSystem: 'arabext' }).format(n);
        }
    } catch (_) { /* Intl yoksa Latin */ }
    return String(n);
}

export const SUPPORTED_LOCALES = [
    { code: 'tr', labelKey: 'settings.localeTr', bcp47: 'tr-TR', dir: 'ltr', flag: 'tr' },
    { code: 'ar', labelKey: 'settings.localeAr', bcp47: 'ar', dir: 'ltr', flag: 'sa' },
    { code: 'id', labelKey: 'settings.localeId', bcp47: 'id-ID', dir: 'ltr', flag: 'id' },
    { code: 'ms', labelKey: 'settings.localeMs', bcp47: 'ms-MY', dir: 'ltr', flag: 'my' },
    { code: 'en', labelKey: 'settings.localeEn', bcp47: 'en-US', dir: 'ltr', flag: 'gb' },
    { code: 'fr', labelKey: 'settings.localeFr', bcp47: 'fr-FR', dir: 'ltr', flag: 'fr' },
    { code: 'bn', labelKey: 'settings.localeBn', bcp47: 'bn-BD', dir: 'ltr', flag: 'bd' },
    { code: 'ur', labelKey: 'settings.localeUr', bcp47: 'ur-PK', dir: 'ltr', flag: 'pk' }
];

const UI_BY_LOCALE = { tr: trUi, en: enUi, id: idUi, ms: msUi, fr: frUi, bn: bnUi, ar: arUi, ur: urUi };

const libraryContextEnById = new Map((libraryEn || []).map((item) => [item.id, item]));
const libraryBnById = new Map((libraryBn || []).map((item) => [item.id, item]));
const libraryArById = new Map((libraryAr || []).map((item) => [item.id, item]));
const libraryTrById = new Map([
    ...(libraryTr || []).map((item) => [item.id, item]),
    ...(libraryPremiumTr || []).map((item) => [item.id, item])
]);
const libraryPremiumEnById = new Map((libraryPremiumId || []).map((item) => [item.id, item]));

const LIBRARY_BY_LOCALE = {
    tr: { base: libraryTr, premium: libraryPremiumTr },
    en: { base: libraryEn, premium: [] },
    id: { base: libraryEn, premium: libraryPremiumId },
    ms: { base: libraryEn, premium: libraryPremiumId },
    fr: { base: libraryEn, premium: libraryPremiumId },
    bn: { base: libraryEn, premium: libraryPremiumId },
    ar: { base: libraryAr, premium: [] },
    ur: { base: libraryEn, premium: libraryPremiumId }
};

let currentLocale = DEFAULT_APP_LOCALE;
let uiStrings = enUi;
const fallbackUi = trUi;

function nestedGet(obj, path) {
    return path.split('.').reduce((o, k) => (o && o[k] != null ? o[k] : undefined), obj);
}

export function getLocale() {
    return currentLocale;
}

export function getLocaleTag() {
    const meta = SUPPORTED_LOCALES.find((l) => l.code === currentLocale);
    return meta?.bcp47 || 'en-US';
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

/** Kütüphane okunuş adı: TR Latin; AR Arapça; BN Bengalce; diğerleri en.json Latin. */
export function getLibraryNameForLocale(id, locale) {
    const base = libraryTrById.get(id);
    if (!base) return '';
    const code = normalizeAppLocale(locale);
    if (code === 'tr') return String(base.name || '').trim();
    if (code === 'ar') {
        const ar = libraryArById.get(id);
        if (ar && ar.name) return String(ar.name).trim();
        if (base.arabic) return String(base.arabic).trim();
        return '';
    }
    if (code === 'bn') {
        const bn = libraryBnById.get(id);
        if (bn && bn.name) return String(bn.name).trim();
    }
    const en = libraryContextEnById.get(id) || libraryPremiumEnById.get(id);
    if (en && en.name) return String(en.name).trim();
    return String(base.name || '').trim();
}

export function getKnownLibraryNameTexts(id) {
    const known = new Set();
    const tr = libraryTrById.get(id);
    const en = libraryContextEnById.get(id) || libraryPremiumEnById.get(id);
    const bn = libraryBnById.get(id);
    const ar = libraryArById.get(id);
    if (tr && tr.name) known.add(String(tr.name).trim());
    if (tr && tr.arabic) known.add(String(tr.arabic).trim());
    if (en && en.name) known.add(String(en.name).trim());
    if (bn && bn.name) known.add(String(bn.name).trim());
    if (ar && ar.name) known.add(String(ar.name).trim());
    return known;
}

/**
 * TR: tam kanon. Diğer diller: locale okunuş; meal İngilizce (en.json); fazilet/bağlam zikirde boş.
 * Dualarda bağlam (ne zaman) da İngilizce.
 */
function applyLibraryLocalePolicy(item, locale) {
    if (normalizeAppLocale(locale) === 'tr') return item;
    const enRow = libraryContextEnById.get(item.id);
    const out = {
        ...item,
        name: getLibraryNameForLocale(item.id, locale),
        meaning: (enRow && enRow.meaning) || '',
        context: ''
    };
    if (item.category === 'dua') {
        out.context = (enRow && enRow.context) || '';
        if (enRow && enRow.keywords) out.keywords = enRow.keywords;
    }
    return out;
}

function buildLibrary(locale, includePremium) {
    const code = normalizeAppLocale(locale);
    const pack = LIBRARY_BY_LOCALE[code] || LIBRARY_BY_LOCALE.tr;
    const overlayById = new Map((pack.base || []).map((item) => [item.id, item]));
    let list = libraryTr.map((item) => {
        const merged = mergeLibraryItem(item, overlayById.get(item.id));
        return applyLibraryLocalePolicy(merged, code);
    });
    if (includePremium) {
        const premOverlay = new Map((pack.premium || []).map((item) => [item.id, item]));
        list = list.concat(
            libraryPremiumTr.map((item) => {
                const merged = mergeLibraryItem(item, premOverlay.get(item.id));
                return applyLibraryLocalePolicy(merged, code);
            })
        );
    }
    return list;
}

export function getZikirLibrary(includePremium = false) {
    return buildLibrary(currentLocale, includePremium);
}

/** Kütüphane maddesi (TR kanon + locale politikası). */
export function getLibraryCanonItem(id, locale) {
    const base = libraryTrById.get(id);
    if (!base) return null;
    if (normalizeAppLocale(locale) === 'tr') return { ...base };
    const enRow = libraryContextEnById.get(id) || libraryPremiumEnById.get(id);
    return applyLibraryLocalePolicy(mergeLibraryItem(base, enRow), locale);
}

export function getLibraryMeaningForLocale(id, locale) {
    const item = getLibraryCanonItem(id, locale);
    return item && item.meaning ? String(item.meaning).trim() : '';
}

/** Zikir maddelerinde TR `context` = fazilet metni. */
export function getLibraryFaziletForLocale(id) {
    const base = libraryTrById.get(id);
    if (!base || base.category !== 'zikir') return '';
    return base.context && String(base.context).trim() ? String(base.context).trim() : '';
}

export function getKnownLibraryMeaningTexts(id) {
    const known = new Set();
    const tr = libraryTrById.get(id);
    const en = libraryContextEnById.get(id) || libraryPremiumEnById.get(id);
    if (tr && tr.meaning) known.add(String(tr.meaning).trim());
    if (en && en.meaning) known.add(String(en.meaning).trim());
    return known;
}

export function getKnownLibraryFaziletTexts(id) {
    const fz = getLibraryFaziletForLocale(id);
    return fz ? new Set([fz]) : new Set();
}

/** Eski kayıtlar: kütüphaneden eklenmiş ama libraryId yoksa isim/Arapça ile eşleştir. */
export function inferLibraryIdForZikir(z) {
    if (!z || z.libraryId) return z?.libraryId || null;
    const nameKey = String(z.name || '').trim().toLocaleLowerCase('tr-TR');
    if (!nameKey) return null;
    const ar = String(z.arabic || '').trim();
    for (const item of libraryTrById.values()) {
        if (String(item.name || '').trim().toLocaleLowerCase('tr-TR') !== nameKey) continue;
        if (ar && item.arabic && String(item.arabic).trim() !== ar) continue;
        return item.id;
    }
    return null;
}

export function applyLocaleToDocument(locale) {
    const code = normalizeAppLocale(locale);
    currentLocale = code;
    uiStrings = UI_BY_LOCALE[code] || enUi;

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
