import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pluralCategory, pluralCountOf, pluralVariantKey } from './i18n-plural.js';

const loadUi = (code) => JSON.parse(readFileSync(new URL(`../locales/${code}.json`, import.meta.url), 'utf8'));
const getPath = (obj, key) => key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

/** i18n.js t() ile aynı seçim; i18n.js JSON'u Vite importuyla aldığı için Node'da yüklenemiyor. */
function makeT(code, localeTag) {
    const ui = loadUi(code);
    return (key, vars) => {
        const variantKey = pluralVariantKey(key, localeTag, vars);
        const str = (variantKey && getPath(ui, variantKey)) ?? getPath(ui, key);
        return String(str).replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
    };
}
const tAr = makeT('ar', 'ar');
const tEn = makeT('en', 'en-US');
const tFr = makeT('fr', 'fr-FR');

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

test('ingilizcede 1 tekil, digerleri cogul', () => {
    assert.equal(tEn('home.selectedFolders', { count: 1 }), '1 folder selected');
    assert.equal(tEn('home.selectedFolders', { count: 2 }), '2 folders selected');
    assert.equal(tEn('community.cardSummary', { count: 1, juz: 5 }), '1 group · juz 5 next');
    assert.equal(tEn('stats.clicksUnit', { count: 1 }), '1 time');
    assert.equal(tEn('stats.dayTotal', { count: '1', pluralCount: 1 }), '1 tap');
    assert.equal(tEn('stats.dayTotal', { count: '0', pluralCount: 0 }), '0 taps');
    assert.equal(tEn('stats.allTimeDays', { count: '1', pluralCount: 1 }), 'For 1 day');
    assert.equal(
        tEn('confirm.deleteFoldersMsg', { folderCount: 1, zikirCount: 4, pluralCount: 1 }),
        'Permanently delete 1 folder and 4 zikir inside it? This cannot be undone.'
    );
    assert.equal(
        tEn('confirm.deleteFoldersMsg', { folderCount: 3, zikirCount: 9, pluralCount: 3 }),
        'Permanently delete 3 folders and 9 zikir inside them? This cannot be undone.'
    );
});

test('fransizcada 0 ve 1 tekil', () => {
    assert.equal(tFr('stats.dayTotal', { count: '0', pluralCount: 0 }), '0 touche');
    assert.equal(tFr('stats.dayTotal', { count: '1', pluralCount: 1 }), '1 touche');
    assert.equal(tFr('stats.dayTotal', { count: '2', pluralCount: 2 }), '2 touches');
    assert.equal(tFr('home.selectedZikirs', { count: 1 }), '1 zikir sélectionné');
    assert.equal(tFr('home.selectedZikirs', { count: 3 }), '3 zikir sélectionnés');
    assert.equal(tFr('premiumPurchase.yearlyBadge', { percent: 17, count: 2 }), 'Économisez 17 % · 2 mois offerts');
    assert.equal(tFr('premiumPurchase.yearlyBadge', { percent: 8, count: 1 }), 'Économisez 8 % · 1 mois offert');
});

test('yeni cevrilen arapca sayili metinler', () => {
    assert.equal(tAr('premiumPurchase.yearlyBadge', { percent: 17, count: 2 }), 'وفّر 17% · شهران مجانًا');
    assert.equal(tAr('premiumPurchase.yearlyBadge', { percent: 25, count: 3 }), 'وفّر 25% · 3 أشهر مجانًا');
    assert.equal(tAr('smartReminders.timesPerDayShort', { count: 1 }), 'مرة يوميًا');
    assert.equal(tAr('smartReminders.timesPerDayShort', { count: 2 }), 'مرتين يوميًا');
    assert.equal(tAr('smartReminders.timesPerDayShort', { count: 3 }), '3 مرات يوميًا');
    assert.equal(tAr('smartReminders.maxReached', { max: 12, pluralCount: 12 }), 'يمكنك إضافة 12 تذكيرًا كحد أقصى.');
    assert.equal(tAr('community.cardSummary', { count: 1, juz: 5 }), 'مجموعة واحدة · التالي الجزء 5');
    assert.equal(tAr('community.cardSummary', { count: 4, juz: 5 }), '4 مجموعات · التالي الجزء 5');
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
