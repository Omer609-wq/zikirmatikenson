import test from 'node:test';
import assert from 'node:assert/strict';
import { getJuzAtStart, getJuzDividerBeforeAyah, getJuzForAyah } from './juz.js';

test('juz boundaries match standard Madinah mushaf (Tanzil)', () => {
    const cases = [
        [1, 1, 1],
        [2, 142, 2],
        [3, 92, 3],
        [3, 93, 4],
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
