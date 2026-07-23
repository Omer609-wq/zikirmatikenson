import { isCapacitorNative } from '../native-reminders.js';

/** Splash en az bu kadar görünsün; daha kısa olursa “flash” hissi artar. */
export const SPLASH_MIN_VISIBLE_MS = 200;

/**
 * Native splash’i ilk anlamlı boyamadan sonra kapatır.
 * launchAutoHide:false iken JS hide() çağırana kadar logo kalır.
 *
 * @param {number} shownAtMs performance.now() — splash’in tutulmaya başladığı an
 */
export async function hideNativeSplashWhenReady(shownAtMs = performance.now()) {
    if (!isCapacitorNative()) return;
    const elapsed = performance.now() - shownAtMs;
    const waitMs = Math.max(0, SPLASH_MIN_VISIBLE_MS - elapsed);
    if (waitMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
    // İki frame: layout + paint tamamlanana kadar bekle
    await new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
    try {
        const { SplashScreen } = await import('@capacitor/splash-screen');
        await SplashScreen.hide({ fadeOutDuration: 180 });
    } catch (err) {
        console.warn('SplashScreen.hide başarısız:', err);
    }
}
