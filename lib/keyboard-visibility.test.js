import test from 'node:test';
import assert from 'node:assert/strict';
import { isKeyboardShrink, isTextEntryElement } from './keyboard-visibility.js';

const el = (tagName, attrs = {}, props = {}) => ({
    tagName,
    getAttribute: (name) => (name in attrs ? attrs[name] : null),
    ...props
});

test('klavye kadar daralma sayılır, adres çubuğu oynaması sayılmaz', () => {
    assert.equal(isKeyboardShrink(812, 480), true);
    assert.equal(isKeyboardShrink(812, 760), false);
    // Büyük ekranda %15 eşiği 120 px'ten büyük kalır
    assert.equal(isKeyboardShrink(1400, 1250), false);
    assert.equal(isKeyboardShrink(1400, 1150), true);
});

test('yalnız yazı girilen alanlar klavye açar', () => {
    assert.equal(isTextEntryElement(el('INPUT')), true);
    assert.equal(isTextEntryElement(el('INPUT', { type: 'search' })), true);
    assert.equal(isTextEntryElement(el('INPUT', { type: 'number' })), true);
    assert.equal(isTextEntryElement(el('TEXTAREA')), true);
    assert.equal(isTextEntryElement(el('INPUT', { type: 'checkbox' })), false);
    assert.equal(isTextEntryElement(el('INPUT', { type: 'range' })), false);
    assert.equal(isTextEntryElement(el('INPUT', {}, { readOnly: true })), false);
    assert.equal(isTextEntryElement(el('BUTTON')), false);
    assert.equal(isTextEntryElement(el('DIV', {}, { isContentEditable: true })), true);
    assert.equal(isTextEntryElement(null), false);
});
