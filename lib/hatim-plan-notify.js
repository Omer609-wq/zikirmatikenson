/**
 * Kişisel hatim hedefi bildirimleri — cihaz tarafı. Hangi gün ne yazacağı
 * lib/hatim-plan.js'te (hatimPlanReminderSlots); burası yalnız kurar.
 */
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { createAsyncSerial } from './async-serial.js';
import {
    ANDROID_NOTIFICATION_ICONS,
    HATIM_PLAN_NOTIFICATION_BASE_ID,
    HATIM_PLAN_NOTIFICATION_COUNT,
    isCapacitorNative
} from '../native-reminders.js';

// Senkronlar sıraya dizilir: her cüz işaretlemesi bir senkron başlatıyor (bkz. async-serial.js).
const enqueue = createAsyncSerial();

async function cancelHatimPlanSlots() {
    const notifications = [];
    for (let i = 0; i < HATIM_PLAN_NOTIFICATION_COUNT; i++) {
        notifications.push({ id: HATIM_PLAN_NOTIFICATION_BASE_ID + i });
    }
    try {
        await LocalNotifications.cancel({ notifications });
    } catch {
        /* yok say */
    }
}

async function ensureHatimPlanChannel() {
    if (Capacitor.getPlatform() !== 'android') return;
    try {
        await LocalNotifications.createChannel({
            id: 'hatim-plan',
            name: 'Hatim hedefi',
            description: 'Kişisel hatim hedefinin günlük payı',
            importance: 4,
            visibility: 1,
            vibration: true
        });
    } catch {
        /* kanal zaten var */
    }
}

/**
 * Eski bildirimleri siler, verilenleri kurar.
 *
 * İzin yalnız `askPermission` ile sorulur — kullanıcı hatırlatmayı açtığında.
 * Uygulama her açıldığında yapılan yenileme sormaz: izni reddeden biri her
 * açılışta aynı pencereyi görmesin.
 *
 * @param {{ at: Date, title: string, body: string, extra: object }[]} slots
 * @param {{ askPermission?: boolean }} [opts]
 * @returns {Promise<{ ok: boolean, reason?: 'denied' | 'default' | 'schedule' }>}
 */
export function syncNativeHatimPlanReminders(slots, opts = {}) {
    const snapshot = Array.isArray(slots) ? slots.slice(0, HATIM_PLAN_NOTIFICATION_COUNT) : [];
    return enqueue(() => syncNow(snapshot, opts));
}

async function syncNow(slots, { askPermission = false }) {
    if (!isCapacitorNative()) return { ok: true };

    await cancelHatimPlanSlots();
    if (!slots.length) return { ok: true };

    let perm = await LocalNotifications.checkPermissions().catch(() => ({ display: 'prompt' }));
    if (perm.display !== 'granted' && askPermission) {
        try {
            perm = await LocalNotifications.requestPermissions();
        } catch (e) {
            console.error('LocalNotifications.requestPermissions hatim', e);
            return { ok: false, reason: 'denied' };
        }
    }
    if (perm.display !== 'granted') {
        return { ok: false, reason: perm.display === 'denied' ? 'denied' : 'default' };
    }

    await ensureHatimPlanChannel();

    const notifications = slots.map((slot, i) => {
        const n = {
            id: HATIM_PLAN_NOTIFICATION_BASE_ID + i,
            title: slot.title || '',
            body: slot.body || '',
            // Date olmalı; ISO string iOS'ta bildirimi hemen gösterir (bkz. native-reminders.js).
            schedule: { at: slot.at },
            extra: slot.extra || { openApp: true, view: 'homeView' }
        };
        if (Capacitor.getPlatform() === 'android') {
            n.schedule.allowWhileIdle = true;
            n.channelId = 'hatim-plan';
            n.smallIcon = ANDROID_NOTIFICATION_ICONS.smallIcon;
            n.largeIcon = ANDROID_NOTIFICATION_ICONS.largeIcon;
            n.iconColor = ANDROID_NOTIFICATION_ICONS.iconColor;
            n.autoCancel = true;
        }
        return n;
    });

    try {
        await LocalNotifications.schedule({ notifications });
        return { ok: true };
    } catch (e) {
        console.error('LocalNotifications.schedule hatim', e);
        return { ok: false, reason: 'schedule' };
    }
}
