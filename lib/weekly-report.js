/**
 * Haftalık rapor — saf hesaplama (platformdan bağımsız).
 */

export const WEEKLY_REPORT_HOUR = 9;
export const WEEKLY_REPORT_MINUTE = 0;
export const DEFAULT_DAILY_ZIKIR_GOAL = 100;

export function formatDateKeyFromDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function parseDateKey(ymd) {
    return new Date(`${ymd}T12:00:00`);
}

export function getDayKeysBetween(startKey, endKey) {
    const out = [];
    const cur = parseDateKey(startKey);
    const end = parseDateKey(endKey);
    while (cur <= end) {
        out.push(formatDateKeyFromDate(cur));
        cur.setDate(cur.getDate() + 1);
    }
    return out;
}

/** Bildirimin düştüğü Pazartesi için rapor haftası (önceki Pazartesi–Pazar). */
export function getReportWeekForMonday(mondayDate) {
    const end = new Date(mondayDate);
    end.setDate(end.getDate() - 1);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    const startKey = formatDateKeyFromDate(start);
    const endKey = formatDateKeyFromDate(end);
    return { startKey, endKey, dayKeys: getDayKeysBetween(startKey, endKey) };
}

/** Sonraki Pazartesi 09:00 (yerel). */
export function getNextMondayAt(hour = WEEKLY_REPORT_HOUR, minute = WEEKLY_REPORT_MINUTE) {
    const d = new Date();
    d.setSeconds(0, 0);
    d.setHours(hour, minute, 0, 0);
    const dow = d.getDay();
    let add = (1 - dow + 7) % 7;
    if (add === 0 && d.getTime() <= Date.now()) add = 7;
    d.setDate(d.getDate() + add);
    return d;
}

export function dayHistoryTotal(history, dayKey) {
    const block = history && history[dayKey];
    if (!block || typeof block !== 'object') return 0;
    return Object.values(block).reduce((sum, v) => sum + (Number(v) || 0), 0);
}

export function dayUsageSeconds(usageByDay, dayKey) {
    const v = usageByDay && usageByDay[dayKey];
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}

export function normalizeDailyZikirGoal(value) {
    const n = parseInt(String(value ?? ''), 10);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.min(n, 1_000_000);
}

export function countGoalDaysInRange(history, goal, dayKeys) {
    const g = normalizeDailyZikirGoal(goal);
    if (!g) return { hit: 0, total: dayKeys.length };
    let hit = 0;
    dayKeys.forEach((day) => {
        if (dayHistoryTotal(history, day) >= g) hit++;
    });
    return { hit, total: dayKeys.length };
}

export function computeGoalStreak(history, goal, todayKey) {
    const g = normalizeDailyZikirGoal(goal);
    if (!g) return 0;
    let streak = 0;
    const cur = parseDateKey(todayKey);
    for (let i = 0; i < 400; i++) {
        const key = formatDateKeyFromDate(cur);
        if (dayHistoryTotal(history, key) >= g) {
            streak++;
            cur.setDate(cur.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
}

/** Her kademe = 1 hafta (7 gün): turuncu → kırmızı → mavi → mor → usta */
export const FLAME_TIER_WEEK_DAYS = 7;

export const FLAME_TIER_IDS = ['none', 'orange', 'red', 'blue', 'purple', 'master'];

export function getFlameTier(streak) {
    const s = Math.max(0, Math.floor(Number(streak) || 0));
    if (s >= 29) return { tier: 'master', emoji: '🔥', min: 29 };
    if (s >= 22) return { tier: 'purple', emoji: '🔥', min: 22 };
    if (s >= 15) return { tier: 'blue', emoji: '🔥', min: 15 };
    if (s >= 8) return { tier: 'red', emoji: '🔥', min: 8 };
    if (s >= 1) return { tier: 'orange', emoji: '🔥', min: 1 };
    return { tier: 'none', emoji: '🔥', min: 0 };
}

export function computeWeekUsageStats(usageByDay, dayKeys) {
    const daysWithUsage = dayKeys.filter((d) => dayUsageSeconds(usageByDay, d) > 0);
    const totalSeconds = dayKeys.reduce((acc, d) => acc + dayUsageSeconds(usageByDay, d), 0);
    const divisor = dayKeys.length || 1;
    const avgSecondsPerDay = totalSeconds / divisor;
    let busiestDay = null;
    let busiestSeconds = 0;
    dayKeys.forEach((d) => {
        const sec = dayUsageSeconds(usageByDay, d);
        if (sec > busiestSeconds) {
            busiestSeconds = sec;
            busiestDay = d;
        }
    });
    return {
        totalSeconds,
        avgSecondsPerDay,
        avgMinutesPerDay: Math.round(avgSecondsPerDay / 60),
        daysWithUsage: daysWithUsage.length,
        busiestDay,
        busiestSeconds
    };
}

export function computeWeekZikirStats(history, dayKeys) {
    const totalZikir = dayKeys.reduce((acc, d) => acc + dayHistoryTotal(history, d), 0);
    let topZikirId = null;
    let topZikirCount = 0;
    const perZikir = Object.create(null);
    dayKeys.forEach((day) => {
        const block = history && history[day];
        if (!block) return;
        Object.keys(block).forEach((zid) => {
            perZikir[zid] = (perZikir[zid] || 0) + (Number(block[zid]) || 0);
        });
    });
    Object.keys(perZikir).forEach((zid) => {
        if (perZikir[zid] > topZikirCount) {
            topZikirCount = perZikir[zid];
            topZikirId = zid;
        }
    });
    return { totalZikir, topZikirId, topZikirCount };
}

export function percentChange(current, previous) {
    const c = Number(current) || 0;
    const p = Number(previous) || 0;
    if (p <= 0 && c <= 0) return { percent: 0, direction: 'same' };
    if (p <= 0) return { percent: 100, direction: 'up' };
    const raw = Math.round(((c - p) / p) * 100);
    if (raw > 0) return { percent: raw, direction: 'up' };
    if (raw < 0) return { percent: Math.abs(raw), direction: 'down' };
    return { percent: 0, direction: 'same' };
}

export function buildWeekReport(history, usageByDay, dayKeys, goal, todayKey) {
    const usage = computeWeekUsageStats(usageByDay, dayKeys);
    const zikir = computeWeekZikirStats(history, dayKeys);
    const goalDays = countGoalDaysInRange(history, goal, dayKeys);
    const streak = computeGoalStreak(history, goal, todayKey);
    const flame = getFlameTier(streak);
    return {
        dayKeys,
        usage,
        zikir,
        goalDays,
        streak,
        flame
    };
}

/** En son Pazar (bugün dahil). */
export function getLastSundayOnOrBefore(date = new Date()) {
    const d = new Date(date);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay());
    return d;
}

/** İçinde bulunulan hafta (Pazartesi–Pazar). */
export function getWeekRangeContainingDate(date = new Date()) {
    const d = new Date(date);
    d.setHours(12, 0, 0, 0);
    const dow = d.getDay();
    const mondayOffset = (dow + 6) % 7;
    const start = new Date(d);
    start.setDate(start.getDate() - mondayOffset);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const startKey = formatDateKeyFromDate(start);
    const endKey = formatDateKeyFromDate(end);
    return {
        startKey,
        endKey,
        dayKeys: getDayKeysBetween(startKey, endKey),
        isCurrent: true
    };
}

/** Son N hafta: en eskiden yeniye (son eleman = içinde bulunulan hafta). */
export function getSelectableWeekRanges(count = 4, referenceDate = new Date()) {
    const ranges = [];
    const current = getWeekRangeContainingDate(referenceDate);
    ranges.push({ ...current, isCurrent: true });
    let end = parseDateKey(current.startKey);
    end.setDate(end.getDate() - 1);
    for (let i = 1; i < count; i++) {
        const start = new Date(end);
        start.setDate(start.getDate() - 6);
        const startKey = formatDateKeyFromDate(start);
        const endKey = formatDateKeyFromDate(end);
        ranges.unshift({
            startKey,
            endKey,
            dayKeys: getDayKeysBetween(startKey, endKey),
            isCurrent: false
        });
        end = new Date(start);
        end.setDate(end.getDate() - 1);
    }
    return ranges;
}

export function computeFourWeekDailyAverage(usageByDay, weekRanges) {
    const keys = weekRanges.flatMap((w) => w.dayKeys);
    const total = keys.reduce((acc, d) => acc + dayUsageSeconds(usageByDay, d), 0);
    const divisor = keys.length || 1;
    return total / divisor;
}

export function getDailyUsageSeries(usageByDay, dayKeys) {
    return dayKeys.map((day) => ({
        day,
        seconds: dayUsageSeconds(usageByDay, day)
    }));
}

export function getLastCompleteWeekRanges(count, referenceDate = new Date()) {
    const ranges = [];
    let end = getLastSundayOnOrBefore(referenceDate);
    for (let i = 0; i < count; i++) {
        const start = new Date(end);
        start.setDate(start.getDate() - 6);
        const startKey = formatDateKeyFromDate(start);
        const endKey = formatDateKeyFromDate(end);
        ranges.unshift({ startKey, endKey, dayKeys: getDayKeysBetween(startKey, endKey) });
        end = new Date(end);
        end.setDate(end.getDate() - 7);
    }
    return ranges;
}

export function sanitizeUsageByDay(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const out = Object.create(null);
    Object.keys(src)
        .slice(0, 4000)
        .forEach((day) => {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
            const sec = Number(src[day]);
            if (!Number.isFinite(sec) || sec <= 0) return;
            out[day] = Math.min(Math.round(sec), 86400);
        });
    return out;
}

export function formatUsageDuration(seconds, { hourUnit = 'h', minuteUnit = 'dk' } = {}) {
    const sec = Math.max(0, Math.round(Number(seconds) || 0));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0 && m > 0) return `${h}${hourUnit} ${m}${minuteUnit}`;
    if (h > 0) return `${h}${hourUnit}`;
    return `${m}${minuteUnit}`;
}
