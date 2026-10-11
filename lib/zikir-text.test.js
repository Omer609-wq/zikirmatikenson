import test from 'node:test';
import assert from 'node:assert/strict';
import { ZIKIR_TEXT_MAX, normalizeFolderName, normalizeZikirText } from './zikir-text.js';

test('ad tek satıra iner, not paragraflarını korur', () => {
    assert.equal(normalizeZikirText('name', '  Sabah\n tesbihi '), 'Sabah tesbihi');
    assert.equal(normalizeZikirText('meaning', 'Birinci\n\nİkinci'), 'Birinci\n\nİkinci');
    assert.equal(normalizeZikirText('fazilet', 'a\nb'), 'a\nb');
    assert.equal(normalizeZikirText('arabic', 'سُبْحَانَ\n\nاللَّهِ'), 'سُبْحَانَ\n\nاللَّهِ');
});

test('sınırlar uygulamanın kendi metnini kesmez', () => {
    // Üç ayetlik Kur'an zikri en uzun hâlinde ~2.550 Arapça, ~6.800 meal + okunuş
    assert.ok(ZIKIR_TEXT_MAX.arabic >= 2600);
    assert.ok(ZIKIR_TEXT_MAX.meaning >= 7000);
    assert.equal(normalizeZikirText('meaning', 'x'.repeat(6800)).length, 6800);
});

test('sınırı aşan metin kesilir, klasör adı 60 karakter', () => {
    assert.equal(normalizeZikirText('name', 'a'.repeat(450)).length, ZIKIR_TEXT_MAX.name);
    assert.equal(normalizeFolderName('k'.repeat(70)).length, 60);
});
