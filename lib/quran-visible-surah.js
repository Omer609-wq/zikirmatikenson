/**
 * Scroll/list okuyucuda görünen sure ile app state'ini hizala.
 *
 * Sure atlama okları (ve kaydırma) `showView` çağırmaz; yalnızca kaydırır.
 * Meal / okuma modu / düzen yeniden çizimleri `currentQuranSurahId` kullanır —
 * görünür sureyi tercih etmezsek kullanıcı yanlış sureye zıplar.
 */

/**
 * @param {unknown} currentId uygulama state'indeki sure
 * @param {unknown} visibleId ekranda görünen sure (yoksa null)
 * @returns {number} 1..114
 */
export function resolveQuranReaderSurahId(currentId, visibleId) {
    const v = Number(visibleId);
    if (Number.isFinite(v) && v >= 1 && v <= 114) return Math.trunc(v);
    const c = Number(currentId);
    if (Number.isFinite(c) && c >= 1 && c <= 114) return Math.trunc(c);
    return 1;
}
