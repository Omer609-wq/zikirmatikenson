/**
 * Hatim cüz motoru — 30 cüzün sınırlarını, kapsadığı sureleri, mushaf sayfalarını
 * ve ayet sayılarını mevcut Kuran verisinden türetir.
 *
 * Tamamen çevrimdışıdır: veri `data/quran/juz.json` (cüz başlangıçları),
 * `data/quran/index.json` (sure ayet sayıları) ve `lib/quran-pages.js` (mushaf
 * sayfa haritası) üzerinden gelir; hatim grubu için sunucudan cüz bilgisi çekilmez.
 *
 * Sure adları burada yok — modül saf sayı döndürür, yerelleştirmeyi arayüz
 * `quran-surah-names.js` ile yapar.
 */
import juzBoundaries from '../data/quran/juz.json' with { type: 'json' };
import surahIndex from '../data/quran/index.json' with { type: 'json' };
import { getPageForAyah } from './quran-pages.js';

export const HATIM_JUZ_COUNT = 30;

/** Son ayet — 30. cüzün bitişi sabittir (Nâs 6). */
const LAST_AYAH = { surah: 114, ayah: 6 };

const ayahCountByN = new Map((surahIndex || []).map((s) => [s.n, s.ayahCount]));

/** @type {Map<number, object>} */
const detailCache = new Map();

function getAyahCount(surahN) {
    return ayahCountByN.get(Number(surahN)) || 0;
}

function getBoundary(juzN) {
    return (juzBoundaries || []).find((b) => b.juz === Number(juzN)) || null;
}

/**
 * Verilen ayetten bir öncekini bulur. Ayet 1 ise bir önceki surenin son ayetine düşer.
 * Cüz bitişi = bir sonraki cüzün başlangıcından önceki ayet olduğu için gerekli.
 */
function previousAyah(surahN, ayahN) {
    const s = Number(surahN);
    const a = Number(ayahN);
    if (a > 1) return { surah: s, ayah: a - 1 };
    const prevSurah = s - 1;
    if (prevSurah < 1) return { surah: 1, ayah: 1 };
    return { surah: prevSurah, ayah: getAyahCount(prevSurah) };
}

/**
 * Cüzün kapsadığı sureleri, her birinde okunan ayet aralığıyla birlikte listeler.
 * Baştaki ve sondaki sure kısmi olabilir; aradakiler tam okunur.
 */
function buildSurahSpans(start, end) {
    const spans = [];
    for (let n = start.surah; n <= end.surah; n += 1) {
        const total = getAyahCount(n);
        if (!total) continue;
        const from = n === start.surah ? start.ayah : 1;
        const to = n === end.surah ? end.ayah : total;
        if (to < from) continue;
        spans.push({
            surah: n,
            from,
            to,
            ayahCount: to - from + 1,
            /** Sure bu cüzde baştan sona okunuyor mu? */
            complete: from === 1 && to === total
        });
    }
    return spans;
}

/**
 * @param {number} juzN 1–30
 * @returns {{ juz: number, start: { surah: number, ayah: number },
 *   end: { surah: number, ayah: number } } | null}
 */
export function getJuzRange(juzN) {
    const n = Number(juzN);
    if (!Number.isInteger(n) || n < 1 || n > HATIM_JUZ_COUNT) return null;

    const boundary = getBoundary(n);
    if (!boundary) return null;

    const start = { surah: boundary.surah, ayah: boundary.ayah };
    const next = n < HATIM_JUZ_COUNT ? getBoundary(n + 1) : null;
    const end = next ? previousAyah(next.surah, next.ayah) : { ...LAST_AYAH };

    return { juz: n, start, end };
}

/**
 * Cüz detay ekranının tüm verisi. İlk çağrıda hesaplanır, sonra önbellekten döner.
 *
 * @param {number} juzN 1–30
 * @returns {{
 *   juz: number,
 *   start: { surah: number, ayah: number },
 *   end: { surah: number, ayah: number },
 *   startPage: number,
 *   endPage: number,
 *   pageCount: number,
 *   ayahCount: number,
 *   surahCount: number,
 *   surahs: { surah: number, from: number, to: number, ayahCount: number, complete: boolean }[]
 * } | null}
 */
export function getJuzDetail(juzN) {
    const n = Number(juzN);
    if (!Number.isInteger(n) || n < 1 || n > HATIM_JUZ_COUNT) return null;
    if (detailCache.has(n)) return detailCache.get(n);

    const range = getJuzRange(n);
    if (!range) return null;

    const surahs = buildSurahSpans(range.start, range.end);
    const startPage = getPageForAyah(range.start.surah, range.start.ayah);
    const endPage = getPageForAyah(range.end.surah, range.end.ayah);

    const detail = Object.freeze({
        juz: n,
        start: Object.freeze({ ...range.start }),
        end: Object.freeze({ ...range.end }),
        startPage,
        endPage,
        pageCount: endPage - startPage + 1,
        ayahCount: surahs.reduce((sum, s) => sum + s.ayahCount, 0),
        surahCount: surahs.length,
        surahs: Object.freeze(surahs.map((s) => Object.freeze(s)))
    });

    detailCache.set(n, detail);
    return detail;
}

/** 30 cüzün tamamı, sırayla. */
export function listJuzDetails() {
    const out = [];
    for (let n = 1; n <= HATIM_JUZ_COUNT; n += 1) {
        const detail = getJuzDetail(n);
        if (detail) out.push(detail);
    }
    return out;
}

/**
 * Cüzü okumaya başlanacak nokta — "Cüzü oku" mushafa buradan atlar.
 * @returns {{ surah: number, ayah: number, page: number } | null}
 */
export function getJuzReadStart(juzN) {
    const detail = getJuzDetail(juzN);
    if (!detail) return null;
    return { surah: detail.start.surah, ayah: detail.start.ayah, page: detail.startPage };
}
