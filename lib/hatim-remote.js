/**
 * Paylaşımlı hatim grupları — Firestore işlemleri.
 *
 * Her fonksiyon `{ db, uid }` bağlamı alır; uygulama bağlamı firebase-app.js'ten
 * kurar, testler emülatörün bağlamını verir. Böylece aynı kod gerçek kurallara
 * (firestore.rules) karşı firestore-tests/ altında sınanır.
 *
 * Dönüş sözleşmesi lib/hatim-groups.js ile aynı dilde: `{ ok: true, ... }` ya da
 * `{ ok: false, reason }`. Arayüz reddi yerel modeldekiyle aynı anahtarlarla gösterir
 * ('taken', 'notOwner', 'notClaimed', 'notDone'); ağ ve yetki için ek anahtarlar:
 * 'offline', 'denied', 'busy', 'gone', 'removed', 'owner', 'done', 'invalid'.
 *
 * Tasarım: docs/HATIM_GROUPS_DESIGN.md §3, §4, §6, §7, §10.
 */
import {
    collection,
    doc,
    getDoc,
    getDocs,
    runTransaction,
    serverTimestamp,
    setDoc,
    writeBatch
} from 'firebase/firestore';
import {
    HATIM_GROUP_NAME_MAX,
    HATIM_JUZ_COUNT,
    HATIM_MEMBER_NAME_MAX,
    JUZ_CLAIMED,
    JUZ_DONE,
    JUZ_FREE,
    generateHatimCode,
    isValidHatimCode,
    normalizeHatimCode
} from './hatim-groups.js';
import {
    FREE_JUZ_FIELDS,
    HATIM_CODES_COLLECTION,
    HATIM_COLLECTION,
    HATIM_JUZ_SUBCOLLECTION,
    HATIM_MEMBERS_SUBCOLLECTION,
    HATIM_REPORTS_COLLECTION,
    groupFromRemote,
    juzFromRemote,
    needsJuzRefetch,
    reasonFromError,
    toMillis
} from './hatim-remote-map.js';

/** Kod doluysa kaç kez yeni kodla denenecek. 31⁶ uzayda çakışma zaten nadir. */
const CODE_ATTEMPTS = 5;
/** Firestore toplu yazma sınırı 500; kod + hatim + 30 cüz dışındakiler üyeler. */
const BATCH_LIMIT = 500;
const REPORT_REASON_MAX = 500;

/**
 * Eşzamanlı yazışta sunucu, transaction'ı yeniden oynatmadan kuralı güncel
 * duruma karşı değerlendirip permission-denied dönebilir. Emülatörde görüldü:
 * aynı cüzü iki kişi aynı anda alınca kaybeden 'taken' yerine 'denied' aldı;
 * aynı sayacı okuyan iki katılımcıdan ikincisi de böyle reddedilir. SDK bu
 * hatayı yeniden denemez. Birkaç kez yeniden deneyince transaction güncel
 * durumu okur ve iş kuralı doğru cevabı verir ('taken', 'alreadyMember');
 * ret gerçekse yine reddedilir.
 */
const RACE_RETRIES = 4;

async function runRaceSafeTransaction(db, updateFn) {
    for (let attempt = 0; ; attempt += 1) {
        try {
            return await runTransaction(db, updateFn);
        } catch (err) {
            if (reasonFromError(err) !== 'denied' || attempt >= RACE_RETRIES) throw err;
            await new Promise((resolve) => setTimeout(resolve, 40 + Math.random() * 80));
        }
    }
}

function requireContext(ctx) {
    if (!ctx?.db || !ctx?.uid) throw new Error('NOT_SIGNED_IN');
}

function cleanText(value, max) {
    return String(value ?? '').trim().slice(0, max);
}

function hatimRef(db, hatimId) {
    return doc(db, HATIM_COLLECTION, hatimId);
}

function codeRef(db, code) {
    return doc(db, HATIM_CODES_COLLECTION, code);
}

function memberRef(db, hatimId, uid) {
    return doc(db, HATIM_COLLECTION, hatimId, HATIM_MEMBERS_SUBCOLLECTION, uid);
}

function juzRef(db, hatimId, n) {
    return doc(db, HATIM_COLLECTION, hatimId, HATIM_JUZ_SUBCOLLECTION, String(n));
}

function allJuzRefs(db, hatimId) {
    return Array.from({ length: HATIM_JUZ_COUNT }, (_, i) => juzRef(db, hatimId, i + 1));
}

/* ------------------------------------------------------------------ */
/* Kurma, bulma, katılma                                               */
/* ------------------------------------------------------------------ */

/**
 * Grubu kurar: kod + hatim + yöneticinin üyelik kaydı + 30 boş cüz tek toplu
 * yazmada. Kod doluysa kural reddeder; kodun gerçekten dolu olduğu doğrulanınca
 * yeni kodla tekrar denenir.
 *
 * @returns {Promise<{ ok: true, group: object } | { ok: false, reason: string }>}
 */
export async function createSharedHatim(ctx, { name, memberName, random } = {}) {
    requireContext(ctx);
    const groupName = cleanText(name, HATIM_GROUP_NAME_MAX);
    const displayName = cleanText(memberName, HATIM_MEMBER_NAME_MAX);
    if (!groupName || !displayName) return { ok: false, reason: 'invalid' };

    const { db, uid } = ctx;
    for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt += 1) {
        const hatimId = doc(collection(db, HATIM_COLLECTION)).id;
        const code = generateHatimCode(random);
        const hatimData = { name: groupName, code, ownerUid: uid, rev: 0, memberCount: 1 };

        const batch = writeBatch(db);
        batch.set(codeRef(db, code), { hatimId });
        batch.set(hatimRef(db, hatimId), { ...hatimData, createdAt: serverTimestamp() });
        batch.set(memberRef(db, hatimId, uid), { name: displayName, joinedAt: serverTimestamp() });
        for (const ref of allJuzRefs(db, hatimId)) {
            batch.set(ref, { n: Number(ref.id), ...FREE_JUZ_FIELDS });
        }

        try {
            await batch.commit();
            return {
                ok: true,
                group: groupFromRemote(hatimId, { ...hatimData, createdAt: Date.now() }, new Map())
            };
        } catch (err) {
            const reason = reasonFromError(err);
            if (reason !== 'denied') return { ok: false, reason };
            // Ret kod çakışmasından mı, gerçek yetkiden mi? Kodu okuyarak ayırt et.
            const taken = await getDoc(codeRef(db, code))
                .then((snap) => snap.exists())
                .catch(() => false);
            if (!taken) return { ok: false, reason: 'denied' };
        }
    }
    return { ok: false, reason: 'busy' };
}

/**
 * Koddan grubu bulur ve katılmadan önce gösterilecek bilgiyi getirir.
 * @returns {Promise<{ ok: true, hatimId: string, name: string, memberCount: number, ownerUid: string }
 *   | { ok: false, reason: 'invalid' | 'notFound' | string }>}
 */
export async function findHatimByCode(ctx, rawCode) {
    requireContext(ctx);
    if (!isValidHatimCode(rawCode)) return { ok: false, reason: 'invalid' };
    const code = normalizeHatimCode(rawCode);
    const { db } = ctx;
    try {
        const codeSnap = await getDoc(codeRef(db, code));
        if (!codeSnap.exists()) return { ok: false, reason: 'notFound' };
        const hatimId = codeSnap.data().hatimId;
        const hatimSnap = await getDoc(hatimRef(db, hatimId));
        // Başıboş kod: grup silinmiş ama kod kalmış (kurallar önler, eski veri için).
        if (!hatimSnap.exists()) return { ok: false, reason: 'notFound' };
        const h = hatimSnap.data();
        return { ok: true, hatimId, name: h.name, memberCount: h.memberCount, ownerUid: h.ownerUid };
    } catch (err) {
        return { ok: false, reason: reasonFromError(err) };
    }
}

/**
 * Gruba katılır: üyelik kaydı ve sayaç aynı transaction'da. Zaten üyeyse yazmaz.
 * Kişi başına 5 grup sınırı istemcide (isHatimLimitReached) — çağırmadan önce.
 *
 * @returns {Promise<{ ok: true, hatimId: string, alreadyMember: boolean } | { ok: false, reason: string }>}
 */
export async function joinHatim(ctx, hatimId, memberName) {
    requireContext(ctx);
    const displayName = cleanText(memberName, HATIM_MEMBER_NAME_MAX);
    if (!displayName) return { ok: false, reason: 'invalid' };
    const { db, uid } = ctx;
    try {
        return await runRaceSafeTransaction(db, async (tx) => {
            const hatimSnap = await tx.get(hatimRef(db, hatimId));
            if (!hatimSnap.exists()) return { ok: false, reason: 'notFound' };
            const mineSnap = await tx.get(memberRef(db, hatimId, uid));
            if (mineSnap.exists()) return { ok: true, hatimId, alreadyMember: true };

            tx.set(memberRef(db, hatimId, uid), { name: displayName, joinedAt: serverTimestamp() });
            tx.update(hatimRef(db, hatimId), { memberCount: hatimSnap.data().memberCount + 1 });
            return { ok: true, hatimId, alreadyMember: false };
        });
    } catch (err) {
        return { ok: false, reason: reasonFromError(err) };
    }
}

/* ------------------------------------------------------------------ */
/* Okuma                                                               */
/* ------------------------------------------------------------------ */

/**
 * Grubun güncel hâlini getirir.
 *
 * Her açılışta hatim belgesi + kişinin kendi üyelik kaydı + üye listesi okunur.
 * Cüz tablosu (+30) yalnızca rev önbellekle farklıysa okunur (§3).
 *
 * Üyelik kaydı her seferinde okunur çünkü çıkarılan üye başka türlü fark
 * edemez: yönetici çıkarırken rev değişmeyebilir, önbellek eski tabloyu
 * göstermeye devam eder.
 *
 * Üye listesi "Üyeler" satırındaki yeşil/kırmızı nokta için. Kurallar listeyi
 * üye olmayana kapattığından hatası yutulur; grup silinmişse ya da kişi
 * çıkarılmışsa o bilgi zaten yukarıdaki iki okumadan geliyor.
 *
 * `gone` ve `removed`, çağıranın grubu yerel listeden atıp sınırı boşaltması
 * gerektiğini söyler (§10 hayalet grup).
 *
 * @returns {Promise<{ ok: true, group: object, juzFetched: boolean }
 *   | { ok: false, reason: 'gone' | 'removed' | 'offline' | 'denied' | string }>}
 */
export async function fetchHatim(ctx, hatimId, previous = null) {
    requireContext(ctx);
    const { db, uid } = ctx;
    try {
        const memberList = getDocs(collection(db, HATIM_COLLECTION, hatimId, HATIM_MEMBERS_SUBCOLLECTION))
            .then((snap) => snap.docs.map((m) => m.id))
            .catch(() => null); // okunamazsa noktalar bekler, açılış bozulmaz
        const [hatimSnap, mineSnap, memberUids] = await Promise.all([
            getDoc(hatimRef(db, hatimId)),
            getDoc(memberRef(db, hatimId, uid)),
            memberList
        ]);
        if (!hatimSnap.exists()) return { ok: false, reason: 'gone' };
        if (!mineSnap.exists()) return { ok: false, reason: 'removed' };

        const h = hatimSnap.data();
        if (!needsJuzRefetch(previous, h.rev)) {
            return {
                ok: true,
                group: groupFromRemote(hatimId, h, null, previous, memberUids),
                juzFetched: false
            };
        }
        const juzSnap = await getDocs(collection(db, HATIM_COLLECTION, hatimId, HATIM_JUZ_SUBCOLLECTION));
        const byN = new Map();
        juzSnap.forEach((snap) => byN.set(Number(snap.id), snap.data()));
        return {
            ok: true,
            group: groupFromRemote(hatimId, h, byN, previous, memberUids),
            juzFetched: true
        };
    } catch (err) {
        return { ok: false, reason: reasonFromError(err) };
    }
}

/**
 * Üye listesi — yöneticinin çıkarma ekranı için. Katılma sırasına göre.
 * @returns {Promise<{ ok: true, members: Array<{ uid: string, name: string, joinedAt: number | null }> }
 *   | { ok: false, reason: string }>}
 */
export async function listHatimMembers(ctx, hatimId) {
    requireContext(ctx);
    try {
        const snap = await getDocs(collection(ctx.db, HATIM_COLLECTION, hatimId, HATIM_MEMBERS_SUBCOLLECTION));
        const members = [];
        snap.forEach((m) => {
            const data = m.data();
            members.push({ uid: m.id, name: data.name, joinedAt: toMillis(data.joinedAt) });
        });
        members.sort((a, b) => (a.joinedAt ?? 0) - (b.joinedAt ?? 0));
        return { ok: true, members };
    } catch (err) {
        return { ok: false, reason: reasonFromError(err) };
    }
}

/* ------------------------------------------------------------------ */
/* Cüz işlemleri — tek cüz + rev, transaction                          */
/* ------------------------------------------------------------------ */

/**
 * Ortak iskelet: hatim ve cüzü transaction içinde okur, `decide` kararına göre
 * cüzü yazar ve rev'i tam 1 artırır. Aynı cüzü iki kişi aynı anda alırsa
 * transaction ikinciyi yeniden oynatır, `decide` o sefer 'taken' döner.
 */
async function mutateJuz(ctx, hatimId, n, decide) {
    requireContext(ctx);
    const juzN = Number(n);
    if (!Number.isInteger(juzN) || juzN < 1 || juzN > HATIM_JUZ_COUNT) {
        return { ok: false, reason: 'invalid' };
    }
    const { db, uid } = ctx;
    try {
        return await runRaceSafeTransaction(db, async (tx) => {
            const hatimSnap = await tx.get(hatimRef(db, hatimId));
            if (!hatimSnap.exists()) return { ok: false, reason: 'gone' };
            const juzSnap = await tx.get(juzRef(db, hatimId, juzN));
            const h = hatimSnap.data();
            const current = juzFromRemote(juzN, juzSnap.data());

            const decision = decide(current, { uid, ownerUid: h.ownerUid });
            if (!decision.ok) return decision;

            tx.update(juzRef(db, hatimId, juzN), decision.write);
            tx.update(hatimRef(db, hatimId), { rev: h.rev + 1 });
            return { ok: true, rev: h.rev + 1, juz: { ...current, ...decision.local } };
        });
    } catch (err) {
        return { ok: false, reason: reasonFromError(err) };
    }
}

export function claimJuzRemote(ctx, hatimId, n, memberName) {
    const displayName = cleanText(memberName, HATIM_MEMBER_NAME_MAX);
    if (!displayName) return Promise.resolve({ ok: false, reason: 'invalid' });
    return mutateJuz(ctx, hatimId, n, (current, { uid }) => {
        if (current.state !== JUZ_FREE) return { ok: false, reason: 'taken' };
        return {
            ok: true,
            write: { state: JUZ_CLAIMED, by: uid, byName: displayName, claimedAt: serverTimestamp() },
            local: { state: JUZ_CLAIMED, by: uid, byName: displayName, claimedAt: Date.now(), completedAt: null }
        };
    });
}

export function completeJuzRemote(ctx, hatimId, n) {
    return mutateJuz(ctx, hatimId, n, (current, { uid }) => {
        if (current.state !== JUZ_CLAIMED) return { ok: false, reason: 'notClaimed' };
        if (current.by !== uid) return { ok: false, reason: 'notOwner' };
        return {
            ok: true,
            write: { state: JUZ_DONE, completedAt: serverTimestamp() },
            local: { state: JUZ_DONE, completedAt: Date.now() }
        };
    });
}

/** Yanlışlıkla "bitirdim" denen cüzü geri alır. */
export function uncompleteJuzRemote(ctx, hatimId, n) {
    return mutateJuz(ctx, hatimId, n, (current, { uid }) => {
        if (current.state !== JUZ_DONE) return { ok: false, reason: 'notDone' };
        if (current.by !== uid) return { ok: false, reason: 'notOwner' };
        return {
            ok: true,
            write: { state: JUZ_CLAIMED, completedAt: null },
            local: { state: JUZ_CLAIMED, completedAt: null }
        };
    });
}

/**
 * Bitmemiş cüzü bırakır. `force` ile yönetici başkasınınkini boşaltır (kayıp üye).
 * Bitmiş cüz bırakılmaz ('done'): yerel kişisel hatimden farkı bu — okuma
 * yapılmıştır, önce uncompleteJuzRemote gerekir.
 */
export function releaseJuzRemote(ctx, hatimId, n, { force = false } = {}) {
    return mutateJuz(ctx, hatimId, n, (current, { uid, ownerUid }) => {
        if (current.state === JUZ_DONE) return { ok: false, reason: 'done' };
        if (current.state !== JUZ_CLAIMED) return { ok: false, reason: 'notClaimed' };
        const allowed = current.by === uid || (force && ownerUid === uid);
        if (!allowed) return { ok: false, reason: 'notOwner' };
        return { ok: true, write: { ...FREE_JUZ_FIELDS }, local: { ...FREE_JUZ_FIELDS } };
    });
}

/* ------------------------------------------------------------------ */
/* Ayrılma, çıkarma, silme (§7, §10)                                   */
/* ------------------------------------------------------------------ */

/**
 * Belirli bir üyenin bitmemiş cüzlerini transaction içinde bulur. 30 cüzün
 * hepsi okunur: önbellek başka cihazda alınmış bir cüzü bilmeyebilir, eksik
 * kalan cüz ayrılan birinin üstünde asılı kalır ve hatmi kilitler.
 */
async function claimedByInTransaction(tx, db, hatimId, memberUid) {
    const refs = allJuzRefs(db, hatimId);
    const snaps = await Promise.all(refs.map((ref) => tx.get(ref)));
    const numbers = [];
    snaps.forEach((snap, i) => {
        const juz = juzFromRemote(i + 1, snap.data());
        if (juz.state === JUZ_CLAIMED && juz.by === memberUid) numbers.push(i + 1);
    });
    return { refs, numbers };
}

/**
 * Katılımcı gruptan ayrılır: bitmemiş cüzleri boşa düşer, bitmişler kalır.
 * Yönetici ayrılamaz ('owner') — grubu siler.
 *
 * @returns {Promise<{ ok: true, released?: number[], alreadyLeft?: boolean, gone?: boolean }
 *   | { ok: false, reason: string }>}
 */
export async function leaveHatim(ctx, hatimId) {
    requireContext(ctx);
    const { db, uid } = ctx;
    try {
        return await runRaceSafeTransaction(db, async (tx) => {
            const hatimSnap = await tx.get(hatimRef(db, hatimId));
            if (!hatimSnap.exists()) return { ok: true, gone: true };
            const h = hatimSnap.data();
            if (h.ownerUid === uid) return { ok: false, reason: 'owner' };
            const mineSnap = await tx.get(memberRef(db, hatimId, uid));
            if (!mineSnap.exists()) return { ok: true, alreadyLeft: true };

            const { refs, numbers } = await claimedByInTransaction(tx, db, hatimId, uid);
            for (const n of numbers) tx.update(refs[n - 1], { ...FREE_JUZ_FIELDS });
            tx.delete(memberRef(db, hatimId, uid));
            tx.update(hatimRef(db, hatimId), {
                memberCount: h.memberCount - 1,
                ...(numbers.length ? { rev: h.rev + 1 } : {})
            });
            return { ok: true, released: numbers };
        });
    } catch (err) {
        return { ok: false, reason: reasonFromError(err) };
    }
}

/**
 * Yönetici bir üyeyi çıkarır (§7 engelleme): üyelik kaydı silinir, bitmemiş
 * cüzleri boşa düşer, bitmişleri kalır.
 */
export async function removeHatimMember(ctx, hatimId, memberUid) {
    requireContext(ctx);
    const { db, uid } = ctx;
    if (!memberUid || memberUid === uid) return { ok: false, reason: 'invalid' };
    try {
        return await runRaceSafeTransaction(db, async (tx) => {
            const hatimSnap = await tx.get(hatimRef(db, hatimId));
            if (!hatimSnap.exists()) return { ok: false, reason: 'gone' };
            const h = hatimSnap.data();
            if (h.ownerUid !== uid) return { ok: false, reason: 'notOwner' };
            const theirSnap = await tx.get(memberRef(db, hatimId, memberUid));
            if (!theirSnap.exists()) return { ok: true, alreadyRemoved: true };

            const { refs, numbers } = await claimedByInTransaction(tx, db, hatimId, memberUid);
            for (const n of numbers) tx.update(refs[n - 1], { ...FREE_JUZ_FIELDS });
            tx.delete(memberRef(db, hatimId, memberUid));
            tx.update(hatimRef(db, hatimId), {
                memberCount: h.memberCount - 1,
                ...(numbers.length ? { rev: h.rev + 1 } : {})
            });
            return { ok: true, released: numbers };
        });
    } catch (err) {
        return { ok: false, reason: reasonFromError(err) };
    }
}

/**
 * Yönetici grubu siler: kod, üyeler, 30 cüz ve hatim tek toplu yazmada.
 *
 * Bilinen boşluk: üye listesi okunduktan sonra ama yazmadan önce biri katılırsa
 * onun kaydı yetim kalır (kurallar hatim yokken silmeye izin vermez); 12 ay
 * temizliği toplar. Katılımcının cihazı grubu `fetchHatim` → 'gone' ile atar.
 */
export async function deleteHatim(ctx, hatimId) {
    requireContext(ctx);
    const { db, uid } = ctx;
    try {
        const hatimSnap = await getDoc(hatimRef(db, hatimId));
        if (!hatimSnap.exists()) return { ok: true, gone: true };
        const h = hatimSnap.data();
        if (h.ownerUid !== uid) return { ok: false, reason: 'notOwner' };

        const members = await getDocs(collection(db, HATIM_COLLECTION, hatimId, HATIM_MEMBERS_SUBCOLLECTION));
        if (members.size + HATIM_JUZ_COUNT + 2 > BATCH_LIMIT) return { ok: false, reason: 'tooLarge' };

        const batch = writeBatch(db);
        batch.delete(codeRef(db, h.code));
        members.forEach((m) => batch.delete(m.ref));
        for (const ref of allJuzRefs(db, hatimId)) batch.delete(ref);
        batch.delete(hatimRef(db, hatimId));
        await batch.commit();
        return { ok: true };
    } catch (err) {
        return { ok: false, reason: reasonFromError(err) };
    }
}

/** Grubu şikâyet eder (§7). Katılmamış biri de edebilir. */
export async function reportHatim(ctx, hatimId, reason) {
    requireContext(ctx);
    try {
        await setDoc(doc(collection(ctx.db, HATIM_REPORTS_COLLECTION)), {
            hatimId,
            reason: cleanText(reason, REPORT_REASON_MAX),
            reporterUid: ctx.uid,
            createdAt: serverTimestamp()
        });
        return { ok: true };
    } catch (err) {
        return { ok: false, reason: reasonFromError(err) };
    }
}
