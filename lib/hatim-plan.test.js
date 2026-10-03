import test from 'node:test';
import assert from 'node:assert/strict';
import { addDaysToDateKey, dateKeyOf, daysBetweenDateKeys, isValidDateKey } from './date-key.js';
import { mushafPage, setCurrentMushaf } from './mushaf.js';
import { getJuzDetail } from './hatim-juz.js';
import {
    HATIM_INTENTION_MAX,
    HATIM_KIND_PERSONAL,
    HATIM_KIND_SHARED,
    claimJuz,
    completeJuz,
    createHatimGroup,
    currentReadingJuz,
    hatimHasProgress,
    hatimMushafOf,
    setHatimMushaf,
    sanitizeHatimGroups,
    releaseJuz,
    sanitizeHatimPlan,
    setHatimIntention,
    setHatimPlan,
    setJuzReadTo,
    uncompleteJuz
} from './hatim-groups.js';
import {
    hatimTotalPages,
    createHatimPlan,
    hatimPlanEndForDays,
    hatimPlanReminderSlots,
    hatimPlanStatus,
    hatimReadPages,
    juzReadToForPage,
    withReadingLog
} from './hatim-plan.js';

// Sayfa hesapları baskıya bağlı: testler Türk baskısında (her cüz 20 sayfa,
// 30. cüz 24; hatim 604 sayfa; sayfa numaraları Türk baskısının, 3. cüz 41-60).
setCurrentMushaf('tr');

const ME = 'local_me';
const at = (y, m, d, h = 12) => new Date(y, m - 1, d, h, 0).getTime();

function personal(extra = {}) {
    return { ...createHatimGroup({ name: 'Hatmim', kind: HATIM_KIND_PERSONAL, ownerId: ME, now: at(2026, 10, 1) }), ...extra };
}

/** Uygulamadaki gibi: her değişiklik günün okuma kaydından geçer. */
function step(group, res, when) {
    assert.equal(res.ok, true, res.reason);
    return withReadingLog(group, res.group, when);
}

/** Cüzleri verilen anda bitirir. */
function finish(group, numbers, when) {
    let g = group;
    for (const n of numbers) {
        if (g.juz[n - 1].state === 'free') g = step(g, claimJuz(g, n, ME, { now: when }), when);
        g = step(g, completeJuz(g, n, ME, { now: when }), when);
    }
    return g;
}

/** Cüzde son okunan sayfayı işaretler — uygulamadaki kaydırıcı gibi. */
function readTo(group, n, page, when) {
    const { complete, readTo: ref } = juzReadToForPage(n, page);
    return step(group, setJuzReadTo(group, n, ME, ref, { now: when, complete }), when);
}

test('tarih anahtarı: geçerlilik, fark, ekleme — ay ve yıl geçişi', () => {
    assert.equal(isValidDateKey('2026-02-28'), true);
    assert.equal(isValidDateKey('2026-02-30'), false);
    assert.equal(isValidDateKey('2026-2-3'), false);
    assert.equal(isValidDateKey(null), false);
    assert.equal(daysBetweenDateKeys('2026-12-30', '2027-01-02'), 3);
    assert.equal(daysBetweenDateKeys('2026-03-01', '2026-02-28'), -1);
    assert.equal(addDaysToDateKey('2026-10-27', 29), '2026-11-25');
    assert.equal(dateKeyOf(at(2026, 3, 29, 1)), '2026-03-29', 'yaz saati sabahı');
});

test('hedef: bugün dahil N gün; geçmiş ya da bir yıldan uzak hedef kurulmaz', () => {
    const now = at(2026, 10, 1, 22);
    assert.equal(hatimPlanEndForDays(30, now), '2026-10-30');
    assert.equal(hatimPlanEndForDays(1, now), '2026-10-01', 'tek gün: bugün');
    assert.deepEqual(createHatimPlan('2026-10-30', now), { start: '2026-10-01', end: '2026-10-30' });
    assert.equal(createHatimPlan('2026-09-30', now), null, 'dün');
    assert.equal(createHatimPlan('2027-10-01', now), null, '366. gün');
    assert.ok(createHatimPlan('2027-09-30', now), '365. gün');
    assert.equal(createHatimPlan('2026-13-01', now), null);
});

test('niyet ve hedef kişisel hatimde kayıttan geri gelir, ortak hatimde düşer', () => {
    let g = setHatimIntention(personal(), '  Annem   için ');
    g = setHatimPlan(g, { start: '2026-10-01', end: '2026-10-30' });
    const shared = {
        ...createHatimGroup({ name: 'Cami', kind: HATIM_KIND_SHARED, ownerId: 'u1' }),
        intention: 'sızmasın',
        plan: { start: '2026-10-01', end: '2026-10-30' }
    };
    const [p, s] = sanitizeHatimGroups(JSON.parse(JSON.stringify([g, shared])));
    assert.equal(p.intention, 'Annem için');
    assert.deepEqual(p.plan, { start: '2026-10-01', end: '2026-10-30' });
    assert.equal('intention' in s, false);
    assert.equal('plan' in s, false);
});

test('niyet: boş metin kaldırır, uzun metin kısalır', () => {
    const g = setHatimIntention(personal(), 'Babam için');
    assert.equal('intention' in setHatimIntention(g, '   '), false);
    assert.equal(setHatimIntention(g, 'x'.repeat(200)).intention.length, HATIM_INTENTION_MAX);
});

test('hedef: bozuk kayıt temizlenir; null hedefi kaldırır', () => {
    assert.equal(sanitizeHatimPlan({ start: '2026-10-05', end: '2026-10-01' }), null, 'ters');
    assert.equal(sanitizeHatimPlan({ start: 'dün', end: '2026-10-01' }), null);
    assert.equal(sanitizeHatimPlan('2026-10-01'), null);
    const [p] = sanitizeHatimGroups([{ ...personal(), plan: { start: '2026-10-01', end: 'x' } }]);
    assert.equal('plan' in p, false);
    const g = setHatimPlan(personal(), { start: '2026-10-01', end: '2026-10-30' });
    assert.equal('plan' in setHatimPlan(g, null), false);
});

test('günlük pay: 30 günlük hedefte günde ~20 sayfa; hedef yoksa durum yok', () => {
    assert.equal(hatimPlanStatus(personal()), null);
    const now = at(2026, 10, 1);
    const g = setHatimPlan(personal(), createHatimPlan('2026-10-30', now));
    const st = hatimPlanStatus(g, now);
    assert.equal(st.totalDays, 30);
    assert.equal(st.daysLeft, 30);
    assert.equal(st.todayTarget, 20);
    assert.equal(st.dailyPages, 20);
    assert.equal(st.doneToday, 0);
    assert.equal(st.todayMet, false);
    assert.equal(st.overdue, false);
});

test('bugün bitirilen cüz bugünün payını küçültmez, "okudun" olur; 20 sayfalık cüz de yeter', () => {
    const d1 = at(2026, 10, 1);
    let g = setHatimPlan(personal(), createHatimPlan('2026-10-30', d1));
    g = finish(g, [1], d1);
    let st = hatimPlanStatus(g, d1 + 3600000);
    assert.equal(st.todayTarget, 20, 'pay gün başına göre');
    assert.equal(st.doneToday, 20, 'Türk baskısında 1. cüz 20 sayfa');
    assert.equal(st.todayMet, true);

    // Ertesi gün 2. cüz (20 sayfa) payı karşılar.
    const d2 = at(2026, 10, 2);
    g = finish(g, [2], d2);
    st = hatimPlanStatus(g, d2);
    assert.equal(st.daysLeft, 29);
    assert.equal(st.doneToday, 20);
    assert.equal(st.todayMet, true);
});

test('okunmayan günler payı büyütür; son gün kalanın tamamı', () => {
    const g = setHatimPlan(personal(), createHatimPlan('2026-10-30', at(2026, 10, 1)));
    const st = hatimPlanStatus(g, at(2026, 10, 21));
    assert.equal(st.daysLeft, 10);
    assert.equal(st.todayTarget, 60);
    const last = hatimPlanStatus(g, at(2026, 10, 30, 23));
    assert.equal(last.daysLeft, 1);
    assert.equal(last.todayTarget, last.remainingPages);
});

test('hedef günü geçti: gecikti, pay kalanın tamamı', () => {
    const g = setHatimPlan(personal(), createHatimPlan('2026-10-07', at(2026, 10, 1)));
    const st = hatimPlanStatus(g, at(2026, 10, 8, 0));
    assert.equal(st.daysLeft, 0);
    assert.equal(st.overdue, true);
    assert.equal(st.todayMet, false);
    assert.equal(st.todayTarget, st.remainingPages);
});

test('tamamlanan hatim: zamanında mı bitti', () => {
    const all = Array.from({ length: 30 }, (_, i) => i + 1);
    const base = setHatimPlan(personal(), createHatimPlan('2026-10-30', at(2026, 10, 1)));
    const onTime = hatimPlanStatus(finish(base, all, at(2026, 10, 30, 23)), at(2026, 11, 2));
    assert.equal(onTime.complete, true);
    assert.equal(onTime.finishedOnTime, true);
    assert.equal(onTime.overdue, false);
    assert.equal(onTime.todayTarget, 0);
    const late = hatimPlanStatus(finish(base, all, at(2026, 10, 31, 9)), at(2026, 11, 2));
    assert.equal(late.finishedOnTime, false);
});

test('bir cüz geride olan: 21 sayfalık payda 20 sayfalık cüz yeter, 40 sayfalıkta yetmez', () => {
    const d1 = at(2026, 10, 1);
    // 30 günlük hedefin 6. günü, 4 cüz bitmiş: pay ~21 sayfa.
    let g = setHatimPlan(personal(), createHatimPlan('2026-10-30', d1));
    g = finish(g, [1, 2, 3, 4], at(2026, 10, 5));
    const today = at(2026, 10, 6, 20);
    let st = hatimPlanStatus(finish(g, [5], at(2026, 10, 6, 9)), today);
    assert.equal(st.todayTarget, 21);
    assert.equal(st.doneToday, 20);
    assert.equal(st.todayMet, true);

    // 15 günlük hedefte pay ~40 sayfa: tek cüz yetmez.
    g = setHatimPlan(personal(), createHatimPlan('2026-10-15', d1));
    st = hatimPlanStatus(finish(g, [2], at(2026, 10, 1, 9)), at(2026, 10, 1, 20));
    assert.equal(st.todayTarget, 40);
    assert.equal(st.doneToday, 20);
    assert.equal(st.todayMet, false);
});

test('hatırlatma saati hedefle saklanır; bozuk saat düşer', () => {
    const now = at(2026, 10, 1);
    assert.deepEqual(createHatimPlan('2026-10-30', now, { remindAt: '20:00' }), {
        start: '2026-10-01',
        end: '2026-10-30',
        remindAt: '20:00'
    });
    assert.equal('remindAt' in createHatimPlan('2026-10-30', now, { remindAt: '25:00' }), false);
    assert.equal('remindAt' in createHatimPlan('2026-10-30', now), false);
    const [p] = sanitizeHatimGroups([setHatimPlan(personal(), createHatimPlan('2026-10-30', now, { remindAt: '07:30' }))]);
    assert.equal(p.plan.remindAt, '07:30');
});

test('bildirimler: hatırlatmasız hedefte yok; saat geçtiyse ilki yarın; hedef gününde biter', () => {
    const d1 = at(2026, 10, 1, 12);
    const noRemind = setHatimPlan(personal(), createHatimPlan('2026-10-30', d1));
    assert.deepEqual(hatimPlanReminderSlots([noRemind], { now: d1 }), []);

    const g = { ...setHatimPlan(personal(), createHatimPlan('2026-10-03', d1, { remindAt: '20:00' })), id: 'h_a' };
    const slots = hatimPlanReminderSlots([g], { now: d1 });
    assert.deepEqual(slots.map((s) => dateKeyOf(s.at.getTime())), ['2026-10-01', '2026-10-02', '2026-10-03']);
    assert.equal(slots[0].at.getHours(), 20);
    assert.deepEqual(slots.map((s) => s.daysLeft), [3, 2, 1]);
    // Hiç okunmazsa pay günden güne büyür; son gün kalanın tamamı.
    assert.deepEqual(slots.map((s) => s.target), [201, 302, 604]);

    const late = hatimPlanReminderSlots([g], { now: at(2026, 10, 1, 21) });
    assert.equal(dateKeyOf(late[0].at.getTime()), '2026-10-02', 'bugünün saati geçti');
});

test('bildirimler: bugünün payı okunduysa bugünkü atlanır; bitmiş ve gecikmiş hatimde yok', () => {
    const d1 = at(2026, 10, 1, 9);
    let g = setHatimPlan(personal(), createHatimPlan('2026-10-30', d1, { remindAt: '20:00' }));
    const before = hatimPlanReminderSlots([g], { now: d1 });
    assert.equal(dateKeyOf(before[0].at.getTime()), '2026-10-01');
    assert.equal(before.length, 14, 'iki hafta ileri');

    g = finish(g, [1], d1);
    const after = hatimPlanReminderSlots([g], { now: d1 + 60000 });
    assert.equal(dateKeyOf(after[0].at.getTime()), '2026-10-02');
    assert.equal(after[0].target, 20);

    const all = Array.from({ length: 30 }, (_, i) => i + 1);
    assert.deepEqual(hatimPlanReminderSlots([finish(g, all.slice(1), d1)], { now: d1 }), []);
    assert.deepEqual(hatimPlanReminderSlots([g], { now: at(2026, 11, 1) }), [], 'hedef günü geçti');
});

test('bildirimler: birden çok hedef zamana göre dizilir ve sınırda kesilir; ortak hatim sayılmaz', () => {
    const d1 = at(2026, 10, 1, 9);
    const a = { ...setHatimPlan(personal(), createHatimPlan('2026-12-30', d1, { remindAt: '21:00' })), id: 'h_a' };
    const b = { ...setHatimPlan(personal(), createHatimPlan('2026-12-30', d1, { remindAt: '07:00' })), id: 'h_b' };
    const shared = { ...a, id: 'h_s', kind: HATIM_KIND_SHARED };
    const slots = hatimPlanReminderSlots([a, b, shared], { now: d1, limit: 5 });
    assert.equal(slots.length, 5);
    assert.deepEqual(slots.map((s) => s.groupId), ['h_a', 'h_b', 'h_a', 'h_b', 'h_a']);
    assert.ok(slots.every((s, i) => i === 0 || slots[i - 1].at <= s.at));
});

test('bildirim: bugünkü payın yüzdesi ve kalan sayfa; gelecek günlerde %0', () => {
    const d1 = at(2026, 10, 1, 9);
    // 15 günlük hedef: pay ~40 sayfa, 2. cüz (20 sayfa) bugün bitti.
    let g = setHatimPlan(personal(), createHatimPlan('2026-10-15', d1, { remindAt: '20:00' }));
    g = finish(g, [2], d1);
    const [today, tomorrow] = hatimPlanReminderSlots([g], { now: d1 + 60000 });
    assert.equal(today.target, 40);
    assert.equal(today.done, 20);
    assert.equal(today.percent, 50);
    assert.equal(today.remaining, 20);
    assert.equal(tomorrow.done, 0);
    assert.equal(tomorrow.percent, 0);
    assert.equal(tomorrow.remaining, tomorrow.target);
});

test('son okunan sayfa: boş cüz okunur olur, son sayfa cüzü bitirir, geri çekmek işareti kaldırır', () => {
    const d1 = at(2026, 10, 1, 9);
    // 3. cüz: sayfa 41-60. Sayfa değil o sayfanın son ayeti saklanır.
    let g = readTo(personal(), 3, 50, d1);
    let juz = g.juz[2];
    assert.equal(juz.state, 'claimed');
    assert.deepEqual(juz.readTo, mushafPage(50).last);
    assert.equal(hatimReadPages(g), 10);

    g = readTo(g, 3, 40, d1);
    assert.equal('readTo' in g.juz[2], false, 'başlangıçtan önceki sayfa: hiç okunmadı');
    assert.equal(g.juz[2].state, 'claimed');

    g = readTo(g, 3, 60, d1);
    assert.equal(g.juz[2].state, 'done');
    assert.equal('readTo' in g.juz[2], false);
    assert.equal(hatimReadPages(g), 20);

    assert.equal(setJuzReadTo(g, 3, ME, { s: 2, a: 260 }).reason, 'done');
    assert.equal(setJuzReadTo(g, 4, ME, { s: 2, a: 999 }).reason, 'invalid', 'olmayan ayet');
    assert.equal(setJuzReadTo(g, 4, ME, 70).reason, 'invalid', 'eski biçim: sayfa numarası');
    const free = setJuzReadTo(personal(), 5, ME, null);
    assert.equal(free.group.juz[4].state, 'free', 'boş cüzde "başlamadım" bir şey değiştirmez');
});

test('son okunan sayfa kayıttan geri gelir; bırakılan ya da geri alınan cüzde düşer', () => {
    const d1 = at(2026, 10, 1, 9);
    const g = readTo(personal(), 3, 50, d1);
    const [back] = sanitizeHatimGroups(JSON.parse(JSON.stringify([g])));
    assert.deepEqual(back.juz[2].readTo, g.juz[2].readTo);
    for (const bozuk of [0, 605, 51.5, '51', { s: 2, a: 999 }, { s: 'x' }]) {
        const [bad] = sanitizeHatimGroups([{ ...g, juz: g.juz.map((j) => (j.n === 3 ? { ...j, readTo: bozuk } : j)) }]);
        assert.equal('readTo' in bad.juz[2], false, JSON.stringify(bozuk));
    }
    assert.equal('readTo' in releaseJuz(g, 3, ME).group.juz[2], false);
    const redo = uncompleteJuz(finish(g, [3], d1), 3, ME).group;
    assert.equal('readTo' in redo.juz[2], false);
});

test('günün okuması: sayfa işaretleri toplanır, gün değişince sıfırlanır, düzeltme sıfırın altına inmez', () => {
    const d1 = at(2026, 10, 1, 9);
    let g = setHatimPlan(personal(), createHatimPlan('2026-10-30', d1));
    g = readTo(g, 1, 10, d1); // 10 sayfa
    g = readTo(g, 1, 15, d1 + 3600000); // +5
    let st = hatimPlanStatus(g, d1 + 7200000);
    assert.deepEqual(g.readLog, { day: '2026-10-01', pages: 15 });
    assert.equal(st.doneToday, 15);
    assert.equal(st.todayTarget, 20);
    assert.equal(st.todayMet, false);
    assert.equal(st.remainingPages, hatimTotalPages() - 15);

    // Ertesi gün: dünkü 15 sayfa günün başında zaten okunmuş.
    const d2 = at(2026, 10, 2, 9);
    st = hatimPlanStatus(g, d2);
    assert.equal(st.doneToday, 0);
    // Dünkü girişi düzeltir (15 değil 12'deydi): bugünkü okuma eksiye düşmez.
    g = readTo(g, 1, 12, d2);
    assert.equal(hatimPlanStatus(g, d2).doneToday, 0);
    g = readTo(g, 1, 19, d2 + 60000); // bugün 7 sayfa
    assert.equal(hatimPlanStatus(g, d2 + 120000).doneToday, 7);

    // Cüzü bitirmek kalan sayfaları ekler: 1. cüz 20 sayfa, 19'a kadar okunmuştu.
    g = finish(g, [1], d2 + 180000);
    st = hatimPlanStatus(g, d2 + 240000);
    assert.equal(st.doneToday, 8);
});

test('günün okuması kişisel hatimde kayıtta durur; bozuk kayıt düşer', () => {
    const d1 = at(2026, 10, 1, 9);
    const g = readTo(personal(), 1, 10, d1);
    const [back] = sanitizeHatimGroups(JSON.parse(JSON.stringify([g])));
    assert.deepEqual(back.readLog, { day: '2026-10-01', pages: 10 });
    const [bad] = sanitizeHatimGroups([{ ...g, readLog: { day: 'dün', pages: 10 } }]);
    assert.equal('readLog' in bad, false);
});

test('nerede kaldın: sayfası işaretli cüz, yoksa okunan; okunan cüz yokken yok', () => {
    const d1 = at(2026, 10, 1, 9);
    let g = finish(personal(), [1, 2], d1);
    assert.equal(currentReadingJuz(g), null, 'alınmış cüz yok: düğme de yok');
    g = step(g, claimJuz(g, 10, ME), d1);
    assert.equal(currentReadingJuz(g).n, 10, 'okunan cüz');
    g = readTo(g, 12, 230, d1);
    assert.equal(currentReadingJuz(g).n, 12, 'sayfası işaretli cüz önce');
    const all = Array.from({ length: 30 }, (_, i) => i + 1);
    assert.equal(currentReadingJuz(finish(personal(), all, d1)), null);
});

test('baskı değişince işaret kaymaz: ayet saklanır, sayfası o baskıda hesaplanır', () => {
    const d1 = at(2026, 10, 1, 9);
    // Türk baskısında 3. cüzün 50. sayfası = Medine'de 51.
    const g = readTo(personal(), 3, 50, d1);
    const ref = g.juz[2].readTo;
    setCurrentMushaf('medina');
    try {
        assert.deepEqual(juzReadToForPage(3, 51).readTo, ref, 'aynı yer, Medine numarasıyla');
        assert.equal(hatimReadPages(g), 10);
        // Medine 3. cüzü 42-62: 62. sayfa cüzü bitirir, 61'in son ayeti Âl-i İmrân 91.
        assert.deepEqual(juzReadToForPage(3, 62), { complete: true, readTo: null });
        assert.deepEqual(juzReadToForPage(3, 61).readTo, { s: 3, a: 91 });
    } finally {
        setCurrentMushaf('tr');
    }
    // Türk baskısı 30. cüz 24 sayfa: 592. sayfa Gâşiye 12 – Fecr 14.
    assert.deepEqual(juzReadToForPage(30, 592).readTo, { s: 89, a: 14 });
    assert.deepEqual(juzReadToForPage(30, 604), { complete: true, readTo: null });
});

test('kişisel hatim baskısını taşır: genel ayar değişse de sınırlar kaymaz, ayet atlanmaz', () => {
    const d1 = at(2026, 10, 1, 9);
    let g = createHatimGroup({ name: 'Hatmim', kind: HATIM_KIND_PERSONAL, ownerId: ME, mushaf: 'tr', now: d1 });
    assert.equal(g.mushaf, 'tr');
    // Türk düzeninde 25. cüz Câsiye 32'de biter.
    g = finish(g, [25], d1);
    setCurrentMushaf('medina');
    try {
        assert.equal(hatimMushafOf(g), 'tr', 'genel ayar Medine olsa da hatim Türk');
        assert.equal(hatimReadPages(g), 20, 'Türk sayfasıyla sayılır');
        // 26. cüz hatimde Câsiye 33 ile başlar: 25'in bittiği yerden devam, arada ayet kalmaz.
        const m = hatimMushafOf(g);
        const juz26 = getJuzDetail(26, { juzMushaf: m, pageMushaf: m });
        assert.deepEqual(juz26.start, { surah: 45, ayah: 33 });
        assert.equal(juz26.startPage, 501);
        // İlk sayfası (Câsiye 33-37, Ahkâf 1-5) okununca işaret Ahkâf 5'te.
        assert.deepEqual(juzReadToForPage(26, 501, m).readTo, { s: 46, a: 5 });
    } finally {
        setCurrentMushaf('tr');
    }
});

test('baskı kayıtta kalır; ortak hatimde yok; yalnız okumaya başlanmadan değişir', () => {
    const d1 = at(2026, 10, 1, 9);
    const p = createHatimGroup({ name: 'Hatmim', kind: HATIM_KIND_PERSONAL, ownerId: ME, mushaf: 'medina', now: d1 });
    const sh = createHatimGroup({ name: 'Cami', kind: HATIM_KIND_SHARED, ownerId: 'u1', mushaf: 'medina' });
    assert.equal('mushaf' in sh, false);
    const [back, backShared] = sanitizeHatimGroups(JSON.parse(JSON.stringify([p, { ...sh, mushaf: 'medina' }])));
    assert.equal(back.mushaf, 'medina');
    assert.equal('mushaf' in backShared, false);

    assert.equal(hatimHasProgress(p), false);
    const changed = setHatimMushaf(p, 'tr');
    assert.equal(changed.ok, true);
    assert.equal(changed.group.mushaf, 'tr');
    const started = step(p, claimJuz(p, 1, ME, { now: d1 }), d1);
    assert.equal(hatimHasProgress(started), true);
    assert.equal(setHatimMushaf(started, 'tr').reason, 'started');
    assert.equal(setHatimMushaf(sh, 'tr').reason, 'invalid');
});

test('eski kayıt: sayfa numarası olarak saklanan son okunan yer ayete çevrilir, kaybolmaz', () => {
    // 27-28 Eylül derlemeleri Medine sayfa numarası yazıyordu: 3. cüzde 51.
    const d1 = at(2026, 10, 1, 9);
    const g = step(personal(), claimJuz(personal(), 3, ME, { now: d1 }), d1);
    const legacy = { ...g, juz: g.juz.map((j) => (j.n === 3 ? { ...j, readTo: 51 } : j)) };
    const [back] = sanitizeHatimGroups(JSON.parse(JSON.stringify([legacy])));
    // Medine 51. sayfa Âl-i İmrân 15'te biter.
    assert.deepEqual(back.juz[2].readTo, { s: 3, a: 15 });
    // Aynı yer: Türk baskısında 50. sayfa, cüzde 10 sayfa okunmuş.
    assert.equal(hatimReadPages(back), 10);
});
