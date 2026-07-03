import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { isCapacitorNative, WEEKLY_REPORT_NOTIFICATION_ID } from '../native-reminders.js';

const ANDROID_NOTIFICATION_ICONS = {
    smallIcon: 'ic_stat_notification',
    largeIcon: 'ic_notification_large',
    iconColor: '#0f2918'
};

async function ensureWeeklyReportChannel() {
    if (!isCapacitorNative() || Capacitor.getPlatform() !== 'android') return;
    try {
        await LocalNotifications.createChannel({
            id: 'weekly-report',
            name: 'Haftalık rapor',
            description: 'Her Pazartesi haftalık özet',
            importance: 4,
            visibility: 1,
            vibration: true
        });
    } catch {
        // kanal zaten var
    }
}

async function cancelWeeklyReportNotification() {
    try {
        await LocalNotifications.cancel({ notifications: [{ id: WEEKLY_REPORT_NOTIFICATION_ID }] });
    } catch {
        // yok say
    }
}

/**
 * @param {{ enabled: boolean, at: Date, body: string, extra?: object }} opts
 */
export async function syncNativeWeeklyReport(opts) {
    if (!isCapacitorNative()) return { ok: true };

    await cancelWeeklyReportNotification();
    if (!opts || !opts.enabled || !opts.at || !opts.body) return { ok: true };

    let perm = await LocalNotifications.checkPermissions().catch(() => ({ display: 'prompt' }));
    if (perm.display !== 'granted') {
        try {
            perm = await LocalNotifications.requestPermissions();
        } catch (e) {
            console.error('LocalNotifications.requestPermissions weekly', e);
            return { ok: false, reason: 'denied' };
        }
    }
    if (perm.display !== 'granted') {
        return { ok: false, reason: perm.display === 'denied' ? 'denied' : 'default' };
    }

    if (Capacitor.getPlatform() === 'android') {
        await ensureWeeklyReportChannel();
    }

    const n = {
        id: WEEKLY_REPORT_NOTIFICATION_ID,
        title: opts.title || '',
        body: opts.body,
        schedule: { at: opts.at.toISOString() },
        extra: opts.extra || { openApp: true, view: 'premiumFeatureWeeklyView' }
    };

    if (Capacitor.getPlatform() === 'android') {
        n.schedule.allowWhileIdle = true;
        n.channelId = 'weekly-report';
        n.smallIcon = ANDROID_NOTIFICATION_ICONS.smallIcon;
        n.largeIcon = ANDROID_NOTIFICATION_ICONS.largeIcon;
        n.iconColor = ANDROID_NOTIFICATION_ICONS.iconColor;
        n.autoCancel = true;
    }

    try {
        await LocalNotifications.schedule({ notifications: [n] });
        if (Capacitor.getPlatform() === 'android') {
            try {
                const st = await LocalNotifications.checkExactNotificationSetting();
                if (st && st.exact_alarm !== 'granted') {
                    return { ok: true, warnExactAlarm: true };
                }
            } catch {
                // Android < 12
            }
        }
        return { ok: true };
    } catch (e) {
        console.error('LocalNotifications.schedule weekly', e);
        return { ok: false, reason: 'schedule' };
    }
}
