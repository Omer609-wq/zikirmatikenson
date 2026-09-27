/**
 * Kişisel hatim hedefi: "şu tarihe kadar bitireyim" — kalan gün ve günlük pay.
 *
 * Günlük pay sabit bir bölüm değil, her gün kalanın kalan güne bölümü: bir gün
 * okunamazsa pay sonraki günlere dağılır, fazla okunursa azalır. Pay günün
 * başındaki duruma göre hesaplanır; yoksa bugün bir cüz bitince bugünün payı
 * da küçülür ve "bugünkü payını okudun" hiç görünmezdi.
 *
 * Birim sayfa: ilerleme cüz cüz işaretleniyor, ama "günde 10 sayfa" yarım
 * cüzden daha anlaşılır. Pay yuvarlanır, yukarı değil: 30 günlük hedefte cüzler
 * 20-21 sayfa, yukarı yuvarlanan 21'lik pay 20 sayfalık cüzü "eksik" gösterirdi.
 */
import { addDaysToDateKey, dateKeyAtTime, dateKeyOf, daysBetweenDateKeys } from './date-key.js';
import { JUZ_DONE, isHatimComplete, isPersonalHatim, sanitizeHatimPlan } from './hatim-groups.js';
import { getJuzDetail } from './hatim-juz.js';

/** Hedef penceresindeki hazır süreler (gün). 30: günde bir cüz. */
export const HATIM_PLAN_PRESETS = Object.freeze([7, 15, 30, 40, 60]);

/** Hatırlatma ilk açılışta bu saatte önerilir: akşam, günün işi bitmişken. */
export const HATIM_PLAN_REMIND_DEFAULT = '20:00';

/**
 * Bildirimler kaç gün ileriye kurulur. Uygulama her açılışta yeniden kurar;
 * iki hafta açılmazsa bildirim de susar.
 */
export const HATIM_PLAN_REMIND_DAYS_AHEAD = 14;

/**
 * Toplam bildirim sınırı. iOS bekleyen yerel bildirimi 64'le sınırlıyor ve
 * fazlasını sessizce atıyor; günlük zikir hatırlatıcısı 28'ini kullanıyor.
 */
export const HATIM_PLAN_REMIND_LIMIT = 30;

/** Bugün başlayıp `days` günde biten hedefin son günü. */
export function hatimPlanEndForDays(days, now = Date.now()) {
    return addDaysToDateKey(dateKeyOf(now), Math.max(1, Math.floor(days)) - 1);
}

/**
 * Bugünden `end` gününe hedef. Geçmiş ya da bir yıldan uzak gün null döner.
 * @param {{ remindAt?: string | null }} [opts] Her gün bildirim saati ('SS:DD').
 * @returns {{ start: string, end: string, remindAt?: string } | null}
 */
export function createHatimPlan(end, now = Date.now(), { remindAt = null } = {}) {
    return sanitizeHatimPlan({ start: dateKeyOf(now), end, remindAt });
}

function juzPageCount(n) {
    return getJuzDetail(n)?.pageCount || 0;
}

/** Günlük pay: kalan sayfa kalan güne; en az bir sayfa. */
function dailyShare(pages, days) {
    return pages > 0 && days > 0 ? Math.max(1, Math.round(pages / days)) : 0;
}

/** Günün başı (yerel gece yarısı). */
function startOfDay(ms) {
    const d = new Date(ms);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
}

/**
 * Hedefin bugünkü durumu. Hedef yoksa null.
 *
 * @returns {{
 *   start: string, end: string, totalDays: number,
 *   daysLeft: number,       bugün dahil kalan gün; hedef günü geçtiyse 0
 *   overdue: boolean,       hedef günü geçti, hatim bitmedi
 *   complete: boolean,
 *   remainingPages: number,
 *   dailyPages: number,     bundan sonra günde ortalama
 *   todayTarget: number,    bugünün payı (günün başındaki duruma göre)
 *   doneToday: number,      bugün biten cüzlerin sayfası
 *   todayMet: boolean,
 *   finishedOnTime: boolean son cüz hedef gününde ya da önce bitti
 * } | null}
 */
export function hatimPlanStatus(group, now = Date.now()) {
    const plan = sanitizeHatimPlan(group?.plan);
    if (!plan) return null;

    const dayStart = startOfDay(now);
    let remainingPages = 0;
    let openAtDayStart = 0;
    let doneToday = 0;
    let lastDoneAt = 0;
    for (const juz of group.juz || []) {
        const pages = juzPageCount(juz.n);
        if (juz.state !== JUZ_DONE) {
            remainingPages += pages;
            openAtDayStart += pages;
            continue;
        }
        // Bitiş anı bilinmeyen (eski) cüz bugünden önce bitmiş sayılır.
        const at = Number(juz.completedAt) || 0;
        lastDoneAt = Math.max(lastDoneAt, at);
        if (at >= dayStart) {
            openAtDayStart += pages;
            doneToday += pages;
        }
    }

    const complete = isHatimComplete(group);
    const daysLeft = Math.max(0, daysBetweenDateKeys(dateKeyOf(now), plan.end) + 1);
    const todayTarget = complete ? 0 : daysLeft > 0 ? dailyShare(openAtDayStart, daysLeft) : remainingPages;
    // İlerleme cüz cüz işaretleniyor ve cüzler 20-23 sayfa: 21 sayfalık payda
    // 20 sayfalık cüzü bitiren "eksik" görünmesin. Bir cüz geride olan yine
    // görür — onun payı iki cüze yakın.
    const todayMet =
        !complete && daysLeft > 0 && doneToday > 0 && doneToday >= Math.floor(todayTarget * 0.9);
    return {
        ...plan,
        totalDays: daysBetweenDateKeys(plan.start, plan.end) + 1,
        daysLeft,
        overdue: !complete && daysLeft === 0,
        complete,
        remainingPages,
        dailyPages: complete ? 0 : daysLeft > 0 ? dailyShare(remainingPages, daysLeft) : remainingPages,
        todayTarget,
        doneToday,
        todayMet,
        finishedOnTime: complete && lastDoneAt > 0 && dateKeyOf(lastDoneAt) <= plan.end
    };
}

/**
 * Hatırlatmalı hedeflerin önümüzdeki günlerdeki bildirimleri: hatim ve gün
 * başına bir tane, kurulduğu anda hesaplanmış payla.
 *
 * Gelecek günlerin payı "bundan sonra hiç okunmazsa" varsayımıyla hesaplanır.
 * Bu varsayım yeterli: ilerleme yalnız uygulamada işaretlenebiliyor ve her
 * işaretlemede bildirimler baştan kurulunca metin hep o güne göre doğru kalır.
 * Bugünün payı okunduysa bugünkü bildirim kurulmaz. Hedef günü geçen ya da
 * biten hatim için bildirim yok.
 *
 * @returns {Array<{ groupId: string, name: string, at: Date, target: number,
 *   done: number, daysLeft: number }>} zamana göre sıralı, en fazla `limit`.
 */
export function hatimPlanReminderSlots(groups, opts = {}) {
    const {
        now = Date.now(),
        daysAhead = HATIM_PLAN_REMIND_DAYS_AHEAD,
        limit = HATIM_PLAN_REMIND_LIMIT
    } = opts;
    const today = dateKeyOf(now);
    const slots = [];
    for (const group of Array.isArray(groups) ? groups : []) {
        if (!isPersonalHatim(group)) continue;
        const status = hatimPlanStatus(group, now);
        if (!status?.remindAt || status.complete || status.overdue) continue;
        const [hh, mm] = status.remindAt.split(':').map(Number);
        const days = Math.min(daysAhead, status.daysLeft);
        for (let i = 0; i < days; i += 1) {
            const day = addDaysToDateKey(today, i);
            const at = dateKeyAtTime(day, hh, mm);
            if (at <= now) continue;
            if (i === 0 && status.todayMet) continue;
            const daysLeft = status.daysLeft - i;
            slots.push({
                groupId: group.id,
                name: group.name,
                at: new Date(at),
                target: i === 0 ? status.todayTarget : dailyShare(status.remainingPages, daysLeft),
                done: i === 0 ? status.doneToday : 0,
                daysLeft
            });
        }
    }
    slots.sort((a, b) => a.at - b.at);
    return slots.slice(0, limit);
}
