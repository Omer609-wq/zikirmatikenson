import test from 'node:test';
import assert from 'node:assert/strict';
import {
    HATIM_CODE_ALPHABET,
    HATIM_CODE_LENGTH,
    HATIM_LIMIT_PER_KIND,
    HATIM_KIND_PERSONAL,
    HATIM_KIND_SHARED,
    HATIM_MEMBER_NAME_MAX,
    HATIM_JUZ_COUNT,
    JUZ_CLAIMED,
    JUZ_DONE,
    JUZ_FREE,
    buildMemberJuzStrip,
    claimJuz,
    completeJuz,
    countHatimsByKind,
    createHatimGroup,
    hatimLoadLevel,
    isHatimLimitReached,
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

test('hatim sayısı kip başına ayrı kesilir', () => {
    // Kipsiz kayıtların hepsi ortak sayılır; sınır o kipte dolar.
    const many = Array.from({ length: 20 }, (_, i) => ({ id: `h_${i}`, name: `G${i}` }));
    assert.equal(sanitizeHatimGroups(many).length, HATIM_LIMIT_PER_KIND);
    assert.deepEqual(sanitizeHatimGroups('dizi değil'), []);

    // Düz slice olsaydı 5 kişisel + 5 ortak tutan kullanıcı yarısını kaybederdi.
    const karisik = [
        ...Array.from({ length: 8 }, (_, i) => ({ id: `p_${i}`, kind: HATIM_KIND_PERSONAL })),
        ...Array.from({ length: 8 }, (_, i) => ({ id: `s_${i}`, kind: HATIM_KIND_SHARED }))
    ];
    const temiz = sanitizeHatimGroups(karisik);
    assert.equal(temiz.length, HATIM_LIMIT_PER_KIND * 2);
    assert.equal(countHatimsByKind(temiz, HATIM_KIND_PERSONAL), HATIM_LIMIT_PER_KIND);
    assert.equal(countHatimsByKind(temiz, HATIM_KIND_SHARED), HATIM_LIMIT_PER_KIND);
    // Kesilen, sondan gelenler olmalı — eski kayıtlar korunur.
    assert.deepEqual(
        temiz.filter((g) => g.kind === HATIM_KIND_PERSONAL).map((g) => g.id),
        ['p_0', 'p_1', 'p_2', 'p_3', 'p_4']
    );
});

test('sınır kipler arasında paylaşılmaz', () => {
    const besKisisel = Array.from({ length: HATIM_LIMIT_PER_KIND }, (_, i) => ({
        id: `p_${i}`,
        kind: HATIM_KIND_PERSONAL
    }));
    assert.equal(isHatimLimitReached(besKisisel, HATIM_KIND_PERSONAL), true);
    assert.equal(
        isHatimLimitReached(besKisisel, HATIM_KIND_SHARED),
        false,
        'kişisel dolu diye grup sekmesi kapanmamalı'
    );

    assert.equal(isHatimLimitReached([], HATIM_KIND_PERSONAL), false);
    assert.equal(isHatimLimitReached(null, HATIM_KIND_SHARED), false);
    assert.equal(countHatimsByKind(null, HATIM_KIND_SHARED), 0);
});

test('kipsiz eski kayıt sınır sayımında ortak sayılır', () => {
    // hatimKindOf hem temizlemede hem sayımda aynı kuralı uygular; ayrışırlarsa
    // kullanıcı "sınır dolu" görürken yeni hatim açabilir hâle gelirdi.
    const kipsiz = [{ id: 'h_1' }, { id: 'h_2', kind: 'uydurma' }];
    assert.equal(countHatimsByKind(kipsiz, HATIM_KIND_SHARED), 2);
    assert.equal(countHatimsByKind(kipsiz, HATIM_KIND_PERSONAL), 0);
    assert.equal(sanitizeHatimGroups(kipsiz).every((g) => g.kind === HATIM_KIND_SHARED), true);
});

/* ---------- Ana ekran şeridi: tüm hatimlerin toplamı ---------- */

/** Aynı cüzü birden çok hatimde üstlenen bir kullanıcı kurar. */
function coklu() {
    let a = createHatimGroup({ name: 'Grup A', ownerId: ME, now: 1 });
    let b = createHatimGroup({ name: 'Grup B', ownerId: ME, now: 2 });
    let c = createHatimGroup({ name: 'Grup C', ownerId: ME, now: 3 });

    // 5. cüzü üçünde de aldım, birini bitirdim -> 2 bekliyor
    a = claimJuz(a, 5, ME).group;
    b = claimJuz(b, 5, ME).group;
    c = claimJuz(c, 5, ME).group;
    a = completeJuz(a, 5, ME).group;

    // 9. cüzü iki grupta aldım, ikisini de bitirdim -> bekleyen yok, bitti
    a = claimJuz(a, 9, ME).group;
    b = claimJuz(b, 9, ME).group;
    a = completeJuz(a, 9, ME).group;
    b = completeJuz(b, 9, ME).group;

    // 12. cüzü başkası aldı -> şeritte görünmemeli
    a = claimJuz(a, 12, OTHER).group;

    return [a, b, c];
}

test('şerit her zaman 30 cüz döner, hatim yoksa da', () => {
    for (const girdi of [[], null, undefined]) {
        const s = buildMemberJuzStrip(girdi, ME);
        assert.equal(s.length, HATIM_JUZ_COUNT);
        assert.ok(s.every((x) => x.state === JUZ_FREE && x.pending === 0 && x.done === 0));
    }
    assert.equal(buildMemberJuzStrip(coklu(), null).length, HATIM_JUZ_COUNT);
});

test('aynı cüz birden çok hatimde alınınca bekleyen sayısı toplanır', () => {
    const s = buildMemberJuzStrip(coklu(), ME);
    const c5 = s[4];
    assert.equal(c5.n, 5);
    assert.equal(c5.pending, 2, 'üç hatimde alındı, biri bitti');
    assert.equal(c5.done, 1);
    assert.equal(c5.state, JUZ_CLAIMED, 'bekleyen varken durum üstlenilmiş kalır');
});

test('hepsi bitince cüz yeşile döner', () => {
    const c9 = buildMemberJuzStrip(coklu(), ME)[8];
    assert.equal(c9.pending, 0);
    assert.equal(c9.done, 2);
    assert.equal(c9.state, JUZ_DONE);
    assert.equal(c9.level, 0, 'bitmiş cüzün yük kademesi olmaz');
});

test('başkasının aldığı cüz benim şeridimde görünmez', () => {
    const s = buildMemberJuzStrip(coklu(), ME);
    assert.equal(s[11].state, JUZ_FREE, '12. cüzü OTHER aldı');
    assert.equal(s[11].pending, 0);
    // Karşı taraftan bakınca da doğru olmalı.
    assert.equal(buildMemberJuzStrip(coklu(), OTHER)[11].state, JUZ_CLAIMED);
});

test('hiç dokunulmamış cüz boş kalır', () => {
    const s = buildMemberJuzStrip(coklu(), ME);
    assert.equal(s[29].state, JUZ_FREE);
    assert.equal(s[29].level, 0);
});

test('yük kademesi 3 cüzde doyar — 8x6 pikselde daha fazlası ayırt edilmez', () => {
    assert.equal(hatimLoadLevel(0), 0);
    assert.equal(hatimLoadLevel(1), 1);
    assert.equal(hatimLoadLevel(2), 2);
    assert.equal(hatimLoadLevel(3), 3);
    assert.equal(hatimLoadLevel(4), 3, '3 ve üstü aynı görünür');
    assert.equal(hatimLoadLevel(5), 3, 'hatim sınırı 5; üstü zaten olamaz');
    assert.equal(hatimLoadLevel(99), 3, 'doyar, taşmaz');
});

test('yük kademesi bozuk girdide sıfırlanır', () => {
    // Sayıya dönmeyen ya da anlamsız değer kademe üretmez; nokta boş kalır.
    for (const kotu of [null, undefined, NaN, -3, 0, 'abc', Infinity]) {
        assert.equal(hatimLoadLevel(kotu), 0, String(kotu));
    }
});

test('tek kişisel hatimde şerit eski davranışı korur', () => {
    // Yaygın durum: tek hatim, her cüz bir kez. Toplama bunu bozmamalı.
    let g = createHatimGroup({ name: 'Hatmim', ownerId: ME, kind: HATIM_KIND_PERSONAL, now: 1 });
    g = claimJuz(g, 1, ME).group;
    g = completeJuz(g, 1, ME).group;
    g = claimJuz(g, 2, ME).group;

    const s = buildMemberJuzStrip([g], ME);
    assert.equal(s[0].state, JUZ_DONE);
    assert.equal(s[1].state, JUZ_CLAIMED);
    assert.equal(s[1].level, 1, 'tek hatimde kademe hep en açık ton');
    assert.equal(s[2].state, JUZ_FREE);
});

/* ---------- Paylaşımlı hatimin sunucu eşleşme bilgisi ---------- */

test('ortak hatimin sunucu bilgisi depodan dönüşte korunur', () => {
    // Düşseydi rev önbelleği her açılışta kaybolur, tablo her seferinde baştan okunurdu.
    const [g] = sanitizeHatimGroups([
        { id: 'Xq3vT9bLm2Pz8KwR4nYc', kind: HATIM_KIND_SHARED, code: 'K7M2QP', remote: { rev: 7, memberCount: 4 } }
    ]);
    assert.deepEqual(g.remote, { rev: 7, memberCount: 4 });
    assert.equal(g.id, 'Xq3vT9bLm2Pz8KwR4nYc', 'Firestore otomatik kimliği korunur');
});

test('kişisel ve hiç senkronlanmamış hatimde sunucu bilgisi olmaz', () => {
    const [kisisel] = sanitizeHatimGroups([
        { id: 'p1', kind: HATIM_KIND_PERSONAL, remote: { rev: 3, memberCount: 2 } }
    ]);
    assert.equal(kisisel.remote, undefined);

    const [yerel] = sanitizeHatimGroups([{ id: 's1', kind: HATIM_KIND_SHARED }]);
    assert.equal(yerel.remote, undefined);
});

test('bozuk sunucu bilgisi güvenli varsayılana düşer', () => {
    const [g] = sanitizeHatimGroups([
        { id: 's2', kind: HATIM_KIND_SHARED, remote: { rev: -2, memberCount: 'dört' } }
    ]);
    // rev 0'a düşerse sunucudaki rev'le tutmaz ve tablo yeniden okunur — güvenli yön.
    assert.deepEqual(g.remote, { rev: 0, memberCount: 1 });
});
