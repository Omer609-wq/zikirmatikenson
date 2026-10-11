/**
 * Kullanıcının sildiği Esma kayıtları (ESMA_LIST sırası, `appMeta.removedEsma`).
 *
 * Açılışta eksik Esma'lar tamamlanıyor (liste genişlerse ya da kayıt bozulursa diye).
 * Silme hatırlanmadığı için silinen isim her açılışta sıfır sayaçla geri geliyordu;
 * Premium'da çöp kutusundaki asıl kayıt geri yüklenince de kimlik çakışıp ikinci bir
 * kayıt doğuyordu. Silinenler bu listede durur, geri yüklenince listeden çıkar.
 */

const ESMA_ZIKIR_ID = /^z_e_(\d+)$/;

/** z_e_N → N; Esma değilse -1. */
export function esmaIndexFromZikirId(id) {
    const m = ESMA_ZIKIR_ID.exec(id != null ? String(id) : '');
    return m ? parseInt(m[1], 10) : -1;
}

/** Kayıttan okunan liste: benzersiz, sıralı, geçerli sıra numaraları. */
export function normalizeRemovedEsma(value) {
    if (!Array.isArray(value)) return [];
    const nums = value.filter((n) => Number.isInteger(n) && n >= 0 && n < 1000);
    return [...new Set(nums)].sort((a, b) => a - b);
}

function esmaIndexes(zikirIds) {
    return [...zikirIds].map(esmaIndexFromZikirId).filter((n) => n >= 0);
}

/** Silinen zikirlerden Esma olanları listeye ekler (yeni dizi döner). */
export function addRemovedEsma(list, zikirIds) {
    return normalizeRemovedEsma([...normalizeRemovedEsma(list), ...esmaIndexes(zikirIds)]);
}

/** Geri yüklenen Esma'ları listeden çıkarır (yeni dizi döner). */
export function dropRemovedEsma(list, zikirIds) {
    const back = new Set(esmaIndexes(zikirIds));
    return normalizeRemovedEsma(list).filter((n) => !back.has(n));
}
