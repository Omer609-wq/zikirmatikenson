import test from 'node:test';
import assert from 'node:assert/strict';
import {
    buildSearchHaystack,
    compactSearchText,
    matchesSearchQuery,
    normalizeSearchText,
    scoreSearchMatch,
    toSearchTokens
} from './fuzzy-search.js';

test('normalizeSearchText strips Turkish accents and special letters', () => {
    assert.equal(normalizeSearchText('Yâ Rahmân'), 'ya rahman');
    assert.equal(normalizeSearchText('Yâ Bâsıt'), 'ya basit');
    assert.equal(normalizeSearchText('Ğufreâneke'), 'gufreaneke');
    assert.equal(normalizeSearchText('İSTİĞFAR'), 'istigfar');
    assert.equal(normalizeSearchText('Şükür Çokça Öğün'), 'sukur cokca ogun');
});

test('normalizeSearchText drops punctuation and collapses spaces', () => {
    assert.equal(normalizeSearchText("  Yâ Mu'izz  "), 'ya mu izz');
    assert.equal(normalizeSearchText('Buhari, Vudu 23; Müslim'), 'buhari vudu 23 muslim');
    assert.equal(normalizeSearchText(null), '');
    assert.equal(normalizeSearchText(undefined), '');
});

test('normalizeSearchText unifies Arabic harakat and letter variants', () => {
    assert.equal(normalizeSearchText('بِسْمِ'), normalizeSearchText('بسم'));
    assert.equal(normalizeSearchText('أَللّٰه'), normalizeSearchText('الله'));
    assert.equal(normalizeSearchText('رَحْمَٰن'), normalizeSearchText('رحمن'));
});

test('normalizeSearchText keeps Bengali vowel signs intact', () => {
    // \p{M} atılırsa "বাংলা" → "ব ল" olur ve kelime paramparça olur.
    assert.equal(normalizeSearchText('বাংলা'), 'বাংলা');
    assert.equal(normalizeSearchText('সর্বশক্তিমান'), 'সর্বশক্তিমান');
    assert.deepEqual(toSearchTokens('আর-রহমান'), ['আর', 'রহমান']);
});

test('search works in every app language', () => {
    // tr / en / fr / id / ms — latin
    assert.ok(matchesSearchQuery(['Yâ Rahmân'], 'rahman'), 'tr');
    assert.ok(matchesSearchQuery(['The Most Merciful'], 'mercifull'), 'en');
    assert.ok(matchesSearchQuery(['Le Très Miséricordieux'], 'misericordieux'), 'fr');
    assert.ok(matchesSearchQuery(['Yang Maha Pengasih'], 'pengasi'), 'id/ms');
    // ar / ur — hareke ve harf varyantları
    assert.ok(matchesSearchQuery(['الرَّحْمَٰن'], 'الرحمن'), 'ar harekesiz');
    assert.ok(matchesSearchQuery(['يَا رَحْمَنُ'], 'الرحمن'), 'ar belirtme takisi');
    assert.ok(matchesSearchQuery(['اللہ کریم'], 'الله كريم'), 'ur klavyesi ↔ ar harfleri');
    // bn
    assert.ok(matchesSearchQuery(['আর-রহমান', 'পরম করুণাময়'], 'রহমান'), 'bn');
    assert.ok(matchesSearchQuery(['আর-রহমান', 'পরম করুণাময়'], 'রহমন'), 'bn yazim hatasi');
    assert.equal(matchesSearchQuery(['আর-রহমান', 'পরম করুণাময়'], 'বাংলাদেশ'), false, 'bn alakasiz');
});

test('compactSearchText removes word gaps', () => {
    assert.equal(compactSearchText("Yâ Mu'izz"), 'yamuizz');
});

test('toSearchTokens splits a normalized query', () => {
    assert.deepEqual(toSearchTokens('  Yâ   Rahmân '), ['ya', 'rahman']);
    assert.deepEqual(toSearchTokens('   '), []);
});

test('toSearchTokens drops the Arabic article but keeps short words whole', () => {
    assert.deepEqual(toSearchTokens('الرحمن'), ['رحمن']);
    assert.deepEqual(toSearchTokens('الكريم'), ['كريم']);
    assert.deepEqual(toSearchTokens('الله'), ['الله'], '"الله" budanmamali');
    assert.deepEqual(toSearchTokens('ال'), ['ال']);
});

const ESMA_RAHMAN = ['Yâ Rahman', 'Tüm yaratılanlara merhamet eden'];
const ESMA_BASIT = ['Yâ Bâsıt', 'İstediğine bolluk veren'];
const ESMA_MUIZZ = ['Yâ Mu\'izz', 'Aziz kılan, dilediğini yücelten'];

test('accent-free typing finds the accented entry', () => {
    assert.ok(matchesSearchQuery(ESMA_RAHMAN, 'rahman'));
    assert.ok(matchesSearchQuery(ESMA_BASIT, 'basit'));
    assert.ok(matchesSearchQuery(ESMA_BASIT, 'BASIT'));
});

test('a single wrong, missing or extra letter still matches', () => {
    assert.ok(matchesSearchQuery(ESMA_RAHMAN, 'rahmn'), 'eksik harf');
    assert.ok(matchesSearchQuery(ESMA_RAHMAN, 'rahmann'), 'fazla harf');
    assert.ok(matchesSearchQuery(ESMA_RAHMAN, 'rehman'), 'yanlis harf');
    assert.ok(matchesSearchQuery(ESMA_RAHMAN, 'rahamn'), 'yer degistirmis harf');
    assert.ok(matchesSearchQuery(ESMA_RAHMAN, 'merhemet'), 'meal alaninda hata');
});

test('long queries tolerate two mistakes', () => {
    assert.ok(matchesSearchQuery(['Yâ Müheymin'], 'muhaymin'));
    assert.ok(matchesSearchQuery(['Yâ Mütekebbir'], 'mutekebir'));
    assert.ok(matchesSearchQuery(['Esmaül Hüsna'], 'esmaul husnaa'));
});

test('short queries stay strict so results do not turn to noise', () => {
    assert.ok(matchesSearchQuery(["Yâ 'Adl", 'Adil olan'], 'adl'));
    assert.equal(matchesSearchQuery(["Yâ 'Adl", 'Adil olan'], 'ekm'), false);
});

test('apostrophe and spacing differences do not break the match', () => {
    assert.ok(matchesSearchQuery(ESMA_MUIZZ, 'muizz'));
    assert.ok(matchesSearchQuery(ESMA_MUIZZ, "mu'izz"));
    assert.ok(matchesSearchQuery(['Esma\'ül Hüsna'], 'esmaulhusna'));
});

test('every query word must match somewhere', () => {
    const dua = [
        'Allahümme innî eûzü bike minel hubsi vel habâisi',
        'Ya Allah, pislikten ve pis varlıklardan Sana sığınıyorum.',
        'tuvalet hela wc lavabo abdesthane'
    ];
    assert.ok(matchesSearchQuery(dua, 'tuvalet lavabo'), 'iki kelime de gecmeli');
    assert.equal(matchesSearchQuery(dua, 'tuvalet dua'), false, '"dua" hicbir alanda yok');
    assert.equal(matchesSearchQuery(dua, 'tuvalet araba'), false);
    assert.ok(matchesSearchQuery(dua, 'tuvalt'), 'yazim hatasi telafi edilir');
});

test('unrelated queries still return nothing', () => {
    assert.equal(matchesSearchQuery(ESMA_RAHMAN, 'kitap'), false);
    assert.equal(matchesSearchQuery(ESMA_RAHMAN, 'bilgisayar'), false);
    assert.equal(matchesSearchQuery(ESMA_BASIT, 'rahman'), false);
});

test('compact matching does not leak across fields', () => {
    // "veren" ile "istediğine" ayrı alanlarda; bitişik hâli eşleşme üretmemeli.
    assert.equal(matchesSearchQuery(['abc', 'def'], 'abcdef'), false);
    assert.ok(matchesSearchQuery(['abc def'], 'abcdef'));
});

test('scoreSearchMatch ranks exact over prefix over fuzzy', () => {
    const tokens = toSearchTokens('rahman');
    const exact = scoreSearchMatch(buildSearchHaystack(['Yâ Rahman']), tokens);
    const prefix = scoreSearchMatch(buildSearchHaystack(['Yâ Rahmaniyye']), tokens);
    const fuzzy = scoreSearchMatch(buildSearchHaystack(['Yâ Rahmen']), tokens);

    assert.ok(exact != null && prefix != null && fuzzy != null);
    assert.ok(exact < prefix, 'tam eslesme once gelir');
    assert.ok(prefix < fuzzy, 'on ek yazim hatasindan once gelir');
});

test('earlier fields outrank later ones at the same quality', () => {
    const tokens = toSearchTokens('selam');
    const inName = scoreSearchMatch(buildSearchHaystack(['Yâ Selâm', 'bolluk veren']), tokens);
    const inMeaning = scoreSearchMatch(buildSearchHaystack(['Yâ Kuddûs', 'selam veren']), tokens);
    assert.ok(inName < inMeaning);
});

test('empty query matches everything', () => {
    assert.equal(scoreSearchMatch(buildSearchHaystack(ESMA_RAHMAN), []), 0);
    assert.ok(matchesSearchQuery(ESMA_RAHMAN, ''));
    assert.ok(matchesSearchQuery(ESMA_RAHMAN, '   '));
});

test('haystack tolerates empty and nullish fields', () => {
    const hay = buildSearchHaystack(['Yâ Rahman', '', null, undefined, 0]);
    assert.ok(scoreSearchMatch(hay, toSearchTokens('rahman')) != null);
});

test('Esma haystack: locale-independent name and meaning variants match', () => {
    // folderZikirSearchParts: aktif locale adı + getKnownEsmaNames/Meanings hepsi.
    // TR UI'da EN meal / BN okunuş / harekesiz Arapça da bulunsun.
    const rahmanParts = [
        'Yâ Rahmân',
        'Tüm yaratılanlara merhamet eden',
        'الرَّحْمَٰن',
        'Ya Rahman',
        'The Most Merciful',
        'আর-রহমান',
        'الرحمن'
    ];
    assert.ok(matchesSearchQuery(rahmanParts, 'rahman'), 'tr/en okunus');
    assert.ok(matchesSearchQuery(rahmanParts, 'merciful'), 'en meal');
    assert.ok(matchesSearchQuery(rahmanParts, 'merhamet'), 'tr meal');
    assert.ok(matchesSearchQuery(rahmanParts, 'রহমান'), 'bn okunus');
    assert.ok(matchesSearchQuery(rahmanParts, 'الرحمن'), 'ar');
    assert.ok(matchesSearchQuery(rahmanParts, 'rahmn'), 'yazim hatasi');
    assert.equal(matchesSearchQuery(rahmanParts, 'basit'), false, 'baska esma degil');
});
