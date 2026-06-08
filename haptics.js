import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * Dokunma: kısa motor darbesi (Impact birçok Android'de hissedilmez).
 * Tur: art arda güçlü darbeler (Notification çoğu cihazda çok zayıf).
 */
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isAndroidNative() {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

function fallbackNavigatorVibrate(isTarget) {
    if (!navigator.vibrate) return;
    if (isTarget) {
        navigator.vibrate([300, 85, 280, 85, 380]);
    } else {
        navigator.vibrate(55);
    }
}

async function vibrateMs(duration) {
    await Haptics.vibrate({ duration });
}

/** Dokunma — Android'de doğrudan vibrator; iOS'ta kısa vibrate + hafif impact */
async function runNativeTapVibration() {
    if (isAndroidNative()) {
        await vibrateMs(55);
        return;
    }
    try {
        await vibrateMs(42);
    } catch {
        await Haptics.impact({ style: ImpactStyle.Light });
    }
}

/** Tur tamamlandı — üç güçlü darbe + son vuruş */
async function runNativeRoundVibration() {
    if (isAndroidNative()) {
        await vibrateMs(320);
        await delay(85);
        await vibrateMs(300);
        await delay(85);
        await vibrateMs(400);
        return;
    }
    try {
        await vibrateMs(380);
        await delay(90);
        await Haptics.impact({ style: ImpactStyle.Heavy });
        await delay(70);
        await vibrateMs(280);
    } catch {
        await Haptics.impact({ style: ImpactStyle.Heavy });
        await delay(100);
        await Haptics.impact({ style: ImpactStyle.Heavy });
    }
}

async function runNativeCounter(isTarget, { vibrationTap, vibrationTarget }) {
    try {
        if (isTarget) {
            if (!vibrationTarget) return;
            await runNativeRoundVibration();
        } else {
            if (!vibrationTap) return;
            await runNativeTapVibration();
        }
    } catch (e) {
        console.warn('Zikirmatik: Haptics', e);
        fallbackNavigatorVibrate(isTarget);
    }
}

export function runCounterVibration(isTarget, { vibrationTap, vibrationTarget }) {
    if (Capacitor.isNativePlatform()) {
        void runNativeCounter(isTarget, { vibrationTap, vibrationTarget });
        return;
    }
    if (!navigator.vibrate) return;
    if (isTarget) {
        if (!vibrationTarget) return;
        navigator.vibrate([300, 85, 280, 85, 380]);
    } else {
        if (!vibrationTap) return;
        navigator.vibrate(55);
    }
}

/** Sürükleyerek sıralama başladığında kısa geri bildirim */
export function runDragReorderNudge() {
    if (Capacitor.isNativePlatform()) {
        if (isAndroidNative()) {
            void vibrateMs(28).catch((e) => console.warn('Haptics', e));
            return;
        }
        void Haptics.impact({ style: ImpactStyle.Light }).catch((e) => console.warn('Haptics', e));
        return;
    }
    if (navigator.vibrate) navigator.vibrate(20);
}
