/**
 * Paylaşımlı hatimin Firestore biçimi ↔ yerel model (lib/hatim-groups.js) dönüşümü.
 *
 * Saf: Firestore'a dokunmaz, SDK'yı içe aktarmaz. Zaman damgasını yalnızca
 * `toMillis()` yöntemi üzerinden tanır; böylece `npm test` altında emülatörsüz
 * sınanır. Firestore işlemleri lib/hatim-remote.js'te.
 *
 * Tasarım: docs/HATIM_GROUPS_DESIGN.md §3 (veri modeli, rev önbelleği), §10.
 */
import {
    HATIM_JUZ_COUNT,
    HATIM_KIND_SHARED,
    JUZ_CLAIMED,
    JUZ_DONE,
    JUZ_FREE
} from './hatim-groups.js';

export const HATIM_COLLECTION = 'hatims';
export const HATIM_CODES_COLLECTION = 'hatimCodes';
export const HATIM_MEMBERS_SUBCOLLECTION = 'members';
export const HATIM_JUZ_SUBCOLLECTION = 'juz';
export const HATIM_REPORTS_COLLECTION = 'reports';

const JUZ_STATES = new Set([JUZ_FREE, JUZ_CLAIMED, JUZ_DONE]);

/** Boş cüz — hem yerel satır hem de sunucuya yazılacak alanlar aynı. */
export const FREE_JUZ_FIELDS = Object.freeze({
    state: JUZ_FREE,
    by: null,
    byName: null,
    claimedAt: null,
    completedAt: null
});

/**
 * Firestore Timestamp | Date | ms → ms. Tanınmayan değer null.
 * @returns {number | null}
 */
export function toMillis(value) {
    if (value == null) return null;
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (value instanceof Date) {
        const ms = value.getTime();
        return Number.isFinite(ms) ? ms : null;
    }
    return null;
}

/**
 * Uzak cüz belgesi → yerel cüz satırı. Sahibi olmayan "alındı" kaydı boş sayılır;
 * yerel temizleme (sanitizeJuzRow) de aynı kuralı uygular, ikisi ayrışmamalı.
 */
export function juzFromRemote(n, data) {
    const d = data && typeof data === 'object' ? data : {};
    const state = JUZ_STATES.has(d.state) ? d.state : JUZ_FREE;
    if (state === JUZ_FREE || typeof d.by !== 'string' || !d.by) {
        return { n, ...FREE_JUZ_FIELDS };
    }
    return {
        n,
        state,
        by: d.by,
        byName: typeof d.byName === 'string' && d.byName ? d.byName : null,
        claimedAt: toMillis(d.claimedAt),
        completedAt: state === JUZ_DONE ? toMillis(d.completedAt) : null
    };
}

/**
 * Uzak hatim (+ istenirse cüzler) → yerel grup.
 *
 * @param {string} hatimId
 * @param {Record<string, unknown>} hatimData
 * @param {Map<number, object> | null} juzByN  null: cüzler bu sefer okunmadı
 *   (rev değişmedi), önceki yerel cüzler kullanılır.
 * @param {object | null} [previous]  aynı grubun yerel son hâli
 */
export function groupFromRemote(hatimId, hatimData, juzByN, previous = null) {
    const h = hatimData && typeof hatimData === 'object' ? hatimData : {};
    const keepPrevious = !juzByN && Array.isArray(previous?.juz) && previous.juz.length === HATIM_JUZ_COUNT;
    const juz = keepPrevious
        ? previous.juz
        : Array.from({ length: HATIM_JUZ_COUNT }, (_, i) => juzFromRemote(i + 1, juzByN?.get(i + 1)));
    return {
        id: hatimId,
        name: typeof h.name === 'string' ? h.name : '',
        kind: HATIM_KIND_SHARED,
        code: typeof h.code === 'string' ? h.code : '',
        ownerId: typeof h.ownerUid === 'string' ? h.ownerUid : null,
        createdAt: toMillis(h.createdAt) || 0,
        order: typeof previous?.order === 'number' ? previous.order : 0,
        juz,
        remote: {
            rev: Number.isInteger(h.rev) && h.rev >= 0 ? h.rev : 0,
            memberCount: Number.isInteger(h.memberCount) && h.memberCount >= 1 ? h.memberCount : 1
        }
    };
}

/** Sunucuyla eşleşmiş paylaşımlı hatim mi? Hiç senkronlanmamış yerel grup değil. */
export function isRemoteHatim(group) {
    return !!group && group.kind === HATIM_KIND_SHARED && !!group.remote;
}

/**
 * Cüz tablosu yeniden okunmalı mı? Yalnızca rev önbellekle aynıysa ve önbellek
 * sağlamsa hayır (§3: açılışta 30 okuma yalnızca tablo değiştiğinde).
 */
export function needsJuzRefetch(previous, remoteRev) {
    if (!isRemoteHatim(previous)) return true;
    if (!Array.isArray(previous.juz) || previous.juz.length !== HATIM_JUZ_COUNT) return true;
    return previous.remote.rev !== remoteRev;
}

/** Kişinin bu gruptaki bitmemiş cüzleri. */
export function claimedJuzNumbers(group, uid) {
    if (!uid) return [];
    return (group?.juz || [])
        .filter((j) => j.state === JUZ_CLAIMED && j.by === uid)
        .map((j) => j.n);
}

/**
 * Sunucuda artık bulunmayan ya da kişinin çıkarıldığı grupları yerel listeden atar
 * (§10 hayalet grup). Kişisel ve hiç senkronlanmamış gruplara dokunmaz.
 */
export function dropGoneHatims(groups, goneIds) {
    const gone = new Set(goneIds || []);
    if (!gone.size) return Array.isArray(groups) ? groups : [];
    return (Array.isArray(groups) ? groups : []).filter((g) => !(isRemoteHatim(g) && gone.has(g.id)));
}

/**
 * Firestore hatasını arayüzün diline çevirir.
 * @returns {'denied' | 'offline' | 'busy' | 'gone' | 'error'}
 */
export function reasonFromError(err) {
    const code = String(err?.code || '').replace(/^firestore\//, '');
    if (code === 'permission-denied' || code === 'unauthenticated') return 'denied';
    if (code === 'unavailable' || code === 'deadline-exceeded') return 'offline';
    if (code === 'aborted' || code === 'failed-precondition' || code === 'resource-exhausted') return 'busy';
    if (code === 'not-found') return 'gone';
    return 'error';
}
