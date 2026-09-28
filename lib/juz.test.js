import test from 'node:test';
import assert from 'node:assert/strict';
import { getJuzAtStart, getJuzDividerBeforeAyah, getJuzForAyah } from './juz.js';
import { getJuzDetail } from './hatim-juz.js';
import { setJuzLocale } from './juz-boundaries.js';

test('juz boundaries match standard Madinah mushaf', () => {
    const cases = [
        [1, 1, 1],
        [2, 142, 2],
        // Medine: 4. cüz "كل الطعام", 7. cüz "لتجدن", 11. cüz "إنما السبيل"
        [3, 92, 3],
        [3, 93, 4],
        [5, 81, 6],
        [5, 82, 7],
        [9, 92, 10],
        [9, 93, 11],
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

test('Türk baskısı: 4., 7., 11. ve 26. cüz sayfa başında başlar', () => {
    setJuzLocale('tr');
    try {
        // Len tenâlû, Ve izâ semiû, Ya'tezirûne, Câsiye 33
        for (const [s, a, juz] of [[3, 91, 3], [3, 92, 4], [5, 82, 6], [5, 83, 7], [9, 93, 10], [9, 94, 11], [45, 32, 25], [45, 33, 26]]) {
            assert.equal(getJuzForAyah(s, a), juz, `${s}:${a}`);
        }
        assert.equal(getJuzAtStart(45, 33), 26);
        assert.equal(getJuzDetail(3).endPage, 61);
        assert.equal(getJuzDetail(25).endPage, 501);
        assert.equal(getJuzDetail(26).startPage, 502);
        // Türkçede her cüz 20 sayfa; 1. cüzün 21 mushaf sayfası ekranda 20
        // (Fatiha ile Bakara başı tek sayfa), son cüz 23.
        for (let n = 2; n <= 29; n += 1) assert.equal(getJuzDetail(n).pageCount, 20, `cüz ${n}`);
    } finally {
        setJuzLocale('en');
    }
    assert.equal(getJuzForAyah(45, 33), 25, "dil değişince Medine düzeni geri gelir");
    assert.equal(getJuzForAyah(3, 92), 3);
    assert.equal(getJuzDetail(26).startPage, 502);
    // Medine: yeni cüz sayfa ortasında başlar, önceki o sayfayı da kapsar.
    assert.equal(getJuzDetail(25).endPage, 502);
    assert.equal(getJuzDetail(3).endPage, 62);
    assert.equal(getJuzDetail(7).startPage, 121);
    assert.equal(getJuzDetail(11).startPage, 201);
});
