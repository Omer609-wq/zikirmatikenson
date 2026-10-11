import test from 'node:test';
import assert from 'node:assert/strict';
import { parseWholeNumber, toLatinDigits } from './digits.js';

test('Arapça, Urduca ve Bengalce rakamlar Latin rakama döner', () => {
    assert.equal(toLatinDigits('١٢٣'), '123');
    assert.equal(toLatinDigits('۱۲۳'), '123');
    assert.equal(toLatinDigits('১২৩'), '123');
    assert.equal(toLatinDigits('٢:٢٥٥'), '2:255');
    assert.equal(toLatinDigits('Bakara ٢٥٥'), 'Bakara 255');
});

test('yalnız tam sayı kabul edilir', () => {
    assert.equal(parseWholeNumber(' ١ '), 1);
    assert.equal(parseWholeNumber('286'), 286);
    assert.ok(Number.isNaN(parseWholeNumber('1.5')));
    assert.ok(Number.isNaN(parseWholeNumber('1e2')));
    assert.ok(Number.isNaN(parseWholeNumber('-3')));
    assert.ok(Number.isNaN(parseWholeNumber('')));
});
