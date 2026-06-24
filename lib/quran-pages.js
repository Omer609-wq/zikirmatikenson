import pagesData from '../data/quran/pages.json' with { type: 'json' };

export const MUSHAF_PAGE_COUNT = pagesData?.meta?.pageCount || 604;
const PAGES = pagesData?.pages || [];

export function getPageSegments(pageNum) {
    const p = Number(pageNum);
    if (!Number.isFinite(p) || p < 1 || p > MUSHAF_PAGE_COUNT) return [];
    return PAGES[p - 1] || [];
}

/** @returns {number} 1-based mushaf page for surah:ayah */
export function getPageForAyah(surahN, ayahN) {
    const s = Number(surahN);
    const a = Number(ayahN);
    if (!Number.isFinite(s) || !Number.isFinite(a)) return 1;

    for (let p = 1; p <= MUSHAF_PAGE_COUNT; p += 1) {
        for (const seg of getPageSegments(p)) {
            if (s < seg.s) break;
            if (s > seg.s) continue;
            if (a >= seg.a1 && a <= seg.a2) return p;
        }
    }
    return 1;
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
