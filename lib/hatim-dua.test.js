import test from 'node:test';
import assert from 'node:assert/strict';
import duaData from '../data/hatim-dua.json' with { type: 'json' };
import {
    HATIM_DUA_PERSONAL,
    HATIM_DUA_SHARED,
    getHatimDua,
    getHatimDuaMeta
} from './hatim-dua.js';

const UI_LOCALES = ['tr', 'ar', 'id', 'ms', 'en', 'fr', 'bn', 'ur'];
/** Ortak dua metni girildiğinde bu testler kendiliğinden asıl metni sınar. */
const SHARED_READY = Boolean(duaData.shared?.arabic);

test('Arapça metin her dilde gösterilir', () => {
    for (const locale of UI_LOCALES) {
        const dua = getHatimDua(locale);
        assert.ok(dua.arabic.length > 0, `${locale}: Arapça metin boş`);
        assert.equal(dua.arabic, duaData.personal.arabic);
    }
});

test('okunuş yalnızca Arap harfi okumayan dillerde çıkar', () => {
    // Arapça ve Urduca metni zaten kendi alfabesinden okur.
    assert.equal(getHatimDua('ar').translit, '');
    assert.equal(getHatimDua('ur').translit, '');

    assert.equal(getHatimDua('tr').translit, duaData.personal.translit.tr);
    assert.equal(getHatimDua('en').translit, duaData.personal.translit.en);
    // Kendi okunuşu olmayan diller en paketine düşer.
    for (const locale of ['id', 'ms', 'fr', 'bn']) {
        assert.equal(getHatimDua(locale).translit, duaData.personal.translit.en, locale);
    }
});

test('meal Arapça dışında her dilde dolu', () => {
    assert.equal(getHatimDua('ar').meaning, '', 'Arapça metin zaten kendi dilinde');
    for (const locale of UI_LOCALES.filter((l) => l !== 'ar')) {
        assert.ok(getHatimDua(locale).meaning.length > 0, `${locale}: meal boş`);
    }
});

test('her dilin kendi meali kullanılır', () => {
    for (const locale of ['tr', 'en', 'id', 'ms', 'fr', 'bn', 'ur']) {
        assert.equal(getHatimDua(locale).meaning, duaData.personal.meaning[locale], locale);
    }
});

test('bilinmeyen dil güvenli varsayılana düşer', () => {
    const dua = getHatimDua('zz');
    assert.equal(dua.arabic, duaData.personal.arabic);
    assert.equal(dua.translit, duaData.personal.translit.en);
    assert.equal(dua.meaning, duaData.personal.meaning.en);

    // Bölgeli kod da çalışmalı.
    assert.equal(getHatimDua('tr-TR').meaning, duaData.personal.meaning.tr);
    assert.equal(getHatimDua(null).arabic, duaData.personal.arabic);
});

test('kişisel dua birinci tekil şahıs kalır', () => {
    const dua = getHatimDua('tr', HATIM_DUA_PERSONAL);
    assert.equal(dua.fallback, false);
    assert.equal(dua.arabic, duaData.personal.arabic);
    // "bana / benim için" — grupta değil kişisel hatimde anlamlı.
    assert.match(dua.meaning, /bana|benim/i);
});

test('ortak dua metni yoksa kişisel duaya düşer ve bunu bildirir', () => {
    const dua = getHatimDua('tr', HATIM_DUA_SHARED);
    if (SHARED_READY) {
        assert.equal(dua.fallback, false);
        assert.equal(dua.arabic, duaData.shared.arabic);
    } else {
        // Geçici köprü: grup ekranı boş kalmasın diye kişisel dua gösterilir.
        assert.equal(dua.fallback, true, 'düşüş bildirilmeli');
        assert.equal(dua.arabic, duaData.personal.arabic);
    }
});

test('ortak dua girilince öznesi çoğul olmalı', { skip: !SHARED_READY }, () => {
    const dua = getHatimDua('tr', HATIM_DUA_SHARED);
    assert.notEqual(dua.arabic, duaData.personal.arabic, 'kişisel duayla aynı olamaz');
    // "bize / bizim / bizi" — ortak hatmin duası cemaat adına konuşur.
    assert.match(dua.meaning, /biz/i);
});

test('ortak dua girilince her dilde eksiksiz olmalı', { skip: !SHARED_READY }, () => {
    for (const locale of UI_LOCALES.filter((l) => l !== 'ar')) {
        assert.ok(
            getHatimDua(locale, HATIM_DUA_SHARED).meaning.length > 0,
            `${locale}: ortak dua meali boş`
        );
    }
    assert.ok(duaData.shared.translit.tr.length > 0, 'tr okunuşu boş');
    assert.ok(duaData.shared.translit.en.length > 0, 'en okunuşu boş');
});

test('satır sonları korunur — dua satır satır dizilir', () => {
    assert.ok(duaData.personal.arabic.includes('\n'), 'Arapça metin çok satırlı olmalı');
    assert.ok(duaData.personal.translit.tr.includes('\n'));
});

test('editoryal durum izlenebilir', () => {
    const meta = getHatimDuaMeta();
    assert.ok(meta.personalSource, 'kişisel dua kaynağı yazılmalı');
    assert.ok(meta.personalDecision, 'kişisel duanın neden kaldığı yazılmalı');
    // text-unverified: meşruiyet kararı verildi ama Arapça harekeler ve
    // mealler matbu kaynakla karşılaştırılınca burası "verified" olur.
    assert.ok(['text-unverified', 'verified'].includes(meta.review), meta.review);
    if (SHARED_READY) {
        assert.ok(meta.sharedSource, 'ortak dua metni girildiyse kaynağı da yazılmalı');
    }
});
