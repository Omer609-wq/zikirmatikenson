import test from 'node:test';
import assert from 'node:assert/strict';
import {
    splitIntoBalancedPages,
    findPageIndex,
    clampPageIndex,
    MONTH_CHART_PAGE_COUNT,
    YEAR_CHART_PAGE_COUNT
} from './chart-pages.js';

const days = (n) => Array.from({ length: n }, (_, i) => i + 1);
const sizes = (pages) => pages.map((p) => p.length);

test('ay uzunluklari iki sayfaya dengeli bolunur', () => {
    assert.deepEqual(sizes(splitIntoBalancedPages(days(31), 2)), [16, 15]);
    assert.deepEqual(sizes(splitIntoBalancedPages(days(30), 2)), [15, 15]);
    assert.deepEqual(sizes(splitIntoBalancedPages(days(29), 2)), [15, 14]);
    assert.deepEqual(sizes(splitIntoBalancedPages(days(28), 2)), [14, 14]);
});

test('sayfalar arasi fark hicbir ay uzunlugunda 1i gecmez', () => {
    for (let n = 28; n <= 31; n++) {
        const s = sizes(splitIntoBalancedPages(days(n), MONTH_CHART_PAGE_COUNT));
        assert.ok(Math.max(...s) - Math.min(...s) <= 1, `${n} gun -> ${s.join('+')}`);
    }
});

test('bolme veriyi bozmaz: sira korunur, hicbir gun kaybolmaz veya tekrarlamaz', () => {
    for (let n = 28; n <= 31; n++) {
        const flat = splitIntoBalancedPages(days(n), 2).flat();
        assert.deepEqual(flat, days(n), `${n} gun`);
    }
});

test('yilin 12 ayi 6+6 bolunur, sira korunur', () => {
    const months = days(12);
    const pages = splitIntoBalancedPages(months, YEAR_CHART_PAGE_COUNT);
    assert.deepEqual(sizes(pages), [6, 6]);
    assert.deepEqual(pages.flat(), months);
});

test('bu ayin sayfasi bulunur: ocak-haziran ilk, temmuz-aralik ikinci', () => {
    const pages = splitIntoBalancedPages(days(12), YEAR_CHART_PAGE_COUNT);
    assert.equal(findPageIndex(pages, (m) => m === 1), 0);
    assert.equal(findPageIndex(pages, (m) => m === 6), 0);
    assert.equal(findPageIndex(pages, (m) => m === 7), 1);
    assert.equal(findPageIndex(pages, (m) => m === 12), 1);
});

test('tek sayfa istendiginde dizi oldugu gibi doner', () => {
    assert.deepEqual(splitIntoBalancedPages(days(30), 1), [days(30)]);
});

test('bos giris tek bos sayfa verir (render dongusu kirilmasin)', () => {
    assert.deepEqual(splitIntoBalancedPages([], 2), [[]]);
    assert.deepEqual(splitIntoBalancedPages(null, 2), [[]]);
});

test('ogeden fazla sayfa istenirse bos sayfa uretilmez', () => {
    assert.deepEqual(splitIntoBalancedPages([1], 2), [[1]]);
    assert.deepEqual(splitIntoBalancedPages([1, 2], 3), [[1], [2]]);
});

test('bozuk pageCount tek sayfaya duser', () => {
    for (const bad of [0, -1, NaN, undefined, 'x']) {
        assert.deepEqual(splitIntoBalancedPages(days(5), bad), [days(5)]);
    }
});

test('bugunun sayfasi bulunur', () => {
    const pages = splitIntoBalancedPages(days(30), 2);
    assert.equal(findPageIndex(pages, (d) => d === 3), 0);
    assert.equal(findPageIndex(pages, (d) => d === 15), 0);
    assert.equal(findPageIndex(pages, (d) => d === 16), 1);
    assert.equal(findPageIndex(pages, (d) => d === 30), 1);
});

test('eslesme yoksa ilk sayfa', () => {
    const pages = splitIntoBalancedPages(days(30), 2);
    assert.equal(findPageIndex(pages, (d) => d === 99), 0);
    assert.equal(findPageIndex(null, () => true), 0);
    assert.equal(findPageIndex(pages, null), 0);
});

test('sayfa indeksi aralikta tutulur', () => {
    assert.equal(clampPageIndex(-5, 2), 0);
    assert.equal(clampPageIndex(0, 2), 0);
    assert.equal(clampPageIndex(1, 2), 1);
    assert.equal(clampPageIndex(9, 2), 1);
    assert.equal(clampPageIndex(NaN, 2), 0);
});
