import test from 'node:test';
import assert from 'node:assert/strict';
import { addRemovedEsma, dropRemovedEsma, esmaIndexFromZikirId, normalizeRemovedEsma } from './removed-esma.js';

test('yalnız Esma kimlikleri sayılır', () => {
    assert.equal(esmaIndexFromZikirId('z_e_0'), 0);
    assert.equal(esmaIndexFromZikirId('z_e_98'), 98);
    assert.equal(esmaIndexFromZikirId('z_1'), -1);
    assert.equal(esmaIndexFromZikirId('z_e_x'), -1);
    assert.equal(esmaIndexFromZikirId(null), -1);
});

test('silinen Esma eklenir, geri yüklenen çıkar; diğer zikirler etkilemez', () => {
    let list = addRemovedEsma(undefined, ['z_e_5', 'z_1', 'z_e_2']);
    assert.deepEqual(list, [2, 5]);
    list = addRemovedEsma(list, new Set(['z_e_5', 'z_e_40']));
    assert.deepEqual(list, [2, 5, 40]);
    list = dropRemovedEsma(list, ['z_e_5', 'z_99']);
    assert.deepEqual(list, [2, 40]);
});

test('kayıttan okunan liste temizlenir', () => {
    assert.deepEqual(normalizeRemovedEsma([3, 3, '4', -1, 1.5, 1, 2000]), [1, 3]);
    assert.deepEqual(normalizeRemovedEsma('x'), []);
});
