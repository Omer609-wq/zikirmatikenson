import test from 'node:test';
import assert from 'node:assert/strict';
import { addDaysToDateKey, dateKeyOf, daysBetweenDateKeys, isValidDateKey } from './date-key.js';
import {
    HATIM_INTENTION_MAX,
    HATIM_KIND_PERSONAL,
    HATIM_KIND_SHARED,
    claimJuz,
    completeJuz,
    createHatimGroup,
    sanitizeHatimGroups,
    sanitizeHatimPlan,
    setHatimIntention,
    setHatimPlan
} from './hatim-groups.js';
import { createHatimPlan, hatimPlanEndForDays, hatimPlanStatus } from './hatim-plan.js';

const ME = 'local_me';
const at = (y, m, d, h = 12) => new Date(y, m - 1, d, h, 0).getTime();

function personal(extra = {}) {
    return { ...createHatimGroup({ name: 'Hatmim', kind: HATIM_KIND_PERSONAL, ownerId: ME, now: at(2026, 10, 1) }), ...extra };
}

/** Cüzleri verilen anda bitirir. */
function finish(group, numbers, when) {
    let g = group;
    for (const n of numbers) {
        g = claimJuz(g, n, ME).group;
        g = completeJuz(g, n, ME, { now: when }).group;
    }
    return g;
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
    assert.equal(st.doneToday, 21);
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
    assert.equal(st.todayTarget, 61);
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

test('bir cüz geride olan: 21 sayfalık payda 20 sayfalık cüz yeter, 41 sayfalıkta yetmez', () => {
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
    assert.equal(st.todayTarget, 41);
    assert.equal(st.doneToday, 20);
    assert.equal(st.todayMet, false);
});
