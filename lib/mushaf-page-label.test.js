import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mushafPageLabel } from './mushaf-page-label.js';

test('Türkçe: Fatiha ve Bakara başı birlikte sayfa 1, sonrakiler bir eksik', () => {
    assert.equal(mushafPageLabel(1, 'tr'), 1);
    assert.equal(mushafPageLabel(2, 'tr'), 1);
    assert.equal(mushafPageLabel(3, 'tr'), 2);
    assert.equal(mushafPageLabel(22, 'tr'), 21, '2. cüz 21. sayfada başlar');
    assert.equal(mushafPageLabel(604, 'tr'), 603);
});

test('diğer diller Medine numarasını korur', () => {
    for (const locale of ['en', 'ar', 'id', 'ms', 'bn', 'ur', 'fr']) {
        assert.equal(mushafPageLabel(2, locale), 2);
        assert.equal(mushafPageLabel(3, locale), 3);
        assert.equal(mushafPageLabel(604, locale), 604);
    }
});
