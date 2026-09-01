import test from 'node:test';
import assert from 'node:assert/strict';

import {
    LIBRARY_GROUPS,
    getLibraryGroup,
    getLibraryGroupItems,
    splitLibraryByGroup
} from './library-groups.js';

const items = [
    { id: 'lib_d_a', category: 'dua' },
    { id: 'lib_d_tovbe_1', category: 'dua', group: 'tovbe' },
    { id: 'lib_d_b', category: 'dua' },
    { id: 'lib_d_tovbe_2', category: 'dua', group: 'tovbe' }
];

test('tanımlı gruplar benzersiz id taşır', () => {
    const ids = LIBRARY_GROUPS.map((g) => g.id);
    assert.equal(new Set(ids).size, ids.length);
});

test('getLibraryGroup bilinmeyen id için null döner', () => {
    assert.equal(getLibraryGroup('yok'), null);
    assert.equal(getLibraryGroup(''), null);
    assert.equal(getLibraryGroup(undefined), null);
    assert.equal(getLibraryGroup('tovbe')?.id, 'tovbe');
});

test('getLibraryGroupItems yalnızca gruba ait maddeleri kaynak sırasıyla verir', () => {
    const found = getLibraryGroupItems('tovbe', items);
    assert.deepEqual(found.map((z) => z.id), ['lib_d_tovbe_1', 'lib_d_tovbe_2']);
});

test('splitLibraryByGroup grup ve grupsuzları ayırır', () => {
    const { groups, loose } = splitLibraryByGroup(items, 'dua');
    assert.equal(groups.length, 1);
    assert.equal(groups[0].id, 'tovbe');
    assert.equal(groups[0].items.length, 2);
    assert.deepEqual(loose.map((z) => z.id), ['lib_d_a', 'lib_d_b']);
});

test('üyesi olmayan grup listelenmez', () => {
    const { groups, loose } = splitLibraryByGroup(
        [{ id: 'lib_d_a', category: 'dua' }],
        'dua'
    );
    assert.equal(groups.length, 0);
    assert.equal(loose.length, 1);
});

test('başka kategoride grup kartı çıkmaz', () => {
    const { groups, loose } = splitLibraryByGroup(items, 'zikir');
    assert.equal(groups.length, 0);
    assert.equal(loose.length, items.length);
});

test('bozuk girdi çökmez', () => {
    assert.deepEqual(splitLibraryByGroup(null, 'dua'), { groups: [], loose: [] });
    assert.deepEqual(getLibraryGroupItems('tovbe', null), []);
});
