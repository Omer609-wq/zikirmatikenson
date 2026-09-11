/**
 * İstatistik grafiğinin sol ekseni: tavan ve ortanca.
 *
 * Tavan, en yüksek çubuğun üstündeki ilk 10'un katı: 99 → 100, 100 → 100,
 * 101 → 110. Eskiden yüzlüğe yuvarlanıyordu; 101 çekim tavanı 200 yapıp
 * bütün çubukları yarı boya indiriyordu, 3 çekim de 100'lük eksende
 * görünmez kalıyordu.
 *
 * 10'dan küçükse tavan değerin kendisi (2 → 2, 3 → 3): 10'a yuvarlamak
 * 2 çekimi grafiğin beşte birine indirirdi.
 */

/** Hiç çekim yokken eksen: 10 / 5 / 0. */
export const EMPTY_CHART_TOP = 10;

/**
 * @param {number} maxValue en yüksek çubuğun değeri
 * @returns {number} her zaman > 0
 */
export function chartTopFor(maxValue) {
    const v = Number(maxValue);
    if (!Number.isFinite(v) || v <= 0) return EMPTY_CHART_TOP;
    if (v < 10) return Math.ceil(v);
    return Math.ceil(v / 10) * 10;
}

/**
 * @param {number[]} values çubuk değerleri
 * @returns {number} eksen tavanı
 */
export function chartScaleMax(values) {
    const list = Array.isArray(values) ? values.map(Number).filter(Number.isFinite) : [];
    return chartTopFor(Math.max(0, ...list));
}

/**
 * Ortanca tavanın tam yarısı (110 → 55, 3 → 1.5), çünkü eksende de tam
 * ortada duruyor. Eskiden yüzlüğe yuvarlanıyordu: 100'lük eksende
 * Math.round(0.5) 1 olduğu için ortanca da 100 yazıyordu, 300'lükte 200.
 *
 * @param {number} top chartScaleMax sonucu
 * @returns {{ top: number, mid: number, bottom: number }}
 */
export function chartAxisLabels(top) {
    const t = Number(top) > 0 ? Number(top) : EMPTY_CHART_TOP;
    return { top: t, mid: t / 2, bottom: 0 };
}

/**
 * Eksen etiketi. Tam sayılar olduğu gibi (eksen hep Latin rakamlı ve
 * gruplamasızdı, 6900 gibi); yalnızca tek tavanlı küçük eksenin ortancası
 * kesirli olur ve dilin ondalık ayracıyla yazılır (tr: 1,5 / en: 1.5).
 *
 * @param {number} n
 * @param {string} [locale] BCP 47 etiketi
 * @returns {string}
 */
export function formatChartAxisValue(n, locale) {
    const v = Number(n) || 0;
    if (Number.isInteger(v)) return String(v);
    try {
        return v.toLocaleString(locale || 'en-US', {
            maximumFractionDigits: 1,
            useGrouping: false,
            numberingSystem: 'latn'
        });
    } catch {
        return String(Math.round(v * 10) / 10);
    }
}
