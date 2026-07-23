/** Yerel önizleme: VITE_PREMIUM_PREVIEW=1 + localStorage zikirmatik_premium_preview */

export const PREMIUM_PREVIEW_STORAGE_KEY = 'zikirmatik_premium_preview';

/** @typedef {'teaser'|'locked'|'active'} PremiumPreviewMode */

export const PREMIUM_PREVIEW_MODES = /** @type {const} */ (['teaser', 'locked', 'active']);

/** @type {PremiumPreviewMode|undefined} */
const PREMIUM_PREVIEW_BUILD_DEFAULT = PREMIUM_PREVIEW_MODES.includes(
    /** @type {PremiumPreviewMode} */ (import.meta.env?.VITE_PREMIUM_PREVIEW_MODE)
)
    ? /** @type {PremiumPreviewMode} */ (import.meta.env?.VITE_PREMIUM_PREVIEW_MODE)
    : undefined;

/**
 * @param {boolean} previewBuildEnabled
 * @returns {PremiumPreviewMode|null}
 */
export function getPremiumPreviewMode(previewBuildEnabled) {
    if (!previewBuildEnabled) return null;
    const stored = localStorage.getItem(PREMIUM_PREVIEW_STORAGE_KEY);
    const raw = stored || PREMIUM_PREVIEW_BUILD_DEFAULT || 'teaser';
    // Eski 'purchase' modu: hub + Abone ol (satın alma ayrı ekran, otomatik açılmaz).
    const normalized = raw === 'purchase' ? 'locked' : raw;
    return PREMIUM_PREVIEW_MODES.includes(/** @type {PremiumPreviewMode} */ (normalized))
        ? normalized
        : 'teaser';
}

/**
 * @param {boolean} previewBuildEnabled
 * @returns {{ live: boolean, uiVisible: boolean, mode: PremiumPreviewMode|null }}
 */
export function resolvePremiumPreviewFlags(previewBuildEnabled) {
    const mode = getPremiumPreviewMode(previewBuildEnabled);
    if (!mode) {
        return { live: false, uiVisible: false, mode: null };
    }
    if (mode === 'teaser') {
        return { live: false, uiVisible: true, mode };
    }
    if (mode === 'locked') {
        return { live: true, uiVisible: true, mode };
    }
    return { live: true, uiVisible: true, mode: 'active' };
}

/**
 * Önizleme modunda ekranda kullanılacak entitlement'ı döndürür. Saklanan gerçek
 * aboneliği değiştirmez; önizleme yalnızca bu oturumdaki erişim kontrollerine uygulanır.
 * @param {PremiumPreviewMode|null} mode
 * @param {boolean} persistedPremium
 * @returns {boolean}
 */
export function resolvePremiumPreviewEntitlement(mode, persistedPremium) {
    if (!mode) return !!persistedPremium;
    return mode === 'active';
}

/**
 * @param {boolean} previewBuildEnabled
 */
export function installPremiumPreviewConsoleHelper(previewBuildEnabled) {
    if (!previewBuildEnabled || typeof window === 'undefined') return;
    /** @param {PremiumPreviewMode} mode */
    window.setPremiumPreview = (mode) => {
        if (!PREMIUM_PREVIEW_MODES.includes(mode)) {
            console.warn('[premium-preview] Geçerli modlar:', PREMIUM_PREVIEW_MODES.join(', '));
            return;
        }
        localStorage.setItem(PREMIUM_PREVIEW_STORAGE_KEY, mode);
        window.location.reload();
    };
    const current = getPremiumPreviewMode(true);
    console.info(
        `[premium-preview] Mod: ${current}. Değiştirmek için: setPremiumPreview('teaser'|'locked'|'active')`
    );
}
