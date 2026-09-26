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
import { deleteField, doc, getDoc, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore';
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
    renameHatim,
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

/* ------------------------------------------------------------------ */
/* Biten cüz sayısı ve katılım kapısı                                  */
/* ------------------------------------------------------------------ */

/** Kuralları kapatıp hatmi bitmiş hâle getirir: 30 cüz bitti, sayaç 30. */
async function seedComplete(hatimId, by) {
    await env.withSecurityRulesDisabled(async (c) => {
        const db = c.firestore();
        const batch = writeBatch(db);
        for (let n = 1; n <= 30; n += 1) {
            batch.update(doc(db, 'hatims', hatimId, 'juz', String(n)), {
                state: 'done',
                by,
                byName: 'Hoca',
                claimedAt: new Date(),
                completedAt: new Date()
            });
        }
        batch.update(doc(db, 'hatims', hatimId), { doneCount: 30, rev: 30 });
        await batch.commit();
    });
}

test('sayaç: bitirme +1, geri alma -1, kapma ve bırakma değiştirmez', async () => {
    const { hatimId, ctx } = await setup(MEMBER);
    assert.equal((await serverHatim(hatimId)).doneCount, 0);
    await claimJuzRemote(ctx[MEMBER], hatimId, 3, 'Ömer');
    assert.equal((await serverHatim(hatimId)).doneCount, 0);
    assert.equal((await completeJuzRemote(ctx[MEMBER], hatimId, 3)).ok, true);
    assert.equal((await serverHatim(hatimId)).doneCount, 1);
    assert.equal((await uncompleteJuzRemote(ctx[MEMBER], hatimId, 3)).ok, true);
    assert.equal((await serverHatim(hatimId)).doneCount, 0);
    assert.equal((await releaseJuzRemote(ctx[MEMBER], hatimId, 3)).ok, true);
    assert.equal((await serverHatim(hatimId)).doneCount, 0);
});

test('sayaç: aynı anda iki bitirme kaymaz', async () => {
    const { hatimId, ctx } = await setup(MEMBER, OTHER);
    await claimJuzRemote(ctx[MEMBER], hatimId, 1, 'Ömer');
    await claimJuzRemote(ctx[OTHER], hatimId, 2, 'Ali');
    const [a, b] = await Promise.all([
        completeJuzRemote(ctx[MEMBER], hatimId, 1),
        completeJuzRemote(ctx[OTHER], hatimId, 2)
    ]);
    assert.equal(a.ok && b.ok, true);
    assert.equal((await serverHatim(hatimId)).doneCount, 2);
});

test('katılma: bitmiş hatme yeni kişi katılamaz, üye kodla geri bulur', async () => {
    const { hatimId, code, ctx } = await setup(MEMBER);
    await seedComplete(hatimId, OWNER);

    const outsider = ctxOf(OTHER);
    const found = await findHatimByCode(outsider, code);
    assert.equal(found.ok, true);
    assert.equal(found.complete, true);
    assert.equal(found.alreadyMember, false);
    assert.equal((await joinHatim(outsider, hatimId, 'Ali')).reason, 'complete');

    // İstemciyi atlayan doğrudan yazma da kuralda reddedilir.
    const batch = writeBatch(outsider.db);
    batch.set(doc(outsider.db, 'hatims', hatimId, 'members', OTHER), {
        name: 'Ali',
        joinedAt: serverTimestamp()
    });
    batch.update(doc(outsider.db, 'hatims', hatimId), { memberCount: 3 });
    await assert.rejects(batch.commit());

    // Kontrol: aynı yazma, hatim bitmemişken geçer — ret kapıdandı.
    await env.withSecurityRulesDisabled(async (c) => {
        await updateDoc(doc(c.firestore(), 'hatims', hatimId), { doneCount: 29 });
    });
    const kontrol = writeBatch(outsider.db);
    kontrol.set(doc(outsider.db, 'hatims', hatimId, 'members', OTHER), {
        name: 'Ali',
        joinedAt: serverTimestamp()
    });
    kontrol.update(doc(outsider.db, 'hatims', hatimId), { memberCount: 3 });
    await kontrol.commit();
    await env.withSecurityRulesDisabled(async (c) => {
        await updateDoc(doc(c.firestore(), 'hatims', hatimId), { doneCount: 30 });
    });

    const again = await findHatimByCode(ctx[MEMBER], code);
    assert.equal(again.complete, true);
    assert.equal(again.alreadyMember, true, 'üye kendi hatmini yeniden bulur');
});

test('katılma: bitmiş hatimde cüz geri alınınca kapı yeniden açılır', async () => {
    const { hatimId, code, ctx } = await setup(MEMBER);
    await seedComplete(hatimId, MEMBER);
    assert.equal((await uncompleteJuzRemote(ctx[MEMBER], hatimId, 7)).ok, true);
    assert.equal((await serverHatim(hatimId)).doneCount, 29);
    const outsider = ctxOf(OTHER);
    assert.equal((await findHatimByCode(outsider, code)).complete, false);
    assert.equal((await joinHatim(outsider, hatimId, 'Ali')).ok, true);
});

test('sayaç cüzün gerçek geçişini izler: kapmada artmaz, bitirmede artmadan geçmez', async () => {
    const { hatimId, ctx } = await setup(MEMBER);
    const db = ctx[MEMBER].db;

    // Kapma sayacı oynatamaz.
    let h = await serverHatim(hatimId);
    const kapma = writeBatch(db);
    kapma.update(doc(db, 'hatims', hatimId, 'juz', '2'), {
        state: 'claimed',
        by: MEMBER,
        byName: 'Ömer',
        claimedAt: serverTimestamp()
    });
    kapma.update(doc(db, 'hatims', hatimId), { rev: h.rev + 1, doneCount: h.doneCount + 1 });
    await assert.rejects(kapma.commit());
    // Kontrol: aynı kapma sayaç oynamadan geçer.
    const kapmaDogru = writeBatch(db);
    kapmaDogru.update(doc(db, 'hatims', hatimId, 'juz', '2'), {
        state: 'claimed',
        by: MEMBER,
        byName: 'Ömer',
        claimedAt: serverTimestamp()
    });
    kapmaDogru.update(doc(db, 'hatims', hatimId), { rev: h.rev + 1 });
    await kapmaDogru.commit();

    // Bitirme sayacı artırmadan geçmez.
    await claimJuzRemote(ctx[MEMBER], hatimId, 1, 'Ömer');
    h = await serverHatim(hatimId);
    const bitirme = writeBatch(db);
    bitirme.update(doc(db, 'hatims', hatimId, 'juz', '1'), { state: 'done', completedAt: serverTimestamp() });
    bitirme.update(doc(db, 'hatims', hatimId), { rev: h.rev + 1 });
    await assert.rejects(bitirme.commit());
    // Kontrol: aynı bitirme sayaç +1 ile geçer.
    const bitirmeDogru = writeBatch(db);
    bitirmeDogru.update(doc(db, 'hatims', hatimId, 'juz', '1'), { state: 'done', completedAt: serverTimestamp() });
    bitirmeDogru.update(doc(db, 'hatims', hatimId), { rev: h.rev + 1, doneCount: h.doneCount + 1 });
    await bitirmeDogru.commit();
    h = await serverHatim(hatimId);

    // Sıçrama yok: tek yazmada 2 artış reddedilir.
    await assert.rejects(updateDoc(doc(db, 'hatims', hatimId), { rev: h.rev + 1, doneCount: h.doneCount + 2 }));
});

test('eski grup (sayaçsız): bitirme ve katılma eskisi gibi, sayaç eklenemez', async () => {
    const { hatimId, code, ctx } = await setup(MEMBER);
    await env.withSecurityRulesDisabled(async (c) => {
        await updateDoc(doc(c.firestore(), 'hatims', hatimId), { doneCount: deleteField() });
    });
    await claimJuzRemote(ctx[MEMBER], hatimId, 4, 'Ömer');
    assert.equal((await completeJuzRemote(ctx[MEMBER], hatimId, 4)).ok, true);
    const h = await serverHatim(hatimId);
    assert.equal('doneCount' in h, false, 'istemci eski gruba sayaç eklemez');
    await assert.rejects(
        updateDoc(doc(ctx[MEMBER].db, 'hatims', hatimId), { rev: h.rev + 1, doneCount: 1 }),
        'kural da eklemeye izin vermez'
    );
    // Kontrol: aynı rev artışı sayaçsız geçer — ret sayaçtandı.
    await updateDoc(doc(ctx[MEMBER].db, 'hatims', hatimId), { rev: h.rev + 1 });
    assert.equal((await findHatimByCode(ctxOf(OTHER), code)).complete, false);
});

test('ad değiştirme: yalnız yönetici; üye yeni adı eşitlemede alır', async () => {
    const { hatimId, ctx } = await setup(MEMBER);
    assert.equal((await renameHatim(ctx[MEMBER], hatimId, 'Başka ad')).reason, 'denied');
    const res = await renameHatim(ctx[OWNER], hatimId, '  Cuma Hatmi  ');
    assert.deepEqual(res, { ok: true, name: 'Cuma Hatmi' }, 'kenar boşlukları atılır');
    assert.equal((await serverHatim(hatimId)).name, 'Cuma Hatmi');
    assert.equal((await fetchHatim(ctx[MEMBER], hatimId)).group.name, 'Cuma Hatmi');
    assert.equal((await renameHatim(ctx[OWNER], hatimId, '   ')).reason, 'invalid');
});

test('ad değiştirme: silinmiş grupta gone döner', async () => {
    const { hatimId, ctx } = await setup();
    await deleteHatim(ctx[OWNER], hatimId);
    assert.equal((await renameHatim(ctx[OWNER], hatimId, 'Yeni')).reason, 'gone');
});

test('ad sınırı UTF-16 birimi sayar; istemci emojiyi bölmeden keser', async () => {
    const { hatimId, ctx } = await setup();
    const yaz = (name) => updateDoc(doc(ctx[OWNER].db, 'hatims', hatimId), { name });

    // Kural harf ya da bayt değil, UTF-16 birimi sayıyor.
    await yaz('ş'.repeat(40)); // 40 birim, 80 bayt: kabul
    await yaz('a'.repeat(36) + '😀🌙'); // 40 birim: kabul
    await assert.rejects(yaz('a'.repeat(37) + '😀🌙')); // 41 birim: ret

    // İstemci 42 birimlik adı emojiyi bölmeden 40'a indirir ve kural kabul eder.
    const res = await renameHatim(ctx[OWNER], hatimId, 'a'.repeat(38) + '😀🌙');
    assert.deepEqual(res, { ok: true, name: 'a'.repeat(38) + '😀' });
    assert.equal((await serverHatim(hatimId)).name, 'a'.repeat(38) + '😀');
});

/* ------------------------------------------------------------------ */
/* Bayat cüz ve yönetici devri                                         */
/* ------------------------------------------------------------------ */

const GUN = 86400000;

/** Kuralları kapatıp hatim belgesine alan yazar (zamanı geriye almak için). */
async function seedHatim(hatimId, fields) {
    await env.withSecurityRulesDisabled(async (c) => {
        await updateDoc(doc(c.firestore(), 'hatims', hatimId), fields);
    });
}

test('bayat cüz: 7 günden eskiyse her üye boşaltır, tazeyse boşaltamaz', async () => {
    const { hatimId, ctx } = await setup(MEMBER, OTHER);
    await claimJuzRemote(ctx[MEMBER], hatimId, 9, 'Ömer');

    const taze = await releaseJuzRemote(ctx[OTHER], hatimId, 9, { stale: true });
    assert.equal(taze.ok, false, 'taze cüz boşaltılamaz');

    await env.withSecurityRulesDisabled(async (c) => {
        await updateDoc(doc(c.firestore(), 'hatims', hatimId, 'juz', '9'), { claimedAt: new Date(Date.now() - 8 * GUN) });
    });
    const bayat = await releaseJuzRemote(ctx[OTHER], hatimId, 9, { stale: true });
    assert.equal(bayat.ok, true, 'bayat cüzü başka üye boşaltır');
    assert.equal((await serverJuz(hatimId, 9)).state, JUZ_FREE);
    assert.equal((await serverHatim(hatimId)).doneCount, 0);
});

test('bayat cüz: bitmiş cüz bayatlamaz, üye olmayan boşaltamaz', async () => {
    const { hatimId, ctx } = await setup(MEMBER);
    await claimJuzRemote(ctx[MEMBER], hatimId, 2, 'Ömer');
    await completeJuzRemote(ctx[MEMBER], hatimId, 2);
    await env.withSecurityRulesDisabled(async (c) => {
        await updateDoc(doc(c.firestore(), 'hatims', hatimId, 'juz', '2'), { claimedAt: new Date(Date.now() - 30 * GUN) });
    });
    assert.equal((await releaseJuzRemote(ctx[OWNER], hatimId, 2, { stale: true })).reason, 'done');

    await claimJuzRemote(ctx[MEMBER], hatimId, 3, 'Ömer');
    await env.withSecurityRulesDisabled(async (c) => {
        await updateDoc(doc(c.firestore(), 'hatims', hatimId, 'juz', '3'), { claimedAt: new Date(Date.now() - 30 * GUN) });
    });
    assert.equal((await releaseJuzRemote(ctxOf(OUTSIDER), hatimId, 3, { stale: true })).ok, false);
});

test('yedek: ilk katılan yedek olur, sonrakiler değiştirmez', async () => {
    const { hatimId } = await setup(MEMBER, OTHER);
    const h = await serverHatim(hatimId);
    assert.equal(h.successorUid, MEMBER);
    assert.ok(h.ownerSeenAt, 'kuruluşta yöneticinin son bakışı yazılır');
});

test('yedek: yedek ayrılınca ya da çıkarılınca sıradaki en eski üye geçer', async () => {
    const { hatimId, ctx } = await setup(MEMBER, OTHER, OUTSIDER);
    assert.equal((await serverHatim(hatimId)).successorUid, MEMBER);

    assert.equal((await leaveHatim(ctx[MEMBER], hatimId)).ok, true);
    assert.equal((await serverHatim(hatimId)).successorUid, OTHER, 'ayrılan yedeğin yerine sıradaki');

    assert.equal((await removeHatimMember(ctx[OWNER], hatimId, OTHER)).ok, true);
    assert.equal((await serverHatim(hatimId)).successorUid, OUTSIDER, 'çıkarılan yedeğin yerine sıradaki');

    assert.equal((await leaveHatim(ctx[OUTSIDER], hatimId)).ok, true);
    assert.equal((await serverHatim(hatimId)).successorUid, null, 'kimse kalmadıysa boş');
});

test('yedek: yedek, alanını güncellemeden ayrılamaz (kural)', async () => {
    const { hatimId, ctx } = await setup(MEMBER, OTHER);
    const db = ctx[MEMBER].db;
    const h = await serverHatim(hatimId);
    const b = writeBatch(db);
    b.delete(doc(db, 'hatims', hatimId, 'members', MEMBER));
    b.update(doc(db, 'hatims', hatimId), { memberCount: h.memberCount - 1 });
    await assert.rejects(b.commit());
    // Kontrol: yedeği sıradakine devrederek aynı ayrılma geçer.
    const dogru = writeBatch(db);
    dogru.delete(doc(db, 'hatims', hatimId, 'members', MEMBER));
    dogru.update(doc(db, 'hatims', hatimId), { memberCount: h.memberCount - 1, successorUid: OTHER });
    await dogru.commit();
});

test('devir: yönetici 14 gündür görünmüyorsa yedek açılışta devralır', async () => {
    const { hatimId, ctx } = await setup(MEMBER, OTHER);

    // Yönetici yakın zamanda göründü: devir yok.
    const erken = await fetchHatim(ctx[MEMBER], hatimId);
    assert.equal(erken.tookOver, false);
    assert.equal((await serverHatim(hatimId)).ownerUid, OWNER);

    await seedHatim(hatimId, { ownerSeenAt: new Date(Date.now() - 15 * GUN) });
    // Yedek olmayan üye devralamaz.
    assert.equal((await fetchHatim(ctx[OTHER], hatimId)).tookOver, false);

    const res = await fetchHatim(ctx[MEMBER], hatimId);
    assert.equal(res.tookOver, true);
    assert.equal(res.group.ownerId, MEMBER);
    const h = await serverHatim(hatimId);
    assert.equal(h.ownerUid, MEMBER);
    assert.equal(h.successorUid, OTHER, 'yeni yedek sıradaki, eski yönetici değil');

    // Yeni yönetici yetkileri kullanır, eski yönetici artık kullanamaz.
    assert.equal((await renameHatim(ctx[MEMBER], hatimId, 'Devralınan')).ok, true);
    assert.equal((await renameHatim(ctx[OWNER], hatimId, 'Eski')).reason, 'denied');
    // Eski yönetici artık sıradan üye: ayrılabilir.
    assert.equal((await leaveHatim(ctx[OWNER], hatimId)).ok, true);
});

test('devir: yönetici bakınca sayaç sıfırlanır, doğrudan erken devir kuralda reddedilir', async () => {
    const { hatimId, ctx } = await setup(MEMBER);
    await seedHatim(hatimId, { ownerSeenAt: new Date(Date.now() - 3 * GUN) });
    await fetchHatim(ctx[OWNER], hatimId);
    const tazelendi = (await serverHatim(hatimId)).ownerSeenAt.toMillis();
    assert.ok(Date.now() - tazelendi < 60000, 'yönetici açınca son bakış güncellenir');

    // İstemciyi atlayan erken devir denemesi reddedilir.
    await assert.rejects(updateDoc(doc(ctx[MEMBER].db, 'hatims', hatimId), {
        ownerUid: MEMBER,
        successorUid: null,
        ownerSeenAt: serverTimestamp()
    }));
    // Kontrol: süre dolunca aynı yazma geçer.
    await seedHatim(hatimId, { ownerSeenAt: new Date(Date.now() - 15 * GUN) });
    await updateDoc(doc(ctx[MEMBER].db, 'hatims', hatimId), {
        ownerUid: MEMBER,
        successorUid: null,
        ownerSeenAt: serverTimestamp()
    });
});
