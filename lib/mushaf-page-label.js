/**
 * Mushaf sayfasının ekranda yazan numarası.
 *
 * Sayfa düzeni standart Medine mushafı: 1 Fatiha, 2 Bakara 1–5, 3 Bakara 6'dan
 * itibaren. Türkiye baskılarında Fatiha ile Bakara'nın süslü ilk sayfası karşılıklı
 * açılış sayfası olarak birlikte "1" numaradır; ilk tam sayfa (Bakara 6) 2'dir,
 * 2. cüz 21. sayfada başlar. Arap baskıları Medine numarasını kullanır.
 *
 * Yalnızca etiket değişir: sayfa indeksi, kayıtlı "kaldığım sayfa" ve cüz
 * hesapları 604'lük düzende kalır.
 */
const OPENING_SPREAD_LOCALES = new Set(['tr']);

/**
 * @param {number} page 1–604 arası mushaf sayfa indeksi
 * @param {string} locale uygulama dili kodu
 * @returns {number}
 */
export function mushafPageLabel(page, locale) {
    const p = Number(page);
    if (!Number.isInteger(p) || p < 1 || !OPENING_SPREAD_LOCALES.has(locale)) return p;
    return p <= 2 ? 1 : p - 1;
}
