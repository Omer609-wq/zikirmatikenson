import { Capacitor } from '@capacitor/core';

/**
 * Splash için ek yapay bekleme.
 *
 * 0 = bekleme yok. Uygulama hazır olur olmaz kapanır (init ~18 ms).
 * "Flash" riski yok: süreç başlatma + WebView kurulumu zaten birkaç yüz ms
 * sürüyor, yani logo doğal olarak yeterince görünüyor. Buraya süre eklemek
 * kullanıcıyı hazır olan bir ekranın önünde boşuna bekletir.
 */
export const SPLASH_MIN_VISIBLE_MS = 0;

let hideStarted = false;

function isNative() {
    try {
        return Capacitor.isNativePlatform();
    } catch {
        return false;
    }
}

/**
 * Native splash’i kapatır.
 *
 * ÖNEMLİ: Android 12 Splash API OnPreDraw ile frame’i bloklar; bu yüzden
 * hide() öncesi requestAnimationFrame BEKLENMEMELİ — rAF hiç gelmez, splash
 * sonsuza kilitlenir. Sadece setTimeout ile minimum süre tutulur.
 *
 * @param {number} shownAtMs performance.now() — ölçüm başlangıcı
 */
export async function hideNativeSplashWhenReady(shownAtMs = performance.now()) {
    if (!isNative() || hideStarted) return;
    hideStarted = true;

    const elapsed = performance.now() - shownAtMs;
    const waitMs = Math.max(0, SPLASH_MIN_VISIBLE_MS - elapsed);
    if (waitMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitMs));
    }

    try {
        const { SplashScreen } = await import('@capacitor/splash-screen');
        // fadeOutDuration Android 12 ilk splash’te etkisiz; launchFadeOutDuration config’de
        await SplashScreen.hide();
    } catch (err) {
        console.warn('SplashScreen.hide başarısız:', err);
        hideStarted = false;
    }
}
