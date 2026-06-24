import test from 'node:test';
import assert from 'node:assert/strict';
import {
    DEFAULT_APP_LOCALE,
    normalizeAppLocale,
    resolveLocaleFromSystem,
    resolveLocaleFromTag
} from '../lib/app-locale.js';

test('resolveLocaleFromTag maps BCP-47 tags to supported codes', () => {
    assert.equal(resolveLocaleFromTag('en-US'), 'en');
    assert.equal(resolveLocaleFromTag('en_GB'), 'en');
    assert.equal(resolveLocaleFromTag('tr-TR'), 'tr');
    assert.equal(resolveLocaleFromTag('ar-SA'), 'ar');
    assert.equal(resolveLocaleFromTag('id-ID'), 'id');
    assert.equal(resolveLocaleFromTag('ms-MY'), 'ms');
    assert.equal(resolveLocaleFromTag('fr-FR'), 'fr');
    assert.equal(resolveLocaleFromTag('bn-BD'), 'bn');
    assert.equal(resolveLocaleFromTag('ur-PK'), 'ur');
});

test('resolveLocaleFromTag returns null for unsupported languages', () => {
    assert.equal(resolveLocaleFromTag('de-DE'), null);
    assert.equal(resolveLocaleFromTag('zh-CN'), null);
    assert.equal(resolveLocaleFromTag(''), null);
});

test('resolveLocaleFromSystem prefers first supported candidate', () => {
    assert.equal(resolveLocaleFromSystem({ candidates: ['de-DE', 'fr-FR', 'en-US'] }), 'fr');
    assert.equal(resolveLocaleFromSystem({ candidates: ['de-DE', 'zh-CN', 'en-US'] }), 'en');
    assert.equal(resolveLocaleFromSystem({ candidates: ['de-DE', 'tr-TR'] }), 'tr');
    assert.equal(resolveLocaleFromSystem({ candidates: ['ms-MY'] }), 'ms');
});

test('resolveLocaleFromSystem falls back to English', () => {
    assert.equal(resolveLocaleFromSystem({ candidates: ['de-DE', 'pt-BR'] }), DEFAULT_APP_LOCALE);
    assert.equal(resolveLocaleFromSystem({ candidates: [] }), DEFAULT_APP_LOCALE);
});

test('normalizeAppLocale uses English for invalid stored codes', () => {
    assert.equal(normalizeAppLocale('de'), 'en');
    assert.equal(normalizeAppLocale(''), 'en');
    assert.equal(normalizeAppLocale('tr'), 'tr');
});
