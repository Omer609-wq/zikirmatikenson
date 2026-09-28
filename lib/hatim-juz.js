/**
 * Hatim cüz motoru — 30 cüzün sınırlarını, kapsadığı sureleri, mushaf sayfalarını
 * ve ayet sayılarını mevcut Kuran verisinden türetir.
 *
 * Tamamen çevrimdışıdır: veri `lib/juz-boundaries.js` (cüz başlangıçları, baskıya
 * göre), `data/quran/index.json` (sure ayet sayıları) ve `lib/mushaf.js` (baskının
 * sayfa düzeni) üzerinden gelir; hatim grubu için sunucudan cüz bilgisi çekilmez.
 *
 * İki baskı ayrı seçilebilir: cüz sınırı hangi baskıya göre (`juzMushaf`) ve
 * sayfa numarası hangi baskıya göre (`pageMushaf`). Grup hatiminde sınır hep
 * Türk baskısı, sayfa numarası ise okuyanın kendi mushafı.
 *
 * Sure adları burada yok — modül saf sayı döndürür, yerelleştirmeyi arayüz
 * `quran-surah-names.js` ile yapar.
 */
import surahIndex from '../data/quran/index.json' with { type: 'json' };
import { getJuzBoundaries } from './juz-boundaries.js';
import { getCurrentMushaf, mushafPageOfAyah, normalizeMushaf } from './mushaf.js';

export const HATIM_JUZ_COUNT = 30;

/** Son ayet — 30. cüzün bitişi sabittir (Nâs 6). */
const LAST_AYAH = { surah: 114, ayah: 6 };

const ayahCountByN = new Map((surahIndex || []).map((s) => [s.n, s.ayahCount]));

/** Anahtar "tr/medina/26" gibi: sınır ve sayfa baskısı ayrı. @type {Map<string, object>} */
const detailCache = new Map();

function getAyahCount(surahN) {
    return ayahCountByN.get(Number(surahN)) || 0;
}

function getBoundary(juzN, mushaf) {
    return getJuzBoundaries(mushaf).find((b) => b.juz === Number(juzN)) || null;
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
 * @param {'tr' | 'medina'} [mushaf] Cüz sınırının baskısı; verilmezse seçili baskı.
 * @returns {{ juz: number, start: { surah: number, ayah: number },
 *   end: { surah: number, ayah: number } } | null}
 */
export function getJuzRange(juzN, mushaf) {
    const n = Number(juzN);
    if (!Number.isInteger(n) || n < 1 || n > HATIM_JUZ_COUNT) return null;

    const boundary = getBoundary(n, mushaf);
    if (!boundary) return null;

    const start = { surah: boundary.surah, ayah: boundary.ayah };
    const next = n < HATIM_JUZ_COUNT ? getBoundary(n + 1, mushaf) : null;
    const end = next ? previousAyah(next.surah, next.ayah) : { ...LAST_AYAH };

    return { juz: n, start, end };
}

/**
 * Cüz detay ekranının tüm verisi. İlk çağrıda hesaplanır, sonra önbellekten döner.
 * `startPage`/`endPage` sayfa baskısının kendi numarasıdır (ekranda doğrudan yazılır).
 *
 * @param {number} juzN 1–30
 * @param {{ juzMushaf?: 'tr' | 'medina', pageMushaf?: 'tr' | 'medina' }} [opts]
 *   Verilmeyen seçili baskı ("Mushafım").
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
export function getJuzDetail(juzN, opts = {}) {
    const n = Number(juzN);
    if (!Number.isInteger(n) || n < 1 || n > HATIM_JUZ_COUNT) return null;
    const juzMushaf = normalizeMushaf(opts.juzMushaf) || getCurrentMushaf();
    const pageMushaf = normalizeMushaf(opts.pageMushaf) || getCurrentMushaf();
    const cacheKey = `${juzMushaf}/${pageMushaf}/${n}`;
    if (detailCache.has(cacheKey)) return detailCache.get(cacheKey);

    const range = getJuzRange(n, juzMushaf);
    if (!range) return null;

    const surahs = buildSurahSpans(range.start, range.end);
    const startPage = mushafPageOfAyah(range.start.surah, range.start.ayah, pageMushaf);
    const endPage = mushafPageOfAyah(range.end.surah, range.end.ayah, pageMushaf);

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

    detailCache.set(cacheKey, detail);
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
