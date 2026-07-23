import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePremiumViewAccess } from './premium-view-access.js';

const FEATURE_IDS = new Set(['premiumFeatureWeeklyView']);

test('locked premium feature view redirects to premium hub', () => {
    assert.deepEqual(
        resolvePremiumViewAccess('premiumFeatureWeeklyView', { from: 'notification' }, {
            premiumLive: true,
            premiumUiVisible: true,
            premiumLocked: true,
            premiumFeatureViewIds: FEATURE_IDS
        }),
        {
            viewId: 'premiumView',
            param: null,
            blockedPremiumFeature: true
        }
    );
});

test('unlocked premium feature view is allowed unchanged', () => {
    assert.deepEqual(
        resolvePremiumViewAccess('premiumFeatureWeeklyView', null, {
            premiumLive: true,
            premiumUiVisible: true,
            premiumLocked: false,
            premiumFeatureViewIds: FEATURE_IDS
        }),
        {
            viewId: 'premiumFeatureWeeklyView',
            param: null,
            blockedPremiumFeature: false
        }
    );
});

test('hidden premium UI never resolves to premium screens', () => {
    assert.deepEqual(
        resolvePremiumViewAccess('premiumFeatureWeeklyView', null, {
            premiumLive: false,
            premiumUiVisible: false,
            premiumLocked: false,
            premiumFeatureViewIds: FEATURE_IDS
        }),
        {
            viewId: 'homeView',
            param: null,
            blockedPremiumFeature: false
        }
    );
});
