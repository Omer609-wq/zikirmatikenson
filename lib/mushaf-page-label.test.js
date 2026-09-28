import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mushafPageLabel } from './mushaf-page-label.js';

test('Türk baskısı: Fatiha ve Bakara başı birlikte sayfa 1, sonrakiler bir eksik', () => {
    assert.equal(mushafPageLabel(1, 'tr'), 1);
    assert.equal(mushafPageLabel(2, 'tr'), 1);
    assert.equal(mushafPageLabel(3, 'tr'), 2);
    assert.equal(mushafPageLabel(22, 'tr'), 21, '2. cüz 21. sayfada başlar');
    assert.equal(mushafPageLabel(581, 'tr'), 580);
});

test('Türk baskısı 30. cüz: sayfalar başka yerden bölünür, son sayfa 604', () => {
    assert.equal(mushafPageLabel(582, 'tr'), 581, 'Nebe 1');
    assert.equal(mushafPageLabel(585, 'tr'), 584, 'Abese 1');
    assert.equal(mushafPageLabel(592, 'tr'), 591, "A'lâ 16, Türk baskısında 591. sayfada");
    assert.equal(mushafPageLabel(603, 'tr'), 603, 'Kâfirûn 1');
    assert.equal(mushafPageLabel(604, 'tr'), 604, 'İhlâs 1');
});

test('Medine numarası olduğu gibi kalır', () => {
    for (const p of [1, 2, 3, 22, 582, 604]) assert.equal(mushafPageLabel(p, 'medina'), p);
});
