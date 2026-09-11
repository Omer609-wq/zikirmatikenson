import test from 'node:test';
import assert from 'node:assert/strict';
import surahIndex from './data/quran/index.json' with { type: 'json' };
import {
    dropWeakSurahMatches,
    normalizeTrSearchText,
    normalizeLatinSearchText,
    parseQuranRefQuery,
    parseScopedMealSearchQuery,
    resolveQuranRefSuggestions,
    resolveSurahNameQuery,
    scoreSurahRefSearch,
    surahMatchesRefSearch
} from './quran-ref-search.js';

const surahByN = (n) => surahIndex.find((s) => s.n === n);

test('normalizeTrSearchText folds Turkish', () => {
    assert.equal(normalizeTrSearchText('Âl-i İmrân'), 'al i imran');
    assert.equal(normalizeTrSearchText('Bakara'), 'bakara');
});

test('normalizeTrSearchText folds the dotless i instead of dropping it', () => {
    // Katlanmazsa "k yamet" olur ve kelime ikiye bölünür.
    assert.equal(normalizeTrSearchText('Kıyâmet'), 'kiyamet');
    assert.equal(normalizeTrSearchText('Vâkıa'), 'vakia');
    assert.equal(normalizeTrSearchText('Târık'), 'tarik');
    // Türkçede büyük I küçükken ı olur; mobil klavyenin otomatik büyük harfi.
    assert.equal(normalizeTrSearchText('Ihlas'), 'ihlas');
    assert.equal(normalizeLatinSearchText('Târık'), 'tarik');
});

test('surah list finds dotless-i names typed with a plain i', () => {
    for (const [n, typed] of [[75, 'kiyamet'], [56, 'vakia'], [86, 'tarik'], [35, 'fatir']]) {
        assert.ok(surahMatchesRefSearch(surahByN(n), typed, 'tr'), `#${n} "${typed}"`);
    }
});

test('surah list tolerates a typo like the suggestion row does', () => {
    // "bakra" önerilerde çözülüyordu ama listede kayboluyordu; ikisi artık aynı.
    assert.ok(resolveSurahNameQuery('bakra', surahIndex, 'tr')?.surah);
    assert.ok(surahMatchesRefSearch(surahByN(2), 'bakra', 'tr'));
    assert.ok(surahMatchesRefSearch(surahByN(36), 'yasn', 'tr'));
    assert.ok(surahMatchesRefSearch(surahByN(2), 'baqara', 'en'));
});

test('surah list stays strict: number, ayah count and nonsense', () => {
    assert.ok(surahMatchesRefSearch(surahByN(36), '36', 'tr'), 'sure numarasi');
    assert.ok(surahMatchesRefSearch(surahByN(2), '286', 'tr'), 'ayet sayisi');
    const noise = surahIndex.filter((s) => surahMatchesRefSearch(s, 'qqqqqq', 'tr'));
    assert.equal(noise.length, 0);
    const bakra = surahIndex.filter((s) => surahMatchesRefSearch(s, 'bakra', 'tr'));
    assert.ok(bakra.length <= 5, `fuzzy liste sismemeli, ${bakra.length} sonuc`);
});

/** Liste sırası: renderQuranSurahList ile aynı kural. */
function rankedSurahs(query, locale = 'tr') {
    return dropWeakSurahMatches(
        surahIndex
            .map((s) => ({ s, score: scoreSurahRefSearch(s, query, locale) }))
            .filter((row) => row.score != null)
            .sort((a, b) => a.score - b.score || a.s.n - b.s.n)
    ).map((row) => row.s.n);
}

test('surah list ranks the intended surah first', () => {
    // "tarik" Talâk/Tahrîm'e de yakın; Târık (#86) mushaf sirasinda sonda kalmamali.
    assert.equal(rankedSurahs('tarik')[0], 86);
    assert.equal(rankedSurahs('bakra')[0], 2);
    assert.equal(rankedSurahs('vakia')[0], 56);
    assert.equal(rankedSurahs('kiyamet')[0], 75);
    assert.equal(rankedSurahs('yasn')[0], 36);
    assert.equal(rankedSurahs('36')[0], 36, 'sure numarasi ayet sayisini yener');
    assert.equal(rankedSurahs('baqara', 'en')[0], 2);
});

test('empty query keeps every surah in mushaf order', () => {
    assert.equal(scoreSurahRefSearch(surahByN(114), '', 'tr'), 0);
    assert.deepEqual(rankedSurahs(''), surahIndex.map((s) => s.n));
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

test('a solid name match never falls through to a distant one', () => {
    // Târık 17 ayet; 45. ayet yok diye Fransızca "Marie" üzerinden Meryem'e
    // düşülüyordu. Doğru davranış: yanlış sure önermek yerine hiç önermemek.
    assert.deepEqual(resolveQuranRefSuggestions('tarik 45', surahIndex, 'tr'), []);
    assert.deepEqual(resolveQuranRefSuggestions('tarik 18', surahIndex, 'tr'), []);

    const inRange = resolveQuranRefSuggestions('tarik 15', surahIndex, 'tr');
    assert.equal(inRange.length, 1);
    assert.equal(inRange[0].surah, 86);
});

test('dropWeakSurahMatches keeps typo rows when nothing matched solidly', () => {
    const solid = [{ score: 0 }, { score: 2 }, { score: 12 }];
    assert.deepEqual(dropWeakSurahMatches(solid), [{ score: 0 }, { score: 2 }]);

    const typoOnly = [{ score: 11 }, { score: 12 }];
    assert.deepEqual(dropWeakSurahMatches(typoOnly), typoOnly);
    assert.deepEqual(dropWeakSurahMatches([]), []);
});

test('surah list drops cross-language near misses', () => {
    // "tarik" Fransızca "Marie", "Talâk", "Tahrîm"e de 2 harf uzaklıktaydı.
    assert.deepEqual(rankedSurahs('tarik'), [86]);
    assert.deepEqual(rankedSurahs('kiyamet'), [75]);
    assert.deepEqual(rankedSurahs('nas'), [114, 110], 'net eslesmeler birlikte kalir');
    assert.equal(rankedSurahs('bakra')[0], 2, 'yazim hatasi toleransi durur');
    assert.ok(rankedSurahs('bakra').length > 1);
});

test('resolveSurahNameQuery fuzzy match', () => {
    const hit = resolveSurahNameQuery('bakera', surahIndex, 'tr');
    assert.ok(hit && hit.surah);
    assert.equal(hit.surah.n, 2);

    const enHit = resolveSurahNameQuery('baqarah', surahIndex, 'en');
    assert.ok(enHit && enHit.surah);
    assert.equal(enHit.surah.n, 2);
});

test('parseScopedMealSearchQuery splits surah and text', () => {
    const scoped = parseScopedMealSearchQuery('kehf hidayet', surahIndex, 'tr');
    assert.equal(scoped?.surah, 18);
    assert.equal(scoped?.text, 'hidayet');
    assert.equal(scoped?.surahName, 'Kehf');
});

test('parseScopedMealSearchQuery ignores meal words mistaken for surah names', () => {
    assert.equal(parseScopedMealSearchQuery('goturmeyen suphe dogruluk', surahIndex, 'tr'), null);
});

test('normalizeLatinSearchText', () => {
    assert.equal(normalizeLatinSearchText('Al-Baqarah'), 'al baqarah');
});
