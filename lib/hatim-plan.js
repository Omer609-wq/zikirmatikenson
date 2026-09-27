/**
 * Kişisel hatim hedefi: "şu tarihe kadar bitireyim" — kalan gün ve günlük pay.
 *
 * Günlük pay sabit bir bölüm değil, her gün kalanın kalan güne bölümü: bir gün
 * okunamazsa pay sonraki günlere dağılır, fazla okunursa azalır. Pay günün
 * başındaki duruma göre hesaplanır; yoksa bugün bir cüz bitince bugünün payı
 * da küçülür ve "bugünkü payını okudun" hiç görünmezdi.
 *
 * Birim sayfa: "günde 10 sayfa" yarım cüzden daha anlaşılır. İlerleme cüz
 * bitince ya da okunan cüzde son okunan sayfa işaretlenince (setJuzReadTo)
 * değişir; günün okuması bu değişikliklerden toplanır (withReadingLog). Pay
 * yuvarlanır, yukarı değil: 30 günlük hedefte cüzler 20-21 sayfa, yukarı
 * yuvarlanan 21'lik pay 20 sayfalık cüzü "eksik" gösterirdi.
 */
import { addDaysToDateKey, dateKeyAtTime, dateKeyOf, daysBetweenDateKeys } from './date-key.js';
import { JUZ_CLAIMED, JUZ_DONE, isHatimComplete, isPersonalHatim, sanitizeHatimPlan } from './hatim-groups.js';
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

/**
 * Hatmin bütün sayfaları, cüzlerin sayfa sayılarının toplamı. Mushaf 604 sayfa;
 * toplam biraz fazla, çünkü birkaç cüz bir öncekinin bittiği sayfada başlıyor.
 */
export const HATIM_TOTAL_PAGES = Array.from({ length: 30 }, (_, i) => juzPageCount(i + 1)).reduce(
    (sum, n) => sum + n,
    0
);

/** Cüzde okunan sayfa: biten cüzün hepsi, okunan cüzde işaretlenen sayfaya kadarı. */
export function juzReadPages(juz) {
    if (juz?.state === JUZ_DONE) return juzPageCount(juz.n);
    const detail = juz?.state === JUZ_CLAIMED && juz.readTo ? getJuzDetail(juz.n) : null;
    return detail ? Math.max(0, juz.readTo - detail.startPage + 1) : 0;
}

export function hatimReadPages(group) {
    return (group?.juz || []).reduce((sum, juz) => sum + juzReadPages(juz), 0);
}

/**
 * Günün okuması: iki hâl arasındaki okunan sayfa farkını bugünün kaydına ekler.
 * Kişisel hatimde her değişiklik buradan geçer; hedefin "bugün okuduğun" sayısı
 * bu kayıttır.
 *
 * Kayıt yalnız bugünü tutar, gün değişince sıfırdan başlar. Eksi fark
 * (fazla girilen sayfanın düzeltilmesi, geri alınan cüz) bugünkünü azaltır
 * ama sıfırın altına indirmez: dünkü yanlışın düzeltilmesi bugünün okumasını
 * yemesin.
 */
export function withReadingLog(prev, next, now = Date.now()) {
    const delta = hatimReadPages(next) - hatimReadPages(prev);
    if (!delta) return next;
    const today = dateKeyOf(now);
    const base = next.readLog?.day === today ? Number(next.readLog.pages) || 0 : 0;
    const pages = Math.max(0, base + delta);
    const { readLog: _old, ...rest } = next;
    return pages > 0 ? { ...rest, readLog: { day: today, pages } } : rest;
}

/** Günlük pay: kalan sayfa kalan güne; en az bir sayfa. */
function dailyShare(pages, days) {
    return pages > 0 && days > 0 ? Math.max(1, Math.round(pages / days)) : 0;
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
 *   doneToday: number,      bugün okunan sayfa (withReadingLog kaydı)
 *   todayMet: boolean,
 *   finishedOnTime: boolean son cüz hedef gününde ya da önce bitti
 * } | null}
 */
export function hatimPlanStatus(group, now = Date.now()) {
    const plan = sanitizeHatimPlan(group?.plan);
    if (!plan) return null;

    const today = dateKeyOf(now);
    const readPages = hatimReadPages(group);
    const remainingPages = Math.max(0, HATIM_TOTAL_PAGES - readPages);
    const logged = group.readLog?.day === today ? Number(group.readLog.pages) || 0 : 0;
    const doneToday = Math.min(logged, readPages);
    // Günün başında açık olan: şimdi kalan + bugün okunan.
    const openAtDayStart = remainingPages + doneToday;
    const lastDoneAt = Math.max(0, ...(group.juz || []).map((j) => Number(j.completedAt) || 0));

    const complete = isHatimComplete(group);
    const daysLeft = Math.max(0, daysBetweenDateKeys(today, plan.end) + 1);
    const todayTarget = complete ? 0 : daysLeft > 0 ? dailyShare(openAtDayStart, daysLeft) : remainingPages;
    // Cüzü "bitirdim" diye işaretleyen sayfa saymaz, cüzler 20-23 sayfa:
    // 21 sayfalık payda 20 sayfalık cüzü bitiren "eksik" görünmesin. Bir cüz
    // geride olan yine görür — onun payı iki cüze yakın.
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
 * `percent`: günün payının okunan kısmı, aşağı yuvarlanır — bildirim payı
 * bitmemiş güne kurulduğu için %100 hiç yazmaz. `remaining`: paya kalan sayfa.
 *
 * @returns {Array<{ groupId: string, name: string, at: Date, target: number,
 *   done: number, percent: number, remaining: number, daysLeft: number }>}
 *   zamana göre sıralı, en fazla `limit`.
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
            const target = i === 0 ? status.todayTarget : dailyShare(status.remainingPages, daysLeft);
            const done = i === 0 ? Math.min(status.doneToday, target) : 0;
            slots.push({
                groupId: group.id,
                name: group.name,
                at: new Date(at),
                target,
                done,
                percent: target > 0 ? Math.floor((done / target) * 100) : 0,
                remaining: target - done,
                daysLeft
            });
        }
    }
    slots.sort((a, b) => a.at - b.at);
    return slots.slice(0, limit);
}
