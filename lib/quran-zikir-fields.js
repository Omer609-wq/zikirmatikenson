import { isPlainObject } from './coerce.js';

/**
 * Kur'an zikrinin metin alanları: sure adı + ayet numarası, ayetin Arapçası ve
 * meal/okunuş. Uygulama bunları seçili dile ve meale göre yeniden üretir.
 *
 * Kullanıcı düzenleme formunda bir alanı değiştirirse o alan ona geçer
 * (`quranCustom`) ve senkron artık o alana dokunmaz. Eskiden ad ve not her
 * açılışta ayetten yeniden yazılıyor, düzenleme sessizce kayboluyordu.
 */
export const QURAN_ZIKIR_TEXT_FIELDS = Object.freeze(['name', 'arabic', 'meaning']);

/** Kayıttan okunan işaretler: yalnız bilinen alanlar ve `true`; boşsa undefined. */
export function normalizeQuranCustom(value) {
    if (!isPlainObject(value)) return undefined;
    const out = {};
    for (const field of QURAN_ZIKIR_TEXT_FIELDS) {
        if (value[field] === true) out[field] = true;
    }
    return Object.keys(out).length ? out : undefined;
}

/**
 * Nesne yerine yenisi atanır: kopyalanan zikir (`{ ...z }`) aynı işaret
 * nesnesini paylaşır, yerinde değiştirmek diğerini de değiştirirdi.
 */
function setQuranCustom(z, custom) {
    const next = normalizeQuranCustom(custom);
    if (next) z.quranCustom = next;
    else delete z.quranCustom;
}

/**
 * Düzenleme formunun sonucunu yazar. Yalnızca formda değiştirilen alan yazılır
 * ve kullanıcıya geçer; dokunulmayan alan uygulamanın kalır (dil değişince
 * güncellenmeye devam eder).
 *
 * @param {object} z Kur'an zikri
 * @param {Record<string, string> | null} shown Form açılırken alanlarda görünen değerler
 * @param {Record<string, string>} next Kaydedilen değerler (yalnız formda olan alanlar)
 */
export function applyQuranZikirFormEdits(z, shown, next) {
    const custom = { ...(z.quranCustom || {}) };
    for (const field of QURAN_ZIKIR_TEXT_FIELDS) {
        if (!Object.prototype.hasOwnProperty.call(next, field)) continue;
        const before = shown ? shown[field] : String(z[field] ?? '').trim();
        if (next[field] === before) continue;
        z[field] = next[field];
        custom[field] = true;
    }
    setQuranCustom(z, custom);
}

/**
 * Uygulamanın ürettiği ayet içeriğini kullanıcıya ait olmayan alanlara yazar.
 * @param {object} z Kur'an zikri
 * @param {Record<string, string>} auto Yeni üretilen değerler
 * @returns {boolean} bir alan değiştiyse true
 */
export function applyQuranZikirAutoContent(z, auto) {
    const custom = z.quranCustom || {};
    let changed = false;
    for (const field of QURAN_ZIKIR_TEXT_FIELDS) {
        if (custom[field] || auto[field] == null) continue;
        if (z[field] !== auto[field]) {
            z[field] = auto[field];
            changed = true;
        }
    }
    return changed;
}

/** Alanları yeniden uygulamaya bırakır (ör. başka bir okuma modu seçildi). */
export function releaseQuranCustomFields(z, fields) {
    if (!z.quranCustom) return;
    const custom = { ...z.quranCustom };
    for (const field of fields) delete custom[field];
    setQuranCustom(z, custom);
}
