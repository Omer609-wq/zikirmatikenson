import { getPageStartAyah } from './quran-pages.js';

/**
 * Mushaf → ayet listesi geçişinde hedef sure/ayet.
 * Sayfa başındaki ayete hizala; bilinmeyen sayfada fallback sure'nin 1. ayeti.
 */
export function resolveScrollTargetLeavingMushaf(pageNum, fallbackSurahId = 1) {
    const start = getPageStartAyah(pageNum);
    if (start) {
        return { surah: start.s, ayah: start.a };
    }
    const surah = Number(fallbackSurahId);
    return {
        surah: Number.isFinite(surah) && surah >= 1 && surah <= 114 ? surah : 1,
        ayah: 1
    };
}

/**
 * Mushaf yeniden çizimlerinde (meal / okuma modu / dil / scroll→mushaf) sayfa tercihi.
 * `preferSaved` yalnızca "kaldığım sayfa" açıkken anlamlıdır — aksi halde kayıtlı
 * sayfa bayat kalır (varsayılan 1) ve `mushafCurrentPage` ezilir.
 */
export function getMushafNavOptsForRerender(readerLayout, rememberPage) {
    if (readerLayout !== 'mushaf') return {};
    return rememberPage ? { preferSaved: true } : {};
}
