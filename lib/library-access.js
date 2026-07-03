/**
 * Ücretsiz kütüphane erişimi (PREMIUM_LIVE + !premium iken).
 * tr.json sırasına göre: ilk N dua / ilk N zikir ücretsiz; geri kalanı kilitli.
 */
import libraryTr from '../data/library/tr.json';

export const FREE_BASE_DUA_COUNT = 10;
export const FREE_BASE_ZIKIR_COUNT = 10;

/** @type {Set<string> | null} */
let lockedBaseIds = null;

function lockedBaseIdSet() {
    if (lockedBaseIds) return lockedBaseIds;
    const duas = libraryTr.filter((x) => x.category === 'dua');
    const zikirs = libraryTr.filter((x) => x.category !== 'dua');
    lockedBaseIds = new Set([
        ...duas.slice(FREE_BASE_DUA_COUNT).map((x) => x.id),
        ...zikirs.slice(FREE_BASE_ZIKIR_COUNT).map((x) => x.id)
    ]);
    return lockedBaseIds;
}

/**
 * Ücretsiz tr.json maddesi premium ile mi kilitli?
 * plib_* ayrı paket; burada yalnızca base id'ler.
 */
export function isBaseLibraryItemPremiumLocked(id, { premiumLive = false, isPremium = false } = {}) {
    if (!premiumLive || isPremium) return false;
    return lockedBaseIdSet().has(String(id));
}

/** @returns {string[]} */
export function getLockedBaseLibraryIds() {
    return [...lockedBaseIdSet()];
}

/** @returns {{ freeDuas: string[]; lockedDuas: string[]; freeZikirs: string[]; lockedZikirs: string[] }} */
export function getBaseLibraryAccessSplit() {
    const duas = libraryTr.filter((x) => x.category === 'dua');
    const zikirs = libraryTr.filter((x) => x.category !== 'dua');
    return {
        freeDuas: duas.slice(0, FREE_BASE_DUA_COUNT).map((x) => x.id),
        lockedDuas: duas.slice(FREE_BASE_DUA_COUNT).map((x) => x.id),
        freeZikirs: zikirs.slice(0, FREE_BASE_ZIKIR_COUNT).map((x) => x.id),
        lockedZikirs: zikirs.slice(FREE_BASE_ZIKIR_COUNT).map((x) => x.id)
    };
}
