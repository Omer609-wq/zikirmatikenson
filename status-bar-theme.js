import { Capacitor } from '@capacitor/core';
import { SystemChrome } from './system-chrome.js';

/**
 * Üst durum çubuğu (saat, şarj, bildirim):
 * - Açık tema → açık zemin + koyu ikonlar (Style.Light)
 * - Koyu temalar → koyu zemin + açık ikonlar (Style.Dark)
 */
const STATUS_BAR_BY_THEME = {
    light: { style: 'Light', bg: '#faf8f5' },
    navy: { style: 'Dark', bg: '#0a0e16' },
    black: { style: 'Dark', bg: '#000000' }
};

function themeKey(theme) {
    return theme === 'light' ? 'light' : theme === 'black' ? 'black' : 'navy';
}

async function applyNativeSystemBarsTheme(theme) {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return;
    try {
        await SystemChrome.applyNavigationBarTheme({ theme: themeKey(theme) });
    } catch (e) {
        console.warn('system-bars theme', e);
    }
}

export async function applyNativeStatusBarTheme(theme) {
    if (!Capacitor.isNativePlatform()) return;

    const key = themeKey(theme);
    const cfg = STATUS_BAR_BY_THEME[key];

    try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        // Önce stil: açık zeminde koyu ikon şart
        await StatusBar.setStyle({
            style: key === 'light' ? Style.Light : Style.Dark
        });
        if (Capacitor.getPlatform() === 'android') {
            // Kenardan kenara modda arka plan bazen yok sayılır; yine de dene
            await StatusBar.setBackgroundColor({ color: cfg.bg });
            try {
                await StatusBar.setOverlaysWebView({ overlay: false });
            } catch {
                /* eski sürüm / iOS */
            }
        }
    } catch (e) {
        console.warn('status-bar theme', e);
    }

    // Android: native WindowInsetsController ile ikon kontrastını kesinleştir
    await applyNativeSystemBarsTheme(theme);
}
