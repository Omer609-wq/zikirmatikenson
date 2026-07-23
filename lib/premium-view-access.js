/**
 * Resolve navigation to premium feature screens before the view switch runs.
 * Centralizing this keeps history restores, notification deep links, and button
 * clicks under the same entitlement check.
 */
export function resolvePremiumViewAccess(viewId, param, options = {}) {
    const {
        premiumLive = false,
        premiumUiVisible = false,
        premiumLocked = false,
        premiumFeatureViewIds = []
    } = options;
    const featureIds =
        premiumFeatureViewIds instanceof Set
            ? premiumFeatureViewIds
            : new Set(Array.isArray(premiumFeatureViewIds) ? premiumFeatureViewIds : []);

    if (viewId === 'premiumView' && !premiumUiVisible) {
        return { viewId: 'homeView', param: null, blockedPremiumFeature: false };
    }

    if (!featureIds.has(viewId)) {
        return { viewId, param, blockedPremiumFeature: false };
    }

    if (!premiumLive) {
        return {
            viewId: premiumUiVisible ? 'premiumView' : 'homeView',
            param: null,
            blockedPremiumFeature: false
        };
    }

    if (premiumLocked) {
        return {
            viewId: premiumUiVisible ? 'premiumView' : 'homeView',
            param: null,
            blockedPremiumFeature: true
        };
    }

    return { viewId, param, blockedPremiumFeature: false };
}
