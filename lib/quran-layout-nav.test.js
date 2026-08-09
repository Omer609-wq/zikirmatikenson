import test from 'node:test';
import assert from 'node:assert/strict';
import {
    getMushafNavOptsForRerender,
    resolveScrollTargetLeavingMushaf
} from './quran-layout-nav.js';

test('resolveScrollTargetLeavingMushaf maps known mushaf pages to start ayah', () => {
    assert.deepEqual(resolveScrollTargetLeavingMushaf(1), { surah: 1, ayah: 1 });
    assert.deepEqual(resolveScrollTargetLeavingMushaf(2), { surah: 2, ayah: 1 });
    assert.deepEqual(resolveScrollTargetLeavingMushaf(22), { surah: 2, ayah: 142 });
    assert.deepEqual(resolveScrollTargetLeavingMushaf(604), { surah: 112, ayah: 1 });
});

test('resolveScrollTargetLeavingMushaf falls back when page is invalid', () => {
    assert.deepEqual(resolveScrollTargetLeavingMushaf(0, 36), { surah: 36, ayah: 1 });
    assert.deepEqual(resolveScrollTargetLeavingMushaf(9999, 2), { surah: 2, ayah: 1 });
    assert.deepEqual(resolveScrollTargetLeavingMushaf(null, 0), { surah: 1, ayah: 1 });
});

test('getMushafNavOptsForRerender only prefers saved page when remember is on', () => {
    assert.deepEqual(getMushafNavOptsForRerender('scroll', false), {});
    assert.deepEqual(getMushafNavOptsForRerender('scroll', true), {});
    assert.deepEqual(getMushafNavOptsForRerender('mushaf', false), {});
    assert.deepEqual(getMushafNavOptsForRerender('mushaf', true), { preferSaved: true });
});
