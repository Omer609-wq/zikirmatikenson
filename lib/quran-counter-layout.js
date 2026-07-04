export const QURAN_COUNTER_LAYOUTS = ['classic', 'compact', 'text-only'];

export function normalizeQuranCounterLayout(layout) {
    const v = String(layout || '').trim();
    return QURAN_COUNTER_LAYOUTS.includes(v) ? v : 'classic';
}
