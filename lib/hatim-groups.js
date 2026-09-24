/**
 * Hatim grubu modeli — saf veri katmanı, depolama ve arayüzden bağımsız.
 *
 * Bu adımda grup yalnızca cihazda yaşıyor; tek kişilik hatim takibi olarak çalışır.
 * Şekil, sonraki adımda Firestore'a taşınabilecek biçimde seçildi: 30 cüz tek dizide
 * durur (tek okumada tüm tablo gelir) ve her cüz sahibini `by` alanında taşır — yerelde
 * bu alan cihaz kimliği, çok kullanıcılıda üyenin uid'i olur, göç gerekmez.
 *
 * Fonksiyonlar grubu değiştirmez; güncellenmiş yeni bir grup nesnesi döndürür.
 */
import { clampNumber, coerceId, coerceString, isPlainObject, mintId } from './coerce.js';
import { HATIM_JUZ_COUNT } from './hatim-juz.js';

export { HATIM_JUZ_COUNT };

/**
 * Kip başına hatim sayısı: 5 kişisel + 5 ortak. Sınır toplamda değil kip
 * başına tutulur, çünkü ikisi farklı işler — kişisel hatim kendi okuman,
 * ortak hatim bir gruba verdiğin sözdür; biri diğerinin yerini yemez.
 * Ortak taraf ayrıca maliyetli: her grup açılışta 1 okuma demek.
 */
/**
 * Sınır iki katmanlı: devam eden hatimler sunucudan sürekli okunduğu için
 * sayılıdır (tür başına 5). Tamamlananlar birkaç gün sonra donup yerel
 * kayda dönüşür, sunucuya hiç gitmez; onlar için sınır yalnızca telefonun
 * deposu (tür başına 30 ≈ 120 KB).
 */
export const HATIM_ACTIVE_LIMIT_PER_KIND = 5;
export const HATIM_ARCHIVE_LIMIT_PER_KIND = 30;

/**
 * Biten hatim hemen donmaz: "bitirdim" yanlışlıkla işaretlenmiş olabilir ve
 * cüz geri alınabiliyor. Üç gün o düzeltmelere yeter — bitmiş bir hatimde
 * kimse günler sonra cüz geri almaz. Kısa tutmanın kazancı, sunucu
 * okumasının erken kesilmesi.
 */
export const HATIM_FREEZE_AFTER_DAYS = 3;
const DAY_MS = 86400000;
export const HATIM_GROUP_NAME_MAX = 40;
/** Cüz hücresinin altında görüneceği için kısa tutulur. */
export const HATIM_MEMBER_NAME_MAX = 20;

/**
 * Hatim kipi. Kişisel hatimde bütün cüzler zaten kullanıcınındır: ad sorulmaz,
 * katılma kodu ve paylaşım gösterilmez, hücrelerde isim yazmaz.
 */
export const HATIM_KIND_PERSONAL = 'personal';
export const HATIM_KIND_SHARED = 'shared';
const HATIM_KINDS = new Set([HATIM_KIND_PERSONAL, HATIM_KIND_SHARED]);

/** @returns {boolean} */
export function isPersonalHatim(group) {
    return group?.kind === HATIM_KIND_PERSONAL;
}

/** Kipi bilinmeyen kayıt ortak sayılır: kip alanından önce kurulan hatimler
    grup akışıyla açılmıştı. Sınır sayımı da temizleme de aynı kuralı kullanır. */
export function hatimKindOf(group) {
    return HATIM_KINDS.has(group?.kind) ? group.kind : HATIM_KIND_SHARED;
}

/** @returns {number} O kipteki hatim sayısı. */
export function countHatimsByKind(groups, kind) {
    if (!Array.isArray(groups)) return 0;
    return groups.filter((g) => hatimKindOf(g) === kind).length;
}

/** @returns {boolean} O kipte yeni hatim açılabilir mi? */
/** Devam eden (tamamlanmamış) hatimler — sınır bunları sayar. */
export function countActiveHatims(groups, kind) {
    if (!Array.isArray(groups)) return 0;
    return groups.filter((g) => hatimKindOf(g) === kind && !isHatimComplete(g)).length;
}

export function isHatimLimitReached(groups, kind) {
    return countActiveHatims(groups, kind) >= HATIM_ACTIVE_LIMIT_PER_KIND;
}

/** Hatmin bittiği an: en son biten cüzün zamanı. Bitmemişse ya da zaman yoksa 0. */
export function hatimCompletedAt(group) {
    if (!isHatimComplete(group)) return 0;
    let last = 0;
    for (const juz of group.juz || []) {
        const at = Number(juz?.completedAt) || 0;
        if (at > last) last = at;
    }
    return last;
}

/**
 * Donmuş hatim: bitişinin üzerinden bir ay geçmiş. Artık sunucudan okunmaz,
 * elde yalnızca yerel kayıt kalır — kim hangi cüzü okudu, ne zaman bitti.
 *
 * Ayrı bir işaret saklanmaz, cüzlerin bitiş zamanından hesaplanır: eski
 * kayıtlar da göçe gerek kalmadan doğru davranır. Zaman damgası olmayan eski
 * kayıt donmaz (0 döner) — senkronda kalması, yanlış donmasından iyi.
 */
export function isHatimFrozen(group, now = Date.now()) {
    const done = hatimCompletedAt(group);
    return done > 0 && now - done >= HATIM_FREEZE_AFTER_DAYS * DAY_MS;
}

/** Cüz durumları: boş → alındı → bitti */
export const JUZ_FREE = 'free';
export const JUZ_CLAIMED = 'claimed';
export const JUZ_DONE = 'done';

const JUZ_STATES = new Set([JUZ_FREE, JUZ_CLAIMED, JUZ_DONE]);

/**
 * Katılma kodu alfabesi — karışabilen karakterler (0/O, 1/I/L) dışarıda.
 * 31 harf × 6 hane ≈ 887 milyon ihtimal; kodu telefonda dikte etmek hâlâ kolay.
 */
export const HATIM_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const HATIM_CODE_LENGTH = 6;

/**
 * @param {() => number} [random] test edilebilirlik için enjekte edilebilir
 * @returns {string}
 */
export function generateHatimCode(random = Math.random) {
    let out = '';
    for (let i = 0; i < HATIM_CODE_LENGTH; i += 1) {
        const idx = Math.floor(random() * HATIM_CODE_ALPHABET.length);
        out += HATIM_CODE_ALPHABET[Math.min(idx, HATIM_CODE_ALPHABET.length - 1)];
    }
    return out;
}

/** Kullanıcının yazdığı kodu normalize eder (küçük harf, boşluk, tire toleransı). */
export function normalizeHatimCode(input) {
    return String(input || '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, HATIM_CODE_LENGTH);
}

export function isValidHatimCode(input) {
    const code = normalizeHatimCode(input);
    if (code.length !== HATIM_CODE_LENGTH) return false;
    return [...code].every((ch) => HATIM_CODE_ALPHABET.includes(ch));
}

function createEmptyJuz(n) {
    return { n, state: JUZ_FREE, by: null, byName: null, claimedAt: null, completedAt: null };
}

/**
 * @param {{ name?: string, code?: string, ownerId?: string, order?: number,
 *   kind?: 'personal' | 'shared', now?: number, random?: () => number }} [opts]
 */
export function createHatimGroup(opts = {}) {
    const {
        name,
        code,
        ownerId = null,
        order = 0,
        kind = HATIM_KIND_SHARED,
        now = Date.now(),
        random
    } = opts;
    return {
        id: mintId('h'),
        name: coerceString(name || '', HATIM_GROUP_NAME_MAX),
        kind: HATIM_KINDS.has(kind) ? kind : HATIM_KIND_SHARED,
        code: code ? normalizeHatimCode(code) : generateHatimCode(random),
        ownerId,
        createdAt: now,
        order,
        juz: Array.from({ length: HATIM_JUZ_COUNT }, (_, i) => createEmptyJuz(i + 1))
    };
}

function findJuz(group, juzN) {
    const n = Number(juzN);
    if (!Number.isInteger(n) || n < 1 || n > HATIM_JUZ_COUNT) return null;
    return (group?.juz || []).find((j) => j.n === n) || null;
}

/** Grubu kopyalayıp yalnızca hedef cüzü değiştirir. */
function withJuz(group, juzN, patch) {
    return {
        ...group,
        juz: group.juz.map((j) => (j.n === juzN ? { ...j, ...patch } : j))
    };
}

/**
 * Boş bir cüzü üstlenir.
 * @returns {{ ok: true, group: object } | { ok: false, reason: 'invalid' | 'taken' }}
 */
export function claimJuz(group, juzN, memberId, opts = {}) {
    const { memberName = null, now = Date.now() } = opts;
    const juz = findJuz(group, juzN);
    if (!juz || !memberId) return { ok: false, reason: 'invalid' };
    if (juz.state !== JUZ_FREE) return { ok: false, reason: 'taken' };
    return {
        ok: true,
        group: withJuz(group, juz.n, {
            state: JUZ_CLAIMED,
            by: memberId,
            byName: memberName ? coerceString(memberName, HATIM_MEMBER_NAME_MAX) : null,
            claimedAt: now,
            completedAt: null
        })
    };
}

/**
 * Üstlenilen cüzü bitmiş olarak işaretler. Yalnızca cüzün sahibi yapabilir.
 * @returns {{ ok: true, group: object } | { ok: false, reason: 'invalid' | 'notClaimed' | 'notOwner' }}
 */
export function completeJuz(group, juzN, memberId, opts = {}) {
    const { now = Date.now() } = opts;
    const juz = findJuz(group, juzN);
    if (!juz || !memberId) return { ok: false, reason: 'invalid' };
    if (juz.state !== JUZ_CLAIMED) return { ok: false, reason: 'notClaimed' };
    if (juz.by !== memberId) return { ok: false, reason: 'notOwner' };
    return { ok: true, group: withJuz(group, juz.n, { state: JUZ_DONE, completedAt: now }) };
}

/** Yanlışlıkla "bitirdim" denen cüzü üstlenilmiş hâline geri alır. */
export function uncompleteJuz(group, juzN, memberId) {
    const juz = findJuz(group, juzN);
    if (!juz || !memberId) return { ok: false, reason: 'invalid' };
    if (juz.state !== JUZ_DONE) return { ok: false, reason: 'notDone' };
    if (juz.by !== memberId) return { ok: false, reason: 'notOwner' };
    return { ok: true, group: withJuz(group, juz.n, { state: JUZ_CLAIMED, completedAt: null }) };
}

/**
 * Cüzü serbest bırakır. Sahibi kendi cüzünü bırakabilir; `force` ile grup sahibi
 * kayıp bir üyenin üstünde kalan cüzü serbest bırakabilir (hatmi kilitlenmekten kurtarır).
 */
export function releaseJuz(group, juzN, memberId, opts = {}) {
    const { force = false } = opts;
    const juz = findJuz(group, juzN);
    if (!juz) return { ok: false, reason: 'invalid' };
    if (juz.state === JUZ_FREE) return { ok: false, reason: 'notClaimed' };
    if (!force && juz.by !== memberId) return { ok: false, reason: 'notOwner' };
    return { ok: true, group: withJuz(group, juz.n, createEmptyJuz(juz.n)) };
}

/**
 * @returns {{ free: number, claimed: number, done: number, total: number, percent: number }}
 */
export function getHatimProgress(group) {
    const juz = group?.juz || [];
    const done = juz.filter((j) => j.state === JUZ_DONE).length;
    const claimed = juz.filter((j) => j.state === JUZ_CLAIMED).length;
    const total = HATIM_JUZ_COUNT;
    return {
        free: total - done - claimed,
        claimed,
        done,
        total,
        percent: total ? Math.round((done / total) * 100) : 0
    };
}

export function isHatimComplete(group) {
    return getHatimProgress(group).done === HATIM_JUZ_COUNT;
}

/** Üyenin bu gruptaki cüzleri — "Cüzlerim" listesi bunları toplar. */
export function listMemberJuz(group, memberId) {
    if (!memberId) return [];
    return (group?.juz || []).filter((j) => j.by === memberId);
}

/** Üyenin sırada okuması gereken cüz: üstlenilmiş ama bitmemiş en küçük numara. */
export function getNextMemberJuz(group, memberId) {
    return listMemberJuz(group, memberId).find((j) => j.state === JUZ_CLAIMED) || null;
}

/**
 * Okunacak sıradaki cüz: bitmemiş ilk cüz. Kişisel hatimde bütün cüzler zaten
 * kullanıcının olduğu için "sıradaki" bu demektir; getNextMemberJuz ise yalnızca
 * üstlenilmiş cüzleri tarar ve ortak hatim için doğrudur.
 */
export function getNextJuzToRead(group) {
    return (group?.juz || []).find((j) => j.state !== JUZ_DONE) || null;
}

/** İki an arasındaki takvim günü farkı (yerel saat). Yaz saati geçişinden etkilenmez. */
function calendarDaysBetween(fromMs, toMs) {
    const a = new Date(fromMs);
    const b = new Date(toMs);
    const dayA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const dayB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.max(0, Math.round((dayB - dayA) / 86400000));
}

/**
 * Grup ekranında adın altındaki satır için: başlangıç ve süre.
 *
 * Gün sayısı takvim günüdür, saat farkı değil: dün 23:00'te başlayan hatim
 * iki saat sonra "1 gündür" sayılır — insanın saydığı gibi. Tamamlanmış hatimde
 * süre bugüne değil son cüzün bitişine kadardır; yoksa tamamlanmış bir hatim
 * her gün "bir gün daha uzun" görünürdü.
 *
 * @returns {{ startedAt: number, days: number, complete: boolean } | null}
 *   Başlangıç bilinmiyorsa (eski kayıt) null — satır gösterilmez.
 */
export function hatimTimeline(group, now = Date.now()) {
    const startedAt = Number(group?.createdAt);
    if (!Number.isFinite(startedAt) || startedAt <= 0) return null;
    const complete = isHatimComplete(group);
    let end = now;
    if (complete) {
        const last = Math.max(0, ...(group.juz || []).map((j) => Number(j.completedAt) || 0));
        if (last > 0) end = last;
    }
    return { startedAt, days: calendarDaysBetween(startedAt, end), complete };
}

/**
 * Yük kademesi: aynı cüzü kaç hatimde okumayı beklediğin.
 *
 * Ana ekran şeridindeki nokta 8,6 x 6 piksel; beş ayrı ton o boyutta birbirinden
 * ayırt edilemez. Üç kademe rahat ayrılır: 1 cüz, 2 cüz, 3 ve üstü. Üst kademe
 * erken doyurulur çünkü 3'ün ötesi hem nadir (toplam hatim sınırı beş) hem de
 * pratikte aynı şeyi söyler — "bu cüzde epey borcun var".
 */
export const HATIM_LOAD_STEPS = [1, 2, Infinity];

/** @returns {0 | 1 | 2 | 3} 0 = bekleyen yok. */
export function hatimLoadLevel(pending) {
    const n = Number(pending);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return HATIM_LOAD_STEPS.findIndex((ust) => n <= ust) + 1;
}

/**
 * Üyenin bütün hatimlerindeki cüzlerini 30'luk tek şeritte toplar.
 *
 * Aynı cüz numarası birden çok hatimde üstlenilebilir; tek bir hatmin şeridi
 * bunu gösteremiyordu. Burada her numara için "kaçı okunmayı bekliyor" ve
 * "kaçı bitti" ayrı sayılır, durum da buna göre belirlenir: bekleyen varsa
 * üstlenilmiş, yoksa ama biten varsa bitmiş, hiçbiri yoksa boş.
 *
 * @param {Array<object>} groups Kişisel ve ortak hatimlerin tamamı.
 * @param {string | string[]} memberId  Kişisel hatimde cüz yerel kimliğe,
 *   paylaşımlıda Firebase uid'sine bağlıdır; ikisi birlikte verilebilir.
 * @returns {Array<{ n: number, pending: number, done: number, state: string, level: number }>}
 *   Her zaman 30 öğe, cüz sırasında.
 */
export function buildMemberJuzStrip(groups, memberId) {
    const pending = new Array(HATIM_JUZ_COUNT).fill(0);
    const done = new Array(HATIM_JUZ_COUNT).fill(0);
    const ids = new Set((Array.isArray(memberId) ? memberId : [memberId]).filter(Boolean));

    if (ids.size) {
        for (const group of Array.isArray(groups) ? groups : []) {
            for (const juz of group?.juz || []) {
                if (!ids.has(juz.by)) continue;
                const i = juz.n - 1;
                if (i < 0 || i >= HATIM_JUZ_COUNT) continue;
                if (juz.state === JUZ_CLAIMED) pending[i] += 1;
                else if (juz.state === JUZ_DONE) done[i] += 1;
            }
        }
    }

    return Array.from({ length: HATIM_JUZ_COUNT }, (_, i) => {
        let state = JUZ_FREE;
        if (pending[i] > 0) state = JUZ_CLAIMED;
        else if (done[i] > 0) state = JUZ_DONE;
        return { n: i + 1, pending: pending[i], done: done[i], state, level: hatimLoadLevel(pending[i]) };
    });
}

function sanitizeJuzRow(raw, n) {
    const row = isPlainObject(raw) ? raw : {};
    const state = JUZ_STATES.has(row.state) ? row.state : JUZ_FREE;
    const by = state === JUZ_FREE ? null : coerceString(row.by || '', 64) || null;
    // Sahibi olmayan bir "alındı" kaydı hatmi sessizce kilitler; boşa düşürülür.
    if (!by) return createEmptyJuz(n);
    return {
        n,
        state,
        by,
        byName: coerceString(row.byName || '', HATIM_MEMBER_NAME_MAX) || null,
        claimedAt: clampNumber(row.claimedAt, { min: 0, max: 9e15, fallback: 0 }) || null,
        completedAt:
            state === JUZ_DONE
                ? clampNumber(row.completedAt, { min: 0, max: 9e15, fallback: 0 }) || null
                : null
    };
}

/**
 * Paylaşımlı hatimin sunucuyla eşleşme bilgisi. Düşürülürse `rev` önbelleği her
 * açılışta kaybolur ve cüz tablosu her seferinde baştan okunur
 * (docs/HATIM_GROUPS_DESIGN.md §3). Kişisel hatimde anlamı yok, tutulmaz;
 * hiç senkronlanmamış yerel grupta da yoktur.
 */
/** Üye kimliği listesi; dizi değilse null ("hiç bakılmadı" ile "boş" ayrı şeyler). */
function sanitizeUidList(value) {
    if (!Array.isArray(value)) return null;
    const out = [];
    for (const item of value) {
        if (typeof item !== 'string') continue;
        const uid = coerceString(item, 64);
        if (uid && !out.includes(uid)) out.push(uid);
        if (out.length >= 200) break;
    }
    return out;
}

/**
 * Son bakılan üye listesi: kimlik + son bilinen ad. Ad, ayrılan kişiyi listede
 * "Ali (ayrıldı)" diye gösterebilmek için saklanır. Eski kayıtlar düz kimlik
 * dizisiydi; onlar da okunur, adı boş kalır.
 */
function sanitizeSeenMembers(value) {
    if (!Array.isArray(value)) return null;
    const out = [];
    for (const item of value) {
        const rawUid = typeof item === 'string' ? item : isPlainObject(item) ? item.uid : '';
        const uid = coerceString(rawUid || '', 64);
        if (!uid || out.some((m) => m.uid === uid)) continue;
        const name = isPlainObject(item) ? coerceString(item.name || '', 40) : '';
        out.push({ uid, name });
        if (out.length >= 200) break;
    }
    return out;
}

function sanitizeRemoteMeta(g) {
    if (hatimKindOf(g) !== HATIM_KIND_SHARED || !isPlainObject(g.remote)) return {};
    const { rev, memberCount } = g.remote;
    const seen = sanitizeSeenMembers(g.remote.seenMembers);
    return {
        remote: {
            rev: Number.isInteger(rev) && rev >= 0 ? rev : 0,
            memberCount: Number.isInteger(memberCount) && memberCount >= 1 ? memberCount : 1,
            // Üye listesi ve son bakılan hâli: "Üyeler" satırındaki nokta ikisinin
            // farkından çıkıyor, düşerlerse nokta hep yanar ya da hiç yanmaz.
            memberUids: sanitizeUidList(g.remote.memberUids) || [],
            ...(seen ? { seenMembers: seen } : {})
        }
    };
}

/**
 * Arşiv bakımı: tavanı aşan en eski tamamlanmış hatimler düşer, donmuş
 * hatimlerin senkron defteri (üye listeleri, rev) atılır.
 *
 * Tavan aşıldığında kullanıcıya sorulmaz: tıkanma hatmin bittiği anda olurdu,
 * "tebrikler, önce eski bir hatmi sil" demek en kötü zamanlama olur. Sunucudaki
 * üyelik olduğu gibi kalır; silinen yalnızca telefondaki kayıttır.
 *
 * @returns {{ groups: object[], changed: boolean }}
 */
export function tidyHatimArchive(groups, now = Date.now()) {
    if (!Array.isArray(groups)) return { groups: [], changed: false };

    // Tür başına tamamlananlar, yenisi önce: tavanı aşanlar (en eskiler) düşer.
    const fazla = new Set();
    for (const kind of [HATIM_KIND_PERSONAL, HATIM_KIND_SHARED]) {
        const bitmis = groups
            .filter((g) => hatimKindOf(g) === kind && isHatimComplete(g))
            .sort((a, b) => hatimCompletedAt(b) - hatimCompletedAt(a));
        for (const g of bitmis.slice(HATIM_ARCHIVE_LIMIT_PER_KIND)) fazla.add(g);
    }

    let changed = fazla.size > 0;
    const next = [];
    for (const g of groups) {
        if (fazla.has(g)) continue;
        // Donmuş grupta senkron defteri ölü ağırlık: bir daha okunmayacak.
        if (isPlainObject(g.remote) && isHatimFrozen(g, now) && ('memberUids' in g.remote || 'seenMembers' in g.remote)) {
            const { memberUids, seenMembers, ...kalanRemote } = g.remote;
            next.push({ ...g, remote: kalanRemote });
            changed = true;
            continue;
        }
        next.push(g);
    }
    return { groups: next, changed };
}

/** Temizlemeden önceki ham kayıt bitmiş mi? Kırpma kotası buna göre seçilir. */
function rawHatimComplete(g) {
    const juz = Array.isArray(g.juz) ? g.juz : [];
    if (juz.length < HATIM_JUZ_COUNT) return false;
    let done = 0;
    for (const j of juz) {
        if (isPlainObject(j) && j.state === JUZ_DONE) done += 1;
    }
    return done >= HATIM_JUZ_COUNT;
}

/** Ham kayıtta son cüzün bitiş zamanı; arşiv sıralaması buna göre. */
function rawCompletedAt(g) {
    let last = 0;
    for (const j of Array.isArray(g.juz) ? g.juz : []) {
        const at = Number(j?.completedAt) || 0;
        if (at > last) last = at;
    }
    return last;
}

/**
 * Arşiv tavanını aşan kayıtlar — en eski bitişliler. Kural `tidyHatimArchive`
 * ile aynı; ayrışsalardı depoda 30'dan fazlası varken açılışta yeni bitmiş
 * hatim düşer, eskisi kalırdı.
 */
function rawArchiveOverflow(raw) {
    const fazla = new Set();
    for (const kind of [HATIM_KIND_PERSONAL, HATIM_KIND_SHARED]) {
        const bitmis = raw
            .filter((g) => isPlainObject(g) && hatimKindOf(g) === kind && rawHatimComplete(g))
            .sort((a, b) => rawCompletedAt(b) - rawCompletedAt(a));
        for (const g of bitmis.slice(HATIM_ARCHIVE_LIMIT_PER_KIND)) fazla.add(g);
    }
    return fazla;
}

/** Depodan okunan grupları güvenli hâle getirir; bozuk kayıt grubu düşürmez. */
export function sanitizeHatimGroups(raw) {
    if (!Array.isArray(raw)) return [];
    // Kırpma kip başına ve durum başına ayrı: düz slice olsaydı 5 kişisel +
    // 5 ortak tutan kullanıcı her açılışta yarısını kaybederdi. Devam eden ve
    // arşiv kotaları da ayrı, yoksa listenin sonunda duran devam eden bir hatim,
    // aylar önce bitmiş bir kayıt uğruna düşerdi.
    const kalanAktif = {
        [HATIM_KIND_PERSONAL]: HATIM_ACTIVE_LIMIT_PER_KIND,
        [HATIM_KIND_SHARED]: HATIM_ACTIVE_LIMIT_PER_KIND
    };
    const kalanArsiv = {
        [HATIM_KIND_PERSONAL]: HATIM_ARCHIVE_LIMIT_PER_KIND,
        [HATIM_KIND_SHARED]: HATIM_ARCHIVE_LIMIT_PER_KIND
    };
    const arsivFazlasi = rawArchiveOverflow(raw);
    return raw
        .filter((g) => isPlainObject(g))
        .filter((g) => !arsivFazlasi.has(g))
        .filter((g) => {
            const kind = hatimKindOf(g);
            const kalan = rawHatimComplete(g) ? kalanArsiv : kalanAktif;
            if (kalan[kind] <= 0) return false;
            kalan[kind] -= 1;
            return true;
        })
        .map((g, idx) => {
            const juzByN = new Map(
                (Array.isArray(g.juz) ? g.juz : [])
                    .filter((j) => isPlainObject(j))
                    .map((j) => [Number(j.n), j])
            );
            return {
                id: coerceId(g.id, 'h'),
                name: coerceString(g.name || '', HATIM_GROUP_NAME_MAX),
                kind: hatimKindOf(g),
                code: isValidHatimCode(g.code) ? normalizeHatimCode(g.code) : generateHatimCode(),
                ownerId: coerceString(g.ownerId || '', 64) || null,
                createdAt: clampNumber(g.createdAt, { min: 0, max: 9e15, fallback: 0 }),
                order: typeof g.order === 'number' && Number.isFinite(g.order) ? g.order : idx,
                juz: Array.from({ length: HATIM_JUZ_COUNT }, (_, i) =>
                    sanitizeJuzRow(juzByN.get(i + 1), i + 1)
                ),
                ...sanitizeRemoteMeta(g)
            };
        });
}
