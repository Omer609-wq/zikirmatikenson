import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { REMINDER_FIXED_BODY } from './quotes.js';

/** İlk slot; ardışık id’ler kullanılır (günlük tekrar için çoklu tek-sefer alarm). */
const REMINDER_BASE_ID = 9001;
/** Kaç gün önceden planlansın (uygulama açılmadan ardışık günler). */
const REMINDER_DAYS_AHEAD = 28;
/** Eski tek-id veya önceki yığın için iptal aralığı. */
const REMINDER_CANCEL_COUNT = 40;

export function isCapacitorNative() {
    try {
        return Capacitor.isNativePlatform();
    } catch {
        return false;
    }
}

/**
 * Android WebView'da sistem gezinme çubuğu ile alt UI çakışmasını azaltmak için
 * ek alt boşluk (px). iOS / tarayıcıda no-op.
 */
export function applyNativeBottomInsetVar() {
    const root = document.documentElement;
    const clear = () => root.style.removeProperty('--app-system-nav-inset');

    if (!isCapacitorNative()) {
        clear();
        root.classList.remove('cap-native-android');
        return;
    }
    if (Capacitor.getPlatform() !== 'android') {
        clear();
        root.classList.remove('cap-native-android');
        return;
    }

    root.classList.add('cap-native-android');

    const read = () => {
        const vv = window.visualViewport;
        if (!vv) {
            clear();
            return;
        }
        const gap = window.innerHeight - vv.offsetTop - vv.height;
        const px = Math.max(0, Math.round(gap));
        if (px > 0) {
            root.style.setProperty('--app-system-nav-inset', `${px}px`);
        } else {
            clear();
        }
    };

    read();
    const vv = window.visualViewport;
    if (vv) {
        vv.addEventListener('resize', read);
        vv.addEventListener('scroll', read);
    }
    window.addEventListener('orientationchange', () => {
        setTimeout(read, 200);
    });
}

/**
 * Yerel saatte her gün hh:mm için bir sonraki ve ardından gelen `count` tarih (Date).
 */
function buildUpcomingLocalDates(hh, mm, count) {
    const out = [];
    const cur = new Date();
    cur.setSeconds(0, 0);
    cur.setHours(hh, mm, 0, 0);
    if (cur.getTime() <= Date.now()) {
        cur.setDate(cur.getDate() + 1);
    }
    for (let i = 0; i < count; i++) {
        out.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
    }
    return out;
}

async function cancelReminderSlots() {
    const notifications = [];
    for (let i = 0; i < REMINDER_CANCEL_COUNT; i++) {
        notifications.push({ id: REMINDER_BASE_ID + i });
    }
    try {
        await LocalNotifications.cancel({ notifications });
    } catch {
        /* yok say */
    }
}

/**
 * @returns {Promise<{ ok: boolean, reason?: string, warnExactAlarm?: boolean }>}
 */
export async function syncNativeDailyReminder(enabled, timeStr) {
    if (!isCapacitorNative()) return { ok: true };

    await cancelReminderSlots();

    if (!enabled) return { ok: true };

    let perm = await LocalNotifications.checkPermissions().catch(() => ({ display: 'prompt' }));
    if (perm.display !== 'granted') {
        try {
            perm = await LocalNotifications.requestPermissions();
        } catch (e) {
            console.error('LocalNotifications.requestPermissions', e);
            return { ok: false, reason: 'denied' };
        }
    }
    if (perm.display !== 'granted') {
        return { ok: false, reason: perm.display === 'denied' ? 'denied' : 'default' };
    }

    const [hh, mm] = String(timeStr || '21:00').split(':').map((x) => parseInt(x, 10));
    if (Number.isNaN(hh) || Number.isNaN(mm)) return { ok: false, reason: 'badtime' };

    if (Capacitor.getPlatform() === 'android') {
        try {
            await LocalNotifications.createChannel({
                id: 'reminders',
                name: 'Hatırlatıcılar',
                description: 'Günlük zikir hatırlatıcısı',
                importance: 4,
                visibility: 1
            });
        } catch {
            /* kanal zaten var olabilir */
        }
    }

    /*
     * Android: `every` + `on` birlikte kullanılırsa yalnızca `every` dalı çalışıyor; saat yok sayılıyor.
     * Güvenilir yol: her gün için ayrı tek-sefer `at` (UTC ISO) + uygulama görünür olunca yenileme.
     */
    const dates = buildUpcomingLocalDates(hh, mm, REMINDER_DAYS_AHEAD);
    const notifications = dates.map((at, i) => {
        const n = {
            id: REMINDER_BASE_ID + i,
            /* Sabit Rad 28 — hatırlatıcıda tanınır; ana sayfa şeridi yine dönen sözler */
            title: '',
            body: REMINDER_FIXED_BODY,
            schedule: {
                at: at.toISOString()
            }
        };
        if (Capacitor.getPlatform() === 'android') {
            n.schedule.allowWhileIdle = true;
            n.channelId = 'reminders';
        }
        return n;
    });

    try {
        await LocalNotifications.schedule({ notifications });
        if (Capacitor.getPlatform() === 'android') {
            try {
                const st = await LocalNotifications.checkExactNotificationSetting();
                if (st && st.exact_alarm !== 'granted') {
                    return { ok: true, warnExactAlarm: true };
                }
            } catch {
                /* Android < 12 veya API yok */
            }
        }
        return { ok: true };
    } catch (e) {
        console.error('LocalNotifications.schedule', e);
        return { ok: false, reason: 'schedule' };
    }
}
