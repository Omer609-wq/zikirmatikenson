import { normalizeQuranCounterLayout } from './quran-counter-layout.js';
import { clampNumber, coerceId, coerceString, isPlainObject } from './coerce.js';

const VALID_QURAN_READ_MODES = new Set(['meal-ar', 'translit-ar', 'ar-only']);
const DEFAULT_QURAN_READ_MODE = 'meal-ar';

function normalizeStoredQuranReadMode(mode) {
    const id = String(mode || '').toLowerCase();
    return VALID_QURAN_READ_MODES.has(id) ? id : DEFAULT_QURAN_READ_MODE;
}

export function sanitizeStoredZikir(z, idx, orderFallback = idx) {
    return {
        id: coerceId(z.id, 'z'),
        folderId: coerceId(z.folderId || 'f_default', 'f'),
        name: coerceString(z.name || 'Zikir', 80) || `Zikir ${idx + 1}`,
        arabic: coerceString(z.arabic || '', 1200),
        target: clampNumber(z.target, { min: 1, max: 1000000, fallback: 33 }),
        meaning: coerceString(z.meaning || '', 1600),
        count: clampNumber(z.count, { min: 0, max: 1000000000, fallback: 0 }),
        lastClicked: clampNumber(z.lastClicked, { min: 0, max: 9e15, fallback: 0 }),
        order: (typeof z.order === 'number' && Number.isFinite(z.order)) ? z.order : orderFallback,
        favorite: typeof z.favorite === 'boolean' ? z.favorite : false,
        fazilet: z.fazilet != null ? coerceString(z.fazilet, 2000) : undefined,
        libraryId: z.libraryId ? coerceId(z.libraryId, 'lib') : undefined,
        quranRef:
            z.quranRef && isPlainObject(z.quranRef)
                ? {
                      s: clampNumber(z.quranRef.s, { min: 1, max: 114, fallback: 1 }),
                      a: clampNumber(z.quranRef.a, { min: 1, max: 300, fallback: 1 }),
                      ayahs: Array.isArray(z.quranRef.ayahs)
                          ? z.quranRef.ayahs
                                .map((n) => clampNumber(n, { min: 1, max: 300, fallback: 0 }))
                                .filter((n) => n > 0)
                                .slice(0, 3)
                          : undefined
                  }
                : undefined,
        quranDisplayMode:
            z.quranDisplayMode != null && String(z.quranDisplayMode).trim()
                ? normalizeStoredQuranReadMode(z.quranDisplayMode)
                : undefined,
        quranCounterLayout:
            z.quranCounterLayout != null && String(z.quranCounterLayout).trim()
                ? normalizeQuranCounterLayout(z.quranCounterLayout)
                : undefined
    };
}
