import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePremiumPreviewEntitlement } from './premium-preview.js';

test('premium preview overrides access without mutating persisted entitlement state', () => {
    const entitlements = { premium: true };

    assert.equal(resolvePremiumPreviewEntitlement('teaser', entitlements.premium), false);
    assert.equal(resolvePremiumPreviewEntitlement('locked', entitlements.premium), false);
    assert.equal(resolvePremiumPreviewEntitlement('active', false), true);
    assert.deepEqual(entitlements, { premium: true });
});

test('persisted entitlement is used outside preview builds', () => {
    assert.equal(resolvePremiumPreviewEntitlement(null, true), true);
    assert.equal(resolvePremiumPreviewEntitlement(null, false), false);
});
