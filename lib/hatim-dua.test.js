import test from 'node:test';
import assert from 'node:assert/strict';
import duaData from '../data/hatim-dua.json' with { type: 'json' };
import { getHatimDua, getHatimDuaMeta } from './hatim-dua.js';

const UI_LOCALES = ['tr', 'ar', 'id', 'ms', 'en', 'fr', 'bn', 'ur'];

test('Arapça metin her dilde gösterilir', () => {
    for (const locale of UI_LOCALES) {
        const dua = getHatimDua(locale);
        assert.ok(dua.arabic.length > 0, `${locale}: Arapça metin boş`);
        assert.equal(dua.arabic, duaData.arabic);
    }
});

test('okunuş yalnızca Arap harfi okumayan dillerde çıkar', () => {
    // Arapça ve Urduca metni zaten kendi alfabesinden okur.
    assert.equal(getHatimDua('ar').translit, '');
    assert.equal(getHatimDua('ur').translit, '');

    assert.equal(getHatimDua('tr').translit, duaData.translit.tr);
    assert.equal(getHatimDua('en').translit, duaData.translit.en);
    // Kendi okunuşu olmayan Latin diller en paketine düşer.
    for (const locale of ['id', 'ms', 'fr', 'bn']) {
        assert.equal(getHatimDua(locale).translit, duaData.translit.en, locale);
    }
});

test('meal Arapça dışında her dilde dolu', () => {
    assert.equal(getHatimDua('ar').meaning, '', 'Arapça metin zaten kendi dilinde');
    for (const locale of UI_LOCALES.filter((l) => l !== 'ar')) {
        const meaning = getHatimDua(locale).meaning;
        assert.ok(meaning.length > 0, `${locale}: meal boş`);
    }
});

test('her dilin kendi meali kullanılır', () => {
    for (const locale of ['tr', 'en', 'id', 'ms', 'fr', 'bn', 'ur']) {
        assert.equal(getHatimDua(locale).meaning, duaData.meaning[locale], locale);
    }
});

test('bilinmeyen dil güvenli varsayılana düşer', () => {
    const dua = getHatimDua('zz');
    assert.equal(dua.arabic, duaData.arabic);
    assert.equal(dua.translit, duaData.translit.en);
    assert.equal(dua.meaning, duaData.meaning.en);

    // Bölgeli kod da çalışmalı.
    assert.equal(getHatimDua('tr-TR').meaning, duaData.meaning.tr);
    assert.equal(getHatimDua(null).arabic, duaData.arabic);
});

test('satır sonları korunur — dua satır satır dizilir', () => {
    assert.ok(duaData.arabic.includes('\n'), 'Arapça metin çok satırlı olmalı');
    assert.ok(duaData.translit.tr.includes('\n'));
});

test('editoryal durum izlenebilir', () => {
    const meta = getHatimDuaMeta();
    assert.ok(meta.source, 'kaynak yazılmalı');
    assert.ok(meta.decision, 'metnin neden kaldığı yazılmalı');
    // text-unverified: meşruiyet kararı verildi ama Arapça harekeler ve
    // mealler matbu kaynakla karşılaştırılınca burası "verified" olur.
    assert.ok(['text-unverified', 'verified'].includes(meta.review), meta.review);
});
