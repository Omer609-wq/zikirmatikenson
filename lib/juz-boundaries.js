/**
 * Cüz başlangıçları — Kuran okuyucusu (juz.js) ve hatim (hatim-juz.js) buradan okur.
 *
 * Veri Medine mushafı (data/quran/juz.json). Cüzler ilk kelimeleriyle anılır
 * ve her dilde aynı ayetten başlar ("لن تنالوا" Âl-i İmrân 92, "وإذا سمعوا"
 * Mâide 83, "يعتذرون" Tevbe 94). Tek fark 26. cüzde: Medine mushafında
 * Ahkâf 1'den, sayfanın ortasından başlar; Türk baskısında her cüz sayfa
 * başında başladığı için 26. cüz o sayfanın başından, Câsiye 33'ten başlar.
 * Böylece Türkçede her cüz 20 sayfa olur (son cüz hariç).
 *
 * Seçim dile bağlı, sayfa numarasındaki gibi (mushaf-page-label.js): Türkçede
 * Türk baskısı, diğer dillerde Medine. Dil uygulanırken setJuzLocale çağrılır.
 */
import medinaBoundaries from '../data/quran/juz.json' with { type: 'json' };

const TURKISH_STARTS = { 26: { surah: 45, ayah: 33 } };

const turkishBoundaries = (medinaBoundaries || []).map((b) =>
    TURKISH_STARTS[b.juz] ? { juz: b.juz, ...TURKISH_STARTS[b.juz] } : b
);

let turkish = false;

/** @param {string} locale uygulama dili kodu */
export function setJuzLocale(locale) {
    turkish = locale === 'tr';
}

/** Önbellek anahtarı: cüz sınırları bu değere göre değişir. */
export function juzBoundaryKey() {
    return turkish ? 'tr' : 'medina';
}

/** @returns {{ juz: number, surah: number, ayah: number }[]} */
export function getJuzBoundaries() {
    return turkish ? turkishBoundaries : medinaBoundaries || [];
}
