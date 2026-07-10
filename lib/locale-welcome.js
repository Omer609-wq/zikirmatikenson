import { normalizeAppLocale, t } from '../i18n.js';

/** Destek / çeviri geri bildirimi (Play Store iletişim adresi ile aynı tutulmalı). */
export const LOCALE_WELCOME_EMAIL = 'zikirmatik.help@gmail.com';

const STORAGE_KEY = 'zikirmatik_locale_welcome_v1';
const TARGET_LOCALES = new Set(['id', 'ms', 'bn', 'ur']);

function readShownMap() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (_) {
        return {};
    }
}

function markLocaleShown(locale) {
    const map = readShownMap();
    map[locale] = true;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch (_) {
        /* quota / private mode */
    }
}

export function shouldShowLocaleWelcome(locale) {
    const code = normalizeAppLocale(locale);
    if (!TARGET_LOCALES.has(code)) return false;
    return !readShownMap()[code];
}

function dismissLocaleWelcome(locale) {
    if (locale) markLocaleShown(locale);
    document.getElementById('localeWelcomeOverlay')?.classList.remove('active');
}

/** closeAllOverlays vb. için: açıksa kapat ve dil bayrağını işaretle. */
export function closeLocaleWelcomeIfOpen() {
    const overlay = document.getElementById('localeWelcomeOverlay');
    if (!overlay?.classList.contains('active')) return;
    dismissLocaleWelcome(overlay.dataset.welcomeLocale || '');
}

export function setupLocaleWelcome() {
    const overlay = document.getElementById('localeWelcomeOverlay');
    const okBtn = document.getElementById('localeWelcomeOkBtn');
    if (!overlay || !okBtn || overlay.dataset.bound === '1') return;
    overlay.dataset.bound = '1';
    okBtn.addEventListener('click', () => {
        dismissLocaleWelcome(overlay.dataset.welcomeLocale || '');
    });
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            dismissLocaleWelcome(overlay.dataset.welcomeLocale || '');
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (!overlay.classList.contains('active')) return;
        e.preventDefault();
        dismissLocaleWelcome(overlay.dataset.welcomeLocale || '');
    });
}

/**
 * id / ms / bn / ur için ilk kez (dil başına bir kez) samimi çeviri notu gösterir.
 * @returns {boolean} gösterildiyse true
 */
export function maybeShowLocaleWelcome(locale) {
    const code = normalizeAppLocale(locale);
    if (!shouldShowLocaleWelcome(code)) return false;

    const overlay = document.getElementById('localeWelcomeOverlay');
    const titleEl = document.getElementById('localeWelcomeTitle');
    const bodyEl = document.getElementById('localeWelcomeBody');
    const emailEl = document.getElementById('localeWelcomeEmail');
    const okBtn = document.getElementById('localeWelcomeOkBtn');
    if (!overlay || !titleEl || !bodyEl || !okBtn) return false;

    titleEl.textContent = t('localeWelcome.title');
    bodyEl.textContent = t('localeWelcome.body');
    okBtn.textContent = t('localeWelcome.ok');
    if (emailEl) {
        emailEl.textContent = LOCALE_WELCOME_EMAIL;
        emailEl.href = `mailto:${LOCALE_WELCOME_EMAIL}?subject=${encodeURIComponent('Zikirmatik — translation feedback')}`;
    }

    overlay.dataset.welcomeLocale = code;
    overlay.classList.add('active');
    requestAnimationFrame(() => okBtn.focus());
    return true;
}
