import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveScrollListFinishAction } from './quran-surah-nav.js';

test('explicit ayah target wins over scroll restore', () => {
    assert.equal(
        resolveScrollListFinishAction({
            scrollAyah: 7,
            forceSurahStart: true,
            savedReaderScrollTop: 4200
        }),
        'ayah'
    );
});

test('forceSurahStart scrolls to surah even when prior scrollTop exists', () => {
    assert.equal(
        resolveScrollListFinishAction({
            scrollAyah: null,
            forceSurahStart: true,
            savedReaderScrollTop: 4200
        }),
        'surah'
    );
});

test('in-place rerender without forceSurahStart may restore scroll', () => {
    assert.equal(
        resolveScrollListFinishAction({
            scrollAyah: null,
            forceSurahStart: false,
            savedReaderScrollTop: 4200
        }),
        'restore'
    );
});

test('fresh open with zero scroll goes to surah start', () => {
    assert.equal(
        resolveScrollListFinishAction({
            scrollAyah: null,
            forceSurahStart: false,
            savedReaderScrollTop: 0
        }),
        'surah'
    );
    assert.equal(
        resolveScrollListFinishAction({
            scrollAyah: null,
            forceSurahStart: false,
            savedReaderScrollTop: null
        }),
        'surah'
    );
});
