import surahIndex from './data/quran/index.json';
import mealsIndex from './data/quran/meals/index.json';
import { getJuzAtStart, getJuzDividerBeforeAyah, getJuzForAyah } from './lib/juz.js';
import {
    MUSHAF_PAGE_COUNT,
    getPageForAyah,
    getPageSegments,
    listAyahsOnPage
} from './lib/quran-pages.js';
import {
    getSurahRefDisplayName,
    parseScopedMealSearchQuery,
    resolveQuranRefSuggestions,
    resolveSurahNameQuery,
    surahMatchesRefSearch
} from './quran-ref-search.js';
import {
    getAyahTextSearchIndexError,
    isAyahTextSearchIndexReady,
    localeSupportsArabicAyahTextSearch,
    localeSupportsAyahTextSearch,
    localeSupportsMealTextSearch,
    localeSupportsTranslitTextSearch,
    passesAyahTextSearchQueryGate,
    preloadAyahTextSearchIndex,
    searchAyahTextHits
} from './quran-ayah-text-search.js';
import { getSurahLocalizedName } from './quran-surah-names.js';

export { getSurahLocalizedName } from './quran-surah-names.js';
import { t, getLocale, normalizeAppLocale } from './i18n.js';
import { closeTafsirBridgeSheet, openTafsirBridgeSheet } from './tafsir-bridge.js';

const VALID_MEAL_IDS = new Set(['vakfi', 'diyanet', 'bn', 'muyassar', 'sahih', 'hamidullah', 'basmeih', 'indonesian', 'ahmedali', 'jalandhry']);
const VALID_READ_MODES = new Set(['meal-ar', 'translit-ar', 'ar-only']);
const VALID_READER_LAYOUTS = new Set(['scroll', 'mushaf']);
const DEFAULT_QURAN_READ_MODE = 'meal-ar';
const DEFAULT_QURAN_READER_LAYOUT = 'scroll';

/** Locale → o dildeki meal paketleri (çapraz dil meal yok). */
const QURAN_MEALS_BY_LOCALE = {
    tr: { meals: ['diyanet', 'vakfi'], default: 'diyanet' },
    bn: { meals: ['bn'], default: 'bn' },
    ar: { meals: ['muyassar'], default: 'muyassar' },
    en: { meals: ['sahih'], default: 'sahih' },
    id: { meals: ['indonesian'], default: 'indonesian' },
    ms: { meals: ['basmeih'], default: 'basmeih' },
    fr: { meals: ['hamidullah'], default: 'hamidullah' },
    ur: { meals: ['ahmedali', 'jalandhry'], default: 'ahmedali' }
};
const LAZY_ROOT_MARGIN = '120% 0px';
const LAZY_UNLOAD_VIEWPORTS = 2.5;
const LAZY_SCROLL_END_MS = 140;
const AYAH_TAP_MOVE_CANCEL_PX_MOUSE = 14;
const AYAH_TAP_MOVE_CANCEL_PX_TOUCH = 56;
const AYAH_HOLD_MS = 520;
const EXPAND_SWIPE_COMMIT_PX = 72;
const EXPAND_SWIPE_LOCK_PX = 14;
/** WebView'da transitionend kaçırılırsa kaydırma takılmasın */
const EXPAND_EXIT_ANIM_MS = 360;
const TEXT_SEARCH_SUGGESTION_LIMIT = 10;

/** @type {{ surah: number, ayah: number, readMode: string, meal: string } | null} */
let expandViewState = null;
let expandNavigateLock = false;
/** @type {number | null} */
let expandPendingDelta = null;
let expandSwipeCommitGen = 0;
let ayahExpandSuppressUntil = 0;

let quranSearchQuery = '';
let quranViewTab = 'surahs';
let navigateToSurah = null;
let onMealChange = null;
let onReadModeChange = null;
let onReaderLayoutChange = null;
let renderGeneration = 0;
const surahContentCache = new Map();
let lazyObserver = null;
let lazyLoadMeal = null;
let lazyLoadMode = null;
let lazyLoadLayout = DEFAULT_QURAN_READER_LAYOUT;
let lazyScrollRaf = 0;
let lazyScrollEndTimer = 0;
let lazyScrollAbort = null;
let lazyScrollScroller = null;
let mushafCurrentPage = 1;
let mushafNavigateLock = false;
let mushafChromeVisible = false;
let mushafChromeBound = false;
let mushafResizeBound = false;
let mushafSwipeBound = false;
const MUSHAF_TAP_MAX_PX = 14;
const MUSHAF_SCROLL_LOCK_PX = 10;

function onMushafViewportResize() {
    if (getCurrentReaderLayout() === 'mushaf') scheduleMushafCanvasFill();
}

/** @type {{ getRemember?: () => boolean, getSavedPage?: () => number, setRemember?: (v: boolean) => void, onPageSaved?: (page: number) => void } | null} */
let mushafSettingsApi = null;
export function setMushafSettingsApi(api) {
    mushafSettingsApi = api;
}

export function getMushafCurrentPage() {
    return mushafCurrentPage;
}

let ayahFavoritesApi = {
    isFavorite: () => false,
    toggleFavorite: () => false
};

export function getQuranMealsForLocale(locale) {
    const code = normalizeAppLocale(locale || getLocale());
    return QURAN_MEALS_BY_LOCALE[code]?.meals ?? [];
}

export function getDefaultQuranMealForLocale(locale) {
    const code = normalizeAppLocale(locale || getLocale());
    return QURAN_MEALS_BY_LOCALE[code]?.default ?? null;
}

export function localeHasQuranMeal(locale) {
    return getQuranMealsForLocale(locale).length > 0;
}

export function normalizeQuranMeal(mealId, locale = getLocale()) {
    const allowed = getQuranMealsForLocale(locale);
    const id = String(mealId || '').toLowerCase();
    if (allowed.includes(id) && VALID_MEAL_IDS.has(id)) return id;
    const def = getDefaultQuranMealForLocale(locale);
    return def && VALID_MEAL_IDS.has(def) ? def : null;
}

export function normalizeQuranReadMode(mode) {
    const id = String(mode || '').toLowerCase();
    return VALID_READ_MODES.has(id) ? id : DEFAULT_QURAN_READ_MODE;
}

export function normalizeQuranReaderLayout(layout) {
    const id = String(layout || '').toLowerCase();
    return VALID_READER_LAYOUTS.has(id) ? id : DEFAULT_QURAN_READER_LAYOUT;
}

export function getDefaultQuranReaderLayout() {
    return DEFAULT_QURAN_READER_LAYOUT;
}

export function getDefaultQuranReadModeForLocale(locale) {
    if (localeHasQuranMeal(locale)) return 'meal-ar';
    return normalizeAppLocale(locale || getLocale()) === 'ar' ? 'ar-only' : 'translit-ar';
}

export function normalizeQuranReadModeForLocale(mode, locale = getLocale()) {
    const normalized = normalizeQuranReadMode(mode);
    if (!localeHasQuranMeal(locale) && normalized === 'meal-ar') {
        return getDefaultQuranReadModeForLocale(locale);
    }
    return normalized;
}

export function syncQuranSettingsForLocale(settings) {
    if (!settings || typeof settings !== 'object') return;
    const locale = normalizeAppLocale(settings.locale || getLocale());
    settings.locale = locale;
    settings.quranMeal = normalizeQuranMeal(settings.quranMeal, locale);
    settings.quranReadMode = normalizeQuranReadModeForLocale(settings.quranReadMode, locale);
    settings.quranReaderLayout = normalizeQuranReaderLayout(settings.quranReaderLayout);
    ensureAyahTextSearchIndexLoaded();
}

export function localeShowsQuran() {
    return true;
}

/** Türkçe tefsir köprüsü (Diyanet / Ömer Çelik) yalnızca TR arayüzünde. */
export function localeShowsQuranTafsir(locale = getLocale()) {
    return normalizeAppLocale(locale) === 'tr';
}

function getMealDisplayName(meta, locale) {
    if (!meta) return '';
    const code = normalizeAppLocale(locale || getLocale());
    if (code === 'ar' && meta.nameAr) return meta.nameAr;
    if (code === 'bn' && meta.nameBn) return meta.nameBn;
    if (code === 'fr' && meta.nameFr) return meta.nameFr;
    if (code === 'ms' && meta.nameMs) return meta.nameMs;
    if (code === 'id' && meta.nameId) return meta.nameId;
    if (code === 'tr' && meta.nameTr) return meta.nameTr;
    if (code === 'en' && meta.nameEn) return meta.nameEn;
    if (code === 'ur' && meta.nameUr) return meta.nameUr;
    return meta.nameEn || meta.nameUr || meta.nameFr || meta.nameTr || meta.id;
}

/** TR: Türkçe latin okunuş; diğer diller: İngilizce latin okunuş. */
export function getQuranTranslitPackId(locale) {
    return normalizeAppLocale(locale || getLocale()) === 'tr' ? 'translit-tr' : 'translit-en';
}

export function setQuranNavigateToSurah(fn) {
    navigateToSurah = typeof fn === 'function' ? fn : null;
}

export function setQuranMealChangeHandler(fn) {
    onMealChange = typeof fn === 'function' ? fn : null;
}

export function setQuranReadModeChangeHandler(fn) {
    onReadModeChange = typeof fn === 'function' ? fn : null;
}

export function setQuranReaderLayoutChangeHandler(fn) {
    onReaderLayoutChange = typeof fn === 'function' ? fn : null;
}

/** Sağ panelden düzen seçimi — dokunmatikte güvenilir giriş noktası. */
export function requestQuranReaderLayout(layout) {
    const next = normalizeQuranReaderLayout(layout);
    const wasMushaf = isQuranMushafDomActive();
    if (next === 'scroll') {
        guardQuranReaderSettingsChange();
    }
    syncQuranReaderLayoutUI(next);
    if (onReaderLayoutChange) onReaderLayoutChange(next, { wasMushaf });
}

export function setQuranAyahFavoritesApi(api) {
    ayahFavoritesApi = {
        isFavorite: typeof api?.isFavorite === 'function' ? api.isFavorite : () => false,
        toggleFavorite: typeof api?.toggleFavorite === 'function' ? api.toggleFavorite : () => false
    };
}

export function resolveQuranSurahInput(raw) {
    return resolveSurahFromGotoInput(raw);
}

export async function fetchSurahAyahs(surahN, mealId, locale = getLocale()) {
    const n = Number(surahN);
    if (!Number.isFinite(n) || n < 1 || n > 114) return null;
    return getSurahContent(normalizeQuranMeal(mealId, locale), n, locale);
}

export function getQuranViewTab() {
    return quranViewTab;
}

export function syncQuranTabVisibility() {
    const btn = document.getElementById('libraryTabSurahs');
    if (!btn) return;
    btn.hidden = false;
    btn.removeAttribute('hidden');
    syncQuranTafsirVisibility();
    syncQuranGuideMealSelect();
    syncQuranSearchGuide();
    ensureAyahTextSearchIndexLoaded();
}

export function syncQuranSearchGuide(locale = getLocale()) {
    const mealItem = document.getElementById('quranSearchGuideMeal');
    const translitItem = document.getElementById('quranSearchGuideTranslit');
    if (mealItem) {
        mealItem.hidden = !localeSupportsMealTextSearch(locale) && !localeSupportsArabicAyahTextSearch(locale);
    }
    if (translitItem) translitItem.hidden = !localeSupportsTranslitTextSearch(locale);
}

let ayahSearchPreloadToken = 0;

function ensureAyahTextSearchIndexLoaded() {
    const locale = getLocale();
    if (!localeSupportsAyahTextSearch(locale)) return;
    if (isAyahTextSearchIndexReady(locale)) return;

    const token = ++ayahSearchPreloadToken;
    void preloadAyahTextSearchIndex(locale)
        .then(() => {
            if (token !== ayahSearchPreloadToken) return;
            if (!(quranSearchQuery || '').trim()) return;
            renderQuranSurahList();
        })
        .catch(() => {
            if (token !== ayahSearchPreloadToken) return;
            renderQuranSurahList();
        });
}

function mealMetaById(mealId) {
    return (mealsIndex || []).find((m) => m.id === mealId) || null;
}

function formatGuideMealExamples(locale) {
    const mealIds = getQuranMealsForLocale(locale);
    const names = mealIds
        .map((id) => getMealDisplayName(mealMetaById(id), locale))
        .filter(Boolean);
    if (names.length < 2) return '';
    if (names.length === 2) {
        return `${names[0]} ${t('quran.guideMealOr')} ${names[1]}`;
    }
    const last = names.pop();
    return `${names.join(', ')} ${t('quran.guideMealOr')} ${last}`;
}

export function syncQuranGuideMealSelect(locale = getLocale()) {
    const el = document.getElementById('quranGuideMealSelect');
    if (!el) return;
    const mealIds = getQuranMealsForLocale(locale);
    if (mealIds.length <= 1) {
        el.hidden = true;
        return;
    }
    el.hidden = false;
    el.removeAttribute('hidden');
    el.textContent = t('quran.guideMealSelect', { meals: formatGuideMealExamples(locale) });
}

export function syncQuranTafsirVisibility(locale = getLocale()) {
    const show = localeShowsQuranTafsir(locale);
    const guideItem = document.getElementById('quranGuideHoldTafsir');
    if (guideItem) guideItem.hidden = !show;
    if (!show) closeTafsirBridgeSheet();
}

export function clearQuranSurahCache() {
    surahContentCache.clear();
}

export function clearQuranSearch() {
    quranSearchQuery = '';
    const input = document.getElementById('quranSearchInput');
    if (input) input.value = '';
    const box = document.getElementById('quranSearchSuggestions');
    if (box) {
        box.innerHTML = '';
        box.hidden = true;
    }
}

function surahMeta(n) {
    return (surahIndex || []).find((s) => s.n === n) || null;
}

function formatAyahExpandRef(surahName, surahN, ayahN) {
    return t('quran.ayahExpandRef', {
        surah: surahName,
        n: ayahN,
        juz: getJuzForAyah(surahN, ayahN)
    });
}

function formatAyahCardRef(surahName, _surahN, ayahN) {
    return t('quran.ayahCardRef', {
        surah: surahName,
        n: ayahN
    });
}

function createJuzDivider(juzN) {
    const row = document.createElement('div');
    row.className = 'quran-juz-divider';
    row.setAttribute('aria-hidden', 'true');

    const lineStart = document.createElement('span');
    lineStart.className = 'quran-juz-divider__line';

    const label = document.createElement('span');
    label.className = 'quran-juz-divider__label';
    label.textContent = t('quran.juzLabel', { n: juzN });

    const lineEnd = document.createElement('span');
    lineEnd.className = 'quran-juz-divider__line';

    row.appendChild(lineStart);
    row.appendChild(label);
    row.appendChild(lineEnd);
    return row;
}

function surahMatchesSearch(surah, rawQuery) {
    return surahMatchesRefSearch(surah, rawQuery, getLocale());
}

function escapeSearchHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function getQuranSearchSuggestionHits(query) {
    const q = (query || '').trim();
    const locale = getLocale();
    if (!q) return [];

    const refs = resolveQuranRefSuggestions(q, surahIndex, locale);
    if (refs.length) {
        return refs.map((ref) => ({
            kind: 'ref',
            surah: ref.surah,
            ayah: ref.ayah,
            displayName: ref.displayName,
            label: t('quran.searchRefHit', { surah: ref.displayName, ayah: ref.ayah })
        }));
    }

    if (!localeSupportsAyahTextSearch(locale)) return [];

    const scoped = parseScopedMealSearchQuery(q, surahIndex, locale);
    const searchQ = scoped ? scoped.text : q;
    if (!passesAyahTextSearchQueryGate(searchQ, locale)) return [];

    const searchOpts = {
        limit: TEXT_SEARCH_SUGGESTION_LIMIT,
        surah: scoped?.surah
    };

    return searchAyahTextHits(searchQ, surahIndex, locale, searchOpts).map((hit) => {
        const scopedPrefix = scoped ? `${scoped.surahName} · ` : '';
        if (hit.kind === 'ar') {
            return {
                kind: 'ar',
                surah: hit.surah,
                ayah: hit.ayah,
                readModeId: hit.readModeId,
                displayName: hit.displayName,
                label: `${scopedPrefix}${t('quran.searchArHit', {
                    surah: hit.displayName,
                    ayah: hit.ayah
                })}`,
                snippet: hit.snippet
            };
        }
        if (hit.kind === 'translit') {
            return {
                kind: 'translit',
                surah: hit.surah,
                ayah: hit.ayah,
                readModeId: hit.readModeId,
                displayName: hit.displayName,
                label: `${scopedPrefix}${t('quran.searchTranslitHit', {
                    surah: hit.displayName,
                    ayah: hit.ayah
                })}`,
                snippet: hit.snippet
            };
        }
        const mealMeta = mealMetaById(hit.mealId);
        const mealLabel = getMealDisplayName(mealMeta, locale) || hit.mealId;
        return {
            kind: 'meal',
            surah: hit.surah,
            ayah: hit.ayah,
            mealId: hit.mealId,
            displayName: hit.displayName,
            label: `${scopedPrefix}${t('quran.searchMealHit', {
                meal: mealLabel,
                surah: hit.displayName,
                ayah: hit.ayah
            })}`,
            snippet: hit.snippet
        };
    });
}

function renderQuranSearchSuggestions(query) {
    const box = document.getElementById('quranSearchSuggestions');
    if (!box) return;
    box.innerHTML = '';
    const q = (query || '').trim();
    const locale = getLocale();
    const scoped = q ? parseScopedMealSearchQuery(q, surahIndex, locale) : null;
    const textProbe = scoped ? scoped.text : q;

    if (
        textProbe &&
        localeSupportsAyahTextSearch(locale) &&
        passesAyahTextSearchQueryGate(textProbe, locale) &&
        !isAyahTextSearchIndexReady(locale)
    ) {
        ensureAyahTextSearchIndexLoaded();
        const loadErr = getAyahTextSearchIndexError(locale);
        const status = document.createElement('p');
        status.className = `quran-search-ref quran-search-ref--loading${
            loadErr ? ' quran-search-ref--error' : ''
        }`;
        status.textContent = loadErr ? t('quran.searchIndexError') : t('quran.loading');
        box.appendChild(status);
        box.hidden = false;
        return;
    }

    const hits = getQuranSearchSuggestionHits(query);
    if (!hits.length) {
        box.hidden = true;
        return;
    }

    hits.forEach((hit) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `quran-search-ref${
            hit.kind === 'meal' || hit.kind === 'translit' || hit.kind === 'ar'
                ? ' quran-search-ref--meal'
                : ''
        }`;
        const snippetHtml = hit.snippet
            ? `<span class="quran-search-ref__snippet">${escapeSearchHtml(hit.snippet)}</span>`
            : '';
        btn.innerHTML = `
            <span class="material-icons-outlined quran-search-ref__icon" aria-hidden="true">arrow_forward</span>
            <span class="quran-search-ref__text">
                <span class="quran-search-ref__title">${escapeSearchHtml(hit.label)}</span>
                ${snippetHtml}
            </span>
        `;
        btn.addEventListener('click', () => {
            if (hit.readModeId && onReadModeChange) onReadModeChange(hit.readModeId);
            if (navigateToSurah) navigateToSurah(hit.surah, hit.ayah, hit.mealId);
            clearQuranSearch();
            renderQuranSurahList();
        });
        box.appendChild(btn);
    });
    box.hidden = false;
}

function getQuranReaderScroller() {
    const view = document.getElementById('quranSurahView');
    if (view?.classList.contains('quran-surah-view--mushaf')) {
        return document.getElementById('quranMushafPager');
    }
    return document.querySelector('#quranSurahView .main-content.scrollable');
}

async function loadSurahContent(n, mealId, locale) {
    const pad = String(n).padStart(3, '0');
    const meal = normalizeQuranMeal(mealId, locale);
    const translitPack = getQuranTranslitPackId(locale);
    const translitImport =
        translitPack === 'translit-tr'
            ? () => import(`./data/quran/translit-tr/${pad}.json`)
            : () => import(`./data/quran/translit-en/${pad}.json`);
    const [arMod, mealMod, latMod] = await Promise.all([
        import(`./data/quran/ar/${pad}.json`),
        meal
            ? import(`./data/quran/meals/${meal}/${pad}.json`)
            : Promise.resolve({ default: { ayahs: [] } }),
        translitImport()
    ]);
    const ar = arMod.default || arMod;
    const trMeal = mealMod.default || mealMod;
    const latPack = latMod.default || latMod;
    const mealByN = new Map((trMeal.ayahs || []).map((a) => [a.n, a.tr]));
    const latByN = new Map((latPack.ayahs || []).map((a) => [a.n, a.lat]));
    return {
        n: ar.n,
        nameTr: ar.nameTr || trMeal.nameTr,
        nameAr: ar.nameAr,
        ayahCount: ar.ayahCount,
        ayahs: (ar.ayahs || []).map((a) => ({
            n: a.n,
            ar: a.ar,
            bismillah: a.bismillah,
            tr: mealByN.get(a.n) || '',
            lat: latByN.get(a.n) || ''
        }))
    };
}

function surahCacheKey(meal, n, locale) {
    const pack = getQuranTranslitPackId(locale);
    const mealKey = meal || 'none';
    return `${mealKey}:${pack}:${n}`;
}

async function getSurahContent(meal, n, locale = getLocale()) {
    const mealNorm = normalizeQuranMeal(meal, locale);
    const key = surahCacheKey(mealNorm, n, locale);
    if (surahContentCache.has(key)) return surahContentCache.get(key);
    const surah = await loadSurahContent(n, mealNorm, locale);
    surahContentCache.set(key, surah);
    return surah;
}

function estimateSurahMinHeight(ayahCount) {
    return Math.max(100, (ayahCount || 1) * 84);
}

function disconnectLazyObserver() {
    if (lazyObserver) {
        lazyObserver.disconnect();
        lazyObserver = null;
    }
    lazyLoadMeal = null;
    lazyLoadMode = null;
    lazyLoadLayout = DEFAULT_QURAN_READER_LAYOUT;
    if (lazyScrollRaf) {
        cancelAnimationFrame(lazyScrollRaf);
        lazyScrollRaf = 0;
    }
    if (lazyScrollEndTimer) {
        clearTimeout(lazyScrollEndTimer);
        lazyScrollEndTimer = 0;
    }
}

function getReaderSectionsNearViewport(scroller, marginPx) {
    const rootRect = scroller.getBoundingClientRect();
    const top = rootRect.top - marginPx;
    const bottom = rootRect.bottom + marginPx;
    const list = document.getElementById('quranAyahList');
    if (!list || lazyLoadLayout === 'mushaf') return [];
    return [...list.querySelectorAll('.quran-surah-section')].filter((section) => {
        const rect = section.getBoundingClientRect();
        return rect.bottom >= top && rect.top <= bottom;
    });
}

function loadVisibleReaderSections() {
    if (!lazyLoadMeal || !lazyLoadMode || lazyLoadLayout === 'mushaf') return;
    const scroller = getQuranReaderScroller();
    if (!scroller) return;
    const margin = Math.max(scroller.clientHeight * 1.2, 480);
    const gen = renderGeneration;
    getReaderSectionsNearViewport(scroller, margin).forEach((section) => {
        void loadSurahSectionIfNeeded(section, lazyLoadMeal, lazyLoadMode, gen);
    });
}

function scheduleVisibleSurahLoad() {
    if (lazyScrollRaf) return;
    lazyScrollRaf = requestAnimationFrame(() => {
        lazyScrollRaf = 0;
        loadVisibleReaderSections();
    });
}

function bindLazyScrollLoader() {
    const scroller = getQuranReaderScroller();
    if (!scroller || scroller === lazyScrollScroller) return;
    lazyScrollAbort?.abort();
    lazyScrollAbort = new AbortController();
    lazyScrollScroller = scroller;
    scroller.addEventListener(
        'scroll',
        () => {
            scheduleVisibleSurahLoad();
            if (lazyScrollEndTimer) clearTimeout(lazyScrollEndTimer);
            lazyScrollEndTimer = window.setTimeout(() => {
                lazyScrollEndTimer = 0;
                loadVisibleReaderSections();
            }, LAZY_SCROLL_END_MS);
        },
        { passive: true, signal: lazyScrollAbort.signal }
    );
}

function getQuranReaderMealId() {
    const pager = document.getElementById('quranMushafPager');
    const list = document.getElementById('quranAyahList');
    const fromPager = pager && !pager.hidden ? pager.dataset.mealId : undefined;
    return normalizeQuranMeal(
        fromPager ?? list?.dataset.mealId ?? lazyLoadMeal ?? getDefaultQuranMealForLocale(getLocale()),
        getLocale()
    );
}

function cancelExpandSwipeCommit() {
    expandSwipeCommitGen += 1;
}

function resetExpandCardMotion() {
    cancelExpandSwipeCommit();
    const card = document.getElementById('quranAyahExpandCard');
    if (!card) return;
    card.style.transform = '';
    card.style.transition = '';
    card.classList.remove(
        'quran-ayah-expand__card--from-left',
        'quran-ayah-expand__card--from-right'
    );
}

function prefetchExpandAyahNeighbors(meal, surahN, ayahN) {
    const next = adjacentAyahRef(surahN, ayahN, 1);
    const prev = adjacentAyahRef(surahN, ayahN, -1);
    for (const ref of [next, prev]) {
        if (ref) void getSurahContent(meal, ref.surah).catch(() => {});
    }
}

function scheduleExpandSwipeNavigate(delta) {
    const card = document.getElementById('quranAyahExpandCard');
    if (!card || !expandViewState) return;

    cancelExpandSwipeCommit();
    const commitGen = expandSwipeCommitGen;
    const exitX = delta > 0 ? '108%' : '-108%';
    let fallbackTimer = 0;

    const finish = () => {
        if (commitGen !== expandSwipeCommitGen) return;
        expandSwipeCommitGen += 1;
        card.removeEventListener('transitionend', onExitDone);
        if (fallbackTimer) clearTimeout(fallbackTimer);
        card.style.transition = '';
        card.style.transform = '';
        void navigateExpandedAyah(delta);
    };

    const onExitDone = (ev) => {
        if (commitGen !== expandSwipeCommitGen) return;
        if (ev.target !== card) return;
        if (ev.propertyName && ev.propertyName !== 'transform') return;
        finish();
    };

    card.style.transition = '';
    card.style.transform = `translateX(${exitX})`;
    fallbackTimer = window.setTimeout(finish, EXPAND_EXIT_ANIM_MS);
    card.addEventListener('transitionend', onExitDone);
}

function adjacentAyahRef(surahN, ayahN, delta) {
    const meta = surahMeta(surahN);
    if (!meta || delta !== 1 && delta !== -1) return null;

    let s = Number(surahN);
    let a = Number(ayahN) + delta;

    if (a >= 1 && a <= meta.ayahCount) return { surah: s, ayah: a };

    if (delta > 0) {
        if (s >= 114) return null;
        s += 1;
        const nextMeta = surahMeta(s);
        return nextMeta ? { surah: s, ayah: 1 } : null;
    }

    if (s <= 1) return null;
    s -= 1;
    const prevMeta = surahMeta(s);
    return prevMeta ? { surah: s, ayah: prevMeta.ayahCount } : null;
}

function getCurrentQuranReadMode(fallback) {
    const list = document.getElementById('quranAyahList');
    const pager = document.getElementById('quranMushafPager');
    const fromList = list?.dataset.readMode;
    const fromPager = pager && !pager.hidden ? pager.dataset.readMode : '';
    const raw = fromList || fromPager || fallback || DEFAULT_QURAN_READ_MODE;
    return normalizeQuranReadModeForLocale(raw, getLocale());
}

function setExpandTextField(el, text, show) {
    if (!el) return;
    const value = String(text || '').trim();
    el.textContent = value;
    const visible = !!show && !!value;
    el.hidden = !visible;
    if (visible) el.removeAttribute('hidden');
    else el.setAttribute('hidden', '');
}

function syncExpandCardReadMode(mode) {
    const card = document.getElementById('quranAyahExpandCard');
    if (!card) return;
    card.classList.remove(
        'quran-ayah-expand__card--meal-ar',
        'quran-ayah-expand__card--translit-ar',
        'quran-ayah-expand__card--ar-only'
    );
    card.classList.add(`quran-ayah-expand__card--${mode}`);
}

function fillAyahExpandCard(surahN, ayah, readMode) {
    const meta = surahMeta(surahN);
    const mode = getCurrentQuranReadMode(readMode);
    const refEl = document.getElementById('quranAyahExpandRef');
    const bismEl = document.getElementById('quranAyahExpandBism');
    const arEl = document.getElementById('quranAyahExpandAr');
    const trEl = document.getElementById('quranAyahExpandTr');
    const latEl = document.getElementById('quranAyahExpandLat');
    if (!refEl || !arEl) return;

    syncExpandCardReadMode(mode);

    refEl.textContent = formatAyahExpandRef(
        getSurahLocalizedName(meta || surahN, getLocale()) || t('quran.surahFallback', { n: surahN }),
        surahN,
        ayah.n
    );

    const bism = ayah.bismillah && String(ayah.bismillah).trim();
    setExpandTextField(bismEl, bism, !!bism);
    setExpandTextField(arEl, ayah.ar, true);
    setExpandTextField(trEl, ayah.tr, mode === 'meal-ar');
    setExpandTextField(latEl, ayah.lat, mode === 'translit-ar');
}

export function isQuranMushafDomActive() {
    const view = document.getElementById('quranSurahView');
    if (view?.classList.contains('quran-surah-view--mushaf')) return true;
    const pager = document.getElementById('quranMushafPager');
    return !!(pager && !pager.hidden);
}

function getDomQuranReaderLayout() {
    return isQuranMushafDomActive() ? 'mushaf' : 'scroll';
}

function getCurrentReaderLayout() {
    const domLayout = getDomQuranReaderLayout();
    if (domLayout === 'mushaf') return 'mushaf';
    const list = document.getElementById('quranAyahList');
    return normalizeQuranReaderLayout(list?.dataset.readerLayout);
}

async function navigateExpandedAyah(delta) {
    if (!expandViewState) return;
    if (expandNavigateLock) {
        expandPendingDelta = delta;
        return;
    }
    const target = adjacentAyahRef(expandViewState.surah, expandViewState.ayah, delta);
    if (!target) {
        resetExpandCardMotion();
        return;
    }

    expandNavigateLock = true;
    const { meal } = expandViewState;
    const readMode = getCurrentQuranReadMode(expandViewState.readMode);
    try {
        const surah = await getSurahContent(meal, target.surah);
        const ayah = (surah?.ayahs || []).find((a) => a.n === target.ayah);
        if (!ayah) {
            console.warn('Expand ayah missing', target);
            resetExpandCardMotion();
            return;
        }

        expandViewState = { surah: target.surah, ayah: target.ayah, readMode, meal };
        resetExpandCardMotion();
        fillAyahExpandCard(target.surah, ayah, readMode);

        const card = document.getElementById('quranAyahExpandCard');
        if (card) {
            card.classList.remove('quran-ayah-expand__card--from-left', 'quran-ayah-expand__card--from-right');
            void card.offsetWidth;
            card.classList.add(delta > 0 ? 'quran-ayah-expand__card--from-left' : 'quran-ayah-expand__card--from-right');
        }

        const layout = getCurrentReaderLayout();
        const gen = renderGeneration;
        prefetchExpandAyahNeighbors(meal, target.surah, target.ayah);
        void prefetchReaderSections(meal, readMode, layout, target.surah, target.ayah, gen);
        void scrollToAyah(target.surah, target.ayah, meal, readMode, gen, layout);
    } catch (err) {
        console.error('Expand ayah navigate:', err);
        resetExpandCardMotion();
    } finally {
        expandNavigateLock = false;
        const pending = expandPendingDelta;
        expandPendingDelta = null;
        if (pending != null) void navigateExpandedAyah(pending);
    }
}

export function closeAyahExpandView() {
    const overlay = document.getElementById('quranAyahExpandOverlay');
    if (!overlay) return;
    expandViewState = null;
    expandNavigateLock = false;
    expandPendingDelta = null;
    resetExpandCardMotion();
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
}

export function teardownQuranReader() {
    disconnectLazyObserver();
    closeAyahExpandView();
    closeTafsirBridgeSheet();
    hideMushafPager({ resetScroll: true });
    const list = document.getElementById('quranAyahList');
    if (list) {
        list.innerHTML = '';
        list.removeAttribute('data-meal-id');
        list.removeAttribute('data-read-mode');
        list.removeAttribute('data-reader-layout');
        list.hidden = true;
    }
}

function setSurahLoading(loading) {
    const el = document.getElementById('quranSurahLoading');
    const list = document.getElementById('quranAyahList');
    if (el) el.hidden = !loading;
    if (!list) return;
    if (loading) {
        list.hidden = true;
    } else if (!isQuranMushafDomActive()) {
        list.hidden = false;
    }
}

function syncMealSelect(mealId, locale = getLocale()) {
    const select = document.getElementById('quranMealSelect');
    if (!select) return;
    const localeMeals = getQuranMealsForLocale(locale);
    const meal = normalizeQuranMeal(mealId, locale);
    select.innerHTML = '';
    localeMeals.forEach((id) => {
        const meta = (mealsIndex || []).find((m) => m.id === id);
        if (!meta) return;
        const opt = document.createElement('option');
        opt.value = meta.id;
        opt.textContent = getMealDisplayName(meta, locale);
        select.appendChild(opt);
    });
    if (meal) select.value = meal;
}

export function syncQuranReaderChrome(readMode, readerLayout = DEFAULT_QURAN_READER_LAYOUT) {
    const mode = normalizeQuranReadModeForLocale(readMode, getLocale());
    const layout = normalizeQuranReaderLayout(readerLayout);

    if (layout !== 'mushaf' && isQuranMushafDomActive()) {
        hideMushafPager();
    }

    const mealWrap = document.getElementById('quranMealPickerWrap');
    const localeMeals = getQuranMealsForLocale(getLocale());
    if (mealWrap) {
        mealWrap.hidden =
            layout === 'mushaf' || (mode !== 'meal-ar' || localeMeals.length <= 1);
    }

    const meta = document.getElementById('quranMushafMeta');
    const rememberRow = document.getElementById('quranMushafRememberRow');
    if (meta) meta.hidden = layout !== 'mushaf';
    if (rememberRow) rememberRow.hidden = layout !== 'mushaf' || !mushafChromeVisible;

    const view = document.getElementById('quranSurahView');
    if (view) {
        view.classList.toggle('quran-surah-view--mushaf', layout === 'mushaf');
        if (layout !== 'mushaf') {
            view.classList.remove('quran-mushaf-chrome--visible');
            document.documentElement.classList.remove('quran-mushaf-chrome--visible');
            mushafChromeVisible = false;
        }
    }

    const list = document.getElementById('quranAyahList');
    if (list) {
        list.classList.remove(
            'quran-ayah-list--meal-ar',
            'quran-ayah-list--translit-ar',
            'quran-ayah-list--ar-only',
            'quran-ayah-list--layout-scroll',
            'quran-ayah-list--layout-mushaf'
        );
        list.classList.add(`quran-ayah-list--${mode}`, `quran-ayah-list--layout-${layout}`);
    }

    syncQuranReadModeUI(mode);
    syncQuranReaderLayoutUI(layout);
    if (layout === 'mushaf') {
        requestAnimationFrame(() => scheduleMushafCanvasFill());
    }
}

export function syncQuranReaderLayoutUI(readerLayout) {
    const layout = normalizeQuranReaderLayout(readerLayout);
    document.querySelectorAll('#quranReaderLayoutList .quran-read-mode-option').forEach((btn) => {
        const layoutId = btn.getAttribute('data-reader-layout');
        const on = layoutId === layout;
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-checked', on ? 'true' : 'false');
    });
}

function syncQuranReadModeUI(readMode) {
    const mode = normalizeQuranReadModeForLocale(readMode, getLocale());
    const hasMeal = localeHasQuranMeal(getLocale());
    document.querySelectorAll('#quranReadModeList .quran-read-mode-option').forEach((btn) => {
        const readModeId = btn.getAttribute('data-read-mode');
        if (readModeId === 'meal-ar') btn.hidden = !hasMeal;
        const on = readModeId === mode;
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-checked', on ? 'true' : 'false');
    });
}

function syncAyahFavoriteButton(btn, surahN, ayahN) {
    if (!btn) return;
    const on = ayahFavoritesApi.isFavorite(surahN, ayahN);
    btn.classList.toggle('quran-ayah__fav--on', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.title = on ? t('quran.removeFavorite') : t('quran.addFavorite');
    const icon = btn.querySelector('.material-icons-outlined');
    if (icon) icon.textContent = on ? 'star' : 'star_border';
}

export function syncQuranAyahFavoriteButtons() {
    document.querySelectorAll('.quran-ayah__fav').forEach((btn) => {
        const surahN = Number(btn.closest('.quran-ayah')?.getAttribute('data-surah'));
        const ayahN = Number(btn.closest('.quran-ayah')?.getAttribute('data-ayah'));
        if (Number.isFinite(surahN) && Number.isFinite(ayahN)) {
            syncAyahFavoriteButton(btn, surahN, ayahN);
        }
    });
}

async function openAyahExpandView(surahN, ayahRef) {
    if (getCurrentReaderLayout() === 'mushaf') return;
    if (isAyahExpandSuppressed()) return;
    const overlay = document.getElementById('quranAyahExpandOverlay');
    if (!overlay) return;

    const ayahN = Number(typeof ayahRef === 'object' && ayahRef != null ? ayahRef.n : ayahRef);
    const s = Number(surahN);
    if (!Number.isFinite(s) || !Number.isFinite(ayahN)) return;

    const meal = getQuranReaderMealId();
    const mode = getCurrentQuranReadMode();
    resetExpandCardMotion();

    try {
        const surah = await getSurahContent(meal, s);
        const ayah = (surah?.ayahs || []).find((a) => a.n === ayahN);
        if (!ayah) return;

        expandViewState = { surah: s, ayah: ayahN, readMode: mode, meal };
        fillAyahExpandCard(s, ayah, mode);

        overlay.hidden = false;
        overlay.removeAttribute('hidden');
        overlay.setAttribute('aria-hidden', 'false');
        prefetchExpandAyahNeighbors(meal, s, ayahN);
        void prefetchReaderSections(meal, mode, getCurrentReaderLayout(), s, ayahN, renderGeneration);
    } catch (err) {
        console.error('Ayet büyütme açılamadı:', err);
    }
}

function suppressAyahExpandInteraction(ms = 500) {
    ayahExpandSuppressUntil = Date.now() + ms;
    const list = document.getElementById('quranAyahList');
    if (list) {
        list.style.pointerEvents = 'none';
        window.setTimeout(() => {
            list.style.removeProperty('pointer-events');
        }, ms);
    }
}

/** Sağ panelden okuma modu / düzen değişince hayalet tıklama ve büyütme açılmasını önle. */
export function guardQuranReaderSettingsChange() {
    suppressAyahExpandInteraction(700);
    closeAyahExpandView();
}

function restoreQuranReaderScrollTop(scroller, scrollTop) {
    if (!scroller || scrollTop == null) return;
    const top = scrollTop;
    const apply = () => {
        scroller.scrollTop = top;
    };
    apply();
    requestAnimationFrame(() => {
        apply();
        requestAnimationFrame(apply);
    });
}

function isReaderDrawerOpen() {
    return document.documentElement.classList.contains('quran-drawer-open');
}

/** Sağ panel açılınca alt menü gizlenir; layout değişince okuma konumu kaybolmasın diye. */
function captureReaderScrollSnapshot() {
    const scroller = getQuranReaderScroller();
    if (!scroller) return null;
    const layout = getCurrentReaderLayout();
    // Liste modunda scrollTop, lazy yükleme/boşaltma ile bölüm yükseklikleri
    // değiştiği için kararsızdır; geri yükleme yanlış ayete götürüyordu. Snapshot
    // yalnızca mushaf'ta (sayfa-bazlı, kararlı) alınır. Liste modunda panel bir
    // overlay olduğundan açılış/kapanış zaten okuma konumunu değiştirmez.
    if (layout !== 'mushaf') return null;
    return {
        layout,
        scrollTop: scroller.scrollTop,
        page: mushafCurrentPage
    };
}

function restoreReaderScrollSnapshot(snapshot) {
    if (!snapshot) return;
    const scroller = getQuranReaderScroller();
    if (!scroller) return;

    if (
        snapshot.layout === 'mushaf' &&
        snapshot.page != null &&
        snapshot.page >= 1 &&
        snapshot.page !== mushafCurrentPage
    ) {
        const meal = getQuranReaderMealId();
        const mode = getCurrentQuranReadMode();
        void showMushafPage(snapshot.page, meal, mode, renderGeneration, { persist: false });
        return;
    }

    restoreQuranReaderScrollTop(scroller, snapshot.scrollTop);
    if (snapshot.layout === 'mushaf') {
        scheduleMushafCanvasFill();
    } else {
        scheduleVisibleSurahLoad();
    }
}

let readerScrollRestoreRaf = 0;
let readerScrollRestoreTimer = 0;

/** Bekleyen okuma-konumu geri yüklemesini iptal eder (örn. kullanıcı kasıtlı
 *  başka bir sureye/ayete gidiyorsa, eski konuma geri dönülmemeli). */
function cancelReaderScrollRestore() {
    if (readerScrollRestoreRaf) {
        cancelAnimationFrame(readerScrollRestoreRaf);
        readerScrollRestoreRaf = 0;
    }
    if (readerScrollRestoreTimer) {
        clearTimeout(readerScrollRestoreTimer);
        readerScrollRestoreTimer = 0;
    }
}

function scheduleReaderScrollRestoreAfterLayout(snapshot) {
    cancelReaderScrollRestore();
    if (!snapshot) return;
    const run = () => {
        cancelReaderScrollRestore();
        restoreReaderScrollSnapshot(snapshot);
    };
    readerScrollRestoreRaf = requestAnimationFrame(() => requestAnimationFrame(run));
    readerScrollRestoreTimer = window.setTimeout(run, 100);
}

function isAyahExpandSuppressed() {
    return Date.now() < ayahExpandSuppressUntil;
}

function ayahGestureMoveLimit(pointerType) {
    return pointerType === 'touch' || pointerType === 'pen'
        ? AYAH_TAP_MOVE_CANCEL_PX_TOUCH
        : AYAH_TAP_MOVE_CANCEL_PX_MOUSE;
}

function ayahPointerMoved(clientX, clientY, startX, startY, pointerType) {
    return Math.hypot(clientX - startX, clientY - startY) > ayahGestureMoveLimit(pointerType);
}

function attachAyahPointerInteractions(block, surahN, ayah, readMode) {
    block.addEventListener('click', (e) => {
        if (e.target.closest('.quran-ayah__fav')) return;
        if (block.dataset.ayahSuppressTap === '1') {
            delete block.dataset.ayahSuppressTap;
            return;
        }
        void openAyahExpandView(surahN, ayah.n);
    });

    block.addEventListener(
        'pointerdown',
        (e) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            if (e.target.closest('.quran-ayah__fav')) return;
            if (!localeShowsQuranTafsir()) return;

            const pid = e.pointerId;
            const ptrKind = e.pointerType;
            const startX = e.clientX;
            const startY = e.clientY;
            let ended = false;
            let moved = false;
            let holdTimer = 0;

            delete block.dataset.ayahSuppressTap;

            function clearHold() {
                if (holdTimer) {
                    clearTimeout(holdTimer);
                    holdTimer = 0;
                }
                block.classList.remove('quran-ayah--pressing');
                document.removeEventListener('pointermove', onMove, true);
                document.removeEventListener('pointerup', onEnd, true);
                document.removeEventListener('pointercancel', onEnd, true);
            }

            function onMove(ev) {
                if (ended || ev.pointerId !== pid) return;
                if (ayahPointerMoved(ev.clientX, ev.clientY, startX, startY, ptrKind)) {
                    moved = true;
                    clearHold();
                }
            }

            function onEnd(ev) {
                if (ended || ev.pointerId !== pid) return;
                ended = true;
                clearHold();
            }

            holdTimer = window.setTimeout(() => {
                if (ended || moved) return;
                block.dataset.ayahSuppressTap = '1';
                block.classList.add('quran-ayah--pressing');
                openTafsirBridgeSheet(surahN, ayah.n);
                window.setTimeout(() => block.classList.remove('quran-ayah--pressing'), 180);
            }, AYAH_HOLD_MS);

            document.addEventListener('pointermove', onMove, { capture: true, passive: true });
            document.addEventListener('pointerup', onEnd, { capture: true });
            document.addEventListener('pointercancel', onEnd, { capture: true });
        },
        { passive: true }
    );

    block.addEventListener('contextmenu', (e) => e.preventDefault());
}

function createAyahElement(ayah, surahN, readMode) {
    const mode = normalizeQuranReadMode(readMode);
    const block = document.createElement('article');
    block.className = 'quran-ayah';
    block.setAttribute('data-surah', String(surahN));
    block.setAttribute('data-ayah', String(ayah.n));
    block.setAttribute('role', 'button');
    block.setAttribute('tabindex', '0');
    const surahName = getSurahLocalizedName(surahMeta(surahN) || surahN, getLocale())
        || t('quran.surahFallback', { n: surahN });
    const cardRef = formatAyahCardRef(surahName, surahN, ayah.n);
    const ariaHints = [t('quran.ayahTapHint')];
    if (localeShowsQuranTafsir()) ariaHints.push(t('quran.ayahHoldTafsirHint'));
    block.setAttribute('aria-label', `${cardRef}. ${ariaHints.join('. ')}`);

    const head = document.createElement('div');
    head.className = 'quran-ayah__head';
    const ref = document.createElement('span');
    ref.className = 'quran-ayah__ref';
    ref.textContent = cardRef;
    head.appendChild(ref);

    const favBtn = document.createElement('button');
    favBtn.type = 'button';
    favBtn.className = 'quran-ayah__fav icon-btn';
    favBtn.setAttribute('aria-label', t('quran.addFavorite'));
    const favIcon = document.createElement('span');
    favIcon.className = 'material-icons-outlined';
    favIcon.textContent = 'star_border';
    favBtn.appendChild(favIcon);
    syncAyahFavoriteButton(favBtn, surahN, ayah.n);
    favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        ayahFavoritesApi.toggleFavorite(surahN, ayah.n);
        syncAyahFavoriteButton(favBtn, surahN, ayah.n);
    });
    head.appendChild(favBtn);
    block.appendChild(head);

    attachAyahPointerInteractions(block, surahN, ayah, readMode);
    block.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            void openAyahExpandView(surahN, ayah.n);
        }
    });

    if (ayah.bismillah) {
        const bism = document.createElement('p');
        bism.className = 'quran-ayah__bismillah arabic-text';
        bism.setAttribute('dir', 'rtl');
        bism.setAttribute('lang', 'ar');
        bism.textContent = ayah.bismillah;
        block.appendChild(bism);
    }

    const ar = document.createElement('p');
    ar.className = 'quran-ayah__ar arabic-text';
    ar.setAttribute('dir', 'rtl');
    ar.setAttribute('lang', 'ar');
    ar.textContent = ayah.ar || '';
    block.appendChild(ar);

    if (mode === 'meal-ar' && ayah.tr) {
        const trLine = document.createElement('p');
        trLine.className = 'quran-ayah__tr';
        trLine.textContent = ayah.tr;
        block.appendChild(trLine);
    }

    if (mode === 'translit-ar' && ayah.lat) {
        const latLine = document.createElement('p');
        latLine.className = 'quran-ayah__lat';
        latLine.textContent = ayah.lat;
        block.appendChild(latLine);
    }

    return block;
}

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';

function toArabicIndicNumber(n) {
    return String(n).replace(/\d/g, (d) => ARABIC_INDIC[Number(d)] || d);
}

function findAyahInSurah(surah, ayahN) {
    return (surah?.ayahs || []).find((row) => row.n === ayahN) || null;
}

function createMushafInlineAyah(ayah, surahN) {
    const span = document.createElement('span');
    span.className = 'quran-mushaf-inline-ayah';
    span.setAttribute('data-surah', String(surahN));
    span.setAttribute('data-ayah', String(ayah.n));

    const text = document.createElement('span');
    text.className = 'quran-mushaf-inline-ayah__text';
    text.textContent = ayah.ar || '';
    span.appendChild(text);

    const marker = document.createElement('span');
    marker.className = 'quran-mushaf-inline-ayah__marker';
    marker.setAttribute('aria-hidden', 'true');
    marker.textContent = ` ${toArabicIndicNumber(ayah.n)} `;
    span.appendChild(marker);

    return span;
}

function createMushafSubsAyah(ayah, surahN, readMode) {
    const mode = normalizeQuranReadMode(readMode);
    const row = document.createElement('div');
    row.className = 'quran-mushaf-subs-ayah';
    row.setAttribute('data-surah', String(surahN));
    row.setAttribute('data-ayah', String(ayah.n));

    const surahName =
        getSurahLocalizedName(surahMeta(surahN) || surahN, getLocale())
        || t('quran.surahFallback', { n: surahN });
    const ref = document.createElement('span');
    ref.className = 'quran-mushaf-subs-ayah__ref';
    ref.textContent = formatAyahCardRef(surahName, surahN, ayah.n);
    row.appendChild(ref);

    if (mode === 'meal-ar' && ayah.tr) {
        const meal = document.createElement('p');
        meal.className = 'quran-mushaf-subs-ayah__meal';
        meal.textContent = ayah.tr;
        row.appendChild(meal);
    }
    if (mode === 'translit-ar' && ayah.lat) {
        const lat = document.createElement('p');
        lat.className = 'quran-mushaf-subs-ayah__lat';
        lat.textContent = ayah.lat;
        row.appendChild(lat);
    }
    return row;
}

function getMushafPageParts() {
    const host = document.getElementById('quranMushafPageHost');
    if (!host) return null;
    const canvas = host.querySelector('.quran-mushaf-canvas');
    return {
        head: canvas?.querySelector('.quran-mushaf-page__head') || null,
        body: canvas?.querySelector('.quran-mushaf-page__body') || null,
        foot: canvas?.querySelector('.quran-mushaf-page__foot') || null,
        subs: host.querySelector('.quran-mushaf-page__subs')
    };
}

function formatMushafMetaLine(pageNum) {
    const page = Number(pageNum);
    if (!Number.isFinite(page)) return '';
    const locale = getLocale();
    const ayahs = listAyahsOnPage(page);
    const juz = ayahs.length ? getJuzForAyah(ayahs[0].s, ayahs[0].a) : 1;
    const juzPart = t('quran.mushafMetaJuz', { n: juz });
    const pagePart = t('quran.mushafMetaPage', { n: page });
    const surahPart = getPageSegments(page)
        .map((seg) => {
            const meta = surahMeta(seg.s);
            const name = getSurahLocalizedName(meta || seg.s, locale) || meta?.nameTr || '';
            return name ? `${seg.s} ${name}` : String(seg.s);
        })
        .join(t('quran.mushafMetaSurahSep'));
    return [juzPart, pagePart, surahPart].filter(Boolean).join(t('quran.mushafMetaSep'));
}

function syncMushafMetaBar(pageNum) {
    const el = document.getElementById('quranMushafMetaText');
    if (!el) return;
    el.textContent = formatMushafMetaLine(pageNum);
}

function setMushafChromeVisible(visible) {
    mushafChromeVisible = !!visible;
    const view = document.getElementById('quranSurahView');
    view?.classList.toggle('quran-mushaf-chrome--visible', mushafChromeVisible);
    document.documentElement.classList.toggle('quran-mushaf-chrome--visible', mushafChromeVisible);

    const rememberRow = document.getElementById('quranMushafRememberRow');
    if (rememberRow && getCurrentReaderLayout() === 'mushaf') {
        rememberRow.hidden = !mushafChromeVisible;
    }
    scheduleMushafCanvasFill();
}

function scheduleMushafCanvasFill() {
    requestAnimationFrame(() => {
        const pager = document.getElementById('quranMushafPager');
        if (!pager || pager.hidden) return;
        const canvas = pager.querySelector('.quran-mushaf-canvas');
        if (canvas && pager.clientHeight > 0) {
            canvas.style.minHeight = `${pager.clientHeight}px`;
        }
    });
}

function teardownMushafChromeWatch() {
    if (mushafResizeBound) {
        window.removeEventListener('resize', onMushafViewportResize);
        mushafResizeBound = false;
    }
    document.querySelector('.quran-mushaf-canvas')?.style.removeProperty('min-height');
}

function toggleMushafChrome() {
    setMushafChromeVisible(!mushafChromeVisible);
}

function bindMushafChromeControls() {
    if (mushafChromeBound) return;
    mushafChromeBound = true;

    const cb = document.getElementById('quranMushafRememberPage');
    if (cb) {
        cb.addEventListener('change', () => {
            mushafSettingsApi?.setRemember?.(cb.checked);
            if (cb.checked) {
                mushafSettingsApi?.onPageSaved?.(mushafCurrentPage);
            }
        });
    }

    if (!mushafResizeBound) {
        mushafResizeBound = true;
        window.addEventListener('resize', onMushafViewportResize, { passive: true });
    }
}

function ensureMushafPageSwipe() {
    if (mushafSwipeBound) return;
    const view = document.getElementById('quranSurahView');
    if (!view) return;
    mushafSwipeBound = true;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchScrollTopAtStart = 0;

    view.addEventListener(
        'touchstart',
        (e) => {
            if (getCurrentReaderLayout() !== 'mushaf' || e.touches.length !== 1) return;
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            const pager = document.getElementById('quranMushafPager');
            touchScrollTopAtStart = pager ? pager.scrollTop : 0;
        },
        { passive: true }
    );

    view.addEventListener(
        'touchend',
        (e) => {
            if (mushafNavigateLock || getCurrentReaderLayout() !== 'mushaf') return;
            const touch = e.changedTouches[0];
            if (!touch) return;

            const pager = document.getElementById('quranMushafPager');
            if (pager && Math.abs(pager.scrollTop - touchScrollTopAtStart) > MUSHAF_SCROLL_LOCK_PX) return;

            const dx = touch.clientX - touchStartX;
            const dy = touch.clientY - touchStartY;
            const moved = Math.hypot(dx, dy);

            if (moved <= MUSHAF_TAP_MAX_PX) {
                if (
                    !e.target.closest(
                        '.quran-mushaf-meta, .quran-mushaf-remember-row, .bottom-nav, button, a, input, select, label'
                    )
                ) {
                    toggleMushafChrome();
                }
                return;
            }

            if (Math.abs(dx) <= Math.abs(dy) * 1.12) return;

            if (dx >= EXPAND_SWIPE_COMMIT_PX && mushafCurrentPage < MUSHAF_PAGE_COUNT) {
                void navigateMushafPage(1);
            } else if (dx <= -EXPAND_SWIPE_COMMIT_PX && mushafCurrentPage > 1) {
                void navigateMushafPage(-1);
            }
        },
        { passive: true }
    );
}

function syncMushafRememberCheckbox() {
    const cb = document.getElementById('quranMushafRememberPage');
    if (!cb || !mushafSettingsApi?.getRemember) return;
    cb.checked = !!mushafSettingsApi.getRemember();
}

async function navigateMushafPage(delta) {
    if (mushafNavigateLock || (delta !== 1 && delta !== -1)) return;
    const next = mushafCurrentPage + delta;
    if (next < 1 || next > MUSHAF_PAGE_COUNT) return;

    mushafNavigateLock = true;
    const meal = getQuranReaderMealId();
    const pager = document.getElementById('quranMushafPager');
    const mode = pager?.dataset.readMode ?? DEFAULT_QURAN_READ_MODE;
    try {
        await showMushafPage(next, meal, mode, renderGeneration);
    } finally {
        mushafNavigateLock = false;
    }
}

function resolveMushafStartPage(surahN, scrollAyah, { forceSurahStart = false, preferSaved = false } = {}) {
    if (scrollAyah != null && Number.isFinite(Number(scrollAyah))) {
        return getPageForAyah(surahN, Number(scrollAyah));
    }
    if (forceSurahStart) {
        return getPageForAyah(surahN, 1);
    }
    if (preferSaved) {
        const saved = Number(mushafSettingsApi?.getSavedPage?.());
        if (saved >= 1 && saved <= MUSHAF_PAGE_COUNT) return saved;
    }
    if (isQuranMushafDomActive() && mushafCurrentPage >= 1) {
        return mushafCurrentPage;
    }
    return getPageForAyah(surahN, 1);
}

function notifyMushafPageSaved(pageNum) {
    if (!mushafSettingsApi?.getRemember?.() || !mushafSettingsApi?.onPageSaved) return;
    if (!mushafSettingsApi.getRemember()) return;
    mushafSettingsApi.onPageSaved(pageNum);
}

function resetScrollReaderScroller() {
    const main = document.querySelector('#quranSurahView .main-content.scrollable');
    if (main) main.scrollTop = 0;
}

/** Mushaf katmanını kapat; ayet listesi görünümüne anında geç. */
function leaveMushafForScrollList() {
    closeAyahExpandView();
    suppressAyahExpandInteraction(500);
    hideMushafPager({ resetScroll: true });
    const list = document.getElementById('quranAyahList');
    if (list) list.hidden = false;
    const meta = document.getElementById('quranMushafMeta');
    if (meta) meta.hidden = true;
}

function hideMushafPager({ resetScroll = false } = {}) {
    const pager = document.getElementById('quranMushafPager');
    const view = document.getElementById('quranSurahView');
    if (pager) {
        pager.hidden = true;
        pager.setAttribute('aria-hidden', 'true');
        pager.removeAttribute('data-meal-id');
        pager.removeAttribute('data-read-mode');
        pager.removeAttribute('data-reader-layout');
    }
    const meta = document.getElementById('quranMushafMeta');
    if (meta) {
        meta.hidden = true;
        meta.setAttribute('aria-hidden', 'true');
    }
    const rememberRow = document.getElementById('quranMushafRememberRow');
    if (rememberRow) rememberRow.hidden = true;
    teardownMushafChromeWatch();
    view?.classList.remove('quran-surah-view--mushaf', 'quran-mushaf-chrome--visible');
    document.documentElement.classList.remove('quran-mushaf-chrome--visible');
    document.documentElement.classList.remove('quran-mushaf-immersive');
    mushafCurrentPage = 1;
    mushafNavigateLock = false;
    mushafChromeVisible = false;
    lazyScrollScroller = null;
    if (resetScroll) {
        resetScrollReaderScroller();
        const list = document.getElementById('quranAyahList');
        if (list) list.hidden = false;
    }
}

async function populateMushafPageContent(parts, pageNum, meal, readMode) {
    if (!parts?.head || !parts.body || !parts.subs) return;

    const page = Number(pageNum);
    if (!Number.isFinite(page) || page < 1 || page > MUSHAF_PAGE_COUNT) return;
    const mode = normalizeQuranReadMode(readMode);
    const locale = getLocale();
    const mealId = normalizeQuranMeal(meal, locale);
    const segments = getPageSegments(page);

    parts.head.replaceChildren();
    parts.body.replaceChildren();
    parts.subs.replaceChildren();
    if (parts.foot) parts.foot.textContent = toArabicIndicNumber(page);

    const firstSeg = segments[0];
    if (firstSeg) {
        const juzStart = getJuzAtStart(firstSeg.s, firstSeg.a1);
        if (juzStart && juzStart > 1) {
            parts.head.appendChild(createJuzDivider(juzStart));
        }
    }

    const surahNums = [...new Set(segments.map((seg) => seg.s))];
    const surahMap = new Map();
    await Promise.all(
        surahNums.map(async (surahN) => {
            surahMap.set(surahN, await getSurahContent(mealId, surahN, locale));
        })
    );

    const showSubs = mode !== 'ar-only';
    parts.subs.hidden = !showSubs;

    for (const seg of segments) {
        const surah = surahMap.get(seg.s);
        const meta = surahMeta(seg.s);
        if (!surah) continue;

        const surahBlock = document.createElement('div');
        surahBlock.className = 'quran-mushaf-surah-block';

        if (seg.a1 === 1 && meta) {
            surahBlock.appendChild(createMushafSurahHead(meta));
        }

        const subsBlock = showSubs ? document.createElement('div') : null;
        if (subsBlock) subsBlock.className = 'quran-mushaf-subs-block';

        for (let ayahN = seg.a1; ayahN <= seg.a2; ayahN += 1) {
            const ayah = findAyahInSurah(surah, ayahN);
            if (!ayah) continue;

            if (ayah.bismillah && ayahN === 1 && seg.s !== 1 && seg.s !== 9) {
                const bism = document.createElement('p');
                bism.className = 'quran-mushaf-page__bismillah arabic-text';
                bism.setAttribute('dir', 'rtl');
                bism.setAttribute('lang', 'ar');
                bism.textContent = ayah.bismillah;
                surahBlock.appendChild(bism);
            }

            surahBlock.appendChild(createMushafInlineAyah(ayah, seg.s));
            if (subsBlock) subsBlock.appendChild(createMushafSubsAyah(ayah, seg.s, mode));
        }

        parts.body.appendChild(surahBlock);
        if (subsBlock && subsBlock.childElementCount > 0) {
            parts.subs.appendChild(subsBlock);
        }
    }
}

async function prefetchMushafSurahsForPages(pages, meal, gen) {
    const locale = getLocale();
    const mealId = normalizeQuranMeal(meal, locale);
    const nums = [...new Set(pages.filter((p) => p >= 1 && p <= MUSHAF_PAGE_COUNT))];
    for (const page of nums) {
        if (gen !== renderGeneration) return;
        const surahNums = [...new Set(getPageSegments(page).map((seg) => seg.s))];
        await Promise.all(surahNums.map((n) => getSurahContent(mealId, n, locale)));
    }
}

async function showMushafPage(pageNum, meal, readMode, gen, { persist = true } = {}) {
    const p = Math.max(1, Math.min(MUSHAF_PAGE_COUNT, Number(pageNum)));
    mushafCurrentPage = p;

    const parts = getMushafPageParts();
    if (!parts?.head || !parts.body || !parts.subs) {
        console.error('Mushaf DOM hazır değil');
        return;
    }
    await populateMushafPageContent(parts, p, meal, readMode);
    if (gen !== renderGeneration) return;

    const scroller = getQuranReaderScroller();
    if (scroller) scroller.scrollTop = 0;

    scheduleMushafCanvasFill();
    syncMushafMetaBar(p);
    // Yalnızca gerçek sayfa çevirme "kaldığım sayfa"yı günceller. Arama/goto ile
    // bir ayete atlama (persist:false) kaydedilmiş sayfayı EZMEMELİDİR.
    if (persist) notifyMushafPageSaved(p);
    void prefetchMushafSurahsForPages([p - 1, p + 1, p - 2, p + 2], meal, gen);
}

function initMushafPager(mealId, readMode, readerLayout) {
    const pager = document.getElementById('quranMushafPager');
    const list = document.getElementById('quranAyahList');
    const locale = getLocale();
    const meal = normalizeQuranMeal(mealId, locale);
    const mode = normalizeQuranReadModeForLocale(readMode, locale);
    const layout = normalizeQuranReaderLayout(readerLayout);

    syncQuranReaderChrome(mode, layout);
    disconnectLazyObserver();

    if (list) {
        list.replaceChildren();
        list.hidden = true;
        list.removeAttribute('data-meal-id');
        list.removeAttribute('data-read-mode');
        list.removeAttribute('data-reader-layout');
    }

    if (pager) {
        pager.hidden = false;
        pager.removeAttribute('aria-hidden');
        pager.dataset.mealId = meal || '';
        pager.dataset.readMode = mode;
        pager.dataset.readerLayout = layout;
    }

    const meta = document.getElementById('quranMushafMeta');
    if (meta) {
        meta.hidden = false;
        meta.removeAttribute('aria-hidden');
    }

    document.documentElement.classList.add('quran-mushaf-immersive');
    setMushafChromeVisible(false);
    syncMushafRememberCheckbox();
    bindMushafChromeControls();
    ensureMushafPageSwipe();
    scheduleMushafCanvasFill();
}

// Köşe süslemeleri eskiden her köşeye ~7 node'luk bir SVG (SURAH_CORNER_SVG)
// basıyordu; sure başına 4 köşe × ~7 = ~28 fazladan DOM node. Artık süsleme
// CSS mask ile çizilir (--surah-corner-mask), böylece kabuk başına yalnızca 4
// boş span kalır ve ilk render belirgin biçimde hafifler.
function appendFrameCornerMotifs(frame, baseClass) {
    ['tl', 'tr', 'bl', 'br'].forEach((pos) => {
        const corner = document.createElement('span');
        corner.className = `${baseClass}__corner ${baseClass}__corner--${pos}`;
        corner.setAttribute('aria-hidden', 'true');
        frame.appendChild(corner);
    });
}

function appendSurahCornerMotifs(frame) {
    appendFrameCornerMotifs(frame, 'quran-surah-section');
}

function createMushafSurahOrnament() {
    const el = document.createElement('div');
    el.className = 'quran-mushaf-surah-frame__ornament';
    el.setAttribute('aria-hidden', 'true');
    const lineA = document.createElement('span');
    lineA.className = 'quran-mushaf-surah-frame__orn-line';
    const gem = document.createElement('span');
    gem.className = 'quran-mushaf-surah-frame__orn-gem';
    const lineB = document.createElement('span');
    lineB.className = 'quran-mushaf-surah-frame__orn-line';
    el.append(lineA, gem, lineB);
    return el;
}

function createMushafSurahHead(meta) {
    const surahHead = document.createElement('div');
    surahHead.className = 'quran-mushaf-page__surah-head';

    const frame = document.createElement('div');
    frame.className = 'quran-mushaf-surah-frame';
    appendFrameCornerMotifs(frame, 'quran-mushaf-surah-frame');

    const badge = document.createElement('span');
    badge.className = 'quran-mushaf-surah-frame__badge';
    badge.textContent = String(meta.n);

    const nameAr = document.createElement('span');
    nameAr.className = 'quran-mushaf-page__surah-name arabic-text';
    nameAr.setAttribute('dir', 'rtl');
    nameAr.setAttribute('lang', 'ar');
    nameAr.textContent = meta.nameAr || '';

    frame.appendChild(badge);
    frame.appendChild(createMushafSurahOrnament());
    frame.appendChild(nameAr);
    frame.appendChild(createMushafSurahOrnament());
    surahHead.appendChild(frame);
    return surahHead;
}

function createSurahSectionShell(meta) {
    const section = document.createElement('section');
    section.className = 'quran-surah-section';
    section.id = `quran-surah-${meta.n}`;
    section.setAttribute('data-surah', String(meta.n));

    const head = document.createElement('header');
    head.className = 'quran-surah-section__banner';

    const frame = document.createElement('div');
    frame.className = 'quran-surah-section__frame';
    appendSurahCornerMotifs(frame);

    const num = document.createElement('span');
    num.className = 'quran-surah-section__badge';
    num.textContent = String(meta.n);

    const nameAr = document.createElement('h2');
    nameAr.className = 'quran-surah-section__name-ar arabic-text';
    nameAr.setAttribute('dir', 'rtl');
    nameAr.setAttribute('lang', 'ar');
    nameAr.textContent = meta.nameAr || '';

    const localName = document.createElement('p');
    localName.className = 'quran-surah-section__name-tr';
    const localized = getSurahLocalizedName(meta, getLocale());
    localName.textContent = localized || '';

    const ayahMeta = document.createElement('p');
    ayahMeta.className = 'quran-surah-section__meta';
    ayahMeta.textContent = t('quran.ayahCount', { count: meta.ayahCount });

    frame.appendChild(num);
    frame.appendChild(nameAr);
    if (localized && localized !== (meta.nameAr || '')) frame.appendChild(localName);
    frame.appendChild(ayahMeta);
    head.appendChild(frame);

    const juzAtSurahStart = getJuzAtStart(meta.n, 1);
    if (juzAtSurahStart && juzAtSurahStart > 1) {
        section.appendChild(createJuzDivider(juzAtSurahStart));
    }
    section.appendChild(head);

    const ayahWrap = document.createElement('div');
    ayahWrap.className = 'quran-surah-section__ayahs quran-surah-section__ayahs--placeholder';
    ayahWrap.style.minHeight = `${estimateSurahMinHeight(meta.ayahCount)}px`;
    section.appendChild(ayahWrap);

    return section;
}

function populateSurahAyahs(section, surah, readMode) {
    const wrap = section.querySelector('.quran-surah-section__ayahs');
    if (!wrap) return;
    const mode = normalizeQuranReadMode(readMode);
    wrap.classList.remove('quran-surah-section__ayahs--placeholder');
    wrap.style.minHeight = '';
    wrap.replaceChildren();
    const frag = document.createDocumentFragment();
    (surah.ayahs || []).forEach((ayah) => {
        const juzDivider = getJuzDividerBeforeAyah(surah.n, ayah.n);
        if (juzDivider) frag.appendChild(createJuzDivider(juzDivider));
        frag.appendChild(createAyahElement(ayah, surah.n, mode));
    });
    wrap.appendChild(frag);
    section.dataset.loaded = '1';
}

function unloadSurahSection(section) {
    if (section.dataset.loading === '1') return;
    if (section.dataset.loaded !== '1') return;
    const n = Number(section.dataset.surah);
    const meta = surahMeta(n);
    const wrap = section.querySelector('.quran-surah-section__ayahs');
    if (!wrap) return;
    wrap.replaceChildren();
    wrap.classList.add('quran-surah-section__ayahs--placeholder');
    wrap.style.minHeight = `${estimateSurahMinHeight(meta?.ayahCount)}px`;
    delete section.dataset.loaded;
}

async function loadSurahSectionIfNeeded(section, meal, readMode, gen) {
    if (!section || section.dataset.loaded === '1' || section.dataset.loading === '1') return;
    const n = Number(section.dataset.surah);
    if (!Number.isFinite(n)) return;

    section.dataset.loading = '1';
    try {
        const surah = await getSurahContent(meal, n);
        if (gen !== renderGeneration) return;
        populateSurahAyahs(section, surah, readMode);
    } catch (err) {
        console.error(`Sure ${n} yüklenemedi:`, err);
    } finally {
        delete section.dataset.loading;
    }
}

function setupLazyObserver(meal, readMode, readerLayout = DEFAULT_QURAN_READER_LAYOUT) {
    if (lazyObserver) lazyObserver.disconnect();
    const layout = normalizeQuranReaderLayout(readerLayout);
    if (layout === 'mushaf') {
        lazyLoadMeal = normalizeQuranMeal(meal, getLocale());
        lazyLoadMode = normalizeQuranReadMode(readMode);
        lazyLoadLayout = layout;
        return;
    }
    const scroller = getQuranReaderScroller();
    const list = document.getElementById('quranAyahList');
    if (!scroller || !list) return;

    lazyLoadMeal = normalizeQuranMeal(meal, getLocale());
    lazyLoadMode = normalizeQuranReadMode(readMode);
    lazyLoadLayout = layout;
    bindLazyScrollLoader();

    lazyObserver = new IntersectionObserver(
        (entries) => {
            const rootRect = scroller.getBoundingClientRect();
            const unloadDistance = rootRect.height * LAZY_UNLOAD_VIEWPORTS;
            let sawIntersecting = false;

            entries.forEach((entry) => {
                const section = entry.target;
                if (entry.isIntersecting) {
                    sawIntersecting = true;
                    void loadSurahSectionIfNeeded(
                        section,
                        lazyLoadMeal,
                        lazyLoadMode,
                        renderGeneration
                    );
                    return;
                }

                const rect = section.getBoundingClientRect();
                const gap = Math.max(rootRect.top - rect.bottom, rect.top - rootRect.bottom, 0);
                if (gap > unloadDistance && !isReaderDrawerOpen()) {
                    unloadSurahSection(section);
                }
            });

            if (sawIntersecting) scheduleVisibleSurahLoad();
        },
        { root: scroller, rootMargin: LAZY_ROOT_MARGIN, threshold: 0 }
    );

    list.querySelectorAll('.quran-surah-section').forEach((section) => {
        lazyObserver.observe(section);
    });
    scheduleVisibleSurahLoad();
}

function renderMushafShells(mealId, readMode, readerLayout = 'scroll') {
    if (normalizeQuranReaderLayout(readerLayout) === 'mushaf') {
        initMushafPager(mealId, readMode, readerLayout);
        return;
    }
    hideMushafPager({ resetScroll: true });
    const list = document.getElementById('quranAyahList');
    if (!list) return;
    const locale = getLocale();
    const meal = normalizeQuranMeal(mealId, locale);
    const mode = normalizeQuranReadModeForLocale(readMode, locale);
    const layout = normalizeQuranReaderLayout(readerLayout);

    syncQuranReaderChrome(mode, layout);
    disconnectLazyObserver();
    list.replaceChildren();
    const frag = document.createDocumentFragment();
    (surahIndex || []).forEach((meta) => frag.appendChild(createSurahSectionShell(meta)));
    list.appendChild(frag);
    list.dataset.mealId = meal || '';
    list.dataset.readMode = mode;
    list.dataset.readerLayout = layout;
    list.hidden = false;
}

async function prefetchReaderSections(meal, readMode, readerLayout, surahN, scrollAyah, gen) {
    const layout = normalizeQuranReaderLayout(readerLayout);
    if (layout === 'mushaf') {
        const ayah = Number.isFinite(Number(scrollAyah)) ? Number(scrollAyah) : 1;
        const page = getPageForAyah(surahN, ayah);
        await prefetchMushafSurahsForPages(
            [page, page - 1, page + 1, page - 2, page + 2],
            meal,
            gen
        );
        return;
    }
    const list = document.getElementById('quranAyahList');
    if (!list) return;
    const nums = [...new Set([surahN, surahN - 1, surahN + 1, surahN - 2, surahN + 2].filter((n) => n >= 1 && n <= 114))];
    await Promise.all(
        nums.map(async (n) => {
            const section = list.querySelector(`.quran-surah-section[data-surah="${n}"]`);
            if (section) await loadSurahSectionIfNeeded(section, meal, readMode, gen);
        })
    );
}

async function prefetchSurahs(meal, readMode, surahNums, gen) {
    const list = document.getElementById('quranAyahList');
    if (!list) return;
    const nums = [...new Set(surahNums.filter((n) => n >= 1 && n <= 114))];
    await Promise.all(
        nums.map(async (n) => {
            const section = list.querySelector(`.quran-surah-section[data-surah="${n}"]`);
            if (section) await loadSurahSectionIfNeeded(section, meal, readMode, gen);
        })
    );
}

function refreshLoadedSections(readMode, readerLayout = DEFAULT_QURAN_READER_LAYOUT) {
    guardQuranReaderSettingsChange();
    const list = document.getElementById('quranAyahList');
    const pager = document.getElementById('quranMushafPager');
    const mode = normalizeQuranReadMode(readMode);
    const layout = normalizeQuranReaderLayout(readerLayout);
    const scroller = layout !== 'mushaf' ? getQuranReaderScroller() : null;
    const savedScrollTop = scroller ? scroller.scrollTop : null;
    const meal = normalizeQuranMeal(
        (layout === 'mushaf' ? pager?.dataset.mealId : list?.dataset.mealId) ?? '',
        getLocale()
    );
    if (list) {
        list.dataset.readMode = mode;
        list.dataset.readerLayout = layout;
    }
    if (pager && layout === 'mushaf') {
        pager.dataset.readMode = mode;
        pager.dataset.readerLayout = layout;
    }
    syncQuranReaderChrome(mode, layout);

    if (layout === 'mushaf') {
        void showMushafPage(mushafCurrentPage, meal, mode, renderGeneration);
        return;
    }

    if (isQuranMushafDomActive()) hideMushafPager();

    if (!list) return;
    list.querySelectorAll('.quran-surah-section[data-loaded="1"]').forEach((section) => {
        const n = Number(section.dataset.surah);
        const surah = surahContentCache.get(surahCacheKey(meal, n, getLocale()));
        if (surah) populateSurahAyahs(section, surah, mode);
    });
    restoreQuranReaderScrollTop(scroller, savedScrollTop);
}

async function scrollToMushafPage(pageNum, mealId, readMode, gen, { persist = false } = {}) {
    const pager = document.getElementById('quranMushafPager');
    if (!pager || pager.hidden) return;
    const meal = mealId ?? getQuranReaderMealId();
    const mode = readMode ?? pager.dataset.readMode ?? DEFAULT_QURAN_READ_MODE;
    await showMushafPage(pageNum, meal, mode, gen ?? renderGeneration, { persist });
}

async function scrollToSurahSection(surahN, readerLayout = DEFAULT_QURAN_READER_LAYOUT, mealId, readMode, gen) {
    const n = Number(surahN);
    if (!Number.isFinite(n)) return;
    if (normalizeQuranReaderLayout(readerLayout) === 'mushaf') {
        await scrollToMushafPage(getPageForAyah(n, 1), mealId, readMode, gen);
        return;
    }
    const anchor = document.getElementById(`quran-surah-${n}`);
    const scroller = getQuranReaderScroller();
    if (!anchor || !scroller) return;

    const delta = anchor.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
    scroller.scrollTop += delta - 8;
}

function scrollToAyahElement(surahN, ayahN) {
    const s = Number(surahN);
    const a = Number(ayahN);
    if (!Number.isFinite(s) || !Number.isFinite(a)) return false;
    const layout = getCurrentReaderLayout();
    const selector =
        layout === 'mushaf'
            ? `.quran-mushaf-inline-ayah[data-surah="${s}"][data-ayah="${a}"]`
            : `.quran-ayah[data-surah="${s}"][data-ayah="${a}"]`;
    const el = document.querySelector(selector);
    const scroller = getQuranReaderScroller();
    if (!el || !scroller) return false;
    const delta = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
    scroller.scrollTop += delta - 72;
    el.classList.add(layout === 'mushaf' ? 'quran-mushaf-inline-ayah--highlight' : 'quran-ayah--highlight');
    window.setTimeout(
        () => el.classList.remove(layout === 'mushaf' ? 'quran-mushaf-inline-ayah--highlight' : 'quran-ayah--highlight'),
        1400
    );
    return true;
}

async function scrollToAyah(surahN, ayahN, mealId, readMode, gen, readerLayout = DEFAULT_QURAN_READER_LAYOUT) {
    const locale = getLocale();
    const meal = normalizeQuranMeal(mealId, locale);
    const mode = normalizeQuranReadModeForLocale(readMode, locale);
    const layout = normalizeQuranReaderLayout(readerLayout);
    await prefetchReaderSections(meal, mode, layout, surahN, ayahN, gen);
    if (gen !== renderGeneration) return;
    if (layout === 'mushaf') {
        await scrollToMushafPage(getPageForAyah(surahN, ayahN), meal, mode, gen);
    } else {
        await scrollToSurahSection(surahN, layout, meal, mode, gen);
        if (Number(ayahN) <= 1) return;
    }
    for (let i = 0; i < 8; i += 1) {
        if (scrollToAyahElement(surahN, ayahN)) return;
        await new Promise((r) => requestAnimationFrame(r));
    }
}

function syncReaderTitle() {
    const title = document.getElementById('quranSurahTitle');
    if (title) title.textContent = t('quran.title');
}

function setQuranReaderHelpPanelOpen(open) {
    const panel = document.getElementById('quranReaderHelpPanel');
    const toggle = document.getElementById('quranReaderHelpToggle');
    if (!panel || !toggle) return;
    const isOpen = !!open;
    panel.hidden = !isOpen;
    toggle.classList.toggle('quran-reader-drawer__help-toggle--open', isOpen);
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

function setQuranReaderDrawerOpen(open) {
    const drawer = document.getElementById('quranReaderDrawer');
    const menuBtn = document.getElementById('quranReaderMenuBtn');
    if (!drawer) return;
    const isOpen = !!open;
    const scrollSnapshot = captureReaderScrollSnapshot();
    if (isOpen) {
        // Soguk-gecisi onle: once paneli gorunur kil (prep) ve baslangic konumunu
        // reflow ile commit et; sonraki frame'de --open ekleyince transition akar.
        drawer.classList.add('quran-reader-drawer--prep');
        void drawer.offsetWidth; // baslangic transform'unu (translateX(100%)) zorla
        requestAnimationFrame(() => {
            // Bu frame'e gelene kadar kapatildiysa acma.
            if (drawer.getAttribute('aria-hidden') === 'false') {
                drawer.classList.add('quran-reader-drawer--open');
            }
        });
    } else {
        drawer.classList.remove('quran-reader-drawer--open');
        // Kapanis animasyonu bitince prep'i (visibility) kaldir; boylece kapali
        // panel focus/screen-reader'a yakalanmaz. Hala kapaliysa uygula.
        const panel = document.getElementById('quranReaderDrawerPanel');
        const cleanup = () => {
            if (drawer.getAttribute('aria-hidden') === 'true') {
                drawer.classList.remove('quran-reader-drawer--prep');
            }
        };
        if (panel) {
            const onEnd = (e) => {
                if (e.target !== panel || e.propertyName !== 'transform') return;
                panel.removeEventListener('transitionend', onEnd);
                cleanup();
            };
            panel.addEventListener('transitionend', onEnd);
            setTimeout(cleanup, 400); // transitionend gelmezse guvenlik agi
        } else {
            cleanup();
        }
    }
    drawer.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    document.documentElement.classList.toggle('quran-drawer-open', isOpen);
    if (!isOpen) {
        setQuranReaderHelpPanelOpen(false);
        const panel = document.getElementById('quranReaderDrawerPanel');
        const active = document.activeElement;
        if (active && panel?.contains(active) && typeof active.blur === 'function') {
            active.blur();
        }
        document.dispatchEvent(new CustomEvent('quran-reader-drawer-close'));
    }
    scheduleReaderScrollRestoreAfterLayout(scrollSnapshot);
}

function setQuranGotoError(message) {
    const el = document.getElementById('quranGotoError');
    if (!el) return;
    if (message) {
        el.textContent = message;
        el.hidden = false;
    } else {
        el.textContent = '';
        el.hidden = true;
    }
}

function resolveSurahFromGotoInput(raw) {
    const q = String(raw || '').trim();
    if (!q) return { ok: false, message: t('quran.gotoInvalidSurah') };

    const compactQ = q.replace(/\s+/g, '');
    const nameArExact = (surahIndex || []).find((s) => {
        const nameAr = s.nameAr || '';
        return nameAr === q || nameAr.replace(/\s+/g, '') === compactQ;
    });
    if (nameArExact) return { ok: true, surah: nameArExact.n };

    const resolved = resolveSurahNameQuery(q, surahIndex, getLocale());
    if (resolved?.surah) return { ok: true, surah: resolved.surah.n };
    if (resolved?.ambiguous) {
        return { ok: false, message: t('quran.gotoAmbiguousSurah') };
    }

    const matches = (surahIndex || []).filter((s) => surahMatchesSearch(s, q));
    if (matches.length === 1) return { ok: true, surah: matches[0].n };
    if (matches.length > 1) return { ok: false, message: t('quran.gotoAmbiguousSurah') };
    return { ok: false, message: t('quran.gotoInvalidSurah') };
}

function parseAyahGotoInput(surahRaw, ayahRaw) {
    const surahResult = resolveSurahFromGotoInput(surahRaw);
    if (!surahResult.ok) return surahResult;

    const surahN = surahResult.surah;
    const meta = surahMeta(surahN);
    if (!meta) return { ok: false, message: t('quran.gotoInvalidSurah') };

    const ayahText = String(ayahRaw || '').trim();
    const ayahN = ayahText === '' ? 1 : Number(ayahText);
    if (!Number.isFinite(ayahN) || ayahN < 1 || ayahN > meta.ayahCount) {
        return {
            ok: false,
            message: t('quran.gotoInvalidAyah', { max: meta.ayahCount })
        };
    }
    return { ok: true, surah: surahN, ayah: ayahN };
}

function submitQuranAyahGoto() {
    const surahInput = document.getElementById('quranGotoSurahInput');
    const ayahInput = document.getElementById('quranGotoAyahInput');
    if (!surahInput || !ayahInput) return;

    const result = parseAyahGotoInput(surahInput.value, ayahInput.value);
    if (!result.ok) {
        setQuranGotoError(result.message);
        return;
    }

    setQuranGotoError('');
    setQuranReaderDrawerOpen(false);
    // Panel kapanışı okuma konumunu geri yüklemeye çalışır; ama burada kullanıcı
    // kasıtlı olarak başka bir sure/ayete gidiyor — bekleyen geri yüklemeyi iptal et,
    // yoksa navigasyon ~100ms sonra eski konuma ezilir.
    cancelReaderScrollRestore();
    if (navigateToSurah) navigateToSurah(result.surah, result.ayah);
}

export async function renderQuranSurahDetail(
    surahN,
    mealId,
    readMode,
    scrollAyah,
    readerLayout = DEFAULT_QURAN_READER_LAYOUT,
    mushafNav = {}
) {
    const n = Number(surahN);
    if (!Number.isFinite(n) || n < 1 || n > 114) return;

    const locale = getLocale();
    const meal = normalizeQuranMeal(mealId, locale);
    const mode = normalizeQuranReadModeForLocale(readMode, locale);
    const layout = normalizeQuranReaderLayout(readerLayout);
    const wasMushafAtStart = isQuranMushafDomActive();
    const leavingMushaf = !!mushafNav.leavingMushaf;
    const targetIsMushaf = layout === 'mushaf';
    const forceShell = wasMushafAtStart !== targetIsMushaf || leavingMushaf;
    const savedReaderScrollTop =
        !targetIsMushaf && !leavingMushaf ? getQuranReaderScroller()?.scrollTop ?? null : null;
    const gen = ++renderGeneration;
    syncMealSelect(meal, locale);
    syncReaderTitle();

    if (!targetIsMushaf && (wasMushafAtStart || leavingMushaf)) {
        leaveMushafForScrollList();
        renderMushafShells(meal, mode, 'scroll');
        setupLazyObserver(meal, mode, 'scroll');
        setSurahLoading(false);
        try {
            await prefetchReaderSections(meal, mode, 'scroll', n, scrollAyah, gen);
            if (gen !== renderGeneration) return;
            requestAnimationFrame(() => {
                if (gen !== renderGeneration) return;
                void (async () => {
                    resetScrollReaderScroller();
                    if (scrollAyah != null && Number(scrollAyah) > 1) {
                        await scrollToAyah(n, Number(scrollAyah), meal, mode, gen, 'scroll');
                    } else {
                        await scrollToSurahSection(n, 'scroll', meal, mode, gen);
                    }
                    scheduleVisibleSurahLoad();
                })();
            });
        } catch (err) {
            console.error('Kur\'an ayet listesine geçilemedi:', err);
            setSurahLoading(false);
        }
        return;
    }

    const prevLayout = wasMushafAtStart ? 'mushaf' : 'scroll';
    const layoutChanged = prevLayout !== layout;

    const list = document.getElementById('quranAyahList');
    const pager = document.getElementById('quranMushafPager');
    const isMushaf = layout === 'mushaf';
    const store = isMushaf ? pager : list;
    const hasShells = isMushaf ? !!(store && !store.hidden) : !!(list && list.childElementCount > 0);
    const sameMeal = hasShells && (store?.dataset.mealId || '') === (meal || '');
    const sameMode = sameMeal && store?.dataset.readMode === mode;
    const sameLayout = sameMeal && store?.dataset.readerLayout === layout;

    const mushafOpts = {
        forceSurahStart: !!mushafNav.forceSurahStart,
        preferSaved: !!mushafNav.preferSaved
    };

    const finishScroll = async () => {
        if (scrollAyah != null && Number.isFinite(Number(scrollAyah))) {
            await scrollToAyah(n, Number(scrollAyah), meal, mode, gen, layout);
        } else if (isMushaf) {
            await scrollToMushafPage(
                resolveMushafStartPage(n, scrollAyah, mushafOpts),
                meal,
                mode,
                gen
            );
        } else if (savedReaderScrollTop != null && savedReaderScrollTop > 0) {
            restoreQuranReaderScrollTop(getQuranReaderScroller(), savedReaderScrollTop);
        } else {
            await scrollToSurahSection(n, layout, meal, mode, gen);
        }
    };

    if (!forceShell && !layoutChanged && sameMeal && sameMode && sameLayout) {
        if (isMushaf) {
            if (list) list.hidden = true;
            if (pager) pager.hidden = false;
        } else {
            hideMushafPager();
            if (list) list.hidden = false;
        }
        syncQuranReaderChrome(mode, layout);
        setSurahLoading(false);
        setupLazyObserver(meal, mode, layout);
        await prefetchReaderSections(meal, mode, layout, n, scrollAyah, gen);
        if (gen !== renderGeneration) return;
        requestAnimationFrame(() => {
            if (gen !== renderGeneration) return;
            void finishScroll();
            if (!isMushaf) scheduleVisibleSurahLoad();
        });
        return;
    }

    if (!forceShell && !layoutChanged && sameMeal && sameLayout && !sameMode) {
        refreshLoadedSections(mode, layout);
        setSurahLoading(false);
        setupLazyObserver(meal, mode, layout);
        await prefetchReaderSections(meal, mode, layout, n, scrollAyah, gen);
        if (gen !== renderGeneration) return;
        const shouldRestoreScroll =
            !isMushaf && (scrollAyah == null || !Number.isFinite(Number(scrollAyah)));
        if (shouldRestoreScroll) {
            scheduleVisibleSurahLoad();
            return;
        }
        requestAnimationFrame(() => {
            if (gen !== renderGeneration) return;
            void finishScroll();
            if (!isMushaf) scheduleVisibleSurahLoad();
        });
        return;
    }

    setSurahLoading(true);
    try {
        if (forceShell && !isMushaf) {
            hideMushafPager({ resetScroll: true });
        }
        renderMushafShells(meal, mode, layout);
        if (!isMushaf && list) list.hidden = false;
        setupLazyObserver(meal, mode, layout);
        await prefetchReaderSections(meal, mode, layout, n, scrollAyah, gen);
        if (gen !== renderGeneration) return;
        requestAnimationFrame(() => {
            if (gen !== renderGeneration) return;
            void finishScroll();
            if (!isMushaf) scheduleVisibleSurahLoad();
            setSurahLoading(false);
        });
    } catch (err) {
        console.error('Kur\'an yüklenemedi:', err);
        if (gen !== renderGeneration) return;
        disconnectLazyObserver();
        hideMushafPager();
        if (list) {
            list.hidden = false;
            list.replaceChildren();
            list.removeAttribute('data-meal-id');
            list.removeAttribute('data-read-mode');
            list.removeAttribute('data-reader-layout');
            const errEl = document.createElement('p');
            errEl.className = 'quran-surah-empty';
            errEl.textContent = t('quran.loadError');
            list.appendChild(errEl);
        }
        setSurahLoading(false);
    }
}

export function renderQuranSurahList() {
    const list = document.getElementById('quranSurahList');
    if (!list) return;

    ensureAyahTextSearchIndexLoaded();

    const q = (quranSearchQuery || '').trim();
    const suggestionHits = q ? getQuranSearchSuggestionHits(q) : [];
    renderQuranSearchSuggestions(q);

    list.innerHTML = '';
    const filtered = (surahIndex || []).filter((s) => surahMatchesSearch(s, q));

    if (!filtered.length) {
        if (!suggestionHits.length) {
            const empty = document.createElement('p');
            empty.className = 'quran-surah-empty';
            empty.textContent = t('quran.emptySearch');
            list.appendChild(empty);
        }
        return;
    }

    filtered.forEach((s) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'quran-surah-card';

        const num = document.createElement('span');
        num.className = 'quran-surah-card__num';
        num.textContent = String(s.n);

        const body = document.createElement('span');
        body.className = 'quran-surah-card__body';

        const locale = getLocale();
        const localizedName = getSurahLocalizedName(s, locale);
        const namePrimary = document.createElement('span');
        namePrimary.className = 'quran-surah-card__name';
        namePrimary.textContent = localizedName || '';

        const nameAr = document.createElement('span');
        nameAr.className = 'quran-surah-card__name-ar arabic-text';
        nameAr.setAttribute('dir', 'rtl');
        nameAr.setAttribute('lang', 'ar');
        const showArabicSub =
            normalizeAppLocale(locale) !== 'ar' && s.nameAr && s.nameAr !== localizedName;
        nameAr.textContent = showArabicSub ? s.nameAr : '';

        const meta = document.createElement('span');
        meta.className = 'quran-surah-card__meta';
        meta.textContent = t('quran.ayahCount', { count: s.ayahCount });

        body.appendChild(namePrimary);
        if (showArabicSub) body.appendChild(nameAr);
        body.appendChild(meta);

        card.appendChild(num);
        card.appendChild(body);
        card.addEventListener('click', () => {
            if (navigateToSurah) navigateToSurah(s.n);
        });
        list.appendChild(card);
    });
}

function openQuranSearchGuide() {
    const overlay = document.getElementById('quranSearchGuideOverlay');
    if (overlay) overlay.classList.add('active');
}

export function bindQuranSearchGuide() {
    const btn = document.getElementById('quranSearchGuideBtn');
    if (!btn || btn.dataset.quranBound === '1') return;
    btn.dataset.quranBound = '1';
    btn.addEventListener('click', openQuranSearchGuide);
}

export function bindQuranSearchInput() {
    const input = document.getElementById('quranSearchInput');
    if (!input || input.dataset.quranBound === '1') return;
    input.dataset.quranBound = '1';
    ensureAyahTextSearchIndexLoaded();
    // Metin araması her tuşta tüm meal indeksini tarıyor (tr'de ~12.5k satır);
    // gecikmesiz çağrı yazarken klavyeyi kasıyordu. Yazma durunca bir kez çalıştır.
    let searchRenderTimer = null;
    input.addEventListener('input', () => {
        quranSearchQuery = input.value || '';
        if (searchRenderTimer) clearTimeout(searchRenderTimer);
        searchRenderTimer = setTimeout(() => {
            searchRenderTimer = null;
            renderQuranSurahList();
        }, 160);
    });
    input.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        const hits = getQuranSearchSuggestionHits(quranSearchQuery);
        if (hits.length !== 1 || !navigateToSurah) return;
        e.preventDefault();
        if (hits[0].readModeId && onReadModeChange) onReadModeChange(hits[0].readModeId);
        navigateToSurah(hits[0].surah, hits[0].ayah, hits[0].mealId);
        clearQuranSearch();
        renderQuranSurahList();
    });
}

export function bindQuranMealSelect() {
    const select = document.getElementById('quranMealSelect');
    if (!select || select.dataset.quranBound === '1') return;
    select.dataset.quranBound = '1';
    select.addEventListener('change', () => {
        const mealId = normalizeQuranMeal(select.value, getLocale());
        if (onMealChange) onMealChange(mealId);
    });
}

export function closeQuranReaderDrawer() {
    setQuranReaderDrawerOpen(false);
}

function syncQuranViewTabsUI() {
    document.querySelectorAll('#quranViewTabs .tab-btn').forEach((btn) => {
        const tab = btn.getAttribute('data-quran-tab');
        btn.classList.toggle('active', tab === quranViewTab);
    });
    const surahsPanel = document.getElementById('quranSurahsPanel');
    const favPanel = document.getElementById('quranFavoritesPanel');
    if (surahsPanel) surahsPanel.hidden = quranViewTab !== 'surahs';
    if (favPanel) favPanel.hidden = quranViewTab !== 'favorites';
}

export function setQuranViewTab(tab) {
    quranViewTab = tab === 'favorites' ? 'favorites' : 'surahs';
    syncQuranViewTabsUI();
}

export async function renderQuranFavoritesList(mealId, favorites) {
    const list = document.getElementById('quranFavoritesList');
    const loading = document.getElementById('quranFavoritesLoading');
    if (!list) return;

    const items = Array.isArray(favorites) ? favorites : [];
    list.replaceChildren();

    if (!items.length) {
        const empty = document.createElement('p');
        empty.className = 'quran-surah-empty';
        empty.textContent = t('quran.favoritesEmpty');
        list.appendChild(empty);
        return;
    }

    if (loading) loading.hidden = false;
    const locale = getLocale();
    const meal = normalizeQuranMeal(mealId, locale);

    try {
        for (const fav of items) {
            const s = Number(fav.s);
            const a = Number(fav.a);
            if (!Number.isFinite(s) || !Number.isFinite(a)) continue;
            const meta = surahMeta(s);
            let arText = '';
            let trText = '';
            try {
                const surah = await getSurahContent(meal, s);
                const ayah = (surah.ayahs || []).find((x) => x.n === a);
                arText = ayah?.ar || '';
                trText = ayah?.tr || '';
            } catch {
                /* preview optional */
            }

            const card = document.createElement('button');
            card.type = 'button';
            card.className = 'quran-favorite-card';

            const head = document.createElement('span');
            head.className = 'quran-favorite-card__head';
            const ref = document.createElement('span');
            ref.className = 'quran-favorite-card__ref';
            ref.textContent = formatAyahCardRef(
                getSurahLocalizedName(meta || s, getLocale()) || t('quran.surahFallback', { n: s }),
                s,
                a
            );
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'quran-favorite-card__remove icon-btn';
            removeBtn.setAttribute('aria-label', t('quran.removeFavorite'));
            const removeIcon = document.createElement('span');
            removeIcon.className = 'material-icons-outlined';
            removeIcon.textContent = 'close';
            removeBtn.appendChild(removeIcon);
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                ayahFavoritesApi.toggleFavorite(s, a);
            });
            head.appendChild(ref);
            head.appendChild(removeBtn);

            const ar = document.createElement('span');
            ar.className = 'quran-favorite-card__ar arabic-text';
            ar.setAttribute('dir', 'rtl');
            ar.setAttribute('lang', 'ar');
            ar.textContent = arText || '…';

            card.appendChild(head);
            card.appendChild(ar);
            if (trText) {
                const trLine = document.createElement('span');
                trLine.className = 'quran-favorite-card__tr';
                trLine.textContent = trText.length > 120 ? `${trText.slice(0, 117)}…` : trText;
                card.appendChild(trLine);
            }

            card.addEventListener('click', () => {
                if (navigateToSurah) navigateToSurah(s, a);
            });
            list.appendChild(card);
        }
    } finally {
        if (loading) loading.hidden = true;
    }
}

export function bindQuranViewTabs(onTabChange) {
    const tabs = document.getElementById('quranViewTabs');
    if (!tabs || tabs.dataset.quranBound === '1') return;
    tabs.dataset.quranBound = '1';
    tabs.querySelectorAll('.tab-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-quran-tab') === 'favorites' ? 'favorites' : 'surahs';
            if (tab === quranViewTab) return;
            setQuranViewTab(tab);
            if (onTabChange) onTabChange(tab);
        });
    });
    syncQuranViewTabsUI();
}

export { bindQuranTafsirBridgeOverlay } from './tafsir-bridge.js';

function attachExpandCardSwipe(card) {
    let activePointer = null;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    /** @type {'h' | 'v' | null} */
    let axisLock = null;

    function endSwipeGesture(releasePointer) {
        if (activePointer == null) return;
        if (releasePointer && card.hasPointerCapture(activePointer)) {
            try {
                card.releasePointerCapture(activePointer);
            } catch {
                // ignore
            }
        }
        activePointer = null;
        axisLock = null;
    }

    function resetSwipeTransform(animate) {
        card.style.transition = animate ? '' : 'none';
        card.style.transform = '';
        if (!animate) {
            requestAnimationFrame(() => {
                card.style.transition = '';
            });
        }
    }

    card.addEventListener('pointerdown', (e) => {
        if (expandNavigateLock) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        cancelExpandSwipeCommit();
        activePointer = e.pointerId;
        startX = lastX = e.clientX;
        startY = e.clientY;
        axisLock = null;
        card.style.transition = 'none';
        card.style.transform = '';
        try {
            card.setPointerCapture(e.pointerId);
        } catch {
            // ignore
        }
    });

    card.addEventListener(
        'pointermove',
        (e) => {
            if (e.pointerId !== activePointer || !expandViewState) return;

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            if (!axisLock) {
                if (Math.abs(dx) < EXPAND_SWIPE_LOCK_PX && Math.abs(dy) < EXPAND_SWIPE_LOCK_PX) return;
                if (Math.abs(dx) > Math.abs(dy) * 1.12) axisLock = 'h';
                else {
                    axisLock = 'v';
                    endSwipeGesture(true);
                    resetSwipeTransform(false);
                    return;
                }
            }

            if (axisLock !== 'h') return;
            e.preventDefault();

            lastX = e.clientX;
            let tx = dx;
            const canPrev = !!adjacentAyahRef(expandViewState.surah, expandViewState.ayah, -1);
            const canNext = !!adjacentAyahRef(expandViewState.surah, expandViewState.ayah, 1);
            if (tx > 0 && !canNext) tx *= 0.3;
            if (tx < 0 && !canPrev) tx *= 0.3;
            card.style.transform = `translateX(${tx}px)`;
        },
        { passive: false }
    );

    function onSwipePointerEnd(e) {
        if (e.pointerId !== activePointer) return;

        const dx = lastX - startX;
        const wasHorizontal = axisLock === 'h';
        endSwipeGesture(true);

        if (!wasHorizontal || !expandViewState) {
            resetSwipeTransform(true);
            return;
        }

        const canPrev = !!adjacentAyahRef(expandViewState.surah, expandViewState.ayah, -1);
        const canNext = !!adjacentAyahRef(expandViewState.surah, expandViewState.ayah, 1);
        const goNext = dx >= EXPAND_SWIPE_COMMIT_PX && canNext;
        const goPrev = dx <= -EXPAND_SWIPE_COMMIT_PX && canPrev;

        if (!goNext && !goPrev) {
            resetSwipeTransform(true);
            return;
        }

        scheduleExpandSwipeNavigate(goNext ? 1 : -1);
    }

    card.addEventListener('pointerup', onSwipePointerEnd);
    card.addEventListener('pointercancel', onSwipePointerEnd);
}

function attachReaderDrawerSwipe(panel, backdrop) {
    let activePointer = null;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    // Panel genişliği sürükleme boyunca değişmez; her pointermove'da offsetWidth
    // okumak forced reflow (layout thrashing) yaratıp paneli parmaktan geriletiyordu.
    // Sürükleme başında bir kez ölçüp burada saklıyoruz.
    let panelWidth = 0;
    /** @type {'h' | 'v' | null} */
    let axisLock = null;

    function isDrawerOpen() {
        const drawer = document.getElementById('quranReaderDrawer');
        return !!drawer?.classList.contains('quran-reader-drawer--open');
    }

    function endSwipeGesture(releasePointer) {
        if (activePointer == null) return;
        if (releasePointer && panel.hasPointerCapture(activePointer)) {
            try {
                panel.releasePointerCapture(activePointer);
            } catch {
                // ignore
            }
        }
        activePointer = null;
        axisLock = null;
    }

    function resetSwipeTransform(animate) {
        panel.style.transition = animate ? '' : 'none';
        panel.style.transform = animate ? '' : '';
        if (backdrop) {
            backdrop.style.transition = animate ? '' : 'none';
            backdrop.style.opacity = animate ? '' : '';
        }
        if (!animate) {
            requestAnimationFrame(() => {
                panel.style.transition = '';
                if (backdrop) backdrop.style.transition = '';
            });
        }
    }

    panel.addEventListener('pointerdown', (e) => {
        if (!isDrawerOpen()) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (e.target.closest('button, a, input, select, label, textarea, .quran-read-mode-option')) return;
        activePointer = e.pointerId;
        startX = lastX = e.clientX;
        startY = e.clientY;
        axisLock = null;
        panelWidth = panel.offsetWidth || 1; // bir kez ölç; pointermove'da yeniden okuma
        panel.style.transition = 'none';
        if (backdrop) backdrop.style.transition = 'none';
        try {
            panel.setPointerCapture(e.pointerId);
        } catch {
            // ignore
        }
    });

    panel.addEventListener(
        'pointermove',
        (e) => {
            if (e.pointerId !== activePointer || !isDrawerOpen()) return;

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            if (!axisLock) {
                if (Math.abs(dx) < EXPAND_SWIPE_LOCK_PX && Math.abs(dy) < EXPAND_SWIPE_LOCK_PX) return;
                if (Math.abs(dx) > Math.abs(dy) * 1.12) axisLock = 'h';
                else {
                    axisLock = 'v';
                    endSwipeGesture(true);
                    resetSwipeTransform(false);
                    return;
                }
            }

            if (axisLock !== 'h') return;
            e.preventDefault();

            lastX = e.clientX;
            let tx = dx;
            if (tx < 0) tx *= 0.2;
            panel.style.transform = `translateX(${tx}px)`;
            if (backdrop) {
                const w = panelWidth || 1;
                const progress = Math.max(0, Math.min(1, Math.max(0, tx) / w));
                backdrop.style.opacity = String(1 - progress);
            }
        },
        { passive: false }
    );

    function onSwipePointerEnd(e) {
        if (e.pointerId !== activePointer) return;

        const dx = lastX - startX;
        const wasHorizontal = axisLock === 'h';
        endSwipeGesture(true);

        if (!wasHorizontal || !isDrawerOpen()) {
            resetSwipeTransform(true);
            return;
        }

        const shouldClose = dx >= EXPAND_SWIPE_COMMIT_PX;
        if (!shouldClose) {
            resetSwipeTransform(true);
            return;
        }

        panel.style.transition = '';
        panel.style.transform = 'translateX(100%)';
        if (backdrop) {
            backdrop.style.transition = 'opacity 0.24s ease';
            backdrop.style.opacity = '0';
        }

        const onExitDone = (ev) => {
            if (ev.propertyName !== 'transform') return;
            panel.removeEventListener('transitionend', onExitDone);
            // Önce --open'ı kaldır (panel kapalı konumda kalsın), SONRA inline
            // transform'u temizle. Ters sırada, --open hâlâ dururken transform
            // silinince panel bir an açık konuma snap edip "yeniden açılıp kapanıyor"
            // gibi görünüyordu.
            setQuranReaderDrawerOpen(false);
            resetSwipeTransform(false);
        };
        panel.addEventListener('transitionend', onExitDone);
    }

    panel.addEventListener('pointerup', onSwipePointerEnd);
    panel.addEventListener('pointercancel', onSwipePointerEnd);
}

export function bindQuranAyahExpandOverlay() {
    const backdrop = document.getElementById('quranAyahExpandBackdrop');
    const overlay = document.getElementById('quranAyahExpandOverlay');
    const card = document.getElementById('quranAyahExpandCard');

    if (backdrop && backdrop.dataset.quranBound !== '1') {
        backdrop.dataset.quranBound = '1';
        backdrop.addEventListener('click', () => closeAyahExpandView());
    }
    if (overlay && overlay.dataset.quranExpandClickBound !== '1') {
        overlay.dataset.quranExpandClickBound = '1';
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeAyahExpandView();
        });
    }
    if (card && card.dataset.quranSwipeBound !== '1') {
        card.dataset.quranSwipeBound = '1';
        attachExpandCardSwipe(card);
    }
}

export function bindQuranReaderMenu(initialReadMode, initialReaderLayout = DEFAULT_QURAN_READER_LAYOUT) {
    const menuBtn = document.getElementById('quranReaderMenuBtn');
    const backdrop = document.getElementById('quranReaderDrawerBackdrop');
    const modeList = document.getElementById('quranReadModeList');
    const layoutList = document.getElementById('quranReaderLayoutList');

    syncQuranReadModeUI(initialReadMode);
    syncQuranReaderLayoutUI(initialReaderLayout);

    if (menuBtn && menuBtn.dataset.quranBound !== '1') {
        menuBtn.dataset.quranBound = '1';
        menuBtn.addEventListener('click', () => {
            const drawer = document.getElementById('quranReaderDrawer');
            const open = drawer && !drawer.classList.contains('quran-reader-drawer--open');
            setQuranReaderDrawerOpen(open);
        });
    }

    if (backdrop && backdrop.dataset.quranBound !== '1') {
        backdrop.dataset.quranBound = '1';
        backdrop.addEventListener('click', () => setQuranReaderDrawerOpen(false));
    }

    const drawerPanel = document.getElementById('quranReaderDrawerPanel');
    if (drawerPanel && drawerPanel.dataset.quranDrawerSwipeBound !== '1') {
        drawerPanel.dataset.quranDrawerSwipeBound = '1';
        attachReaderDrawerSwipe(drawerPanel, backdrop);
    }

    const bindDrawerOption = (btn, onPick) => {
        let pickLock = false;
        const run = (e) => {
            if (e.type === 'pointerup' && e.pointerType === 'mouse' && e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();
            if (pickLock) return;
            pickLock = true;
            try {
                onPick();
            } finally {
                setQuranReaderDrawerOpen(false);
                window.setTimeout(() => {
                    pickLock = false;
                }, 400);
            }
        };
        btn.addEventListener('pointerdown', (e) => e.stopPropagation());
        btn.addEventListener('pointerup', run);
    };

    if (modeList && modeList.dataset.quranBound !== '1') {
        modeList.dataset.quranBound = '1';
        modeList.querySelectorAll('.quran-read-mode-option').forEach((btn) => {
            bindDrawerOption(btn, () => {
                guardQuranReaderSettingsChange();
                const mode = normalizeQuranReadModeForLocale(btn.getAttribute('data-read-mode'), getLocale());
                if (onReadModeChange) onReadModeChange(mode);
            });
        });
    }

    if (layoutList && layoutList.dataset.quranBound !== '1') {
        layoutList.dataset.quranBound = '1';
        layoutList.querySelectorAll('.quran-read-mode-option').forEach((btn) => {
            bindDrawerOption(btn, () => {
                requestQuranReaderLayout(btn.getAttribute('data-reader-layout'));
            });
        });
    }

    const gotoForm = document.getElementById('quranAyahGotoForm');
    if (gotoForm && gotoForm.dataset.quranBound !== '1') {
        gotoForm.dataset.quranBound = '1';
        gotoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submitQuranAyahGoto();
        });
        gotoForm.querySelectorAll('input').forEach((input) => {
            input.addEventListener('input', () => setQuranGotoError(''));
        });
    }

    const helpToggle = document.getElementById('quranReaderHelpToggle');
    if (helpToggle && helpToggle.dataset.quranBound !== '1') {
        helpToggle.dataset.quranBound = '1';
        helpToggle.addEventListener('click', () => {
            const panel = document.getElementById('quranReaderHelpPanel');
            setQuranReaderHelpPanelOpen(panel?.hidden !== false);
        });
    }
}
