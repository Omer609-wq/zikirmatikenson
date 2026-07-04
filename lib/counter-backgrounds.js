/**
 * Premium sayaç arka planı — görseller `public/assets/counter-bg/` altına eklenir.
 * @type {{ id: string, file: string, labelKey?: string }[]}
 */
export const COUNTER_BG_PRESETS = [
    { id: 'q1', file: 'q1.png' },
    { id: 'q3', file: 'q3.png' },
    { id: 'q4', file: 'q4.png' },
    { id: 'q5', file: 'q5.png' },
    { id: 'q6', file: 'q6.png' },
    { id: 'q7', file: 'q7.png' },
    { id: 'q8', file: 'q8.png' },
    { id: 'q9', file: 'q9.png' },
    { id: 'q10', file: 'q10.png' },
    { id: 'q11', file: 'q11.png' },
    { id: 'q12', file: 'q12.png' },
    { id: 'q13', file: 'q13.png' },
    { id: 'q14', file: 'q14.png' },
    { id: 'q15', file: 'q15.png' },
    { id: 'q16', file: 'q16.png' },
    { id: 'q17', file: 'q17.png' },
    { id: 'q19', file: 'q19.png' },
    { id: 'q20', file: 'q20.png' },
    { id: 'q21', file: 'q21.png' },
    { id: 'q23', file: 'q23.png' },
    { id: 'q24', file: 'q24.png' },
    { id: 'q25', file: 'q25.png' },
    { id: 'q26', file: 'q26.png' },
    { id: 'q27', file: 'q27.png' },
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
