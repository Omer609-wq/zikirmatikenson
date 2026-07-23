import test from 'node:test';
import assert from 'node:assert/strict';
import {
    getMushafNavOptsForRerender,
    getMushafNavOptsForSurahOpen
} from './quran-navigation.js';

test('explicit mushaf surah selection starts at selected surah', () => {
    assert.deepEqual(getMushafNavOptsForSurahOpen(null, 'mushaf'), { forceSurahStart: true });
});

test('ayah-specific mushaf navigation ignores saved page', () => {
    assert.deepEqual(getMushafNavOptsForSurahOpen(142, 'mushaf'), {});
});

test('mushaf rerender preserves saved page preference', () => {
    assert.deepEqual(getMushafNavOptsForRerender('mushaf'), { preferSaved: true });
    assert.deepEqual(getMushafNavOptsForRerender('scroll'), {});
});
