/**
 * Kütüphane konu grupları — aynı konudaki dualar tek başlık altında toplanır.
 *
 * Grup yalnızca bir **gezinme katmanıdır**: madde kütüphanedeki yerinde durur,
 * arama düz sonuç vermeye devam eder (grup içindekiler de tekil kart olarak çıkar).
 * Üyelik `data/library/*.json` içindeki maddenin `group` alanıyla belirlenir.
 */

/** Tanımlı gruplar; `nameKey` locale dosyalarındaki başlık anahtarı. */
export const LIBRARY_GROUPS = [
    { id: 'tovbe', category: 'dua', nameKey: 'library.groupTovbe' }
];

/** @param {string} groupId */
export function getLibraryGroup(groupId) {
    const id = String(groupId ?? '').trim();
    if (!id) return null;
    return LIBRARY_GROUPS.find((g) => g.id === id) || null;
}

/**
 * Gruba ait maddeler (kaynak sırası korunur).
 * @param {string} groupId
 * @param {Array<{group?: string}>} items
 */
export function getLibraryGroupItems(groupId, items) {
    const id = String(groupId ?? '').trim();
    if (!id || !Array.isArray(items)) return [];
    return items.filter((z) => z && z.group === id);
}

/**
 * Kategori listesini grup kartları ve grupsuz maddeler diye ikiye ayırır.
 * Boş gruplar (hiç üyesi kalmamışsa) listelenmez.
 *
 * @param {Array<{id: string, group?: string}>} items
 * @param {string} category
 * @returns {{ groups: Array<{id: string, nameKey: string, items: Array}>, loose: Array }}
 */
export function splitLibraryByGroup(items, category) {
    const list = Array.isArray(items) ? items : [];
    const groups = [];

    for (const g of LIBRARY_GROUPS) {
        if (g.category !== category) continue;
        const members = list.filter((z) => z && z.group === g.id);
        if (members.length) groups.push({ ...g, items: members });
    }

    const groupedIds = new Set();
    for (const g of groups) {
        for (const z of g.items) groupedIds.add(z.id);
    }

    return { groups, loose: list.filter((z) => z && !groupedIds.has(z.id)) };
}
