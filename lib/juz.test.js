import test from 'node:test';
import assert from 'node:assert/strict';
import { getJuzAtStart, getJuzDividerBeforeAyah, getJuzForAyah } from './juz.js';
import { getJuzDetail } from './hatim-juz.js';
import { setJuzLocale } from './juz-boundaries.js';

test('juz boundaries match standard Madinah mushaf', () => {
    const cases = [
        [1, 1, 1],
        [2, 142, 2],
        // 4., 7. ve 11. cüz adlarıyla başlar: لن تنالوا، وإذا سمعوا، يعتذرون
        [3, 91, 3],
        [3, 92, 4],
        [5, 82, 6],
        [5, 83, 7],
        [9, 93, 10],
        [9, 94, 11],
        [45, 33, 25],
        [46, 1, 26],
        [4, 147, 5],
        [4, 148, 6],
        [21, 1, 17],
        [25, 20, 18],
        [25, 21, 19],
        [27, 55, 19],
        [27, 56, 20],
        [29, 45, 20],
        [29, 46, 21],
        [33, 30, 21],
        [33, 31, 22],
        [36, 27, 22],
        [36, 28, 23],
        [67, 1, 29],
        [78, 1, 30],
        [114, 6, 30]
    ];
    for (const [surah, ayah, expected] of cases) {
        assert.equal(getJuzForAyah(surah, ayah), expected, `${surah}:${ayah}`);
    }
});

test('juz divider appears at cüz start ayahs (not ayah 1)', () => {
    assert.equal(getJuzAtStart(33, 31), 22);
    assert.equal(getJuzDividerBeforeAyah(33, 31), 22);
    assert.equal(getJuzDividerBeforeAyah(33, 1), null);
    assert.equal(getJuzDividerBeforeAyah(29, 46), 21);
});

test('Türk baskısı: 26. cüz Câsiye 33 ile sayfa başında başlar, diğerleri aynı', () => {
    setJuzLocale('tr');
    try {
        assert.equal(getJuzForAyah(45, 32), 25);
        assert.equal(getJuzForAyah(45, 33), 26);
        assert.equal(getJuzAtStart(45, 33), 26);
        assert.equal(getJuzForAyah(3, 92), 4);
        assert.equal(getJuzDetail(25).endPage, 501);
        assert.equal(getJuzDetail(26).startPage, 502);
        // Türkçede her cüz 20 sayfa; 1. cüzün 21 mushaf sayfası ekranda 20
        // (Fatiha ile Bakara başı tek sayfa), son cüz 23.
        for (let n = 2; n <= 29; n += 1) assert.equal(getJuzDetail(n).pageCount, 20, `cüz ${n}`);
    } finally {
        setJuzLocale('en');
    }
    assert.equal(getJuzForAyah(45, 33), 25, "dil değişince Medine düzeni geri gelir");
    assert.equal(getJuzDetail(26).startPage, 502);
    assert.equal(getJuzDetail(25).endPage, 502, "Medine: 26. cüz sayfa ortasında");
});
