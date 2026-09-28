import test from 'node:test';
import assert from 'node:assert/strict';
import { ayahOrdinal, mushafPage, mushafPageCount, mushafPageOfAyah, normalizeMushaf } from './mushaf.js';

function assertContiguous(mushaf) {
    let prev = -1;
    for (let p = 1; p <= mushafPageCount(mushaf); p += 1) {
        const page = mushafPage(p, mushaf);
        const first = ayahOrdinal(page.first.s, page.first.a);
        const last = ayahOrdinal(page.last.s, page.last.a);
        assert.equal(first, prev + 1, `${mushaf} ${p}. sayfa bir öncekinin devamı değil`);
        assert.ok(last >= first, `${mushaf} ${p}. sayfa ters`);
        prev = last;
    }
    assert.equal(prev, 6235, `${mushaf}: 6236 ayetin hepsi bir sayfada`);
}

test('iki baskı da 604 sayfa, boşluksuz ve üst üste binmeden', () => {
    for (const m of ['medina', 'tr']) {
        assert.equal(mushafPageCount(m), 604);
        assertContiguous(m);
    }
});

test('Türk baskısı: açılış tek sayfa, 2-580 Medine+1, 30. cüz kendi 24 sayfası', () => {
    assert.deepEqual(mushafPage(1, 'tr'), { first: { s: 1, a: 1 }, last: { s: 2, a: 5 } });
    assert.deepEqual(mushafPage(2, 'tr').first, { s: 2, a: 6 });
    // multimediaquran.com Türkçe cüz sayfalarıyla karşılaştırıldı
    assert.deepEqual(mushafPage(350, 'tr'), mushafPage(351, 'medina'));
    assert.deepEqual(mushafPage(580, 'tr'), { first: { s: 77, a: 20 }, last: { s: 77, a: 50 } });
    assert.deepEqual(mushafPage(581, 'tr'), { first: { s: 78, a: 1 }, last: { s: 78, a: 30 } });
    assert.deepEqual(mushafPage(592, 'tr'), { first: { s: 88, a: 12 }, last: { s: 89, a: 14 } });
    assert.deepEqual(mushafPage(604, 'tr'), { first: { s: 112, a: 1 }, last: { s: 114, a: 6 } });
});

test('ayetin sayfası', () => {
    assert.equal(mushafPageOfAyah(1, 1, 'tr'), 1);
    assert.equal(mushafPageOfAyah(2, 5, 'tr'), 1);
    assert.equal(mushafPageOfAyah(2, 6, 'tr'), 2);
    assert.equal(mushafPageOfAyah(2, 6, 'medina'), 3);
    assert.equal(mushafPageOfAyah(88, 12, 'tr'), 592);
    assert.equal(mushafPageOfAyah(88, 11, 'tr'), 591);
    assert.equal(mushafPageOfAyah(114, 6, 'tr'), 604);
});

test('geçersiz ayet ve baskı', () => {
    assert.equal(ayahOrdinal(2, 287), null);
    assert.equal(ayahOrdinal(0, 1), null);
    assert.equal(ayahOrdinal(1, 1), 0);
    assert.equal(normalizeMushaf('tr'), 'tr');
    assert.equal(normalizeMushaf('en'), null);
});
