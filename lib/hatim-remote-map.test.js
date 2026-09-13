import test from 'node:test';
import assert from 'node:assert/strict';
import {
    HATIM_JUZ_COUNT,
    HATIM_KIND_PERSONAL,
    HATIM_KIND_SHARED,
    JUZ_CLAIMED,
    JUZ_DONE,
    JUZ_FREE,
    sanitizeHatimGroups
} from './hatim-groups.js';
import {
    claimedJuzNumbers,
    dropGoneHatims,
    groupFromRemote,
    isRemoteHatim,
    juzFromRemote,
    needsJuzRefetch,
    reasonFromError,
    toMillis
} from './hatim-remote-map.js';

const ts = (ms) => ({ toMillis: () => ms });
const HATIM_ID = 'Xq3vT9bLm2Pz8KwR4nYc'; // Firestore otomatik kimliği biçiminde

test('toMillis Timestamp, Date ve sayıyı tanır, gerisini reddeder', () => {
    assert.equal(toMillis(ts(1234)), 1234);
    assert.equal(toMillis(new Date(5000)), 5000);
    assert.equal(toMillis(42), 42);
    for (const bad of [null, undefined, NaN, 'dün', {}, new Date('geçersiz')]) {
        assert.equal(toMillis(bad), null, String(bad));
    }
});

test('uzak cüz: sahibi olmayan "alındı" boş sayılır', () => {
    assert.deepEqual(juzFromRemote(5, { state: 'claimed', by: null }), {
        n: 5, state: JUZ_FREE, by: null, byName: null, claimedAt: null, completedAt: null
    });
    assert.equal(juzFromRemote(5, { state: 'uydurma', by: 'u1' }).state, JUZ_FREE);
    assert.equal(juzFromRemote(5, undefined).state, JUZ_FREE);
});

test('uzak cüz: bitmemişte tamamlanma zamanı taşınmaz', () => {
    const claimed = juzFromRemote(7, {
        state: 'claimed', by: 'u1', byName: 'Ömer', claimedAt: ts(100), completedAt: ts(200)
    });
    assert.equal(claimed.state, JUZ_CLAIMED);
    assert.equal(claimed.claimedAt, 100);
    assert.equal(claimed.completedAt, null);

    const done = juzFromRemote(7, {
        state: 'done', by: 'u1', byName: 'Ömer', claimedAt: ts(100), completedAt: ts(200)
    });
    assert.equal(done.state, JUZ_DONE);
    assert.equal(done.completedAt, 200);
});

test('uzak grup: 30 cüz, ortak kip, sunucu eşleşme bilgisi', () => {
    const juz = new Map([[3, { state: 'claimed', by: 'u1', byName: 'Ömer', claimedAt: ts(10) }]]);
    const g = groupFromRemote(
        HATIM_ID,
        { name: 'Aile', code: 'K7M2QP', ownerUid: 'u0', createdAt: ts(1), rev: 4, memberCount: 3 },
        juz
    );
    assert.equal(g.id, HATIM_ID);
    assert.equal(g.kind, HATIM_KIND_SHARED);
    assert.equal(g.ownerId, 'u0');
    assert.equal(g.juz.length, HATIM_JUZ_COUNT);
    assert.equal(g.juz[2].state, JUZ_CLAIMED);
    assert.equal(g.juz[3].state, JUZ_FREE);
    assert.deepEqual(g.remote, { rev: 4, memberCount: 3 });
    assert.ok(isRemoteHatim(g));
});

test('uzak grup: cüzler okunmadıysa önceki yerel cüzler ve sıra korunur', () => {
    const previous = groupFromRemote(HATIM_ID, { code: 'K7M2QP', rev: 2 }, new Map([
        [9, { state: 'done', by: 'u1', claimedAt: ts(1), completedAt: ts(2) }]
    ]));
    previous.order = 3;
    const next = groupFromRemote(HATIM_ID, { code: 'K7M2QP', rev: 2, name: 'Yeni ad' }, null, previous);
    assert.equal(next.juz, previous.juz, 'aynı dizi — kopyalanmadı, okunmadı');
    assert.equal(next.order, 3);
    assert.equal(next.name, 'Yeni ad', 'hatim belgesi yine de tazelenir');
});

test('uzak grup depoya yazılıp geri okununca aynı kalır', () => {
    // Veri katmanının ürettiği grup, yerel temizlemeden sağlam geçmeli; yoksa
    // her açılışta sessizce bozulur.
    const g = groupFromRemote(
        HATIM_ID,
        { name: 'Mahalle', code: 'K7M2QP', ownerUid: 'u0', createdAt: ts(1000), rev: 6, memberCount: 2 },
        new Map([
            [1, { state: 'done', by: 'u0', byName: 'Hoca', claimedAt: ts(1100), completedAt: ts(1200) }],
            [2, { state: 'claimed', by: 'u1', byName: 'Ömer', claimedAt: ts(1300) }]
        ])
    );
    const [geri] = sanitizeHatimGroups([JSON.parse(JSON.stringify(g))]);
    assert.deepEqual(geri, g);
});

test('tablo yalnızca rev değişince yeniden okunur', () => {
    const cached = groupFromRemote(HATIM_ID, { code: 'K7M2QP', rev: 5 }, new Map());
    assert.equal(needsJuzRefetch(cached, 5), false);
    assert.equal(needsJuzRefetch(cached, 6), true);
    assert.equal(needsJuzRefetch(null, 5), true, 'önbellek yok');
    assert.equal(needsJuzRefetch({ ...cached, juz: [] }, 5), true, 'önbellek bozuk');
    assert.equal(
        needsJuzRefetch({ id: HATIM_ID, kind: HATIM_KIND_SHARED, juz: cached.juz }, 5),
        true,
        'hiç senkronlanmamış yerel grup'
    );
});

test('kişinin bitmemiş cüzleri — bitmişler ayrılırken boşa düşmez', () => {
    const g = groupFromRemote(HATIM_ID, { code: 'K7M2QP' }, new Map([
        [4, { state: 'claimed', by: 'u1' }],
        [5, { state: 'done', by: 'u1', completedAt: ts(1) }],
        [6, { state: 'claimed', by: 'u2' }]
    ]));
    assert.deepEqual(claimedJuzNumbers(g, 'u1'), [4]);
    assert.deepEqual(claimedJuzNumbers(g, null), []);
});

test('hayalet grup temizliği yalnızca senkronlanmış ortak gruba dokunur', () => {
    const remote = groupFromRemote('silinen', { code: 'K7M2QP' }, new Map());
    const kalan = groupFromRemote('duran', { code: 'K7M2QP' }, new Map());
    const kisisel = { id: 'silinen', kind: HATIM_KIND_PERSONAL, juz: [] };
    const yerel = { id: 'silinen', kind: HATIM_KIND_SHARED, juz: [] };
    const sonuc = dropGoneHatims([remote, kalan, kisisel, yerel], ['silinen']);
    assert.deepEqual(sonuc, [kalan, kisisel, yerel]);
    assert.deepEqual(dropGoneHatims([remote], []), [remote]);
});

test('Firestore hataları arayüz diline çevrilir', () => {
    assert.equal(reasonFromError({ code: 'permission-denied' }), 'denied');
    assert.equal(reasonFromError({ code: 'firestore/permission-denied' }), 'denied');
    assert.equal(reasonFromError({ code: 'unavailable' }), 'offline');
    assert.equal(reasonFromError({ code: 'aborted' }), 'busy');
    assert.equal(reasonFromError({ code: 'not-found' }), 'gone');
    assert.equal(reasonFromError(new Error('x')), 'error');
    assert.equal(reasonFromError(null), 'error');
});
