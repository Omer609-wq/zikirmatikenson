import { t } from '../i18n.js';

/** @type {(() => void) | null} */
let navigateToPurchase = null;

export function setPremiumPurchaseNavigator(fn) {
    navigateToPurchase = typeof fn === 'function' ? fn : null;
}

export function closePremiumUpsell() {
    document.getElementById('premiumUpsellOverlay')?.classList.remove('active');
}

export function showPremiumLibraryUpsell() {
    showPremiumLimitUpsell('library');
}

export function showPremiumFeatureUpsell() {
    showPremiumLimitUpsell('feature');
}

/**
 * @param {'folder' | 'zikir' | 'library' | 'feature'} kind
 */
export function showPremiumLimitUpsell(kind) {
    const overlay = document.getElementById('premiumUpsellOverlay');
    const titleEl = document.getElementById('premiumUpsellTitle');
    const bodyEl = document.getElementById('premiumUpsellBody');
    if (!overlay) return;

    if (titleEl) titleEl.textContent = t('premiumUpsell.title');
    if (bodyEl) {
        const messages = {
            folder: t('premiumUpsell.folderMessage'),
            zikir: t('premiumUpsell.zikirMessage'),
            library: t('premiumUpsell.libraryMessage'),
            feature: t('premiumUpsell.featureMessage')
        };
        bodyEl.textContent = messages[kind] || messages.zikir;
    }

    overlay.classList.add('active');
    requestAnimationFrame(() => {
        document.getElementById('premiumUpsellPurchaseBtn')?.focus();
    });
}

export function setupPremiumUpsell() {
    const overlay = document.getElementById('premiumUpsellOverlay');
    if (!overlay || overlay.dataset.bound === '1') return;
    overlay.dataset.bound = '1';

    const closeBtn = document.getElementById('premiumUpsellCloseBtn');
    const purchaseBtn = document.getElementById('premiumUpsellPurchaseBtn');

    const close = () => closePremiumUpsell();

    closeBtn?.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });
    purchaseBtn?.addEventListener('click', () => {
        close();
        if (navigateToPurchase) navigateToPurchase();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (!overlay.classList.contains('active')) return;
        e.preventDefault();
        close();
    });
}
