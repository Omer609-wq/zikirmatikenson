/**
 * Kütüphane maddesi ↔ klasör ilişkisi.
 *
 * Kullanıcı bir kütüphane maddesini birden fazla klasöre ekleyebilir; her ekleme
 * ayrı bir zikir kaydı yaratır ve `libraryId` ile kaynağa bağlanır. Keşfet
 * kartındaki "ekli" işareti bu ilişkiden hesaplanır.
 */

/**
 * Maddenin bulunduğu klasörleri döndürür (klasör sırası korunur, tekrarsız).
 * @param {string} libraryId kütüphane maddesi kimliği
 * @param {Array<{libraryId?: string, folderId?: string}>} zikirs
 * @param {Array<{id: string, name?: string}>} folders
 * @param {(z: object) => (string|null|undefined)} [resolveLibraryId] Bir zikrin
 *   hangi kütüphane maddesine ait sayılacağını döndürür. Varsayılan: `z.libraryId`.
 *   Varsayılan zikirler (Subhanallah vb.) `libraryId` taşımaz; çağıran taraf
 *   bunları kimliğe göre eşlemek için kendi çözücüsünü geçebilir.
 * @returns {Array<{id: string, name?: string}>}
 */
export function getFoldersForLibraryItem(libraryId, zikirs, folders, resolveLibraryId) {
    const id = String(libraryId ?? '').trim();
    if (!id || !Array.isArray(zikirs) || !Array.isArray(folders)) return [];
    const resolve = typeof resolveLibraryId === 'function' ? resolveLibraryId : (z) => z && z.libraryId;

    const folderIds = new Set();
    for (const z of zikirs) {
        if (!z || resolve(z) !== id) continue;
        const fid = z.folderId;
        if (fid) folderIds.add(fid);
    }
    if (folderIds.size === 0) return [];

    // Klasörler üzerinden filtrele: kullanıcının gördüğü sıra korunur ve
    // silinmiş klasöre bağlı artık kayıtlar kendiliğinden elenir.
    return folders.filter((f) => f && folderIds.has(f.id));
}

/**
 * İpucu balonunda gösterilecek metin: "Klasör A · Klasör B".
 * @param {Array<{name?: string}>} folderList
 * @param {number} maxNames fazlası "+N" olarak kısaltılır
 */
export function formatFolderNames(folderList, maxNames = 3) {
    if (!Array.isArray(folderList) || folderList.length === 0) return '';
    const names = folderList
        .map((f) => String(f?.name ?? '').trim())
        .filter(Boolean);
    if (names.length === 0) return '';
    if (names.length <= maxNames) return names.join(' · ');
    const shown = names.slice(0, maxNames).join(' · ');
    return `${shown} +${names.length - maxNames}`;
}
