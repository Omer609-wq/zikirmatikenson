import test from 'node:test';
import assert from 'node:assert/strict';
import { coerceString, coerceMultilineString, truncateText, coerceId, clampNumber, isPlainObject } from './coerce.js';

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

test('truncateText: emoji ortadan bölünmez', () => {
    // 😀 iki UTF-16 birimi: düz slice(0, 3) onu ikiye bölüp yarım karakter bırakırdı.
    const s = 'ab😀c';
    assert.notEqual(s.slice(0, 3), 'ab', 'eski yöntem yarım emoji bırakıyordu');
    assert.equal(truncateText(s, 3), 'ab', 'sığmayan emoji bütünüyle dışarıda');
    assert.equal(truncateText(s, 4), 'ab😀');
    assert.equal(truncateText('Ömer Şükrü', 4), 'Ömer', 'Türkçe harfler tek birim');
});

test('truncateText: birleşik emoji ve bayrak yarıda kalmaz', () => {
    const aile = '👨‍👩‍👧'; // 8 UTF-16 birimi, tek görünen harf
    assert.equal(aile.length, 8);
    assert.equal(truncateText('ab' + aile, 10), 'ab' + aile);
    assert.equal(truncateText('ab' + aile, 9), 'ab', 'sığmıyorsa bütünüyle dışarıda');
    const bayrak = '🇹🇷'; // 4 UTF-16 birimi
    assert.equal(truncateText('a' + bayrak, 4), 'a');
    assert.equal(truncateText('a' + bayrak, 5), 'a' + bayrak);
});

test('truncateText: tek kalmış yarım parça atılır, sınır altı metin aynen döner', () => {
    const yarim = 'ab' + '\uD83D' + 'c'; // eşi olmayan vekil birim
    assert.equal(truncateText(yarim, 10), 'abc');
    assert.equal(truncateText('Mahalle Camii', 40), 'Mahalle Camii');
    assert.equal(truncateText('', 5), '');
    assert.equal(truncateText(null, 5), '');
});

test('coerceString sınırı aşan metni emojiyi bölmeden keser', () => {
    // 39 + 2 birim = 41: emoji sığmıyor, yarısı da kalmıyor.
    assert.equal(coerceString('x'.repeat(39) + '😀😀', 40), 'x'.repeat(39));
    // 38 + 2 = 40: tam sığıyor.
    assert.equal(coerceString('x'.repeat(38) + '😀😀', 40), 'x'.repeat(38) + '😀');
});

test('coerceMultilineString satır sonlarını korur, satır içi boşlukları sadeleştirir', () => {
    assert.equal(coerceMultilineString('Line one\n\nLine two'), 'Line one\n\nLine two');
    assert.equal(coerceMultilineString('  a\r\nb  \t c \n\n\n\n d  '), 'a\nb c\n\nd');
    assert.equal(coerceMultilineString(null), '');
});

test('coerceMultilineString sınırda harf bölmeden keser', () => {
    assert.equal(coerceMultilineString('ab\ncd', 4), 'ab\nc');
    assert.equal(coerceMultilineString('a\n😀', 3), 'a');
});
