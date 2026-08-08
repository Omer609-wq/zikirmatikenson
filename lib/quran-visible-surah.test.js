import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveQuranReaderSurahId } from './quran-visible-surah.js';

describe('resolveQuranReaderSurahId', () => {
    it('prefers the visible surah after jump/scroll', () => {
        assert.equal(resolveQuranReaderSurahId(2, 1), 1);
        assert.equal(resolveQuranReaderSurahId(2, 3), 3);
    });

    it('falls back to current when visible is missing (mushaf / no DOM)', () => {
        assert.equal(resolveQuranReaderSurahId(5, null), 5);
        assert.equal(resolveQuranReaderSurahId(5, undefined), 5);
        assert.equal(resolveQuranReaderSurahId(5, NaN), 5);
    });

    it('clamps to valid 1..114 and defaults safely', () => {
        assert.equal(resolveQuranReaderSurahId(2, 0), 2);
        assert.equal(resolveQuranReaderSurahId(2, 115), 2);
        assert.equal(resolveQuranReaderSurahId(null, null), 1);
        assert.equal(resolveQuranReaderSurahId('x', 'y'), 1);
        assert.equal(resolveQuranReaderSurahId(12.7, null), 12);
    });
});
