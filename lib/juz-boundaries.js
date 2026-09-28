/**
 * Cüz başlangıçları — Kuran okuyucusu (juz.js) ve hatim (hatim-juz.js) buradan okur.
 *
 * Veri Medine mushafı (data/quran/juz.json, Kuran.com ile aynı). Türk baskısı
 * dört cüzde ayrılır, çünkü orada her cüz sayfa başında başlar:
 *
 *   cüz   Medine                        Türk baskısı
 *   4     Âl-i İmrân 93 ("كل الطعام")   Âl-i İmrân 92 (Len tenâlû)
 *   7     Mâide 82 ("لتجدن")            Mâide 83 (Ve izâ semiû)
 *   11    Tevbe 93 ("إنما السبيل")       Tevbe 94 (Ya'tezirûne)
 *   26    Ahkâf 1 (sayfa ortası)        Câsiye 33 (o sayfanın başı)
 *
 * Böylece Türk baskısında her cüz 20 sayfa olur (30. cüz 24); Medine'de bu
 * dört yerde önceki cüz yeni cüzün başladığı sayfayı da kapsar.
 *
 * Hangi baskı: mushaf.js'teki seçili baskı ("Mushafım"); grup hatimi her
 * zaman Türk baskısını ister (hatim-juz.js).
 */
import medinaBoundaries from '../data/quran/juz.json' with { type: 'json' };
import { MUSHAF_TURKISH, getCurrentMushaf, normalizeMushaf } from './mushaf.js';

const TURKISH_STARTS = {
    4: { surah: 3, ayah: 92 },
    7: { surah: 5, ayah: 83 },
    11: { surah: 9, ayah: 94 },
    26: { surah: 45, ayah: 33 }
};

const turkishBoundaries = (medinaBoundaries || []).map((b) =>
    TURKISH_STARTS[b.juz] ? { juz: b.juz, ...TURKISH_STARTS[b.juz] } : b
);

/**
 * @param {'tr' | 'medina'} [mushaf] Verilmezse seçili baskı.
 * @returns {{ juz: number, surah: number, ayah: number }[]}
 */
export function getJuzBoundaries(mushaf) {
    const edition = normalizeMushaf(mushaf) || getCurrentMushaf();
    return edition === MUSHAF_TURKISH ? turkishBoundaries : medinaBoundaries || [];
}
