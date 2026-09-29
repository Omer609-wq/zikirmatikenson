/**
 * Kuran okuyucusunun sayfaları — seçili baskının ("Mushafım", lib/mushaf.js)
 * sayfaları. Türk baskısı seçiliyken okuyucu gerçekten Türk sayfalarını çizer:
 * açılışta Fatiha ile Bakara 1-5 tek sayfa, 30. cüz kendi 24 sayfası. Sayfa
 * numarası da o baskının numarası; ekranda çevirmeden yazılır.
 *
 * İki baskı da 604 sayfa. Kayıtlı "kaldığım sayfa" baskıya göre anlam
 * değiştirdiği için baskı değişince aynı ayetin sayfasına taşınır (app.js).
 */
import { mushafPageCount, mushafPageOfAyah, mushafPageSegments } from './mushaf.js';

export const MUSHAF_PAGE_COUNT = mushafPageCount();

/** @returns {{ s: number, a1: number, a2: number }[]} */
export function getPageSegments(pageNum) {
    const p = Number(pageNum);
    if (!Number.isFinite(p) || p < 1 || p > MUSHAF_PAGE_COUNT) return [];
    return mushafPageSegments(p);
}

/** @returns {number} 1-based mushaf page for surah:ayah (geçersiz ayet 1) */
export function getPageForAyah(surahN, ayahN) {
    return mushafPageOfAyah(surahN, ayahN);
}

/** @returns {{ s: number, a: number }[]} */
export function listAyahsOnPage(pageNum) {
    const rows = [];
    for (const seg of getPageSegments(pageNum)) {
        for (let a = seg.a1; a <= seg.a2; a += 1) {
            rows.push({ s: seg.s, a });
        }
    }
    return rows;
}

export function pageStartsSurah(pageNum) {
    return getPageSegments(pageNum).some((seg) => seg.a1 === 1);
}

export function firstSurahOnPage(pageNum) {
    const segs = getPageSegments(pageNum);
    return segs.length ? segs[0].s : null;
}

/** @returns {{ s: number, a: number } | null} */
export function getPageStartAyah(pageNum) {
    const segs = getPageSegments(pageNum);
    if (!segs.length) return null;
    return { s: segs[0].s, a: segs[0].a1 };
}

/** @returns {{ s: number, a: number } | null} */
export function getPageEndAyah(pageNum) {
    const segs = getPageSegments(pageNum);
    if (!segs.length) return null;
    const last = segs[segs.length - 1];
    return { s: last.s, a: last.a2 };
}
