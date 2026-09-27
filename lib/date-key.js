/**
 * Takvim günü anahtarı: 'YYYY-MM-DD', yerel saate göre.
 *
 * Gün farkı ve gün ekleme UTC üzerinden yapılır: yerel saatle 24 saat eklemek
 * yaz saati geçişinde bir günü atlar ya da aynı günü iki kez sayar.
 */
import { formatDateKeyFromDate } from './weekly-report.js';

const DAY_MS = 86400000;
const DATE_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function utcDayOf(key) {
    const m = typeof key === 'string' ? DATE_KEY_RE.exec(key) : null;
    return m ? Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : NaN;
}

/** Anın yerel takvim günü. */
export function dateKeyOf(ms) {
    return formatDateKeyFromDate(new Date(ms));
}

/** Gerçek bir takvim günü mü — "2026-02-30" değil. */
export function isValidDateKey(key) {
    const t = utcDayOf(key);
    return !Number.isNaN(t) && new Date(t).toISOString().slice(0, 10) === key;
}

/** `a` gününden `b` gününe kaç gün var (b, a'dan önceyse eksi). */
export function daysBetweenDateKeys(a, b) {
    return Math.round((utcDayOf(b) - utcDayOf(a)) / DAY_MS);
}

export function addDaysToDateKey(key, days) {
    return new Date(utcDayOf(key) + days * DAY_MS).toISOString().slice(0, 10);
}

/** O günün yerel saatle hh:mm anı (ms). */
export function dateKeyAtTime(key, hh, mm) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d, hh, mm, 0, 0).getTime();
}
