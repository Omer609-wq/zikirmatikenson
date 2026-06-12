import surahIndex from './data/quran/index.json';
import juzBoundaries from './data/quran/juz.json';
import mealsIndex from './data/quran/meals/index.json';
import { t, getLocale, getLocaleTag, normalizeAppLocale } from './i18n.js';
import { closeTafsirBridgeSheet, openTafsirBridgeSheet } from './tafsir-bridge.js';

const VALID_MEAL_IDS = new Set(['vakfi', 'diyanet', 'bn', 'muyassar', 'sahih', 'hamidullah', 'basmeih', 'indonesian', 'ahmedali', 'jalandhry']);
const VALID_READ_MODES = new Set(['meal-ar', 'translit-ar', 'ar-only']);
const DEFAULT_QURAN_READ_MODE = 'meal-ar';

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

/** @type {{ surah: number, ayah: number, readMode: string, meal: string } | null} */
let expandViewState = null;
let expandNavigateLock = false;

let quranSearchQuery = '';
let quranViewTab = 'surahs';
let navigateToSurah = null;
let onMealChange = null;
let onReadModeChange = null;
let renderGeneration = 0;
const surahContentCache = new Map();
let lazyObserver = null;
let lazyLoadMeal = null;
let lazyLoadMode = null;
let lazyScrollRaf = 0;
let lazyScrollEndTimer = 0;
let lazyScrollBound = false;
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
}

function surahMeta(n) {
    return (surahIndex || []).find((s) => s.n === n) || null;
}

function getJuzForAyah(surahN, ayahN) {
    const s = Number(surahN);
    const a = Number(ayahN);
    if (!Number.isFinite(s) || !Number.isFinite(a)) return 1;
    let juz = 1;
    for (const boundary of juzBoundaries || []) {
        if (s > boundary.surah || (s === boundary.surah && a >= boundary.ayah)) {
            juz = boundary.juz;
        } else {
            break;
        }
    }
    return juz;
}

function getJuzAtStart(surahN, ayahN) {
    const found = (juzBoundaries || []).find(
        (b) => b.surah === Number(surahN) && b.ayah === Number(ayahN)
    );
    return found ? found.juz : null;
}

function getJuzDividerBeforeAyah(surahN, ayahN) {
    const juz = getJuzAtStart(surahN, ayahN);
    if (!juz || juz <= 1) return null;
    if (Number(ayahN) === 1) return null;
    return juz;
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
    const q = (rawQuery || '').trim();
    if (!q) return true;
    const tag = getLocaleTag();
    const hay = [
        String(surah.n),
        surah.nameTr,
        surah.nameAr,
        String(surah.ayahCount)
    ]
        .join(' ')
        .toLocaleLowerCase(tag);
    const tokens = q.toLocaleLowerCase(tag).split(/\s+/).filter(Boolean);
    return tokens.every((tok) => hay.includes(tok));
}

function getQuranReaderScroller() {
    return document.querySelector('#quranSurahView .main-content.scrollable');
}

async function loadSurahContent(n, mealId, locale) {
    const pad = String(n).padStart(3, '0');
    const meal = normalizeQuranMeal(mealId, locale);
    const translitPack = getQuranTranslitPackId(locale);
    const [arMod, mealMod, latMod] = await Promise.all([
        import(`./data/quran/ar/${pad}.json`),
        meal
            ? import(`./data/quran/meals/${meal}/${pad}.json`)
            : Promise.resolve({ default: { ayahs: [] } }),
        import(`./data/quran/${translitPack}/${pad}.json`)
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
    if (!lazyObserver) return;
    lazyObserver.disconnect();
    lazyObserver = null;
    lazyLoadMeal = null;
    lazyLoadMode = null;
    if (lazyScrollRaf) {
        cancelAnimationFrame(lazyScrollRaf);
        lazyScrollRaf = 0;
    }
    if (lazyScrollEndTimer) {
        clearTimeout(lazyScrollEndTimer);
        lazyScrollEndTimer = 0;
    }
}

function getSurahSectionsNearViewport(scroller, marginPx) {
    const rootRect = scroller.getBoundingClientRect();
    const top = rootRect.top - marginPx;
    const bottom = rootRect.bottom + marginPx;
    const list = document.getElementById('quranAyahList');
    if (!list) return [];
    return [...list.querySelectorAll('.quran-surah-section')].filter((section) => {
        const rect = section.getBoundingClientRect();
        return rect.bottom >= top && rect.top <= bottom;
    });
}

function loadVisibleSurahSections() {
    if (!lazyLoadMeal || !lazyLoadMode) return;
    const scroller = getQuranReaderScroller();
    if (!scroller) return;
    const margin = Math.max(scroller.clientHeight * 1.2, 480);
    const gen = renderGeneration;
    getSurahSectionsNearViewport(scroller, margin).forEach((section) => {
        void loadSurahSectionIfNeeded(section, lazyLoadMeal, lazyLoadMode, gen);
    });
}

function scheduleVisibleSurahLoad() {
    if (lazyScrollRaf) return;
    lazyScrollRaf = requestAnimationFrame(() => {
        lazyScrollRaf = 0;
        loadVisibleSurahSections();
    });
}

function bindLazyScrollLoader() {
    const scroller = getQuranReaderScroller();
    if (!scroller || lazyScrollBound) return;
    lazyScrollBound = true;
    scroller.addEventListener(
        'scroll',
        () => {
            scheduleVisibleSurahLoad();
            if (lazyScrollEndTimer) clearTimeout(lazyScrollEndTimer);
            lazyScrollEndTimer = window.setTimeout(() => {
                lazyScrollEndTimer = 0;
                loadVisibleSurahSections();
            }, LAZY_SCROLL_END_MS);
        },
        { passive: true }
    );
}

function getQuranReaderMealId() {
    const list = document.getElementById('quranAyahList');
    return normalizeQuranMeal(
        list?.dataset.mealId || lazyLoadMeal || getDefaultQuranMealForLocale(getLocale()),
        getLocale()
    );
}

function resetExpandCardMotion() {
    const card = document.getElementById('quranAyahExpandCard');
    if (!card) return;
    card.style.transform = '';
    card.style.transition = '';
    card.classList.remove(
        'quran-ayah-expand__card--from-left',
        'quran-ayah-expand__card--from-right'
    );
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

function fillAyahExpandCard(surahN, ayah, readMode) {
    const meta = surahMeta(surahN);
    const mode = normalizeQuranReadMode(readMode);
    const refEl = document.getElementById('quranAyahExpandRef');
    const bismEl = document.getElementById('quranAyahExpandBism');
    const arEl = document.getElementById('quranAyahExpandAr');
    const trEl = document.getElementById('quranAyahExpandTr');
    const latEl = document.getElementById('quranAyahExpandLat');
    if (!refEl || !arEl) return;

    refEl.textContent = formatAyahExpandRef(
        meta?.nameTr || t('quran.surahFallback', { n: surahN }),
        surahN,
        ayah.n
    );

    const bism = ayah.bismillah && String(ayah.bismillah).trim();
    if (bismEl) {
        bismEl.textContent = bism || '';
        bismEl.hidden = !bism;
    }

    arEl.textContent = ayah.ar || '';

    if (trEl) {
        const meal = mode === 'meal-ar' ? String(ayah.tr || '').trim() : '';
        trEl.textContent = meal;
        trEl.hidden = !meal;
    }

    if (latEl) {
        const lat = mode === 'translit-ar' ? String(ayah.lat || '').trim() : '';
        latEl.textContent = lat;
        latEl.hidden = !lat;
    }
}

async function navigateExpandedAyah(delta) {
    if (expandNavigateLock || !expandViewState) return;
    const target = adjacentAyahRef(expandViewState.surah, expandViewState.ayah, delta);
    if (!target) return;

    expandNavigateLock = true;
    const { meal, readMode } = expandViewState;
    try {
        const surah = await getSurahContent(meal, target.surah);
        const ayah = (surah?.ayahs || []).find((a) => a.n === target.ayah);
        if (!ayah) {
            resetExpandCardMotion();
            return;
        }

        expandViewState = { surah: target.surah, ayah: target.ayah, readMode, meal };
        fillAyahExpandCard(target.surah, ayah, readMode);

        const card = document.getElementById('quranAyahExpandCard');
        if (card) {
            card.classList.remove('quran-ayah-expand__card--from-left', 'quran-ayah-expand__card--from-right');
            void card.offsetWidth;
            card.classList.add(delta > 0 ? 'quran-ayah-expand__card--from-right' : 'quran-ayah-expand__card--from-left');
        }

        void prefetchSurahs(meal, readMode, [target.surah, target.surah - 1, target.surah + 1], renderGeneration);
        void scrollToAyah(target.surah, target.ayah, meal, readMode, renderGeneration);
    } finally {
        expandNavigateLock = false;
    }
}

export function closeAyahExpandView() {
    const overlay = document.getElementById('quranAyahExpandOverlay');
    if (!overlay) return;
    expandViewState = null;
    expandNavigateLock = false;
    resetExpandCardMotion();
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
}

export function teardownQuranReader() {
    disconnectLazyObserver();
    closeAyahExpandView();
    closeTafsirBridgeSheet();
    const list = document.getElementById('quranAyahList');
    if (list) {
        list.innerHTML = '';
        list.removeAttribute('data-meal-id');
        list.removeAttribute('data-read-mode');
        list.hidden = true;
    }
}

function setSurahLoading(loading) {
    const el = document.getElementById('quranSurahLoading');
    const list = document.getElementById('quranAyahList');
    if (el) el.hidden = !loading;
    if (list && loading) list.hidden = true;
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

export function syncQuranReaderChrome(readMode) {
    const mode = normalizeQuranReadModeForLocale(readMode, getLocale());
    const mealWrap = document.getElementById('quranMealPickerWrap');
    const localeMeals = getQuranMealsForLocale(getLocale());
    if (mealWrap) {
        mealWrap.hidden = mode !== 'meal-ar' || localeMeals.length <= 1;
    }

    const list = document.getElementById('quranAyahList');
    if (list) {
        list.classList.remove('quran-ayah-list--meal-ar', 'quran-ayah-list--translit-ar', 'quran-ayah-list--ar-only');
        list.classList.add(`quran-ayah-list--${mode}`);
    }

    syncQuranReadModeUI(mode);
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

function openAyahExpandView(surahN, ayah, readMode) {
    const overlay = document.getElementById('quranAyahExpandOverlay');
    if (!overlay) return;

    const meal = getQuranReaderMealId();
    const mode = normalizeQuranReadMode(readMode);
    expandViewState = { surah: Number(surahN), ayah: Number(ayah.n), readMode: mode, meal };
    resetExpandCardMotion();
    fillAyahExpandCard(surahN, ayah, mode);

    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
    void prefetchSurahs(meal, mode, [surahN, surahN - 1, surahN + 1], renderGeneration);
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
        openAyahExpandView(surahN, ayah, readMode);
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
    const surahName = surahMeta(surahN)?.nameTr || t('quran.surahFallback', { n: surahN });
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
            openAyahExpandView(surahN, ayah, readMode);
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

const SURAH_CORNER_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" aria-hidden="true">' +
    '<path d="M2 15.5V2H15.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>' +
    '<path d="M4.2 13.3V4.2H13.3" fill="none" stroke="currentColor" stroke-width="0.55" opacity="0.55"/>' +
    '<path d="M2 10.2C2 5.8 5.4 2.4 9.8 2.4" fill="none" stroke="currentColor" stroke-width="0.65" opacity="0.5"/>' +
    '<path d="M2 6.2L6.2 2" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.38"/>' +
    '<circle cx="2" cy="2" r="1.15" fill="currentColor"/>' +
    '<circle cx="2" cy="2" r="0.4" fill="currentColor" opacity="0.22"/>' +
    '</svg>';

function appendSurahCornerMotifs(frame) {
    ['tl', 'tr', 'bl', 'br'].forEach((pos) => {
        const corner = document.createElement('span');
        corner.className = `quran-surah-section__corner quran-surah-section__corner--${pos}`;
        corner.setAttribute('aria-hidden', 'true');
        corner.innerHTML = SURAH_CORNER_SVG;
        frame.appendChild(corner);
    });
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

    const nameTr = document.createElement('p');
    nameTr.className = 'quran-surah-section__name-tr';
    nameTr.textContent = meta.nameTr || '';

    const ayahMeta = document.createElement('p');
    ayahMeta.className = 'quran-surah-section__meta';
    ayahMeta.textContent = t('quran.ayahCount', { count: meta.ayahCount });

    frame.appendChild(num);
    frame.appendChild(nameAr);
    if (meta.nameTr) frame.appendChild(nameTr);
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

function setupLazyObserver(meal, readMode) {
    if (lazyObserver) lazyObserver.disconnect();
    const scroller = getQuranReaderScroller();
    const list = document.getElementById('quranAyahList');
    if (!scroller || !list) return;

    lazyLoadMeal = normalizeQuranMeal(meal, getLocale());
    lazyLoadMode = normalizeQuranReadMode(readMode);
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
                if (gap > unloadDistance) unloadSurahSection(section);
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

function renderMushafShells(mealId, readMode) {
    const list = document.getElementById('quranAyahList');
    if (!list) return;
    const locale = getLocale();
    const meal = normalizeQuranMeal(mealId, locale);
    const mode = normalizeQuranReadModeForLocale(readMode, locale);

    syncQuranReaderChrome(mode);
    disconnectLazyObserver();
    list.replaceChildren();
    const frag = document.createDocumentFragment();
    (surahIndex || []).forEach((meta) => frag.appendChild(createSurahSectionShell(meta)));
    list.appendChild(frag);
    list.dataset.mealId = meal || '';
    list.dataset.readMode = mode;
    list.hidden = false;
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

function refreshLoadedSections(readMode) {
    const list = document.getElementById('quranAyahList');
    if (!list) return;
    const meal = list.dataset.mealId;
    const mode = normalizeQuranReadMode(readMode);
    list.dataset.readMode = mode;
    syncQuranReaderChrome(mode);

    list.querySelectorAll('.quran-surah-section[data-loaded="1"]').forEach((section) => {
        const n = Number(section.dataset.surah);
        const surah = surahContentCache.get(surahCacheKey(meal, n, getLocale()));
        if (surah) populateSurahAyahs(section, surah, mode);
    });
}

function scrollToSurahSection(surahN) {
    const n = Number(surahN);
    if (!Number.isFinite(n)) return;
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
    const el = document.querySelector(`.quran-ayah[data-surah="${s}"][data-ayah="${a}"]`);
    const scroller = getQuranReaderScroller();
    if (!el || !scroller) return false;
    const delta = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
    scroller.scrollTop += delta - 72;
    el.classList.add('quran-ayah--highlight');
    window.setTimeout(() => el.classList.remove('quran-ayah--highlight'), 1400);
    return true;
}

async function scrollToAyah(surahN, ayahN, mealId, readMode, gen) {
    const locale = getLocale();
    const meal = normalizeQuranMeal(mealId, locale);
    const mode = normalizeQuranReadModeForLocale(readMode, locale);
    await prefetchSurahs(meal, mode, [surahN, surahN - 1, surahN + 1], gen);
    if (gen !== renderGeneration) return;
    scrollToSurahSection(surahN);
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
    drawer.classList.toggle('quran-reader-drawer--open', isOpen);
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

    if (/^\d+$/.test(q)) {
        const n = Number(q);
        if (n >= 1 && n <= 114) return { ok: true, surah: n };
        return { ok: false, message: t('quran.gotoInvalidSurah') };
    }

    const tag = getLocaleTag();
    const ql = q.toLocaleLowerCase(tag);
    const compactQ = q.replace(/\s+/g, '');

    const exact = (surahIndex || []).find((s) => {
        const nameTr = (s.nameTr || '').toLocaleLowerCase(tag);
        const nameAr = s.nameAr || '';
        return (
            nameTr === ql ||
            nameAr === q ||
            nameAr.replace(/\s+/g, '') === compactQ
        );
    });
    if (exact) return { ok: true, surah: exact.n };

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
    if (navigateToSurah) navigateToSurah(result.surah, result.ayah);
}

export async function renderQuranSurahDetail(surahN, mealId, readMode, scrollAyah) {
    const n = Number(surahN);
    if (!Number.isFinite(n) || n < 1 || n > 114) return;

    const locale = getLocale();
    const meal = normalizeQuranMeal(mealId, locale);
    const mode = normalizeQuranReadModeForLocale(readMode, locale);
    const gen = ++renderGeneration;
    syncMealSelect(meal, locale);
    syncReaderTitle();

    const list = document.getElementById('quranAyahList');
    const hasShells = list && list.childElementCount > 0;
    const sameMeal = hasShells && (list.dataset.mealId || '') === (meal || '');
    const sameMode = sameMeal && list.dataset.readMode === mode;
    const prefetchAround = [n, n - 1, n + 1];

    const finishScroll = async () => {
        if (scrollAyah != null && Number.isFinite(Number(scrollAyah))) {
            await scrollToAyah(n, Number(scrollAyah), meal, mode, gen);
        } else {
            scrollToSurahSection(n);
        }
    };

    if (sameMeal && sameMode) {
        list.hidden = false;
        syncQuranReaderChrome(mode);
        setSurahLoading(false);
        setupLazyObserver(meal, mode);
        await prefetchSurahs(meal, mode, prefetchAround, gen);
        if (gen !== renderGeneration) return;
        requestAnimationFrame(() => {
            if (gen !== renderGeneration) return;
            void finishScroll();
            scheduleVisibleSurahLoad();
        });
        return;
    }

    if (sameMeal && !sameMode) {
        refreshLoadedSections(mode);
        setSurahLoading(false);
        setupLazyObserver(meal, mode);
        await prefetchSurahs(meal, mode, prefetchAround, gen);
        if (gen !== renderGeneration) return;
        requestAnimationFrame(() => {
            if (gen !== renderGeneration) return;
            void finishScroll();
            scheduleVisibleSurahLoad();
        });
        return;
    }

    setSurahLoading(true);
    try {
        renderMushafShells(meal, mode);
        setupLazyObserver(meal, mode);
        await prefetchSurahs(meal, mode, [n, n - 1, n + 1, n - 2, n + 2], gen);
        if (gen !== renderGeneration) return;
        requestAnimationFrame(() => {
            if (gen !== renderGeneration) return;
            void finishScroll();
            scheduleVisibleSurahLoad();
            setSurahLoading(false);
        });
    } catch (err) {
        console.error('Kur\'an yüklenemedi:', err);
        if (gen !== renderGeneration) return;
        disconnectLazyObserver();
        if (list) {
            list.hidden = false;
            list.replaceChildren();
            list.removeAttribute('data-meal-id');
            list.removeAttribute('data-read-mode');
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

    list.innerHTML = '';
    const q = (quranSearchQuery || '').trim();
    const filtered = (surahIndex || []).filter((s) => surahMatchesSearch(s, q));

    if (!filtered.length) {
        const empty = document.createElement('p');
        empty.className = 'quran-surah-empty';
        empty.textContent = t('quran.emptySearch');
        list.appendChild(empty);
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

        const nameTr = document.createElement('span');
        nameTr.className = 'quran-surah-card__name';
        nameTr.textContent = s.nameTr || '';

        const nameAr = document.createElement('span');
        nameAr.className = 'quran-surah-card__name-ar arabic-text';
        nameAr.setAttribute('dir', 'rtl');
        nameAr.setAttribute('lang', 'ar');
        nameAr.textContent = s.nameAr || '';

        const meta = document.createElement('span');
        meta.className = 'quran-surah-card__meta';
        meta.textContent = t('quran.ayahCount', { count: s.ayahCount });

        body.appendChild(nameTr);
        body.appendChild(nameAr);
        body.appendChild(meta);

        card.appendChild(num);
        card.appendChild(body);
        card.addEventListener('click', () => {
            if (navigateToSurah) navigateToSurah(s.n);
        });
        list.appendChild(card);
    });
}

export function bindQuranSearchInput() {
    const input = document.getElementById('quranSearchInput');
    if (!input || input.dataset.quranBound === '1') return;
    input.dataset.quranBound = '1';
    input.addEventListener('input', () => {
        quranSearchQuery = input.value || '';
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
                meta?.nameTr || t('quran.surahFallback', { n: s }),
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
        activePointer = e.pointerId;
        startX = lastX = e.clientX;
        startY = e.clientY;
        axisLock = null;
        card.style.transition = 'none';
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
            if (tx > 0 && !canPrev) tx *= 0.3;
            if (tx < 0 && !canNext) tx *= 0.3;
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
        const goNext = dx <= -EXPAND_SWIPE_COMMIT_PX && canNext;
        const goPrev = dx >= EXPAND_SWIPE_COMMIT_PX && canPrev;

        if (!goNext && !goPrev) {
            resetSwipeTransform(true);
            return;
        }

        const delta = goNext ? 1 : -1;
        const exitX = goNext ? '-108%' : '108%';
        card.style.transition = '';
        card.style.transform = `translateX(${exitX})`;

        const onExitDone = (ev) => {
            if (ev.propertyName !== 'transform') return;
            card.removeEventListener('transitionend', onExitDone);
            card.style.transform = '';
            void navigateExpandedAyah(delta);
        };
        card.addEventListener('transitionend', onExitDone);
    }

    card.addEventListener('pointerup', onSwipePointerEnd);
    card.addEventListener('pointercancel', onSwipePointerEnd);
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

export function bindQuranReaderMenu(initialReadMode) {
    const menuBtn = document.getElementById('quranReaderMenuBtn');
    const backdrop = document.getElementById('quranReaderDrawerBackdrop');
    const modeList = document.getElementById('quranReadModeList');

    syncQuranReadModeUI(initialReadMode);

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

    if (modeList && modeList.dataset.quranBound !== '1') {
        modeList.dataset.quranBound = '1';
        modeList.querySelectorAll('.quran-read-mode-option').forEach((btn) => {
            btn.addEventListener('click', () => {
                const mode = normalizeQuranReadModeForLocale(btn.getAttribute('data-read-mode'), getLocale());
                if (onReadModeChange) onReadModeChange(mode);
                setQuranReaderDrawerOpen(false);
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
