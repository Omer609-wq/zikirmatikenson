import test from 'node:test';
import assert from 'node:assert/strict';
import surahIndex from './data/quran/index.json' with { type: 'json' };
import {
    MIN_TEXT_SEARCH_CHARS,
    meetsMinTextSearchQuery,
    normalizeEnMealSearchText,
    normalizeMealSearchText,
    normalizeTranslitSearchText,
    preloadMealSearchIndex,
    searchMealAyahs,
    searchTranslitAyahs,
    searchAyahTextHits,
    localeSupportsMealTextSearch
} from './quran-ayah-text-search.js';

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
    const hits = searchTranslitAyahs('la raybe fih', surahIndex, 'tr', { limit: 3 });
    assert.ok(hits.length >= 1);
    assert.equal(hits[0].surah, 2);
    assert.equal(hits[0].ayah, 2);
    assert.equal(hits[0].kind, 'translit');
    assert.equal(hits[0].readModeId, 'translit-ar');
    assert.match(hits[0].snippet, /raybe/i);
});

test('searchTranslitAyahs tolerates one typo', async () => {
    const hits = searchTranslitAyahs('elhamdu lillahi rabbi', surahIndex, 'tr', { limit: 3 });
    assert.ok(hits.length >= 1);
    assert.equal(hits[0].surah, 1);
    assert.equal(hits[0].ayah, 2);
});

test('searchAyahTextHits merges meal and translit', async () => {
    await preloadMealSearchIndex('tr');
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
