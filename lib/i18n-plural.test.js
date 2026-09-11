import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pluralCategory, pluralCountOf, pluralVariantKey } from './i18n-plural.js';

const ar = JSON.parse(readFileSync(new URL('../locales/ar.json', import.meta.url), 'utf8'));
const getPath = (obj, key) => key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

/** i18n.js t() ile aynı seçim; i18n.js JSON'u Vite importuyla aldığı için Node'da yüklenemiyor. */
function tAr(key, vars) {
    const variantKey = pluralVariantKey(key, 'ar', vars);
    const str = (variantKey && getPath(ar, variantKey)) ?? getPath(ar, key);
    return String(str).replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
}

test('arapca kategoriler: 0 zero, 1 one, 2 two, 3-10 few, 11-99 many, 100+ other', () => {
    const cases = {
        0: 'zero', 1: 'one', 2: 'two', 3: 'few', 10: 'few', 11: 'many', 99: 'many',
        100: 'other', 101: 'other', 102: 'other', 103: 'few', 111: 'many', 1000: 'other'
    };
    for (const [n, cat] of Object.entries(cases)) {
        assert.equal(pluralCategory('ar', Number(n)), cat, `${n}`);
    }
});

test('klasordeki zikir sayisi arapcada sayiya gore degisir', () => {
    const cases = {
        0: 'لا أذكار',
        1: 'ذكر واحد',
        2: 'ذكران',
        4: '4 أذكار',
        10: '10 أذكار',
        11: '11 ذكرًا',
        99: '99 ذكرًا',
        100: '100 ذكر',
        101: '101 ذكر',
        103: '103 أذكار'
    };
    for (const [n, expected] of Object.entries(cases)) {
        assert.equal(tAr('home.folderZikirCount', { count: Number(n) }), expected, `${n}`);
    }
});

test('bicimi olmayan kategori temel metne duser (ayet: 11-99 ve 100+ ayni)', () => {
    assert.equal(tAr('quran.ayahCount', { count: 7 }), '7 آيات');
    assert.equal(tAr('quran.ayahCount', { count: 77 }), '77 آية');
    assert.equal(tAr('quran.ayahCount', { count: 286 }), '286 آية');
});

test('diger yer tutucular korunur; sifir icin ayri metin', () => {
    assert.equal(tAr('trash.metaFolder', { count: 0, time: 'X' }), 'مجلد فارغ • X');
    assert.equal(tAr('trash.metaFolder', { count: 5, time: 'X' }), 'مجلد (5 أذكار) • X');
});

test('bicimli sayi: secim pluralCount ile, gorunen metin count ile', () => {
    assert.equal(tAr('stats.dayTotal', { count: '٥', pluralCount: 5 }), '٥ نقرات');
    assert.equal(tAr('stats.dayTotal', { count: '١٬٢٣٤', pluralCount: 1234 }), '١٬٢٣٤ نقرة');
    // pluralCount yoksa metinden tahmin edilmez: temel metin.
    assert.equal(tAr('stats.dayTotal', { count: '٥' }), '٥ نقرة');
});

test('pluralCountOf yalnizca sonlu sayilari kabul eder', () => {
    assert.equal(pluralCountOf({ count: 4 }), 4);
    assert.equal(pluralCountOf({ count: '4' }), null);
    assert.equal(pluralCountOf({ count: '1.234', pluralCount: 1234 }), 1234);
    assert.equal(pluralCountOf({ count: 3, pluralCount: NaN }), 3);
    assert.equal(pluralCountOf({ count: Infinity }), null);
    assert.equal(pluralCountOf(null), null);
    assert.equal(pluralCountOf({ name: 'x' }), null);
});

test('kategori other ya da sayi yoksa anahtar degismez', () => {
    assert.equal(pluralVariantKey('k', 'ar', { count: 100 }), null);
    assert.equal(pluralVariantKey('k', 'ar', {}), null);
    assert.equal(pluralVariantKey('k', 'ar', undefined), null);
    assert.equal(pluralVariantKey('k', 'id-ID', { count: 1 }), null);
    assert.equal(pluralVariantKey('k', 'ar', { count: 4 }), 'k_few');
});

test('bicim tanimlamayan dillerde metin degismez', () => {
    // tr'de "one" kategorisi var ama "_one" anahtari yok: t() temel metne duser.
    const tr = JSON.parse(readFileSync(new URL('../locales/tr.json', import.meta.url), 'utf8'));
    const key = pluralVariantKey('home.folderZikirCount', 'tr-TR', { count: 1 });
    assert.equal(key, 'home.folderZikirCount_one');
    assert.equal(getPath(tr, key), undefined);
});

test('gecersiz locale etiketi hata atmaz', () => {
    assert.equal(pluralCategory('!!', 3), 'other');
});
