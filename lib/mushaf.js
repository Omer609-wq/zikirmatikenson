/**
 * Mushaf baskısı: sayfa düzeni ve seçili baskı.
 *
 * İki baskı var:
 *   - Medine (data/quran/pages.json): 604 sayfa; 1 Fatiha, 2 Bakara 1-5.
 *   - Türk baskısı: 604 sayfa; 1 Fatiha ile Bakara 1-5 birlikte (süslü açılış),
 *     2-580 Medine'nin bir sonraki sayfasıyla aynı, 30. cüz ise kendi düzeninde
 *     24 sayfa (data/quran/pages-tr-juz30.json).
 *
 * Sayfa numarası her baskının kendi numarasıdır, ekranda doğrudan yazılır.
 * Ayet → sayfa ve sayfa → ayet aralığı buradan okunur; cüz sınırları
 * juz-boundaries.js'te.
 *
 * Seçili baskı kullanıcının "Mushafım" ayarı (yoksa dile göre: Türkçede Türk
 * baskısı). Kuran okuyucusu (quran-pages.js üzerinden: çizdiği sayfa o
 * baskının sayfası), kişisel hatim ve "Nerede kaldın?" bunu kullanır; grup
 * hatiminin cüz sınırları her zaman Türk baskısı (hatim-juz.js).
 */
import surahIndex from '../data/quran/index.json' with { type: 'json' };
import pagesData from '../data/quran/pages.json' with { type: 'json' };
import turkishJuz30 from '../data/quran/pages-tr-juz30.json' with { type: 'json' };

/** Medine sayfaları, sure başına parça: { s, a1, a2 }. */
const MEDINA_SEGMENTS = pagesData?.pages || [];

export const MUSHAF_TURKISH = 'tr';
export const MUSHAF_MEDINA = 'medina';
export const MUSHAF_EDITIONS = Object.freeze([MUSHAF_TURKISH, MUSHAF_MEDINA]);

/** @returns {'tr' | 'medina' | null} Tanınmayan değer null: "dile göre". */
export function normalizeMushaf(value) {
    return MUSHAF_EDITIONS.includes(value) ? value : null;
}

export function defaultMushafForLocale(locale) {
    return locale === 'tr' ? MUSHAF_TURKISH : MUSHAF_MEDINA;
}

let current = MUSHAF_MEDINA;

export function setCurrentMushaf(mushaf) {
    current = normalizeMushaf(mushaf) || MUSHAF_MEDINA;
}

export function getCurrentMushaf() {
    return current;
}

/* ---------- Ayet sırası ---------- */

const ayahCounts = new Map((surahIndex || []).map((s) => [s.n, s.ayahCount]));
const surahOffsets = new Map();
{
    let offset = 0;
    for (let n = 1; n <= 114; n += 1) {
        surahOffsets.set(n, offset);
        offset += ayahCounts.get(n) || 0;
    }
}

/** Ayetin Kur'an'daki sırası (0'dan). Geçersiz ayet null. */
export function ayahOrdinal(surah, ayah) {
    const s = Number(surah);
    const a = Number(ayah);
    const count = ayahCounts.get(s);
    if (!Number.isInteger(s) || !Number.isInteger(a) || !count || a < 1 || a > count) return null;
    return surahOffsets.get(s) + a - 1;
}

/* ---------- Sayfa düzenleri ---------- */

/** @typedef {{ first: { s: number, a: number }, last: { s: number, a: number } }} MushafPage */

function previousAyah(ref) {
    if (ref.a > 1) return { s: ref.s, a: ref.a - 1 };
    return { s: ref.s - 1, a: ayahCounts.get(ref.s - 1) };
}

function buildMedina() {
    return MEDINA_SEGMENTS.map((segs) => {
        const last = segs[segs.length - 1];
        return { first: { s: segs[0].s, a: segs[0].a1 }, last: { s: last.s, a: last.a2 } };
    });
}

function buildTurkish(medina) {
    // Açılış: Fatiha ile Bakara 1-5 tek sayfa.
    const pages = [{ first: medina[0].first, last: medina[1].last }];
    const tailStarts = (turkishJuz30?.starts || []).map(([s, a]) => ({ s, a }));
    const tailFirstPage = Number(turkishJuz30?.meta?.firstPage) || 581;
    // 2 .. 580: Medine'nin bir sonraki sayfası.
    for (let p = 2; p < tailFirstPage; p += 1) pages.push(medina[p]);
    tailStarts.forEach((first, i) => {
        const next = tailStarts[i + 1];
        pages.push({ first, last: next ? previousAyah(next) : { s: 114, a: ayahCounts.get(114) } });
    });
    return pages;
}

const LAYOUTS = new Map();
function layoutOf(mushaf) {
    const key = normalizeMushaf(mushaf) || current;
    if (!LAYOUTS.has(key)) {
        if (!LAYOUTS.has(MUSHAF_MEDINA)) LAYOUTS.set(MUSHAF_MEDINA, buildMedina());
        if (key === MUSHAF_TURKISH) LAYOUTS.set(key, buildTurkish(LAYOUTS.get(MUSHAF_MEDINA)));
    }
    return LAYOUTS.get(key);
}

export function mushafPageCount(mushaf = current) {
    return layoutOf(mushaf).length;
}

/** @returns {MushafPage | null} */
export function mushafPage(page, mushaf = current) {
    return layoutOf(mushaf)[Number(page) - 1] || null;
}

const SEGMENT_CACHE = new Map();

/**
 * Sayfanın sure başına parçaları `{ s, a1, a2 }` — okuyucu sayfayı bunlarla
 * çizer. Medine'de veri dosyasındaki hâli; Türk baskısında ilk ve son ayetten
 * türetilir.
 */
export function mushafPageSegments(page, mushaf = current) {
    const key = normalizeMushaf(mushaf) || current;
    const p = Number(page);
    if (key === MUSHAF_MEDINA) return MEDINA_SEGMENTS[p - 1] || [];
    const cacheKey = `${key}:${p}`;
    if (SEGMENT_CACHE.has(cacheKey)) return SEGMENT_CACHE.get(cacheKey);
    const range = mushafPage(p, key);
    const segs = [];
    if (range) {
        for (let s = range.first.s; s <= range.last.s; s += 1) {
            segs.push({
                s,
                a1: s === range.first.s ? range.first.a : 1,
                a2: s === range.last.s ? range.last.a : ayahCounts.get(s)
            });
        }
    }
    SEGMENT_CACHE.set(cacheKey, segs);
    return segs;
}

/** Ayetin bu baskıdaki sayfası; geçersiz ayet 1. */
export function mushafPageOfAyah(surah, ayah, mushaf = current) {
    const target = ayahOrdinal(surah, ayah);
    const pages = layoutOf(mushaf);
    if (target == null) return 1;
    // Son ayeti hedefe eşit ya da büyük ilk sayfa.
    let lo = 0;
    let hi = pages.length - 1;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (ayahOrdinal(pages[mid].last.s, pages[mid].last.a) < target) lo = mid + 1;
        else hi = mid;
    }
    return lo + 1;
}
