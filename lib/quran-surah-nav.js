/**
 * Liste (scroll) modunda sure açılışında kaydırma hedefi.
 * Açık bir ayet hedefi yokken eski scrollTop'u geri yüklemek, sure
 * listesinden başka bir sureye geçişi ezer — yalnızca yerinde yeniden
 * çizimlerde (meal/dil) konum korunmalı.
 *
 * @param {{
 *   scrollAyah?: unknown,
 *   forceSurahStart?: boolean,
 *   savedReaderScrollTop?: number|null
 * }} opts
 * @returns {'ayah'|'surah'|'restore'}
 */
export function resolveScrollListFinishAction({
    scrollAyah,
    forceSurahStart = false,
    savedReaderScrollTop = null
} = {}) {
    if (scrollAyah != null && Number.isFinite(Number(scrollAyah))) return 'ayah';
    if (forceSurahStart) return 'surah';
    if (savedReaderScrollTop != null && savedReaderScrollTop > 0) return 'restore';
    return 'surah';
}
