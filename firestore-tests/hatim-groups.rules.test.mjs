/**
 * firestore.rules — paylaşımlı hatim grupları ve canlı yedekleme kuralı.
 *
 * Emülatör ister (Java + firebase-tools); bu yüzden `npm test`e karışmaz:
 *   npm run test:rules
 *
 * Her test tek bir kuralı sınar ve adı neyi kanıtladığını söyler.
 * Tasarım: docs/HATIM_GROUPS_DESIGN.md §3, §5, §7, §10.
 */
import test, { after, before, beforeEach } from 'node:test';
import { readFileSync } from 'node:fs';
import {
    assertFails,
    assertSucceeds,
    initializeTestEnvironment
} from '@firebase/rules-unit-testing';
import {
    deleteDoc,
    doc,
    getDoc,
    serverTimestamp,
    setDoc,
    updateDoc,
    writeBatch
} from 'firebase/firestore';

const PROJECT_ID = 'demo-zikirmatik-rules';
const OWNER = 'uid_yonetici';
const MEMBER = 'uid_katilimci';
const OUTSIDER = 'uid_yabanci';
const HATIM = 'hatim_1';
const CODE = 'K7M2QP';

let env;

before(async () => {
    env = await initializeTestEnvironment({
        projectId: PROJECT_ID,
        firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') }
    });
});

after(async () => {
    await env?.cleanup();
});

beforeEach(async () => {
    await env.clearFirestore();
});

const db = (uid) => (uid ? env.authenticatedContext(uid).firestore() : env.unauthenticatedContext().firestore());

const freeJuz = (n) => ({ n, state: 'free', by: null, byName: null, claimedAt: null, completedAt: null });

/**
 * Kuralları kapatıp hazır bir grup kurar: yönetici + (istenirse) katılımcı,
 * 30 boş cüz. `juz` ile belirli cüzlerin durumu ezilebilir.
 */
async function seedGroup({ withMember = true, rev = 0, juz = {} } = {}) {
    await env.withSecurityRulesDisabled(async (ctx) => {
        const s = ctx.firestore();
        const batch = writeBatch(s);
        batch.set(doc(s, 'hatimCodes', CODE), { hatimId: HATIM });
        batch.set(doc(s, 'hatims', HATIM), {
            name: 'Mahalle Camii Hatmi',
            code: CODE,
            ownerUid: OWNER,
            createdAt: new Date(0),
            rev,
            memberCount: withMember ? 2 : 1
        });
        batch.set(doc(s, 'hatims', HATIM, 'members', OWNER), { name: 'Hoca', joinedAt: new Date(0) });
        if (withMember) {
            batch.set(doc(s, 'hatims', HATIM, 'members', MEMBER), { name: 'Ömer', joinedAt: new Date(0) });
        }
        for (let n = 1; n <= 30; n += 1) {
            batch.set(doc(s, 'hatims', HATIM, 'juz', String(n)), { ...freeJuz(n), ...(juz[n] || {}) });
        }
        await batch.commit();
    });
}

/** Grubu sıfırdan kuran toplu yazma — istemcinin yapacağı şeyin aynısı. */
function createGroupBatch(uid, { code = CODE, name = 'Aile Hatmi', ownerUid = uid, memberId = uid, skip = {} } = {}) {
    const s = db(uid);
    const batch = writeBatch(s);
    if (!skip.code) batch.set(doc(s, 'hatimCodes', code), { hatimId: HATIM });
    batch.set(doc(s, 'hatims', HATIM), {
        name,
        code,
        ownerUid,
        createdAt: serverTimestamp(),
        rev: 0,
        memberCount: 1
    });
    if (!skip.member) {
        batch.set(doc(s, 'hatims', HATIM, 'members', memberId), { name: 'Hoca', joinedAt: serverTimestamp() });
    }
    for (let n = 1; n <= 30; n += 1) {
        batch.set(doc(s, 'hatims', HATIM, 'juz', String(n)), freeJuz(n));
    }
    return batch;
}

/* ------------------------------------------------------------------ */
/* Canlı yedekleme kuralı bozulmamalı                                   */
/* ------------------------------------------------------------------ */

test('yedekleme: kişi kendi yedeğini okur ve yazar', async () => {
    const ref = doc(db(MEMBER), 'users', MEMBER, 'backups', 'main');
    await assertSucceeds(setDoc(ref, { payload: { a: 1 } }));
    await assertSucceeds(getDoc(ref));
});

test('yedekleme: başkasının yedeğine erişilemez, girişsiz hiç erişilemez', async () => {
    await assertFails(getDoc(doc(db(OUTSIDER), 'users', MEMBER, 'backups', 'main')));
    await assertFails(setDoc(doc(db(OUTSIDER), 'users', MEMBER, 'backups', 'main'), { payload: {} }));
    await assertFails(getDoc(doc(db(null), 'users', MEMBER, 'backups', 'main')));
});

/* ------------------------------------------------------------------ */
/* Grup kurma                                                          */
/* ------------------------------------------------------------------ */

test('kurma: kod + hatim + yönetici kaydı + 30 cüz tek yazmada kurulur', async () => {
    await assertSucceeds(createGroupBatch(OWNER).commit());
});

test('kurma: başkası adına yönetici yazılamaz', async () => {
    await assertFails(createGroupBatch(OWNER, { ownerUid: MEMBER }).commit());
});

test('kurma: kod belgesi olmadan hatim kurulamaz', async () => {
    await assertFails(createGroupBatch(OWNER, { skip: { code: true } }).commit());
});

test('kurma: yöneticinin üyelik kaydı olmadan hatim kurulamaz', async () => {
    await assertFails(createGroupBatch(OWNER, { skip: { member: true } }).commit());
});

test('kurma: karışabilen harf (O, I, L, 0, 1) içeren kod reddedilir', async () => {
    for (const bad of ['K7M2QO', 'K7M2Q1', 'K7M2QL']) {
        await env.clearFirestore();
        await assertFails(createGroupBatch(OWNER, { code: bad }).commit());
    }
});

test('kurma: yalnızca boşluktan oluşan grup adı reddedilir', async () => {
    await assertFails(createGroupBatch(OWNER, { name: '    ' }).commit());
});

test('kurma: dolu kod ikinci kez alınamaz', async () => {
    await seedGroup({ withMember: false });
    const s = db(OUTSIDER);
    await assertFails(setDoc(doc(s, 'hatimCodes', CODE), { hatimId: 'hatim_2' }));
});

test('kurma: girişsiz grup kurulamaz', async () => {
    // Kimliksiz bağlamda yol için sahte bir kimlik gerekir; reddin sebebi girişsizlik.
    await assertFails(createGroupBatch(null, { ownerUid: 'x', memberId: 'x' }).commit());
});

/* ------------------------------------------------------------------ */
/* Okuma                                                               */
/* ------------------------------------------------------------------ */

test('okuma: kodu bilen yabancı hatim adını görür ama cüzleri ve üyeleri göremez', async () => {
    await seedGroup();
    const s = db(OUTSIDER);
    await assertSucceeds(getDoc(doc(s, 'hatimCodes', CODE)));
    await assertSucceeds(getDoc(doc(s, 'hatims', HATIM)));
    await assertFails(getDoc(doc(s, 'hatims', HATIM, 'juz', '5')));
    await assertFails(getDoc(doc(s, 'hatims', HATIM, 'members', MEMBER)));
});

test('okuma: üye cüzleri ve üyeleri okur', async () => {
    await seedGroup();
    const s = db(MEMBER);
    await assertSucceeds(getDoc(doc(s, 'hatims', HATIM, 'juz', '5')));
    await assertSucceeds(getDoc(doc(s, 'hatims', HATIM, 'members', OWNER)));
});

/* ------------------------------------------------------------------ */
/* Katılma                                                             */
/* ------------------------------------------------------------------ */

test('katılma: üyelik kaydı + sayaç artışı birlikte kabul edilir', async () => {
    await seedGroup({ withMember: false });
    const s = db(MEMBER);
    const batch = writeBatch(s);
    batch.set(doc(s, 'hatims', HATIM, 'members', MEMBER), { name: 'Ömer', joinedAt: serverTimestamp() });
    batch.update(doc(s, 'hatims', HATIM), { memberCount: 2 });
    await assertSucceeds(batch.commit());
});

test('katılma: sayaç artmadan üyelik kaydı açılamaz', async () => {
    await seedGroup({ withMember: false });
    const s = db(MEMBER);
    await assertFails(
        setDoc(doc(s, 'hatims', HATIM, 'members', MEMBER), { name: 'Ömer', joinedAt: serverTimestamp() })
    );
});

test('katılma: üyelik kaydı olmadan sayaç artırılamaz', async () => {
    await seedGroup({ withMember: false });
    await assertFails(updateDoc(doc(db(MEMBER), 'hatims', HATIM), { memberCount: 2 }));
});

test('katılma: başkası adına üyelik kaydı açılamaz', async () => {
    await seedGroup({ withMember: false });
    const s = db(OUTSIDER);
    const batch = writeBatch(s);
    batch.set(doc(s, 'hatims', HATIM, 'members', MEMBER), { name: 'Ömer', joinedAt: serverTimestamp() });
    batch.update(doc(s, 'hatims', HATIM), { memberCount: 2 });
    await assertFails(batch.commit());
});

/* ------------------------------------------------------------------ */
/* Cüz kapma ve bitirme                                                */
/* ------------------------------------------------------------------ */

function claimBatch(uid, n, { rev = 1, by = uid, byName = 'Ömer' } = {}) {
    const s = db(uid);
    const batch = writeBatch(s);
    batch.update(doc(s, 'hatims', HATIM, 'juz', String(n)), {
        state: 'claimed',
        by,
        byName,
        claimedAt: serverTimestamp()
    });
    if (rev != null) batch.update(doc(s, 'hatims', HATIM), { rev });
    return batch;
}

test('kapma: üye boş cüzü kendi adına alır, rev 1 artar', async () => {
    await seedGroup();
    await assertSucceeds(claimBatch(MEMBER, 5).commit());
});

test('kapma: rev artmadan cüz alınamaz — istemci önbelleği buna güvenir', async () => {
    await seedGroup();
    await assertFails(claimBatch(MEMBER, 5, { rev: null }).commit());
});

test('kapma: rev 1 yerine 2 artarsa reddedilir', async () => {
    await seedGroup();
    await assertFails(claimBatch(MEMBER, 5, { rev: 2 }).commit());
});

test('kapma: alınmış cüz ikinci kez alınamaz', async () => {
    await seedGroup({ juz: { 5: { state: 'claimed', by: OWNER, byName: 'Hoca', claimedAt: new Date(0) } } });
    await assertFails(claimBatch(MEMBER, 5).commit());
});

test('kapma: başkası adına cüz alınamaz', async () => {
    await seedGroup();
    await assertFails(claimBatch(MEMBER, 5, { by: OWNER }).commit());
});

test('kapma: üye olmayan cüz alamaz', async () => {
    await seedGroup();
    await assertFails(claimBatch(OUTSIDER, 5).commit());
});

test('bitirme: kendi aldığı cüzü bitirir, başkasınınkini bitiremez', async () => {
    await seedGroup({
        juz: {
            5: { state: 'claimed', by: MEMBER, byName: 'Ömer', claimedAt: new Date(0) },
            6: { state: 'claimed', by: OWNER, byName: 'Hoca', claimedAt: new Date(0) }
        }
    });
    const s = db(MEMBER);

    const own = writeBatch(s);
    own.update(doc(s, 'hatims', HATIM, 'juz', '5'), { state: 'done', completedAt: serverTimestamp() });
    own.update(doc(s, 'hatims', HATIM), { rev: 1 });
    await assertSucceeds(own.commit());

    const others = writeBatch(s);
    others.update(doc(s, 'hatims', HATIM, 'juz', '6'), { state: 'done', completedAt: serverTimestamp() });
    others.update(doc(s, 'hatims', HATIM), { rev: 2 });
    await assertFails(others.commit());
});

/* ------------------------------------------------------------------ */
/* Ayrılma (§10)                                                       */
/* ------------------------------------------------------------------ */

const releasedJuz = { state: 'free', by: null, byName: null, claimedAt: null, completedAt: null };

test('ayrılma: katılımcı ayrılır, bitmemiş cüzü boşa düşer', async () => {
    await seedGroup({ juz: { 5: { state: 'claimed', by: MEMBER, byName: 'Ömer', claimedAt: new Date(0) } } });
    const s = db(MEMBER);
    const batch = writeBatch(s);
    batch.update(doc(s, 'hatims', HATIM, 'juz', '5'), releasedJuz);
    batch.delete(doc(s, 'hatims', HATIM, 'members', MEMBER));
    batch.update(doc(s, 'hatims', HATIM), { memberCount: 1, rev: 1 });
    await assertSucceeds(batch.commit());
});

test('ayrılma: bitmiş cüz boşa düşürülemez — okuma yapılmıştır', async () => {
    await seedGroup({
        juz: { 5: { state: 'done', by: MEMBER, byName: 'Ömer', claimedAt: new Date(0), completedAt: new Date(0) } }
    });
    const s = db(MEMBER);
    const batch = writeBatch(s);
    batch.update(doc(s, 'hatims', HATIM, 'juz', '5'), releasedJuz);
    batch.update(doc(s, 'hatims', HATIM), { rev: 1 });
    await assertFails(batch.commit());
});

test('ayrılma: yönetici ayrılamaz, yalnızca grubu siler', async () => {
    await seedGroup();
    const s = db(OWNER);
    const batch = writeBatch(s);
    batch.delete(doc(s, 'hatims', HATIM, 'members', OWNER));
    batch.update(doc(s, 'hatims', HATIM), { memberCount: 1 });
    await assertFails(batch.commit());
});

test('ayrılma: sayaç düşmeden üyelik kaydı silinemez', async () => {
    await seedGroup();
    await assertFails(deleteDoc(doc(db(MEMBER), 'hatims', HATIM, 'members', MEMBER)));
});

/* ------------------------------------------------------------------ */
/* Yöneticinin yetkileri (§7 engelleme, kayıp üye)                     */
/* ------------------------------------------------------------------ */

test('yönetici: kayıp üyenin bitmemiş cüzünü boşaltır', async () => {
    await seedGroup({ juz: { 5: { state: 'claimed', by: MEMBER, byName: 'Ömer', claimedAt: new Date(0) } } });
    const s = db(OWNER);
    const batch = writeBatch(s);
    batch.update(doc(s, 'hatims', HATIM, 'juz', '5'), releasedJuz);
    batch.update(doc(s, 'hatims', HATIM), { rev: 1 });
    await assertSucceeds(batch.commit());
});

test('yönetici: bitmiş cüzü zorla boşaltamaz', async () => {
    await seedGroup({
        juz: { 5: { state: 'done', by: MEMBER, byName: 'Ömer', claimedAt: new Date(0), completedAt: new Date(0) } }
    });
    const s = db(OWNER);
    const batch = writeBatch(s);
    batch.update(doc(s, 'hatims', HATIM, 'juz', '5'), releasedJuz);
    batch.update(doc(s, 'hatims', HATIM), { rev: 1 });
    await assertFails(batch.commit());
});

test('katılımcı: başkasının cüzünü zorla boşaltamaz', async () => {
    await seedGroup({ juz: { 5: { state: 'claimed', by: OWNER, byName: 'Hoca', claimedAt: new Date(0) } } });
    const s = db(MEMBER);
    const batch = writeBatch(s);
    batch.update(doc(s, 'hatims', HATIM, 'juz', '5'), releasedJuz);
    batch.update(doc(s, 'hatims', HATIM), { rev: 1 });
    await assertFails(batch.commit());
});

test('yönetici: üyeyi gruptan çıkarır, katılımcı başkasını çıkaramaz', async () => {
    await seedGroup();

    // Her db() çağrısı ayrı Firestore örneği açar; toplu yazma tek örnekle kurulmalı.
    const m = db(MEMBER);
    const byMember = writeBatch(m);
    byMember.delete(doc(m, 'hatims', HATIM, 'members', OWNER));
    byMember.update(doc(m, 'hatims', HATIM), { memberCount: 1 });
    await assertFails(byMember.commit());

    const o = db(OWNER);
    const byOwner = writeBatch(o);
    byOwner.delete(doc(o, 'hatims', HATIM, 'members', MEMBER));
    byOwner.update(doc(o, 'hatims', HATIM), { memberCount: 1 });
    await assertSucceeds(byOwner.commit());
});

test('yönetici: grubun adını değiştirir, katılımcı değiştiremez', async () => {
    await seedGroup();
    await assertFails(updateDoc(doc(db(MEMBER), 'hatims', HATIM), { name: 'Başka Ad' }));
    await assertSucceeds(updateDoc(doc(db(OWNER), 'hatims', HATIM), { name: 'Başka Ad' }));
});

/* ------------------------------------------------------------------ */
/* Grup silme                                                          */
/* ------------------------------------------------------------------ */

function deleteGroupBatch(uid, { skipCode = false } = {}) {
    const s = db(uid);
    const batch = writeBatch(s);
    if (!skipCode) batch.delete(doc(s, 'hatimCodes', CODE));
    batch.delete(doc(s, 'hatims', HATIM, 'members', OWNER));
    batch.delete(doc(s, 'hatims', HATIM, 'members', MEMBER));
    for (let n = 1; n <= 30; n += 1) batch.delete(doc(s, 'hatims', HATIM, 'juz', String(n)));
    batch.delete(doc(s, 'hatims', HATIM));
    return batch;
}

test('silme: yönetici grubu tüm alt kayıtlarıyla birlikte siler', async () => {
    await seedGroup();
    await assertSucceeds(deleteGroupBatch(OWNER).commit());
});

test('silme: katılımcı grubu silemez', async () => {
    await seedGroup();
    await assertFails(deleteGroupBatch(MEMBER).commit());
});

test('silme: kod belgesi bırakılarak silinemez — başıboş kod kalmasın', async () => {
    await seedGroup();
    await assertFails(deleteGroupBatch(OWNER, { skipCode: true }).commit());
});

/* ------------------------------------------------------------------ */
/* Şikâyet (§7)                                                        */
/* ------------------------------------------------------------------ */

test('şikâyet: giriş yapmış kişi yazar, kimse okuyamaz', async () => {
    const s = db(OUTSIDER);
    const ref = doc(s, 'reports', 'r1');
    await assertSucceeds(
        setDoc(ref, { hatimId: HATIM, reason: 'uygunsuz ad', reporterUid: OUTSIDER, createdAt: serverTimestamp() })
    );
    await assertFails(getDoc(ref));
});

test('şikâyet: başkası adına yazılamaz', async () => {
    await assertFails(
        setDoc(doc(db(OUTSIDER), 'reports', 'r2'), {
            hatimId: HATIM,
            reason: 'x',
            reporterUid: MEMBER,
            createdAt: serverTimestamp()
        })
    );
});
