import { Capacitor } from '@capacitor/core';

/** Üst durum çubuğu (saat, şarj): açık zeminde koyu ikon, koyu zeminde açık ikon. */
const STATUS_BAR_BY_THEME = {
    light: { style: 'Light', bg: '#faf8f5' },
    navy: { style: 'Dark', bg: '#0a0e16' },
    black: { style: 'Dark', bg: '#000000' }
};

export async function applyNativeStatusBarTheme(theme) {
    if (!Capacitor.isNativePlatform()) return;

    const key = theme === 'light' ? 'light' : theme === 'black' ? 'black' : 'navy';
    const cfg = STATUS_BAR_BY_THEME[key];

    try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        await StatusBar.setStyle({
            style: cfg.style === 'Light' ? Style.Light : Style.Dark
        });
        if (Capacitor.getPlatform() === 'android') {
            await StatusBar.setBackgroundColor({ color: cfg.bg });
        }
    } catch (e) {
        console.warn('status-bar theme', e);
    }
}
