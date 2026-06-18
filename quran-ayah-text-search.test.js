import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import surahIndex from './data/quran/index.json' with { type: 'json' };
import {
    MIN_TEXT_SEARCH_CHARS,
    meetsMinTextSearchQuery,
    normalizeArabicAyahSearchText,
    normalizeEnMealSearchText,
    normalizeMealSearchText,
    normalizeTranslitSearchText,
    preloadArabicAyahSearchIndex,
    preloadAyahTextSearchIndex,
    preloadMealSearchIndex,
    preloadTranslitSearchIndex,
    isAyahTextSearchIndexReady,
    searchArabicAyahs,
    searchMealAyahs,
    searchTranslitAyahs,
    searchAyahTextHits,
    localeSupportsArabicAyahTextSearch,
    localeSupportsMealTextSearch,
    __setSearchIndexLoaderForTests
} from './quran-ayah-text-search.js';

const searchIndexDir = join(dirname(fileURLToPath(import.meta.url)), 'data', 'quran', 'search');
const readSearchIndexForTests = (fileName) =>
    readFile(join(searchIndexDir, fileName), 'utf8').then((raw) => JSON.parse(raw));
__setSearchIndexLoaderForTests(readSearchIndexForTests);

test('normalizeMealSearchText folds Turkish', () => {
    assert.equal(normalizeMealSearchText('Şüphe GöTürMEyen'), 'suphe goturmeyen');
});

test('normalizeEnMealSearchText folds English', () => {
    assert.equal(normalizeEnMealSearchText('No Doubt'), 'no doubt');
});

test('normalizeTranslitSearchText folds diacritics', () => {
    assert.equal(
        normalizeTranslitSearchText('Ẕâlike-lkitâbü lâ raybe fîh'),
        'zalike lkitabu la raybe fih'
    );
});

test('meetsMinTextSearchQuery rejects short and ref queries', () => {
    assert.equal(meetsMinTextSearchQuery('el'), false);
    assert.equal(meetsMinTextSearchQuery('ve'), false);
    assert.equal(meetsMinTextSearchQuery('bakara 12'), false);
    assert.equal(meetsMinTextSearchQuery('suphe'), true);
    assert.equal(MIN_TEXT_SEARCH_CHARS, MIN_TEXT_SEARCH_CHARS);
});

test('localeSupportsMealTextSearch for meal locales', () => {
    for (const code of ['tr', 'en', 'id', 'ms', 'fr', 'bn', 'ur']) {
        assert.equal(localeSupportsMealTextSearch(code), true);
    }
    assert.equal(localeSupportsMealTextSearch('ar'), false);
    assert.equal(localeSupportsArabicAyahTextSearch('ar'), true);
    assert.equal(localeSupportsArabicAyahTextSearch('tr'), false);
});

test('normalizeArabicAyahSearchText folds hamza and diacritics', () => {
    assert.equal(normalizeArabicAyahSearchText('لَا رَيْبَ'), 'لا ريب');
});

test('searchArabicAyahs finds Al-Baqarah 2:2 by Arabic phrase', async () => {
    await preloadArabicAyahSearchIndex();
    const hits = searchArabicAyahs('ذلك الكتاب لا ريب', surahIndex, 'ar', { limit: 5 });
    assert.ok(hits.length >= 1);
    assert.equal(hits[0].surah, 2);
    assert.equal(hits[0].ayah, 2);
    assert.equal(hits[0].kind, 'ar');
    assert.match(hits[0].snippet, /كتاب|كِتَاب/);
});

test('searchArabicAyahs finds هدى in Al-Kahf when scoped', async () => {
    await preloadArabicAyahSearchIndex();
    const hits = searchArabicAyahs('هدى', surahIndex, 'ar', { limit: 5, surah: 18 });
    assert.ok(hits.some((h) => h.surah === 18 && h.ayah === 13));
});

test('searchAyahTextHits ignores bogus translit for hidayet without meal index', () => {
    const hits = searchAyahTextHits('hidayet', surahIndex, 'tr', { limit: 5 });
    assert.equal(hits.length, 0);
});

test('TR ayah text search remains ready when only meal index loads', async () => {
    const mealTrIndex = JSON.parse(await readFile(join(searchIndexDir, 'meal-tr.json'), 'utf8'));
    __setSearchIndexLoaderForTests((fileName) => {
        if (fileName === 'meal-tr.json') return mealTrIndex;
        if (fileName === 'translit-tr.json') throw new Error('missing translit index');
        return readSearchIndexForTests(fileName);
    });

    try {
        await assert.rejects(
            preloadAyahTextSearchIndex('tr'),
            /Search index load failed: translit-tr\.json/
        );
        await Promise.resolve();

        assert.equal(isAyahTextSearchIndexReady('tr'), true);
        const hits = searchMealAyahs('dogrulugu suphe goturmeyen', surahIndex, 'tr', { limit: 3 });
        assert.ok(hits.length >= 1);
        assert.equal(hits[0].surah, 2);
        assert.equal(hits[0].ayah, 2);
    } finally {
        __setSearchIndexLoaderForTests(readSearchIndexForTests);
    }
});

test('searchMealAyahs finds Diyanet meal phrase', async () => {
    await preloadMealSearchIndex('tr');
    const hits = searchMealAyahs('dogrulugu suphe goturmeyen', surahIndex, 'tr', { limit: 3 });
    assert.ok(hits.length >= 1);
    assert.equal(hits[0].surah, 2);
    assert.equal(hits[0].ayah, 2);
    assert.equal(hits[0].mealId, 'diyanet');
    assert.match(hits[0].snippet, /şüphe|suphe/i);
});

test('searchMealAyahs finds hidayet in Kehf when scoped', async () => {
    await preloadMealSearchIndex('tr');
    const hits = searchAyahTextHits('hidayet', surahIndex, 'tr', { limit: 10, surah: 18 });
    assert.ok(hits.some((h) => h.surah === 18 && h.ayah === 13 && h.kind === 'meal'));
});

test('searchMealAyahs finds Vakfi meal phrase', async () => {
    await preloadMealSearchIndex('tr');
    const hits = searchMealAyahs('muttakiler icin yol gostericidir', surahIndex, 'tr', { limit: 3 });
    assert.ok(hits.length >= 1);
    assert.equal(hits[0].surah, 2);
    assert.equal(hits[0].ayah, 2);
    assert.equal(hits[0].mealId, 'vakfi');
    assert.match(hits[0].snippet, /müttakiler|muttakiler/i);
});

test('searchMealAyahs finds English Sahih meal phrase', async () => {
    await preloadMealSearchIndex('en');
    const hits = searchMealAyahs('no doubt guidance', surahIndex, 'en', { limit: 3 });
    assert.ok(hits.length >= 1);
    assert.equal(hits[0].surah, 2);
    assert.equal(hits[0].ayah, 2);
    assert.equal(hits[0].mealId, 'sahih');
    assert.match(hits[0].snippet, /doubt/i);
});

test('searchTranslitAyahs finds Turkish transliteration phrase', async () => {
    await preloadTranslitSearchIndex();
    const hits = searchTranslitAyahs('la raybe fih', surahIndex, 'tr', { limit: 3 });
    assert.ok(hits.length >= 1);
    assert.equal(hits[0].surah, 2);
    assert.equal(hits[0].ayah, 2);
    assert.equal(hits[0].kind, 'translit');
    assert.equal(hits[0].readModeId, 'translit-ar');
    assert.match(hits[0].snippet, /raybe/i);
});

test('searchTranslitAyahs tolerates one typo', async () => {
    await preloadTranslitSearchIndex();
    const hits = searchTranslitAyahs('elhamdu lillahi rabbi', surahIndex, 'tr', { limit: 3 });
    assert.ok(hits.length >= 1);
    assert.equal(hits[0].surah, 1);
    assert.equal(hits[0].ayah, 2);
});

test('searchTranslitAyahs matches joined phrase without spaces or hyphens', async () => {
    await preloadTranslitSearchIndex();
    const ikhlas = searchTranslitAyahs('kulhuvellahu', surahIndex, 'tr', { limit: 3 });
    assert.ok(ikhlas.some((h) => h.surah === 112 && h.ayah === 1));
    const joined = searchTranslitAyahs('kul huvelleahu', surahIndex, 'tr', { limit: 3 });
    assert.ok(joined.some((h) => h.surah === 112 && h.ayah === 1));
    const fatiha = searchTranslitAyahs('bismillahi', surahIndex, 'tr', { limit: 3 });
    assert.ok(fatiha.some((h) => h.surah === 1 && h.ayah === 1));
});

test('searchTranslitAyahs tolerates Turkish vowel variants', async () => {
    await preloadTranslitSearchIndex();
    const plain = searchTranslitAyahs('kul huve llahu', surahIndex, 'tr', { limit: 3 });
    assert.ok(plain.some((h) => h.surah === 112 && h.ayah === 1));
    const withUmlaut = searchTranslitAyahs('kul hüve llâhü', surahIndex, 'tr', { limit: 3 });
    assert.ok(withUmlaut.some((h) => h.surah === 112 && h.ayah === 1));
});

test('searchAyahTextHits merges meal and translit', async () => {
    await preloadMealSearchIndex('tr');
    await preloadTranslitSearchIndex();
    const mealHits = searchAyahTextHits('dogrulugu suphe goturmeyen', surahIndex, 'tr', { limit: 5 });
    assert.ok(mealHits.some((h) => h.kind === 'meal'));
    const translitHits = searchAyahTextHits('bismi llahi rrahman', surahIndex, 'tr', { limit: 5 });
    assert.ok(translitHits.some((h) => h.kind === 'translit'));
});

test('searchMealAyahs finds Indonesian meal phrase', async () => {
    await preloadMealSearchIndex('id');
    const hits = searchMealAyahs('kitab tidak ada keraguan padanya', surahIndex, 'id', { limit: 3 });
    assert.ok(hits.length >= 1);
    assert.equal(hits[0].surah, 2);
    assert.equal(hits[0].ayah, 2);
    assert.equal(hits[0].mealId, 'indonesian');
});

test('searchMealAyahs finds French meal phrase', async () => {
    await preloadMealSearchIndex('fr');
    const hits = searchMealAyahs('aucun doute', surahIndex, 'fr', { limit: 3 });
    assert.ok(hits.length >= 1);
    assert.equal(hits[0].surah, 2);
    assert.equal(hits[0].ayah, 2);
    assert.equal(hits[0].mealId, 'hamidullah');
});

test('searchMealAyahs finds Malay meal phrase', async () => {
    await preloadMealSearchIndex('ms');
    const hits = searchMealAyahs('tidak ada sebarang syak', surahIndex, 'ms', { limit: 3 });
    assert.ok(hits.length >= 1);
    assert.equal(hits[0].surah, 2);
    assert.equal(hits[0].ayah, 2);
    assert.equal(hits[0].mealId, 'basmeih');
});

test('searchMealAyahs finds Bengali meal phrase', async () => {
    await preloadMealSearchIndex('bn');
    const hits = searchMealAyahs('কিতাব যাতে সন্দেহ নেই', surahIndex, 'bn', { limit: 3 });
    assert.ok(hits.length >= 1);
    assert.equal(hits[0].surah, 2);
    assert.equal(hits[0].ayah, 2);
    assert.equal(hits[0].mealId, 'bn');
});

test('searchMealAyahs finds Urdu meal phrase', async () => {
    await preloadMealSearchIndex('ur');
    const hits = searchMealAyahs('کويی بھی شک نہیں', surahIndex, 'ur', { limit: 3 });
    assert.ok(hits.length >= 1);
    assert.equal(hits[0].surah, 2);
    assert.equal(hits[0].ayah, 2);
    assert.ok(['ahmedali', 'jalandhry'].includes(hits[0].mealId));
});

test('searchMealAyahs not active for unsupported locale', async () => {
    const hits = searchMealAyahs('merciful', surahIndex, 'ar');
    assert.equal(hits.length, 0);
});
