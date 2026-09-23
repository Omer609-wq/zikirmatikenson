/**
 * lib/hatim-remote.js — gerçek kurallara (firestore.rules) karşı emülatörde.
 *
 * Kural testleri tek tek yazmaları sınar; bunlar istemcinin gerçekte kurduğu
 * toplu yazma ve transaction'ların kurallardan geçtiğini ve iş kurallarını
 * doğru uyguladığını kanıtlar.
 *
 *   npm run test:rules
 */
import test, { after, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, writeBatch } from 'firebase/firestore';
import { JUZ_CLAIMED, JUZ_DONE, JUZ_FREE, isValidHatimCode } from '../lib/hatim-groups.js';
import {
    claimJuzRemote,
    completeJuzRemote,
    createSharedHatim,
    deleteHatim,
    fetchHatim,
    findHatimByCode,
    joinHatim,
    leaveHatim,
    listHatimMembers,
    releaseJuzRemote,
    removeHatimMember,
    reportHatim,
    uncompleteJuzRemote
} from '../lib/hatim-remote.js';

const PROJECT_ID = 'demo-zikirmatik-rules';
const OWNER = 'uid_yonetici';
const MEMBER = 'uid_katilimci';
const OTHER = 'uid_ikinci';
const OUTSIDER = 'uid_yabanci';

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

/** Kişi başına tek Firestore örneği: toplu yazma ve transaction aynı örnekte kurulmalı. */
const ctxOf = (uid) => ({ db: env.authenticatedContext(uid).firestore(), uid });

/** Yönetici grubu kurar; istenen kişiler katılır. */
async function setup(...joiners) {
    const owner = ctxOf(OWNER);
    const created = await createSharedHatim(owner, { name: 'Mahalle Camii', memberName: 'Hoca' });
    assert.equal(created.ok, true, `kurma: ${created.reason}`);
    const hatimId = created.group.id;
    const ctx = { [OWNER]: owner };
    for (const uid of joiners) {
        ctx[uid] = ctxOf(uid);
        const joined = await joinHatim(ctx[uid], hatimId, uid);
        assert.equal(joined.ok, true, `katılma ${uid}: ${joined.reason}`);
    }
    return { hatimId, code: created.group.code, ctx };
}

/** Kuralları kapatıp sunucudaki gerçek cüz durumunu okur. */
async function serverJuz(hatimId, n) {
    let data;
    await env.withSecurityRulesDisabled(async (c) => {
        data = (await getDoc(doc(c.firestore(), 'hatims', hatimId, 'juz', String(n)))).data();
    });
    return data;
}

async function serverHatim(hatimId) {
    let data;
    await env.withSecurityRulesDisabled(async (c) => {
        const snap = await getDoc(doc(c.firestore(), 'hatims', hatimId));
        data = snap.exists() ? snap.data() : null;
    });
    return data;
}

/* ------------------------------------------------------------------ */

test('kurma: grup, geçerli kod ve 30 boş cüzle kurulur, yönetici üyedir', async () => {
    const { hatimId, code, ctx } = await setup();
    assert.ok(isValidHatimCode(code));
    const fetched = await fetchHatim(ctx[OWNER], hatimId);
    assert.equal(fetched.ok, true);
    assert.equal(fetched.group.juz.length, 30);
    assert.ok(fetched.group.juz.every((j) => j.state === JUZ_FREE));
    assert.deepEqual(fetched.group.remote, { rev: 0, memberCount: 1, memberUids: [OWNER] });
    assert.equal(fetched.group.ownerId, OWNER);
});

test('kurma: boş ad ya da takma adla kurulmaz', async () => {
    const owner = ctxOf(OWNER);
    assert.equal((await createSharedHatim(owner, { name: '   ', memberName: 'Hoca' })).reason, 'invalid');
    assert.equal((await createSharedHatim(owner, { name: 'Aile', memberName: '' })).reason, 'invalid');
});

test('kurma: kod doluysa yeni kodla tekrar dener', async () => {
    const first = await createSharedHatim(ctxOf(OWNER), { name: 'Bir', memberName: 'Hoca', random: () => 0 });
    assert.equal(first.ok, true);
    // İlk deneme aynı kodu üretir (dolu), sonrakiler farklı.
    let calls = 0;
    const random = () => (calls++ < 6 ? 0 : 0.5);
    const second = await createSharedHatim(ctxOf(MEMBER), { name: 'İki', memberName: 'Ömer', random });
    assert.equal(second.ok, true, `ikinci kurma: ${second.reason}`);
    assert.notEqual(second.group.code, first.group.code);
});

test('bulma: geçersiz, bilinmeyen ve bilinen kod', async () => {
    const { hatimId, code } = await setup();
    const outsider = ctxOf(OUTSIDER);
    assert.equal((await findHatimByCode(outsider, 'K7M2Q0')).reason, 'invalid');
    assert.equal((await findHatimByCode(outsider, 'ZZZZZZ')).reason, 'notFound');
    const found = await findHatimByCode(outsider, code.toLowerCase());
    assert.equal(found.ok, true);
    assert.equal(found.hatimId, hatimId);
    assert.equal(found.name, 'Mahalle Camii');
    assert.equal(found.memberCount, 1);
});

test('katılma: sayaç artar, ikinci katılma yazmaz', async () => {
    const { hatimId, ctx } = await setup(MEMBER);
    assert.equal((await serverHatim(hatimId)).memberCount, 2);
    const again = await joinHatim(ctx[MEMBER], hatimId, 'Ömer');
    assert.deepEqual(again, { ok: true, hatimId, alreadyMember: true });
    assert.equal((await serverHatim(hatimId)).memberCount, 2);
});

test('okuma: rev değişmediyse cüzler okunmaz, değişince okunur', async () => {
    const { hatimId, ctx } = await setup(MEMBER);
    const first = await fetchHatim(ctx[MEMBER], hatimId);
    assert.equal(first.juzFetched, true);

    const cached = await fetchHatim(ctx[MEMBER], hatimId, first.group);
    assert.equal(cached.juzFetched, false, 'rev aynı');

    assert.equal((await claimJuzRemote(ctx[OWNER], hatimId, 5, 'Hoca')).ok, true);
    const changed = await fetchHatim(ctx[MEMBER], hatimId, cached.group);
    assert.equal(changed.juzFetched, true);
    assert.equal(changed.group.juz[4].state, JUZ_CLAIMED);
    assert.equal(changed.group.remote.rev, 1);
});

test('kapma: aynı cüzü aynı anda iki kişi isterse yalnızca biri alır', async () => {
    const { hatimId, ctx } = await setup(MEMBER, OTHER);
    const results = await Promise.all([
        claimJuzRemote(ctx[MEMBER], hatimId, 12, 'Ömer'),
        claimJuzRemote(ctx[OTHER], hatimId, 12, 'Zeynep')
    ]);
    const winners = results.filter((r) => r.ok);
    const losers = results.filter((r) => !r.ok);
    assert.equal(winners.length, 1, JSON.stringify(results));
    assert.equal(losers[0].reason, 'taken');
    assert.equal((await serverHatim(hatimId)).rev, 1, 'rev yalnızca kazanan için arttı');
});

test('katılma: aynı anda katılan üç kişinin hepsi girer, sayaç kaymaz', async () => {
    // Grup paylaşılınca birkaç kişinin aynı anda katılması olağan. İkisi aynı
    // sayacı okursa kural ikinciyi reddeder; yeniden deneme güncel sayaçla geçmeli.
    const { hatimId } = await setup();
    const joiners = ['uid_a', 'uid_b', 'uid_c'].map((uid) => ctxOf(uid));
    const results = await Promise.all(joiners.map((c) => joinHatim(c, hatimId, c.uid)));
    assert.ok(results.every((r) => r.ok && !r.alreadyMember), JSON.stringify(results));
    assert.equal((await serverHatim(hatimId)).memberCount, 4);
});

test('bitirme ve geri alma yalnızca cüzün sahibine açık', async () => {
    const { hatimId, ctx } = await setup(MEMBER, OTHER);
    await claimJuzRemote(ctx[MEMBER], hatimId, 3, 'Ömer');

    assert.equal((await completeJuzRemote(ctx[OTHER], hatimId, 3)).reason, 'notOwner');
    assert.equal((await completeJuzRemote(ctx[MEMBER], hatimId, 3)).ok, true);
    assert.equal((await serverJuz(hatimId, 3)).state, JUZ_DONE);

    assert.equal((await uncompleteJuzRemote(ctx[OTHER], hatimId, 3)).reason, 'notOwner');
    assert.equal((await uncompleteJuzRemote(ctx[MEMBER], hatimId, 3)).ok, true);
    assert.equal((await serverJuz(hatimId, 3)).state, JUZ_CLAIMED);
});

test('bırakma: bitmiş cüz bırakılamaz, yönetici kayıp üyenin cüzünü boşaltır', async () => {
    const { hatimId, ctx } = await setup(MEMBER);
    await claimJuzRemote(ctx[MEMBER], hatimId, 8, 'Ömer');
    await claimJuzRemote(ctx[MEMBER], hatimId, 9, 'Ömer');
    await completeJuzRemote(ctx[MEMBER], hatimId, 9);

    assert.equal((await releaseJuzRemote(ctx[MEMBER], hatimId, 9)).reason, 'done');
    assert.equal((await releaseJuzRemote(ctx[OWNER], hatimId, 8)).reason, 'notOwner', 'force olmadan');
    assert.equal((await releaseJuzRemote(ctx[OWNER], hatimId, 8, { force: true })).ok, true);
    assert.equal((await serverJuz(hatimId, 8)).state, JUZ_FREE);
});

test('ayrılma: bitmemiş cüz boşa düşer, bitmiş kalır, sayaç düşer', async () => {
    const { hatimId, ctx } = await setup(MEMBER);
    await claimJuzRemote(ctx[MEMBER], hatimId, 4, 'Ömer');
    await claimJuzRemote(ctx[MEMBER], hatimId, 5, 'Ömer');
    await completeJuzRemote(ctx[MEMBER], hatimId, 5);

    const left = await leaveHatim(ctx[MEMBER], hatimId);
    assert.deepEqual(left, { ok: true, released: [4] });
    assert.equal((await serverJuz(hatimId, 4)).state, JUZ_FREE);
    assert.equal((await serverJuz(hatimId, 5)).state, JUZ_DONE, 'okuma yapılmıştı');
    assert.equal((await serverHatim(hatimId)).memberCount, 1);
});

test('ayrılma: yönetici ayrılamaz', async () => {
    const { hatimId, ctx } = await setup(MEMBER);
    assert.equal((await leaveHatim(ctx[OWNER], hatimId)).reason, 'owner');
});

test('çıkarma: yönetici üyeyi çıkarır, çıkarılan cihaz bunu açılışta fark eder', async () => {
    const { hatimId, ctx } = await setup(MEMBER, OTHER);
    await claimJuzRemote(ctx[MEMBER], hatimId, 20, 'Ömer');
    const before = await fetchHatim(ctx[MEMBER], hatimId);

    assert.equal((await removeHatimMember(ctx[OTHER], hatimId, MEMBER)).reason, 'notOwner');
    const removed = await removeHatimMember(ctx[OWNER], hatimId, MEMBER);
    assert.deepEqual(removed, { ok: true, released: [20] });

    const after = await fetchHatim(ctx[MEMBER], hatimId, before.group);
    assert.equal(after.reason, 'removed');
});

test('okuma: üye kimlikleri gelir — yeşil/kırmızı nokta bunlara bakar', async () => {
    const { hatimId, ctx } = await setup(MEMBER);
    const first = await fetchHatim(ctx[OWNER], hatimId);
    assert.deepEqual([...first.group.remote.memberUids].sort(), [MEMBER, OWNER].sort());

    ctx[OTHER] = ctxOf(OTHER);
    await joinHatim(ctx[OTHER], hatimId, 'Ali');
    const joined = await fetchHatim(ctx[OWNER], hatimId, first.group);
    assert.ok(joined.group.remote.memberUids.includes(OTHER), 'katılan listeye girer');

    await removeHatimMember(ctx[OWNER], hatimId, MEMBER);
    const afterRemove = await fetchHatim(ctx[OWNER], hatimId, joined.group);
    assert.equal(afterRemove.group.remote.memberUids.includes(MEMBER), false, 'çıkarılan listeden düşer');
});

test('üye listesi katılma sırasıyla gelir', async () => {
    const { hatimId, ctx } = await setup(MEMBER, OTHER);
    const listed = await listHatimMembers(ctx[OWNER], hatimId);
    assert.equal(listed.ok, true);
    assert.deepEqual(listed.members.map((m) => m.uid), [OWNER, MEMBER, OTHER]);
    assert.equal((await listHatimMembers(ctxOf(OUTSIDER), hatimId)).reason, 'denied');
});

test('silme: yalnızca yönetici; sonra kod bulunmaz, katılımcıda grup "gone" olur', async () => {
    const { hatimId, code, ctx } = await setup(MEMBER);
    assert.equal((await deleteHatim(ctx[MEMBER], hatimId)).reason, 'notOwner');
    assert.equal((await deleteHatim(ctx[OWNER], hatimId)).ok, true);

    assert.equal((await findHatimByCode(ctxOf(OUTSIDER), code)).reason, 'notFound');
    assert.equal((await fetchHatim(ctx[MEMBER], hatimId)).reason, 'gone');
    assert.equal(await serverHatim(hatimId), null);
});

test('şikâyet: katılmamış biri de gönderebilir', async () => {
    const { hatimId } = await setup();
    assert.equal((await reportHatim(ctxOf(OUTSIDER), hatimId, 'uygunsuz grup adı')).ok, true);
});
