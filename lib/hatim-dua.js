/**
 * Hatim duası — hatim tamamlandığında gösterilen metin.
 *
 * İki ayrı dua var ve farkları öznede:
 *   kişisel → birinci tekil ("bana merhamet et, benim için rehber kıl")
 *   ortak   → öznesi "biz" olan dua; grupça okunan hatmin duası budur.
 *
 * Katman kuralı kütüphanedeki okunuş kuralıyla aynı mantıkta:
 *   Arapça  → her dilde gösterilir (metnin kendisi).
 *   Okunuş  → tr kendi okunuşunu, id/ms/fr/bn en okunuşunu alır;
 *             ar ve ur Arap harflerini zaten okuduğu için okunuş gösterilmez.
 *   Meal    → dilin kendi meali; ar'da meal yoktur, metin zaten Arapça.
 *
 * İçerik `data/hatim-dua.json` içinde; `meta.review` metnin güvenilir bir
 * kaynakla doğrulanıp doğrulanmadığını işaretler.
 */
import duaData from '../data/hatim-dua.json' with { type: 'json' };

export const HATIM_DUA_PERSONAL = 'personal';
export const HATIM_DUA_SHARED = 'shared';

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
 * Hangi dua bloğunun kullanılacağını seçer. Ortak dua metni henüz girilmemişse
 * kişisel duaya düşer; grup ekranı boş kalmasın diye geçici köprü.
 */
function pickBlock(kind) {
    if (kind === HATIM_DUA_SHARED && duaData.shared?.arabic) {
        return { block: duaData.shared, fallback: false };
    }
    return { block: duaData.personal || {}, fallback: kind === HATIM_DUA_SHARED };
}

/**
 * @param {string} locale
 * @param {'personal' | 'shared'} [kind]
 * @returns {{ arabic: string, translit: string, meaning: string, fallback: boolean }}
 *   Gösterilmeyecek katmanlar boş dize döner. `fallback`, ortak dua istendiği hâlde
 *   metin girilmediği için kişisel duanın gösterildiğini bildirir.
 */
export function getHatimDua(locale, kind = HATIM_DUA_PERSONAL) {
    const code = normalize(locale);
    const { block, fallback } = pickBlock(kind);

    let translit = '';
    if (!READS_ARABIC_SCRIPT.has(code)) {
        const pack = OWN_TRANSLIT.has(code) ? code : 'en';
        translit = block.translit?.[pack] || '';
    }

    const meaning = NEEDS_NO_MEANING.has(code)
        ? ''
        : block.meaning?.[code] || block.meaning?.en || '';

    return {
        arabic: block.arabic || '',
        translit,
        meaning,
        fallback
    };
}

/** Metnin editoryal durumu — yayın öncesi doğrulama takibi için. */
export function getHatimDuaMeta() {
    return { ...(duaData.meta || {}) };
}
