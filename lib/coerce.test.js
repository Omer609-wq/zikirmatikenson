import test from 'node:test';
import assert from 'node:assert/strict';
import { coerceId, clampNumber, isPlainObject } from './coerce.js';

test('clampNumber bounds values', () => {
    assert.equal(clampNumber('12', { min: 1, max: 10, fallback: 0 }), 10);
    assert.equal(clampNumber('x', { fallback: 33 }), 33);
});

test('coerceId mints unsafe ids', () => {
    assert.equal(coerceId('z_1', 'z'), 'z_1');
    assert.match(coerceId('<bad>', 'z'), /^z_\d+_[0-9a-f]+$/);
});

test('isPlainObject rejects prototypes', () => {
    assert.equal(isPlainObject({}), true);
    assert.equal(isPlainObject([]), false);
    assert.equal(isPlainObject(null), false);
});
