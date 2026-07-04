import { clampNumber, coerceId, coerceString, isPlainObject, mintId } from './coerce.js';

export const MAX_SMART_REMINDERS = 12;
export const MAX_MESSAGES_PER_RULE = 8;
export const SMART_REMINDER_MESSAGE_MAX_LEN = 280;
export const MAX_TIMES_PER_DAY = 3;
export const SMART_SCHEDULE_DAYS_AHEAD = 28;
export const SMART_SCHEDULE_MAX_SLOTS = 450;
export const INTRO_SAMPLE_REMINDER_ID = 'sr_intro';
export const INTRO_SAMPLE_SURAH = 7;
export const INTRO_SAMPLE_AYAH = 205;

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** @typedef {'fixed' | 'count'} SmartReminderScheduleMode */

/**
 * @typedef {object} SmartReminderRule
 * @property {string} id
 * @property {boolean} enabled
 * @property {string} name
 * @property {string[]} messages
 * @property {SmartReminderScheduleMode} scheduleMode
 * @property {string} time
 * @property {number} timesPerDay
 * @property {string} windowStart
 * @property {string} windowEnd
 * @property {number[]} weekdays
 * @property {boolean} vibrate
 * @property {'none' | 'app' | 'zikir'} tapAction
 * @property {string|null} openZikirId
 */

function normalizeTime(str, fallback = '09:00') {
    const s = String(str || '').trim();
    return TIME_RE.test(s) ? s : fallback;
}

function parseTimeToMinutes(timeStr) {
    const [hh, mm] = normalizeTime(timeStr).split(':').map((x) => parseInt(x, 10));
    return hh * 60 + mm;
}

function minutesToTimeStr(totalMinutes) {
    const m = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
    const hh = Math.floor(m / 60);
    const mm = m % 60;
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/** Pencere süresi (dakika); gece yarısını geçen aralıklar desteklenir. */
function windowSpanMinutes(start, end) {
    if (end > start) return end - start;
    return (24 * 60 - start) + end;
}

/**
 * @param {unknown} raw
 * @returns {SmartReminderRule[]}
 */
export function sanitizeSmartReminders(raw) {
    const arr = Array.isArray(raw) ? raw : [];
    const out = [];
    const seen = new Set();

    arr.filter(isPlainObject).slice(0, MAX_SMART_REMINDERS).forEach((item) => {
        let id = coerceId(item.id, 'sr');
        if (seen.has(id)) id = mintId('sr');
        seen.add(id);

        const messages = (Array.isArray(item.messages) ? item.messages : [])
            .map((m) => coerceString(m, SMART_REMINDER_MESSAGE_MAX_LEN))
            .filter(Boolean)
            .slice(0, MAX_MESSAGES_PER_RULE);

        const scheduleMode = item.scheduleMode === 'count' ? 'count' : 'fixed';
        let weekdays = (Array.isArray(item.weekdays) ? item.weekdays : [0, 1, 2, 3, 4, 5, 6])
            .map((d) => clampNumber(d, { min: 0, max: 6, fallback: -1 }))
            .filter((d) => d >= 0);
        if (!weekdays.length) weekdays = [0, 1, 2, 3, 4, 5, 6];
        weekdays = [...new Set(weekdays)].sort((a, b) => a - b);

        const openZikirIdRaw = item.openZikirId ? coerceId(item.openZikirId, 'z') : null;
        let tapAction = 'app';
        if (item.tapAction === 'none' || item.tapAction === 'app' || item.tapAction === 'zikir') {
            tapAction = item.tapAction;
        } else if (openZikirIdRaw) {
            tapAction = 'zikir';
        }
        const openZikirId = tapAction === 'zikir' && openZikirIdRaw ? openZikirIdRaw : null;
        if (tapAction === 'zikir' && !openZikirId) tapAction = 'app';

        out.push({
            id,
            enabled: typeof item.enabled === 'boolean' ? item.enabled : true,
            name: coerceString(item.name || '', 60),
            messages,
            scheduleMode,
            time: normalizeTime(item.time, '09:00'),
            timesPerDay: clampNumber(item.timesPerDay, { min: 1, max: MAX_TIMES_PER_DAY, fallback: 1 }),
            windowStart: normalizeTime(item.windowStart, '08:00'),
            windowEnd: normalizeTime(item.windowEnd, '22:00'),
            weekdays,
            vibrate: typeof item.vibrate === 'boolean' ? item.vibrate : true,
            tapAction,
            openZikirId
        });
    });

    return out;
}

/** @param {SmartReminderRule} rule */
export function computeDailyTimeStrings(rule) {
    if (rule.scheduleMode === 'fixed') {
        return [normalizeTime(rule.time, '09:00')];
    }
    const n = clampNumber(rule.timesPerDay, { min: 1, max: MAX_TIMES_PER_DAY, fallback: 1 });
    const start = parseTimeToMinutes(rule.windowStart);
    const span = windowSpanMinutes(start, parseTimeToMinutes(rule.windowEnd));
    if (span <= 0) return [minutesToTimeStr(start)];
    if (n === 1) return [minutesToTimeStr(start)];
    const out = [];
    for (let i = 0; i < n; i++) {
        const m = start + Math.round((span * i) / (n - 1));
        out.push(minutesToTimeStr(m));
    }
    return out;
}

function pickRandomMessage(messages) {
    if (!messages.length) return '';
    return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * @param {SmartReminderRule[]} rules
 * @returns {{ at: Date, body: string, vibrate: boolean, extra: object }[]}
 */
export function buildSmartReminderSlots(rules, {
    daysAhead = SMART_SCHEDULE_DAYS_AHEAD,
    maxSlots = SMART_SCHEDULE_MAX_SLOTS
} = {}) {
    const slots = [];
    const now = Date.now();
    const base = new Date();
    base.setSeconds(0, 0);
    base.setMilliseconds(0);

    for (const rule of rules) {
        if (!rule.enabled) continue;
        const messages = rule.messages.filter(Boolean);
        if (!messages.length) continue;
        const weekdays = rule.weekdays.length ? rule.weekdays : [0, 1, 2, 3, 4, 5, 6];
        const timeStrings = computeDailyTimeStrings(rule);

        for (let d = 0; d < daysAhead; d++) {
            const day = new Date(base);
            day.setDate(base.getDate() + d);
            if (!weekdays.includes(day.getDay())) continue;

            for (const timeStr of timeStrings) {
                const [hh, mm] = timeStr.split(':').map((x) => parseInt(x, 10));
                const at = new Date(day);
                at.setHours(hh, mm, 0, 0);
                if (at.getTime() <= now) continue;

                const tapAction = rule.tapAction || (rule.openZikirId ? 'zikir' : 'app');
                const extra = {
                    openApp: tapAction !== 'none',
                    smartReminderId: rule.id,
                    view: tapAction === 'zikir' && rule.openZikirId ? 'counterView' : 'homeView'
                };
                if (tapAction === 'zikir' && rule.openZikirId) extra.zikirId = rule.openZikirId;

                slots.push({
                    at,
                    body: pickRandomMessage(messages),
                    vibrate: !!rule.vibrate,
                    extra
                });
            }
        }
    }

    slots.sort((a, b) => a.at.getTime() - b.at.getTime());
    return slots.slice(0, maxSlots);
}

/** @returns {SmartReminderRule} */
export function createDefaultSmartReminder() {
    return {
        id: mintId('sr'),
        enabled: true,
        name: '',
        messages: [''],
        scheduleMode: 'fixed',
        time: '09:00',
        timesPerDay: 1,
        windowStart: '08:00',
        windowEnd: '22:00',
        weekdays: [0, 1, 2, 3, 4, 5, 6],
        vibrate: true,
        tapAction: 'app',
        openZikirId: null
    };
}
