import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveScrollPlaceRestore } from './quran-scroll-place.js';

test('explicit ayah target wins over anchor and pixel restore', () => {
    assert.equal(
        resolveScrollPlaceRestore({
            scrollAyah: 7,
            forceSurahStart: true,
            savedAnchor: { surah: 2, ayah: 30 },
            savedReaderScrollTop: 9000
        }),
        'ayah'
    );
});

test('forceSurahStart skips place restore (surah-list open)', () => {
    assert.equal(
        resolveScrollPlaceRestore({
            scrollAyah: null,
            forceSurahStart: true,
            savedAnchor: { surah: 2, ayah: 30 },
            savedReaderScrollTop: 9000
        }),
        'surah'
    );
});

test('meal/locale redraw prefers ayah anchor over pixel scrollTop', () => {
    assert.equal(
        resolveScrollPlaceRestore({
            scrollAyah: null,
            forceSurahStart: false,
            savedAnchor: { surah: 2, ayah: 30 },
            savedReaderScrollTop: 9000
        }),
        'anchor'
    );
});

test('pixel restore is last resort when no ayah anchor exists', () => {
    assert.equal(
        resolveScrollPlaceRestore({
            scrollAyah: null,
            savedAnchor: null,
            savedReaderScrollTop: 4200
        }),
        'pixel'
    );
});

test('invalid or empty anchor falls through to pixel or surah start', () => {
    assert.equal(
        resolveScrollPlaceRestore({
            savedAnchor: { surah: 2, ayah: 0 },
            savedReaderScrollTop: 100
        }),
        'pixel'
    );
    assert.equal(
        resolveScrollPlaceRestore({
            savedAnchor: { surah: '', ayah: '' },
            savedReaderScrollTop: 0
        }),
        'surah'
    );
    assert.equal(
        resolveScrollPlaceRestore({
            savedAnchor: null,
            savedReaderScrollTop: null
        }),
        'surah'
    );
});
