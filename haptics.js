import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Tarayıcıda navigator.vibrate; Capacitor Android/iOS’ta yerel Haptics API.
 * WebView’da vibrate genelde yok → ayarlardaki titreşim burada çalışır.
 */
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function runCounterVibration(isTarget, { vibrationTap, vibrationTarget }) {
    if (Capacitor.isNativePlatform()) {
        void runNativeCounter(isTarget, { vibrationTap, vibrationTarget });
        return;
    }
    if (!navigator.vibrate) return;
    if (isTarget) {
        if (!vibrationTarget) return;
        navigator.vibrate([220, 90, 220, 90, 280]);
    } else {
        if (!vibrationTap) return;
        navigator.vibrate(40);
    }
}

async function runNativeCounter(isTarget, { vibrationTap, vibrationTarget }) {
    try {
        if (isTarget) {
            if (!vibrationTarget) return;
            await Haptics.notification({ type: NotificationType.Success });
            await delay(150);
            await Haptics.impact({ style: ImpactStyle.Heavy });
            await delay(100);
            await Haptics.impact({ style: ImpactStyle.Medium });
        } else {
            if (!vibrationTap) return;
            await Haptics.impact({ style: ImpactStyle.Medium });
        }
    } catch (e) {
        console.warn('Zikirmatik: Haptics', e);
    }
}

/** Sürükleyerek sıralama başladığında kısa geri bildirim */
export function runDragReorderNudge() {
    if (Capacitor.isNativePlatform()) {
        void Haptics.impact({ style: ImpactStyle.Light }).catch((e) => console.warn('Haptics', e));
        return;
    }
    if (navigator.vibrate) navigator.vibrate(15);
}
