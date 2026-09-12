/**
 * Hatim duası — hatim tamamlandığında gösterilen metin.
 *
 * Katman kuralı kütüphanedeki okunuş kuralıyla aynı mantıkta:
 *   Arapça  → her dilde gösterilir (metnin kendisi).
 *   Okunuş  → tr kendi okunuşunu, id/ms/fr/bn en okunuşunu alır;
 *             ar ve ur Arap harflerini zaten okuduğu için okunuş gösterilmez.
 *   Meal    → dilin kendi meali; ar'da meal yoktur, metin zaten Arapça.
 *
 * İçerik `data/hatim-dua.json` içinde; oradaki `meta.review` alanı metnin
 * güvenilir bir kaynakla doğrulanıp doğrulanmadığını işaretler.
 */
import duaData from '../data/hatim-dua.json' with { type: 'json' };

/** Kendi okunuşu olan diller; kalanlar en okunuşuna düşer. */
const OWN_TRANSLIT = new Set(['tr', 'en']);
/** Arap harflerini okuyan diller — okunuş satırı gereksiz. */
const READS_ARABIC_SCRIPT = new Set(['ar', 'ur']);
/** Metin zaten kendi dilinde olduğu için meale gerek duymayan diller. */
const NEEDS_NO_MEANING = new Set(['ar']);

function normalize(locale) {
    return String(locale || 'tr')
        .toLowerCase()
        .split('-')[0];
}

/**
 * @param {string} locale
 * @returns {{ arabic: string, translit: string, meaning: string }}
 *   Gösterilmeyecek katmanlar boş dize döner.
 */
export function getHatimDua(locale) {
    const code = normalize(locale);

    let translit = '';
    if (!READS_ARABIC_SCRIPT.has(code)) {
        const pack = OWN_TRANSLIT.has(code) ? code : 'en';
        translit = duaData.translit?.[pack] || '';
    }

    const meaning = NEEDS_NO_MEANING.has(code)
        ? ''
        : duaData.meaning?.[code] || duaData.meaning?.en || '';

    return {
        arabic: duaData.arabic || '',
        translit,
        meaning
    };
}

/** Metnin editoryal durumu — yayın öncesi doğrulama takibi için. */
export function getHatimDuaMeta() {
    return { ...(duaData.meta || {}) };
}
