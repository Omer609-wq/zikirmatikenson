import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { payloadUpdatedAt, pickNewerPayload } from './seasonal-payload.js';

const at = (updatedAt, tag) => ({ updatedAt, tag });

test('updatedAt okunur; alan yoksa ya da bozuksa 0', () => {
    assert.equal(payloadUpdatedAt({ updatedAt: '2026-09-12T10:00:00+03:00' }), Date.parse('2026-09-12T10:00:00+03:00'));
    assert.equal(payloadUpdatedAt({ updatedAt: '2026-09-12' }), Date.parse('2026-09-12'));
    for (const bad of [{}, { updatedAt: 'dun' }, { updatedAt: 17 }, null, 'x', undefined]) {
        assert.equal(payloadUpdatedAt(bad), 0, JSON.stringify(bad));
    }
});

test('yeni olan secilir', () => {
    const eski = at('2026-01-01', 'eski');
    const yeni = at('2026-09-12', 'yeni');
    assert.equal(pickNewerPayload(eski, yeni).tag, 'yeni');
    assert.equal(pickNewerPayload(yeni, eski).tag, 'yeni');
});

test('tarihsiz kopya tarihliye yenik; esitlikte ilki', () => {
    const tarihsiz = { tag: 'tarihsiz' };
    const tarihli = at('2026-09-12', 'tarihli');
    assert.equal(pickNewerPayload(tarihsiz, tarihli).tag, 'tarihli');
    assert.equal(pickNewerPayload(tarihli, tarihsiz).tag, 'tarihli');
    assert.equal(pickNewerPayload(at('2026-09-12', 'ilk'), at('2026-09-12', 'ikinci')).tag, 'ilk');
    assert.equal(pickNewerPayload({ tag: 'ilk' }, { tag: 'ikinci' }).tag, 'ilk');
});

test('biri yoksa digeri; ikisi de yoksa null', () => {
    const p = at('2026-09-12', 'var');
    assert.equal(pickNewerPayload(null, p).tag, 'var');
    assert.equal(pickNewerPayload(p, null).tag, 'var');
    assert.equal(pickNewerPayload(null, null), null);
    assert.equal(pickNewerPayload('x', 3), null);
});

test('yayimlanan dosyada updatedAt var (guncellemeyi unutmaya karsi)', () => {
    const payload = JSON.parse(readFileSync(new URL('../public/seasonal-content.json', import.meta.url), 'utf8'));
    assert.ok(payloadUpdatedAt(payload) > 0, 'public/seasonal-content.json icinde gecerli updatedAt olmali');
});
