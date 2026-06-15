import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { coerceId, coerceStoredText, clampNumber, isPlainObject } from './coerce.js';

test('clampNumber bounds values', () => {
    assert.equal(clampNumber('12', { min: 1, max: 10, fallback: 0 }), 10);
    assert.equal(clampNumber('x', { fallback: 33 }), 33);
});

test('coerceId mints unsafe ids', () => {
    assert.equal(coerceId('z_1', 'z'), 'z_1');
    assert.match(coerceId('<bad>', 'z'), /^z_\d+_[0-9a-f]+$/);
});

test('coerceStoredText preserves persisted user text', () => {
    const longText = `  first line\nsecond   line\n${'x'.repeat(2000)}  `;
    assert.equal(coerceStoredText(longText), longText);
    assert.equal(coerceStoredText(null), '');
});

test('sanitizeLoadedData keeps zikir body text on the non-normalizing path', () => {
    const src = readFileSync(new URL('./sanitize.js', import.meta.url), 'utf8');
    assert.match(src, /arabic:\s*coerceStoredText\(z\.arabic\)/);
    assert.match(src, /meaning:\s*coerceStoredText\(z\.meaning\)/);
    assert.match(src, /fazilet:\s*z\.fazilet != null \? coerceStoredText\(z\.fazilet\) : undefined/);
    assert.match(src, /arabic:\s*coerceStoredText\(x\.zikir\.arabic\)/);
    assert.match(src, /meaning:\s*coerceStoredText\(x\.zikir\.meaning\)/);
});

test('isPlainObject rejects prototypes', () => {
    assert.equal(isPlainObject({}), true);
    assert.equal(isPlainObject([]), false);
    assert.equal(isPlainObject(null), false);
});
