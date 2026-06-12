import test from 'node:test';
import assert from 'node:assert/strict';
import surahIndex from './data/quran/index.json' with { type: 'json' };
import {
    normalizeTrSearchText,
    normalizeLatinSearchText,
    parseQuranRefQuery,
    resolveQuranRefSuggestions,
    resolveSurahNameQuery
} from './quran-ref-search.js';

test('normalizeTrSearchText folds Turkish', () => {
    assert.equal(normalizeTrSearchText('Âl-i İmrân'), 'al i imran');
    assert.equal(normalizeTrSearchText('Bakara'), 'bakara');
});

test('parseQuranRefQuery accepts common formats', () => {
    assert.deepEqual(parseQuranRefQuery('bakara 12'), {
        type: 'ref',
        namePart: 'bakara',
        ayah: 12
    });
    assert.deepEqual(parseQuranRefQuery('bakara 12. ayet'), {
        type: 'ref',
        namePart: 'bakara',
        ayah: 12
    });
    assert.deepEqual(parseQuranRefQuery('Al-Baqarah 12 verse'), {
        type: 'ref',
        namePart: 'Al-Baqarah',
        ayah: 12
    });
    assert.deepEqual(parseQuranRefQuery('2:12'), {
        type: 'ref',
        surahHint: 2,
        ayah: 12
    });
});

test('resolveQuranRefSuggestions TR: Bakara 12', () => {
    const hits = resolveQuranRefSuggestions('bakara 12', surahIndex, 'tr');
    assert.equal(hits.length, 1);
    assert.equal(hits[0].surah, 2);
    assert.equal(hits[0].ayah, 12);
    assert.equal(hits[0].displayName, 'Bakara');
});

test('resolveQuranRefSuggestions EN: Al-Baqarah 12', () => {
    const hits = resolveQuranRefSuggestions('al-baqarah 12', surahIndex, 'en');
    assert.equal(hits.length, 1);
    assert.equal(hits[0].surah, 2);
    assert.equal(hits[0].displayName, 'Al-Baqarah');
});

test('resolveQuranRefSuggestions tolerates typo', () => {
    const hits = resolveQuranRefSuggestions('bakera 12', surahIndex, 'tr');
    assert.equal(hits.length, 1);
    assert.equal(hits[0].surah, 2);
});

test('resolveSurahNameQuery fuzzy match', () => {
    const hit = resolveSurahNameQuery('bakera', surahIndex, 'tr');
    assert.ok(hit && hit.surah);
    assert.equal(hit.surah.n, 2);

    const enHit = resolveSurahNameQuery('baqarah', surahIndex, 'en');
    assert.ok(enHit && enHit.surah);
    assert.equal(enHit.surah.n, 2);
});

test('normalizeLatinSearchText', () => {
    assert.equal(normalizeLatinSearchText('Al-Baqarah'), 'al baqarah');
});
