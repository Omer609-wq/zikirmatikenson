import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRemoteDailyQuotes } from './daily-quotes.js';

test('geçerli appQuotes listesi normalize edilir', () => {
    const out = normalizeRemoteDailyQuotes({
        version: 1,
        appQuotes: ['  Birinci söz (Kaynak)  ', 'İkinci   söz (Müslim)']
    });
    assert.ok(out);
    assert.deepEqual(out.appQuotes, ['Birinci söz (Kaynak)', 'İkinci söz (Müslim)']);
    assert.equal(out.quranQuotes, null);
});

test('geçerli quranQuotes satırları dil bazında normalize edilir', () => {
    const out = normalizeRemoteDailyQuotes({
        quranQuotes: {
            en: [[13, 28, ' Hearts find rest in the remembrance of Allah. '], [94, 5, 'With hardship comes ease.']],
            ar: [[2, 152, 'فَاذْكُرُونِي أَذْكُرْكُمْ']]
        }
    });
    assert.ok(out);
    assert.equal(out.appQuotes, null);
    assert.deepEqual(out.quranQuotes.en[0], [13, 28, 'Hearts find rest in the remembrance of Allah.']);
    assert.equal(out.quranQuotes.en.length, 2);
    assert.equal(out.quranQuotes.ar.length, 1);
});

test('bozuk satırlar elenir, geçerliler kalır', () => {
    const out = normalizeRemoteDailyQuotes({
        appQuotes: ['Geçerli söz', '', '   ', 42, null],
        quranQuotes: {
            en: [
                [13, 28, 'valid'],
                [0, 5, 'sure 0 olamaz'],
                [115, 1, 'sure 115 olamaz'],
                [2, 0, 'ayet 0 olamaz'],
                [2, 300, 'ayet 300 olamaz'],
                [2, 5, ''],
                ['a', 'b', 'sayı değil'],
                [2, 5],
                'dizi değil'
            ]
        }
    });
    assert.ok(out);
    assert.deepEqual(out.appQuotes, ['Geçerli söz']);
    assert.deepEqual(out.quranQuotes.en, [[13, 28, 'valid']]);
});

test('desteklenmeyen dil kodları yok sayılır', () => {
    const out = normalizeRemoteDailyQuotes({
        quranQuotes: { de: [[2, 5, 'nicht unterstützt']], en: [[2, 5, 'ok']] }
    });
    assert.ok(out);
    assert.equal(out.quranQuotes.de, undefined);
    assert.deepEqual(out.quranQuotes.en, [[2, 5, 'ok']]);
});

test('kullanılabilir alan yoksa null döner', () => {
    assert.equal(normalizeRemoteDailyQuotes(null), null);
    assert.equal(normalizeRemoteDailyQuotes('metin'), null);
    assert.equal(normalizeRemoteDailyQuotes([]), null);
    assert.equal(normalizeRemoteDailyQuotes({}), null);
    assert.equal(normalizeRemoteDailyQuotes({ version: 1 }), null);
    assert.equal(normalizeRemoteDailyQuotes({ appQuotes: [] }), null);
    assert.equal(normalizeRemoteDailyQuotes({ appQuotes: ['', null] }), null);
    assert.equal(normalizeRemoteDailyQuotes({ quranQuotes: { en: [] } }), null);
});

test('aşırı uzun metin ve liste sınırlanır', () => {
    const out = normalizeRemoteDailyQuotes({
        appQuotes: ['a'.repeat(1000), ...Array.from({ length: 600 }, (_, i) => `söz ${i}`)]
    });
    assert.ok(out);
    assert.equal(out.appQuotes[0].length, 400);
    assert.ok(out.appQuotes.length <= 500);
});

test('mevcut public/daily-quotes.json şemaya uyuyor', async () => {
    const { readFile } = await import('node:fs/promises');
    const raw = JSON.parse(await readFile(new URL('../public/daily-quotes.json', import.meta.url), 'utf8'));
    const out = normalizeRemoteDailyQuotes(raw);
    assert.ok(out, 'public/daily-quotes.json normalize edilemedi');
    assert.ok(out.appQuotes.length >= 50, 'beklenenden az satır var');
});
