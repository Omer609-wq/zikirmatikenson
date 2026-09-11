/**
 * Sayıya göre değişen arayüz metinleri (çoğul).
 *
 * Bir metnin sayıya göre biçimleri aynı anahtarın sonuna CLDR kategorisi
 * eklenerek yazılır: "folderZikirCount_few". Sayının kategorisi için biçim
 * yoksa ya da kategori "other" ise temel anahtar kullanılır; bu yüzden biçim
 * tanımlamayan diller ve mevcut metinler hiç değişmeden çalışır. Temel metin
 * "other" biçimi olmalı.
 *
 * Arapçada 6 kategori var ve isim sayıya göre değişiyor:
 *   0 zero · 1 one ("ذكر واحد") · 2 two ("ذكران") · 3–10 few ("4 أذكار")
 *   11–99 many ("99 ذكرًا") · 100, 101, 102… other ("100 ذكر")
 * Kategoriyi Intl.PluralRules seçer; 103 → few, 111 → many gibi yüzlükleri
 * de o bilir.
 */

/** Temel anahtardan ayrı yazılabilen kategoriler ("other" temel metnin kendisi). */
export const PLURAL_VARIANT_CATEGORIES = ['zero', 'one', 'two', 'few', 'many'];

/** @type {Map<string, Intl.PluralRules | null>} */
const rulesByLocale = new Map();

/**
 * @param {string} localeTag BCP 47 ("ar", "tr-TR")
 * @param {number} n
 * @returns {string} CLDR kategorisi; Intl yoksa "other"
 */
export function pluralCategory(localeTag, n) {
    if (!rulesByLocale.has(localeTag)) {
        let rules = null;
        try {
            rules = new Intl.PluralRules(localeTag);
        } catch {
            rules = null;
        }
        rulesByLocale.set(localeTag, rules);
    }
    const rules = rulesByLocale.get(localeTag);
    return rules ? rules.select(n) : 'other';
}

/**
 * Çoğul seçimi için sayı: `pluralCount` (sayı önceden "1.234" gibi biçimlenip
 * `count`'a metin olarak verildiyse) yoksa `count`. Yalnızca sonlu sayılar;
 * biçimli metinden sayı tahmin edilmez ("1,5" 15 okunurdu).
 *
 * @param {Record<string, unknown> | null | undefined} vars
 * @returns {number | null}
 */
export function pluralCountOf(vars) {
    if (!vars) return null;
    for (const v of [vars.pluralCount, vars.count]) {
        if (typeof v === 'number' && Number.isFinite(v)) return v;
    }
    return null;
}

/**
 * "home.folderZikirCount" + { count: 4 } + "ar" → "home.folderZikirCount_few".
 * Çoğul seçimi gerekmiyorsa (sayı yok ya da kategori "other") null.
 *
 * @param {string} key
 * @param {string} localeTag
 * @param {Record<string, unknown> | null | undefined} vars
 * @returns {string | null}
 */
export function pluralVariantKey(key, localeTag, vars) {
    const n = pluralCountOf(vars);
    if (n == null) return null;
    const category = pluralCategory(localeTag, n);
    return PLURAL_VARIANT_CATEGORIES.includes(category) ? `${key}_${category}` : null;
}
