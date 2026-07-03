/**
 * Premium sayaç arka planı — görseller `public/assets/counter-bg/` altına eklenir.
 * @type {{ id: string, file: string, labelKey?: string }[]}
 */
export const COUNTER_BG_PRESETS = [
    {
        id: 'nasir-al-mulk',
        file: 'nasir-al-mulk.webp',
        labelKey: 'premium.counterBgPresetNasirAlMulk'
        // Unsplash: https://unsplash.com/photos/pACLiF3-3sc (Nasir al-Mulk Mosque, Shiraz)
    }
];

export function normalizeCounterBackground(value, presets = COUNTER_BG_PRESETS) {
    const v = String(value || '').trim();
    if (!v || v === 'none') return 'none';
    if (v === 'custom') return 'custom';
    if (v.startsWith('preset:')) {
        const id = v.slice(7);
        if (presets.some((p) => p.id === id)) return `preset:${id}`;
    }
    return 'none';
}

export function findCounterBgPreset(value, presets = COUNTER_BG_PRESETS) {
    const norm = normalizeCounterBackground(value, presets);
    if (!norm.startsWith('preset:')) return null;
    const id = norm.slice(7);
    return presets.find((p) => p.id === id) || null;
}

export function counterBgPresetUrl(preset) {
    if (!preset?.file) return '';
    return `/assets/counter-bg/${preset.file}`;
}
