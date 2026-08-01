/**
 * Uzaktan kütüphane metin düzeltmeleri — public/library-overrides.json doğrulama.
 * Yalnızca **metin/veri** değişir; yeni madde eklenmez (bilinmeyen `id` yok sayılır).
 *
 * Şema:
 *   {
 *     "items": {
 *       "lib_21": {
 *         "tr": { "meaning": "...", "context": "...", "source": "...", "name": "...",
 *                 "arabic": "...", "keywords": "...", "target": 100, "category": "zikir" },
 *         "en": { "meaning": "...", "context": "...", "name": "...", "keywords": "..." },
 *         "ar": { "name": "..." }, "bn": { "name": "..." }, "ur": { "name": "..." },
 *         "prev": { "meaning": ["eski metin"], "name": ["eski ad"], "fazilet": ["eski fazilet"] }
 *       }
 *     }
 *   }
 *
 * Katmanlar `data/library/*.json` ile birebir aynı model:
 *   tr = kanon (Arapça/hedef/kaynak dahil), en = TR dışı ortak meal/bağlam,
 *   ar/bn/ur = yalnızca okunuş adı.
 *
 * `prev` neden var: kullanıcının klasöründeki kayıt eski metni saklar. app.js yalnızca
 * "bilinen" metinleri günceller (elle düzenlenmiş metne dokunmaz). Gömülü JSON'daki metin
 * zaten bilinir; ardışık düzeltmelerde (v1 → v2) v1'in metnini `prev` ile bildir, yoksa
 * v1'i almış kullanıcılarda güncelleme durur. Aynı şekilde bir düzeltmeyi geri alırken
 * katmanları boşalt ama `prev` içinde yanlış metni bırak.
 */

/** Yama katmanları — `data/library/<code>.json` karşılıkları. */
export const LIBRARY_OVERRIDE_LAYERS = ['tr', 'en', 'ar', 'bn', 'ur'];

const TEXT_FIELDS = ['name', 'meaning', 'context', 'source', 'keywords', 'arabic'];
const PREV_FIELDS = ['name', 'meaning', 'fazilet'];
const CATEGORIES = ['zikir', 'dua'];

const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const MAX_ITEMS = 500;
/** Gömülü `context` en uzun 245 karakter; pay bırakılmış üst sınır. */
const MAX_TEXT_LEN = 600;
const MAX_PREV_PER_FIELD = 10;
const MAX_TARGET = 100000;

/** Tek satıra indir, açı parantezlerini at (metin `textContent` ile basılır; yine de savunma). */
function cleanText(value) {
    if (typeof value !== 'string') return '';
    return value
        .replace(/[<>]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, MAX_TEXT_LEN)
        .trim();
}

function cleanLayer(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const out = {};
    for (const field of TEXT_FIELDS) {
        const text = cleanText(raw[field]);
        if (text) out[field] = text;
    }
    if (raw.target != null) {
        const n = Number(raw.target);
        if (Number.isFinite(n) && n >= 1 && n <= MAX_TARGET) out.target = Math.round(n);
    }
    if (typeof raw.category === 'string' && CATEGORIES.includes(raw.category.trim())) {
        out.category = raw.category.trim();
    }
    return Object.keys(out).length ? out : null;
}

function cleanPrev(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const out = {};
    for (const field of PREV_FIELDS) {
        if (!Array.isArray(raw[field])) continue;
        const list = [];
        for (const value of raw[field].slice(0, MAX_PREV_PER_FIELD)) {
            const text = cleanText(value);
            if (text && !list.includes(text)) list.push(text);
        }
        if (list.length) out[field] = list;
    }
    return Object.keys(out).length ? out : null;
}

/**
 * Uzak JSON'u doğrular; kullanılabilir tek madde yoksa null döner (→ gömülü metinler kalır).
 * @returns {{ items: Record<string, { byLayer: Record<string, object>, prev: Record<string, string[]> }> } | null}
 */
export function normalizeLibraryOverrides(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const source = raw.items;
    if (!source || typeof source !== 'object' || Array.isArray(source)) return null;

    const items = {};
    let count = 0;
    for (const [rawId, rawItem] of Object.entries(source)) {
        if (count >= MAX_ITEMS) break;
        const id = String(rawId || '').trim();
        if (!ID_PATTERN.test(id)) continue;
        if (!rawItem || typeof rawItem !== 'object' || Array.isArray(rawItem)) continue;

        const byLayer = {};
        for (const layer of LIBRARY_OVERRIDE_LAYERS) {
            const cleaned = cleanLayer(rawItem[layer]);
            if (cleaned) byLayer[layer] = cleaned;
        }
        const prev = cleanPrev(rawItem.prev);
        if (!Object.keys(byLayer).length && !prev) continue;

        items[id] = { byLayer, prev: prev || {} };
        count++;
    }

    return count ? { items } : null;
}
