export function getMushafNavOptsForRerender(readerLayout) {
    return readerLayout === 'mushaf' ? { preferSaved: true } : {};
}

export function getMushafNavOptsForSurahOpen(scrollAyah, readerLayout) {
    if (scrollAyah != null && Number.isFinite(Number(scrollAyah))) return {};
    return readerLayout === 'mushaf' ? { forceSurahStart: true } : {};
}
