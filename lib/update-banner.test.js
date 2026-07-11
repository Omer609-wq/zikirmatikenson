import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizePlayStoreUrl } from '../update-banner.js';

const DEFAULT =
    'https://play.google.com/store/apps/details?id=com.omerzikirmatik.app';

test('sanitizePlayStoreUrl accepts default Play Store link', () => {
    assert.equal(sanitizePlayStoreUrl(DEFAULT), DEFAULT);
});

test('sanitizePlayStoreUrl rejects non-https', () => {
    assert.equal(
        sanitizePlayStoreUrl('http://play.google.com/store/apps/details?id=com.omerzikirmatik.app'),
        DEFAULT
    );
});

test('sanitizePlayStoreUrl rejects foreign host and app id', () => {
    assert.equal(sanitizePlayStoreUrl('https://evil.com/store/apps/details?id=com.omerzikirmatik.app'), DEFAULT);
    assert.equal(
        sanitizePlayStoreUrl('https://play.google.com/store/apps/details?id=com.evil.app'),
        DEFAULT
    );
});

test('sanitizePlayStoreUrl rejects javascript and empty', () => {
    assert.equal(sanitizePlayStoreUrl('javascript:alert(1)'), DEFAULT);
    assert.equal(sanitizePlayStoreUrl(''), DEFAULT);
});
