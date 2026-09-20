/**
 * Grafiğin sayfalara DENGELİ bölünmesi + yardımcılar.
 *
 * Not: Aylık grafik artık sayfaya bölünmüyor — 30 gün tek şeritte tutulup
 * parmakla yatay kaydırılıyor (bkz. app.js renderMonthScrollChart). Yıl grafiği
 * de her zaman bölünmüyor; ay adları kutuya sığmadığında (Arapça/Urduca/Bengalce
 * gibi uzun adlar) çizim anında ölçülüp 6+6'ya bölünüyor, sığan dillerde 12 ay
 * tek sayfada kalıyor (bkz. app.js renderAdaptiveYearChart).
 *
 * splitIntoBalancedPages hâlâ o 6+6 bölme için kullanılıyor. Bölme DENGELİ:
 * sabit dilim değil, iki sayfa arasındaki fark hiçbir zaman 1 çubuğu geçmez:
 *   12 ay -> 6+6   ve genel olarak 31 -> 16+15   29 -> 15+14   28 -> 14+14
 */

/** İkiye bölme için sabit (splitIntoBalancedPages testinde de kullanılır). */
export const MONTH_CHART_PAGE_COUNT = 2;

/** Yıl grafiği bölününce kaç sayfa: ocak–haziran / temmuz–aralık. */
export const YEAR_CHART_PAGE_COUNT = 2;

/**
 * Diziyi olabildiğince eşit `pageCount` parçaya böler; artan varsa baştaki
 * sayfalar birer fazla alır (16+15 gibi).
 *
 * @template T
 * @param {T[]} items
 * @param {number} pageCount
 * @returns {T[][]} en az bir sayfa; boş dizi için [[]]
 */
export function splitIntoBalancedPages(items, pageCount) {
    const list = Array.isArray(items) ? items : [];
    const pages = Math.max(1, Math.floor(Number(pageCount) || 1));
    if (list.length === 0) return [[]];
    if (pages === 1) return [list.slice()];

    const base = Math.floor(list.length / pages);
    const extra = list.length % pages;

    const out = [];
    let i = 0;
    for (let p = 0; p < pages; p++) {
        const size = base + (p < extra ? 1 : 0);
        // Öğeden az sayfa istendiyse (ör. 1 öğe, 2 sayfa) boş sayfa üretme.
        if (size === 0) break;
        out.push(list.slice(i, i + size));
        i += size;
    }
    return out;
}

/**
 * Verilen öğenin hangi sayfada olduğunu bulur; bulunamazsa 0.
 * Grafik açılırken bugünün / bu ayın bulunduğu sayfayı göstermek için.
 *
 * @template T
 * @param {T[][]} pages
 * @param {(item: T) => boolean} predicate
 * @returns {number}
 */
export function findPageIndex(pages, predicate) {
    if (!Array.isArray(pages) || typeof predicate !== 'function') return 0;
    const idx = pages.findIndex((page) => Array.isArray(page) && page.some(predicate));
    return idx >= 0 ? idx : 0;
}

/** Sayfa indeksini geçerli aralığa sıkıştırır. */
export function clampPageIndex(index, pageCount) {
    const n = Math.max(1, Math.floor(Number(pageCount) || 1));
    const i = Math.floor(Number(index) || 0);
    if (i < 0) return 0;
    if (i > n - 1) return n - 1;
    return i;
}
