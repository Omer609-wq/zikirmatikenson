/**
 * Uzak içerik dosyasının (public/seasonal-content.json) sürüm karşılaştırması.
 *
 * İnternet yokken iki kopya olabilir: en son indirilen (localStorage) ve
 * uygulamanın içine paketlenmiş olan. Hangisinin daha yeni olduğu dosyadaki
 * "updatedAt" alanından bilinir.
 *
 * Yalnızca indirileni tercih etmek yanlış olurdu: kullanıcı uygulamayı
 * güncellediyse paketteki kopya, aylar önce indirilenden yeni olabilir.
 * Tersi de yanlış: dosya push'landıysa indirilen, paketteki sürümden yenidir.
 */

/**
 * @param {unknown} payload
 * @returns {number} ms cinsinden zaman; alan yoksa ya da bozuksa 0
 */
export function payloadUpdatedAt(payload) {
    const raw = payload && typeof payload === 'object' ? payload.updatedAt : null;
    if (typeof raw !== 'string') return 0;
    const ms = Date.parse(raw);
    return Number.isFinite(ms) ? ms : 0;
}

/**
 * İkisinden yeni olanı; eşitse ya da ikisi de tarihsizse ilki. Biri yoksa diğeri.
 *
 * @template T
 * @param {T} a
 * @param {T} b
 * @returns {T | null}
 */
export function pickNewerPayload(a, b) {
    if (!a || typeof a !== 'object') return b && typeof b === 'object' ? b : null;
    if (!b || typeof b !== 'object') return a;
    return payloadUpdatedAt(b) > payloadUpdatedAt(a) ? b : a;
}
