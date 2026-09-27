import { getJuzBoundaries } from './juz-boundaries.js';

export function getJuzForAyah(surahN, ayahN) {
    const s = Number(surahN);
    const a = Number(ayahN);
    if (!Number.isFinite(s) || !Number.isFinite(a)) return 1;
    let juz = 1;
    for (const boundary of getJuzBoundaries()) {
        if (s > boundary.surah || (s === boundary.surah && a >= boundary.ayah)) {
            juz = boundary.juz;
        } else {
            break;
        }
    }
    return juz;
}

export function getJuzAtStart(surahN, ayahN) {
    const found = getJuzBoundaries().find(
        (b) => b.surah === Number(surahN) && b.ayah === Number(ayahN)
    );
    return found ? found.juz : null;
}

export function getJuzDividerBeforeAyah(surahN, ayahN) {
    const juz = getJuzAtStart(surahN, ayahN);
    if (!juz || juz <= 1) return null;
    if (Number(ayahN) === 1) return null;
    return juz;
}
