/**
 * Kuran okuyucusundaki sayfanın ekranda yazan numarası.
 *
 * Okuyucu Medine düzenini çizer (1 Fatiha, 2 Bakara 1–5, 3 Bakara 6'dan
 * itibaren). Seçili baskı Türk baskısıysa numara o sayfanın ilk ayetinin Türk
 * baskısındaki sayfasıdır: Fatiha ile Bakara'nın süslü ilk sayfası birlikte "1",
 * 2. cüz 21. sayfada başlar; 30. cüzde Türk baskısı sayfaları başka yerden
 * böldüğü için numara oradaki gerçek sayfayı gösterir (bkz. mushaf.js).
 *
 * Yalnızca etiket değişir: sayfa indeksi ve kayıtlı "kaldığım sayfa" 604'lük
 * Medine düzeninde kalır.
 */
import { MUSHAF_MEDINA, getCurrentMushaf, mushafPageOfAyah, normalizeMushaf } from './mushaf.js';
import { getPageStartAyah } from './quran-pages.js';

/**
 * @param {number} page 1–604 arası Medine sayfa indeksi
 * @param {'tr' | 'medina'} [mushaf] Verilmezse seçili baskı.
 * @returns {number}
 */
export function mushafPageLabel(page, mushaf) {
    const p = Number(page);
    const edition = normalizeMushaf(mushaf) || getCurrentMushaf();
    if (!Number.isInteger(p) || p < 1 || edition === MUSHAF_MEDINA) return p;
    const first = getPageStartAyah(p);
    return first ? mushafPageOfAyah(first.s, first.a, edition) : p;
}
