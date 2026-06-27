import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import surahIndex from './data/quran/index.json' with { type: 'json' };
import {
    MIN_TEXT_SEARCH_CHARS,
    meetsMinTextSearchQuery,
    passesAyahTextSearchQueryGate,
    normalizeArabicAyahSearchText,
    normalizeEnMealSearchText,
    normalizeEnTranslitSearchText,
    normalizeMealSearchText,
    normalizeTranslitSearchText,
    preloadArabicAyahSearchIndex,
    preloadMealSearchIndex,
    preloadTranslitSearchIndex,
    searchArabicAyahs,
    searchMealAyahs,
    searchTranslitAyahs,
    searchAyahTextHits,
    localeSupportsArabicAyahTextSearch,
    localeSupportsMealTextSearch,
    localeSupportsTranslitTextSearch,
    __setSearchIndexLoaderForTests
} from './quran-ayah-text-search.js';

const searchIndexDir = join(dirname(fileURLToPath(import.meta.url)), 'data', 'quran', 'search');
__setSearchIndexLoaderForTests((fileName) =>
    readFile(join(searchIndexDir, fileName), 'utf8').then((raw) => JSON.parse(raw))
);

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

test('passesAyahTextSearchQueryGate accepts latin translit for bn, ur, ar', () => {
    for (const code of ['bn', 'ur', 'ar']) {
        assert.equal(
            meetsMinTextSearchQuery('bismi allahi', code),
            false,
            `${code}: meal gate rejects latin`
        );
        assert.equal(
            passesAyahTextSearchQueryGate('bismi allahi', code),
            true,
            `${code}: combined gate accepts latin translit`
        );
    }
});

test('localeSupportsMealTextSearch for meal locales', () => {
    for (const code of ['tr', 'en', 'id', 'ms', 'fr', 'bn', 'ur']) {
        assert.equal(localeSupportsMealTextSearch(code), true);
    }
    assert.equal(localeSupportsMealTextSearch('ar'), false);
    assert.equal(localeSupportsArabicAyahTextSearch('ar'), true);
    assert.equal(localeSupportsArabicAyahTextSearch('tr'), false);
});

test('localeSupportsTranslitTextSearch', () => {
    assert.equal(localeSupportsTranslitTextSearch('tr'), true);
    for (const code of ['en', 'id', 'ms', 'fr', 'bn', 'ur', 'ar']) {
        assert.equal(localeSupportsTranslitTextSearch(code), true);
    }
});

test('normalizeEnTranslitSearchText folds English transliteration', () => {
    assert.equal(normalizeEnTranslitSearchText('Al-Kitabu La Rayba'), 'al kitabu la rayba');
});

test('normalizeArabicAyahSearchText folds hamza and diacritics', () => {
    assert.equal(normalizeArabicAyahSearchText('لَا رَيْبَ'), 'لا ريب');
    assert.equal(normalizeArabicAyahSearchText('بِسْمِ ٱللَّهِ'), 'بسم الله');
});

test('searchArabicAyahs finds Al-Baqarah 2:2 by Arabic phrase', async () => {
    await preloadArabicAyahSearchIndex();
    const hits = searchArabicAyahs('ذلك الكتاب لا ريب', surahIndex, 'ar', { limit: 5 });
    assert.ok(hits.length >= 1);
    assert.equal(hits[0].surah, 2);
    assert.equal(hits[0].ayah, 2);
    assert.equal(hits[0].kind, 'ar');
    assert.match(hits[0].snippet, /كِتَاب|كتاب|كِتَـٰب|ٱلْكِتَ/);
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

test('searchMealAyahs finds Diyanet meal phrase', async () => {
    await preloadMealSearchIndex('tr');
    const hits = searchMealAyahs('dogrulugu suphe goturmeyen', surahIndex, 'tr', { limit: 3 });
    assert.ok(hits.length >= 1);
    assert.equal(hits[0].surah, 2);
    assert.equal(hits[0].ayah, 2);
    assert.equal(hits[0].mealId, 'diyanet');
    assert.match(hits[0].snippet, /şüphe|suphe/i);
});

test('searchMealAyahs matches all Turkish meal tokens in any order', async () => {
    await preloadMealSearchIndex('tr');
    const ordered = searchMealAyahs('suphe goturmeyen dogruluk', surahIndex, 'tr', { limit: 5 });
    const reversed = searchMealAyahs('goturmeyen suphe dogrulugu', surahIndex, 'tr', { limit: 5 });
    assert.ok(ordered.some((h) => h.surah === 2 && h.ayah === 2));
    assert.ok(reversed.some((h) => h.surah === 2 && h.ayah === 2));
    const phrase = searchMealAyahs('kitap suphe goturmeyen', surahIndex, 'tr', { limit: 5 });
    assert.ok(phrase.some((h) => h.surah === 2 && h.ayah === 2));
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

test('searchTranslitAyahs finds English transliteration phrase', async () => {
    await preloadTranslitSearchIndex('translit-en');
    const hits = searchTranslitAyahs('la rayba feehi', surahIndex, 'en', { limit: 3 });
    assert.ok(hits.length >= 1);
    assert.equal(hits[0].surah, 2);
    assert.equal(hits[0].ayah, 2);
    assert.equal(hits[0].kind, 'translit');
});

test('searchTranslitAyahs tolerates English transliteration typo', async () => {
    await preloadTranslitSearchIndex('translit-en');
    const hits = searchTranslitAyahs('bismi allahi rrahmani', surahIndex, 'en', { limit: 3 });
    assert.ok(hits.length >= 1);
    assert.equal(hits[0].surah, 1);
    assert.equal(hits[0].ayah, 1);
});

test('searchTranslitAyahs finds Turkish transliteration phrase', async () => {
    await preloadTranslitSearchIndex('translit-tr');
    const hits = searchTranslitAyahs('la raybe fih', surahIndex, 'tr', { limit: 3 });
    assert.ok(hits.length >= 1);
    assert.equal(hits[0].surah, 2);
    assert.equal(hits[0].ayah, 2);
    assert.equal(hits[0].kind, 'translit');
    assert.equal(hits[0].readModeId, 'translit-ar');
    assert.match(hits[0].snippet, /raybe/i);
});

test('searchTranslitAyahs tolerates one typo', async () => {
    await preloadTranslitSearchIndex('translit-tr');
    const hits = searchTranslitAyahs('elhamdu lillahi rabbi', surahIndex, 'tr', { limit: 3 });
    assert.ok(hits.length >= 1);
    assert.equal(hits[0].surah, 1);
    assert.equal(hits[0].ayah, 2);
});

test('searchTranslitAyahs matches joined phrase without spaces or hyphens', async () => {
    await preloadTranslitSearchIndex('translit-tr');
    const ikhlas = searchTranslitAyahs('kulhuvellahu', surahIndex, 'tr', { limit: 3 });
    assert.ok(ikhlas.some((h) => h.surah === 112 && h.ayah === 1));
    const joined = searchTranslitAyahs('kul huvelleahu', surahIndex, 'tr', { limit: 3 });
    assert.ok(joined.some((h) => h.surah === 112 && h.ayah === 1));
    const fatiha = searchTranslitAyahs('bismillahi', surahIndex, 'tr', { limit: 3 });
    assert.ok(fatiha.some((h) => h.surah === 1 && h.ayah === 1));
});

test('searchTranslitAyahs tolerates Turkish vowel variants', async () => {
    await preloadTranslitSearchIndex('translit-tr');
    const plain = searchTranslitAyahs('kul huve llahu', surahIndex, 'tr', { limit: 3 });
    assert.ok(plain.some((h) => h.surah === 112 && h.ayah === 1));
    const withUmlaut = searchTranslitAyahs('kul hüve llâhü', surahIndex, 'tr', { limit: 3 });
    assert.ok(withUmlaut.some((h) => h.surah === 112 && h.ayah === 1));
});

test('searchAyahTextHits merges meal and translit', async () => {
    await preloadMealSearchIndex('tr');
    await preloadTranslitSearchIndex('translit-tr');
    const mealHits = searchAyahTextHits('dogrulugu suphe goturmeyen', surahIndex, 'tr', { limit: 5 });
    assert.ok(mealHits.some((h) => h.kind === 'meal'));
    const translitHits = searchAyahTextHits('bismi llahi rrahman', surahIndex, 'tr', { limit: 5 });
    assert.ok(translitHits.some((h) => h.kind === 'translit'));
});

test('searchAyahTextHits keeps meal and translit as separate rows', async () => {
    await preloadMealSearchIndex('en');
    await preloadTranslitSearchIndex('translit-en');
    const translitHits = searchAyahTextHits('la rayba feehi', surahIndex, 'en', { limit: 8 });
    assert.ok(translitHits.some((h) => h.kind === 'translit' && h.surah === 2 && h.ayah === 2));
    const mealHits = searchAyahTextHits('no doubt guidance', surahIndex, 'en', { limit: 8 });
    assert.ok(mealHits.some((h) => h.kind === 'meal' && h.surah === 2 && h.ayah === 2));
});

// Regresyon: non-latin meal dillerinde (bn, ur) ve ar'da latin okunuş sorgusu,
// meal/Arapça normalize'lı geçit tarafından silinip reddedilmemeli.
test('searchTranslitAyahs accepts latin query for non-latin locales (bn, ur, ar)', async () => {
    await preloadTranslitSearchIndex('translit-en');
    for (const code of ['bn', 'ur', 'ar']) {
        const hits = searchTranslitAyahs('bismi allahi', surahIndex, code, { limit: 3 });
        assert.ok(hits.length >= 1, `${code}: okunuş sonucu dönmeli`);
        assert.equal(hits[0].surah, 1, `${code}: surah 1`);
        assert.equal(hits[0].ayah, 1, `${code}: ayah 1`);
    }
});

test('searchAyahTextHits surfaces translit hit for non-latin locales (bn, ur)', async () => {
    await preloadTranslitSearchIndex('translit-en');
    for (const code of ['bn', 'ur']) {
        await preloadMealSearchIndex(code);
        const hits = searchAyahTextHits('bismi allahi', surahIndex, code, { limit: 8 });
        assert.ok(
            hits.some((h) => h.readModeId === 'translit-ar' && h.surah === 1 && h.ayah === 1),
            `${code}: birleşik aramada okunuş 1:1 görünmeli`
        );
    }
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
