import test from 'node:test';
import assert from 'node:assert/strict';
import {
    HATIM_CODE_ALPHABET,
    HATIM_CODE_LENGTH,
    HATIM_GROUP_LIMIT,
    HATIM_KIND_PERSONAL,
    HATIM_KIND_SHARED,
    HATIM_MEMBER_NAME_MAX,
    HATIM_JUZ_COUNT,
    JUZ_CLAIMED,
    JUZ_DONE,
    JUZ_FREE,
    claimJuz,
    completeJuz,
    createHatimGroup,
    generateHatimCode,
    getHatimProgress,
    getNextJuzToRead,
    getNextMemberJuz,
    isHatimComplete,
    isPersonalHatim,
    isValidHatimCode,
    listMemberJuz,
    normalizeHatimCode,
    releaseJuz,
    sanitizeHatimGroups,
    uncompleteJuz
} from './hatim-groups.js';

const ME = 'uye_1';
const OTHER = 'uye_2';

function freshGroup() {
    return createHatimGroup({ name: 'Ramazan Hatmi', ownerId: ME, now: 1000 });
}

test('yeni grup 30 boş cüzle açılır', () => {
    const g = freshGroup();
    assert.equal(g.juz.length, HATIM_JUZ_COUNT);
    assert.deepEqual(
        g.juz.map((j) => j.n),
        Array.from({ length: 30 }, (_, i) => i + 1)
    );
    assert.ok(g.juz.every((j) => j.state === JUZ_FREE && j.by === null));
    assert.equal(g.name, 'Ramazan Hatmi');
    assert.ok(isValidHatimCode(g.code));
});

test('kip varsayılanı ortak, kişisel açıkça istenir', () => {
    assert.equal(createHatimGroup().kind, HATIM_KIND_SHARED);
    assert.equal(isPersonalHatim(createHatimGroup()), false);

    const kisisel = createHatimGroup({ kind: HATIM_KIND_PERSONAL });
    assert.equal(kisisel.kind, HATIM_KIND_PERSONAL);
    assert.ok(isPersonalHatim(kisisel));

    // Tanınmayan kip ortak'a düşer.
    assert.equal(createHatimGroup({ kind: 'uydurma' }).kind, HATIM_KIND_SHARED);
});

test('kip alanı olmayan eski kayıt ortak sayılır', () => {
    const [eski] = sanitizeHatimGroups([{ id: 'h_eski', name: 'Aile' }]);
    assert.equal(eski.kind, HATIM_KIND_SHARED);

    const [kisisel] = sanitizeHatimGroups([
        { id: 'h_k', name: 'Hatmim', kind: HATIM_KIND_PERSONAL }
    ]);
    assert.equal(kisisel.kind, HATIM_KIND_PERSONAL);
});

test('grup adı üst sınırda kırpılır', () => {
    const g = createHatimGroup({ name: 'x'.repeat(200) });
    assert.equal(g.name.length, 40);
});

test('katılma kodu karışabilen harf içermez', () => {
    for (const yasak of ['0', '1', 'I', 'O', 'L']) {
        assert.ok(!HATIM_CODE_ALPHABET.includes(yasak), `${yasak} alfabede olmamalı`);
    }
    // random=0 → alfabenin ilk harfi, random≈1 → son harfi; sınırlar taşmamalı
    assert.equal(generateHatimCode(() => 0), '2'.repeat(HATIM_CODE_LENGTH));
    assert.equal(
        generateHatimCode(() => 0.999999),
        HATIM_CODE_ALPHABET.at(-1).repeat(HATIM_CODE_LENGTH)
    );
});

test('kullanıcının yazdığı kod toparlanır', () => {
    assert.equal(normalizeHatimCode(' k7m-2qp '), 'K7M2QP');
    assert.equal(normalizeHatimCode('K7M2QPZZZ'), 'K7M2QP');
    assert.ok(isValidHatimCode('k7m2qp'));
    assert.ok(!isValidHatimCode('K7M2Q'), 'eksik hane geçersiz');
    assert.ok(!isValidHatimCode('K7M2Q0'), '0 alfabede yok');
});

test('boş cüz üstlenilir, dolu cüz ikinci kez üstlenilemez', () => {
    const g = freshGroup();
    const first = claimJuz(g, 7, ME, { memberName: 'Ömer', now: 2000 });
    assert.equal(first.ok, true);

    const juz7 = first.group.juz.find((j) => j.n === 7);
    assert.equal(juz7.state, JUZ_CLAIMED);
    assert.equal(juz7.by, ME);
    assert.equal(juz7.byName, 'Ömer');
    assert.equal(juz7.claimedAt, 2000);

    const second = claimJuz(first.group, 7, OTHER);
    assert.equal(second.ok, false);
    assert.equal(second.reason, 'taken');
});

test('üye adı karakter sınırında kırpılır', () => {
    const g = freshGroup();
    const uzun = 'Ö'.repeat(200);
    const res = claimJuz(g, 2, ME, { memberName: uzun });
    const juz = res.group.juz.find((x) => x.n === 2);
    assert.equal(juz.byName.length, HATIM_MEMBER_NAME_MAX);

    // Depodan gelen uzun ad da aynı sınıra çekilir.
    const [geri] = sanitizeHatimGroups([
        { id: 'h_9', juz: [{ n: 1, state: JUZ_CLAIMED, by: ME, byName: uzun }] }
    ]);
    assert.equal(geri.juz[0].byName.length, HATIM_MEMBER_NAME_MAX);
});

test('grup nesnesi değiştirilmez, yenisi döner', () => {
    const g = freshGroup();
    const res = claimJuz(g, 3, ME);
    assert.notEqual(res.group, g);
    assert.equal(g.juz.find((j) => j.n === 3).state, JUZ_FREE, 'özgün grup bozulmamalı');
});

test('geçersiz cüz numarası ve kimliksiz üye reddedilir', () => {
    const g = freshGroup();
    for (const bad of [0, 31, -1, 'x', null]) {
        assert.equal(claimJuz(g, bad, ME).ok, false);
    }
    assert.equal(claimJuz(g, 5, '').ok, false, 'üye kimliği olmadan üstlenilemez');
});

test('bitirdim yalnızca üstlenen kişi tarafından işaretlenir', () => {
    const g = claimJuz(freshGroup(), 4, ME).group;

    const baskasi = completeJuz(g, 4, OTHER);
    assert.equal(baskasi.ok, false);
    assert.equal(baskasi.reason, 'notOwner');

    const bos = completeJuz(g, 5, ME);
    assert.equal(bos.ok, false);
    assert.equal(bos.reason, 'notClaimed', 'üstlenilmemiş cüz bitirilemez');

    const ok = completeJuz(g, 4, ME, { now: 3000 });
    assert.equal(ok.ok, true);
    const juz = ok.group.juz.find((j) => j.n === 4);
    assert.equal(juz.state, JUZ_DONE);
    assert.equal(juz.completedAt, 3000);
    assert.equal(juz.by, ME, 'bitince sahiplik korunur');
});

test('yanlışlıkla bitirilen cüz geri alınır', () => {
    let g = claimJuz(freshGroup(), 9, ME).group;
    g = completeJuz(g, 9, ME).group;

    const geri = uncompleteJuz(g, 9, ME);
    assert.equal(geri.ok, true);
    const juz = geri.group.juz.find((j) => j.n === 9);
    assert.equal(juz.state, JUZ_CLAIMED);
    assert.equal(juz.completedAt, null);
    assert.equal(uncompleteJuz(geri.group, 9, ME).ok, false, 'zaten bitmemiş');
});

test('cüz sahibi bırakabilir, başkası bırakamaz', () => {
    const g = claimJuz(freshGroup(), 12, ME).group;

    assert.equal(releaseJuz(g, 12, OTHER).ok, false);

    const res = releaseJuz(g, 12, ME);
    assert.equal(res.ok, true);
    const juz = res.group.juz.find((j) => j.n === 12);
    assert.deepEqual(
        { state: juz.state, by: juz.by, byName: juz.byName, claimedAt: juz.claimedAt },
        { state: JUZ_FREE, by: null, byName: null, claimedAt: null }
    );
});

test('grup sahibi kayıp üyenin cüzünü force ile serbest bırakır', () => {
    // Hatmin kilitlenmesini önleyen kaçış yolu.
    const g = claimJuz(freshGroup(), 20, OTHER).group;
    const zorla = releaseJuz(g, 20, ME, { force: true });
    assert.equal(zorla.ok, true);
    assert.equal(zorla.group.juz.find((j) => j.n === 20).state, JUZ_FREE);
});

test('ilerleme sayıları ve yüzde', () => {
    let g = freshGroup();
    assert.deepEqual(getHatimProgress(g), {
        free: 30,
        claimed: 0,
        done: 0,
        total: 30,
        percent: 0
    });

    g = claimJuz(g, 1, ME).group;
    g = claimJuz(g, 2, ME).group;
    g = completeJuz(g, 1, ME).group;

    assert.deepEqual(getHatimProgress(g), {
        free: 28,
        claimed: 1,
        done: 1,
        total: 30,
        percent: 3
    });
    assert.equal(isHatimComplete(g), false);
});

test('30 cüz bitince hatim tamamlanmış sayılır', () => {
    let g = freshGroup();
    for (let n = 1; n <= 30; n += 1) {
        g = claimJuz(g, n, ME).group;
        g = completeJuz(g, n, ME).group;
    }
    assert.equal(isHatimComplete(g), true);
    assert.equal(getHatimProgress(g).percent, 100);
});

test('üyenin cüzleri ve sıradaki cüzü', () => {
    let g = freshGroup();
    g = claimJuz(g, 5, ME).group;
    g = claimJuz(g, 11, ME).group;
    g = claimJuz(g, 8, OTHER).group;
    g = completeJuz(g, 5, ME).group;

    assert.deepEqual(
        listMemberJuz(g, ME).map((j) => j.n),
        [5, 11]
    );
    assert.equal(getNextMemberJuz(g, ME).n, 11, 'bitmemiş ilk cüz sırada olmalı');
    assert.equal(getNextMemberJuz(g, OTHER).n, 8);
    assert.equal(getNextMemberJuz(g, 'kimse'), null);
    assert.deepEqual(listMemberJuz(g, null), []);
});

test('okunacak sıradaki cüz bitmemiş ilk cüzdür', () => {
    let g = freshGroup();
    assert.equal(getNextJuzToRead(g).n, 1);

    g = completeJuz(claimJuz(g, 1, ME).group, 1, ME).group;
    assert.equal(getNextJuzToRead(g).n, 2, "biten cüz atlanır");

    // Üstlenilmiş ama bitmemiş cüz hâlâ sıradadır.
    g = claimJuz(g, 2, ME).group;
    assert.equal(getNextJuzToRead(g).n, 2);

    for (let n = 2; n <= 30; n += 1) {
        const c = claimJuz(g, n, ME);
        g = c.ok ? completeJuz(c.group, n, ME).group : completeJuz(g, n, ME).group;
    }
    assert.equal(getNextJuzToRead(g), null, "hepsi bitince null");
});

test('depodan gelen bozuk veri gruba zarar vermez', () => {
    const groups = sanitizeHatimGroups([
        {
            id: 'h_1',
            name: 'Aile',
            code: 'k7m2qp',
            juz: [
                { n: 1, state: 'done', by: ME, completedAt: 5 },
                { n: 2, state: 'claimed', by: ME },
                { n: 3, state: 'claimed' }, // sahipsiz → boşa düşmeli
                { n: 999, state: 'done', by: ME }, // aralık dışı → yok sayılmalı
                { n: 4, state: 'uydurma', by: ME }
            ]
        },
        'grup değil',
        null
    ]);

    assert.equal(groups.length, 1, 'nesne olmayan kayıtlar atılır');
    const g = groups[0];
    assert.equal(g.code, 'K7M2QP');
    assert.equal(g.juz.length, 30, 'eksik cüzler tamamlanır');
    assert.equal(g.juz[0].state, JUZ_DONE);
    assert.equal(g.juz[1].state, JUZ_CLAIMED);
    assert.equal(g.juz[2].state, JUZ_FREE, 'sahipsiz üstlenme hatmi kilitlememeli');
    assert.equal(g.juz[3].state, JUZ_FREE, 'tanınmayan durum boşa düşer');
    assert.ok(g.juz.every((j, i) => j.n === i + 1));
});

test('geçersiz kod depodan gelirse yenisi üretilir', () => {
    const [g] = sanitizeHatimGroups([{ id: 'h_2', code: 'ZZ' }]);
    assert.ok(isValidHatimCode(g.code));
});

test('grup sayısı üst sınırla kesilir', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ id: `h_${i}`, name: `G${i}` }));
    assert.equal(sanitizeHatimGroups(many).length, HATIM_GROUP_LIMIT);
    assert.deepEqual(sanitizeHatimGroups('dizi değil'), []);
});
