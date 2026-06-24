import test from 'node:test';
import assert from 'node:assert/strict';
import {
    MUSHAF_PAGE_COUNT,
    getPageForAyah,
    getPageSegments,
    getPageStartAyah,
    getPageEndAyah,
    listAyahsOnPage,
    pageStartsSurah
} from './quran-pages.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const source = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'data', 'quran', 'madani-pages-source.json'), 'utf8')
);

test('mushaf has 604 pages', () => {
    assert.equal(MUSHAF_PAGE_COUNT, 604);
    assert.equal(getPageSegments(1).length, 1);
    assert.equal(getPageSegments(604).length, 3);
});

test('getPageForAyah matches known Madani boundaries', () => {
    assert.equal(getPageForAyah(1, 1), 1);
    assert.equal(getPageForAyah(2, 1), 2);
    assert.equal(getPageForAyah(2, 142), 22);
    assert.equal(getPageForAyah(33, 31), 422);
    assert.equal(getPageForAyah(114, 6), 604);
});

test('listAyahsOnPage covers Fatiha on page 1', () => {
    const ayahs = listAyahsOnPage(1);
    assert.equal(ayahs.length, 7);
    assert.deepEqual(ayahs[0], { s: 1, a: 1 });
    assert.deepEqual(ayahs[6], { s: 1, a: 7 });
});

test('pageStartsSurah detects surah headers', () => {
    assert.equal(pageStartsSurah(1), true);
    assert.equal(pageStartsSurah(2), true);
    assert.equal(pageStartsSurah(3), false);
});

test('page bounds match Madani source JSON', () => {
    for (const row of source.pages) {
        const start = getPageStartAyah(row.page);
        const end = getPageEndAyah(row.page);
        const [sk, sa] = row.starts_with.verse_key.split(':').map(Number);
        const [ek, ea] = row.ends_with.verse_key.split(':').map(Number);
        assert.deepEqual(start, { s: sk, a: sa }, `page ${row.page} start`);
        assert.deepEqual(end, { s: ek, a: ea }, `page ${row.page} end`);
    }
});
