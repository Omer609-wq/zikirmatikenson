/**
 * Scroll-list place restore after a height-changing redraw (meal / locale shell
 * rebuild). Prefer an ayah identity over raw scrollTop — meal text lengths
 * shift block heights, so the same pixel lands on a different ayah.
 *
 * @param {{
 *   scrollAyah?: unknown,
 *   forceSurahStart?: boolean,
 *   savedAnchor?: { surah?: string|number, ayah?: string|number } | null,
 *   savedReaderScrollTop?: number|null
 * }} opts
 * @returns {'ayah'|'surah'|'anchor'|'pixel'}
 */
export function resolveScrollPlaceRestore({
    scrollAyah = null,
    forceSurahStart = false,
    savedAnchor = null,
    savedReaderScrollTop = null
} = {}) {
    if (scrollAyah != null && Number.isFinite(Number(scrollAyah))) return 'ayah';
    if (forceSurahStart) return 'surah';
    const surah = savedAnchor != null ? Number(savedAnchor.surah) : NaN;
    const ayah = savedAnchor != null ? Number(savedAnchor.ayah) : NaN;
    if (Number.isFinite(surah) && surah >= 1 && Number.isFinite(ayah) && ayah >= 1) {
        return 'anchor';
    }
    if (savedReaderScrollTop != null && savedReaderScrollTop > 0) return 'pixel';
    return 'surah';
}
