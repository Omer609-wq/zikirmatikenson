import test from 'node:test';
import assert from 'node:assert/strict';
import {
    FREE_BASE_DUA_COUNT,
    FREE_BASE_ZIKIR_COUNT,
    getBaseLibraryAccessSplit,
    getLockedBaseLibraryIds,
    isBaseLibraryItemPremiumLocked
} from './library-access.js';

test('isBaseLibraryItemPremiumLocked respects premiumLive and isPremium', () => {
    const lockedId = getLockedBaseLibraryIds()[0];
    assert.ok(lockedId);
    assert.equal(isBaseLibraryItemPremiumLocked(lockedId, { premiumLive: false, isPremium: false }), false);
    assert.equal(isBaseLibraryItemPremiumLocked(lockedId, { premiumLive: true, isPremium: true }), false);
    assert.equal(isBaseLibraryItemPremiumLocked(lockedId, { premiumLive: true, isPremium: false }), true);
});

test('first base dua and zikir slots stay free', () => {
    const split = getBaseLibraryAccessSplit();
    assert.equal(split.freeDuas.length, FREE_BASE_DUA_COUNT);
    assert.equal(split.freeZikirs.length, FREE_BASE_ZIKIR_COUNT);
    assert.ok(split.lockedDuas.length > 0);
    assert.ok(split.lockedZikirs.length > 0);

    for (const id of split.freeDuas) {
        assert.equal(isBaseLibraryItemPremiumLocked(id, { premiumLive: true, isPremium: false }), false);
    }
    for (const id of split.lockedDuas) {
        assert.equal(isBaseLibraryItemPremiumLocked(id, { premiumLive: true, isPremium: false }), true);
    }
});

test('plib ids are not treated as locked base items', () => {
    assert.equal(isBaseLibraryItemPremiumLocked('plib_07', { premiumLive: true, isPremium: false }), false);
});
