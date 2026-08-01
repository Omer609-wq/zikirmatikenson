import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLibraryOverrides } from './library-overrides.js';

test('katmanlar ve prev listesi normalize edilir', () => {
    const out = normalizeLibraryOverrides({
        version: 1,
        items: {
            lib_21: {
                tr: {
                    meaning: '  Yeni   TR anlam  ',
                    context: 'Yeni fazilet',
                    source: 'Müslim, Zikir 1',
                    target: 100
                },
                en: { meaning: 'New EN meaning' },
                ar: { name: 'سُبْحَانَ اللَّهِ' },
                prev: { meaning: ['Eski TR anlam', 'Old EN meaning'] }
            }
        }
    });
    assert.ok(out);
    assert.deepEqual(out.items.lib_21.byLayer.tr, {
        meaning: 'Yeni TR anlam',
        context: 'Yeni fazilet',
        source: 'Müslim, Zikir 1',
        target: 100
    });
    assert.equal(out.items.lib_21.byLayer.en.meaning, 'New EN meaning');
    assert.equal(out.items.lib_21.byLayer.ar.name, 'سُبْحَانَ اللَّهِ');
    assert.deepEqual(out.items.lib_21.prev.meaning, ['Eski TR anlam', 'Old EN meaning']);
});

test('yalnızca prev taşıyan madde korunur (düzeltmeyi geri alma)', () => {
    const out = normalizeLibraryOverrides({
        items: { lib_21: { prev: { meaning: ['Yanlış yayınlanan anlam'] } } }
    });
    assert.ok(out);
    assert.deepEqual(out.items.lib_21.byLayer, {});
    assert.deepEqual(out.items.lib_21.prev.meaning, ['Yanlış yayınlanan anlam']);
});

test('bilinmeyen alan, boş metin ve geçersiz katman elenir', () => {
    const out = normalizeLibraryOverrides({
        items: {
            lib_21: {
                tr: { meaning: 'Geçerli', sirala: 5, name: '   ', target: 0 },
                fr: { meaning: 'desteklenmeyen katman' },
                en: 'metin olamaz'
            }
        }
    });
    assert.ok(out);
    assert.deepEqual(out.items.lib_21.byLayer, { tr: { meaning: 'Geçerli' } });
    assert.equal(out.items.lib_21.byLayer.fr, undefined);
    assert.equal(out.items.lib_21.byLayer.en, undefined);
});

test('geçersiz id ve boş madde atlanır', () => {
    const out = normalizeLibraryOverrides({
        items: {
            'lib bad id': { tr: { meaning: 'a' } },
            '../../etc': { tr: { meaning: 'b' } },
            lib_bos: { tr: {} },
            lib_ok: { tr: { meaning: 'c' } }
        }
    });
    assert.ok(out);
    assert.deepEqual(Object.keys(out.items), ['lib_ok']);
});

test('kategori beyaz listesi ve hedef aralığı uygulanır', () => {
    const out = normalizeLibraryOverrides({
        items: {
            lib_a: { tr: { category: 'zikir', target: 33 } },
            lib_b: { tr: { category: 'sarki', target: 999999999, meaning: 'x' } }
        }
    });
    assert.deepEqual(out.items.lib_a.byLayer.tr, { target: 33, category: 'zikir' });
    assert.deepEqual(out.items.lib_b.byLayer.tr, { meaning: 'x' });
});

test('açı parantezleri temizlenir, uzun metin kırpılır', () => {
    const out = normalizeLibraryOverrides({
        items: {
            lib_a: { tr: { meaning: '<img src=x onerror=alert(1)>Anlam' } },
            lib_b: { tr: { context: 'a'.repeat(900) } }
        }
    });
    assert.equal(out.items.lib_a.byLayer.tr.meaning, 'img src=x onerror=alert(1)Anlam');
    assert.equal(out.items.lib_b.byLayer.tr.context.length, 600);
});

test('prev tekrarları teklenir ve sayısı sınırlanır', () => {
    const out = normalizeLibraryOverrides({
        items: {
            lib_a: {
                tr: { meaning: 'yeni' },
                prev: { meaning: ['eski', 'eski', ...Array.from({ length: 20 }, (_, i) => `m${i}`)] }
            }
        }
    });
    assert.equal(out.items.lib_a.prev.meaning.length, 9);
    assert.deepEqual(out.items.lib_a.prev.meaning.slice(0, 3), ['eski', 'm0', 'm1']);
});

test('boş / bozuk yük null döner (gömülü metinler kalır)', () => {
    assert.equal(normalizeLibraryOverrides(null), null);
    assert.equal(normalizeLibraryOverrides('metin'), null);
    assert.equal(normalizeLibraryOverrides([]), null);
    assert.equal(normalizeLibraryOverrides({}), null);
    assert.equal(normalizeLibraryOverrides({ items: {} }), null);
    assert.equal(normalizeLibraryOverrides({ items: [] }), null);
});
