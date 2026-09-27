import test from 'node:test';
import assert from 'node:assert/strict';
import { foldForFilter, isNameAllowed } from './name-filter.js';

test('normalleştirme: büyük harf, Türkçe harf, aksan, leet', () => {
    assert.equal(foldForFilter('SIKÇA Ölçü'), 'sikca olcu');
    assert.equal(foldForFilter('İbrahim'), 'ibrahim');
    assert.equal(foldForFilter('Café'), 'cafe');
    assert.equal(foldForFilter('0r0spu'), 'orospu');
    assert.equal(foldForFilter('أحمد'), 'احمد');
});

test('yaygın küfür ve hakaret yakalanır', () => {
    for (const ad of [
        'Orospu',
        'siktir git',
        'amk grubu',
        'Fuck this',
        'bullshit',
        'you bitch',
        'Putain',
        'bangsat',
        'madarchod',
        'شرموطة',
        'كس'
    ]) {
        assert.equal(isNameAllowed(ad), false, ad);
    }
});

test('gizleme denemeleri yakalanır: ayırıcı, tekrar, rakam, büyük harf', () => {
    for (const ad of ['s.i.k.t.i.r', 'o r o s p u', '0r0spu', 'fuuuuck', 'F.U.C.K', 'SİKTİR', 'Amına koyayım', 'y4rr4k']) {
        assert.equal(isNameAllowed(ad), false, ad);
    }
});

test('masum adlar geçer — yanlış alarm yok', () => {
    for (const ad of [
        'Mahalle Camii',
        'Cuma Hatmi',
        'Allah rızası için',
        'Ahmet Aksu',
        'Amina',
        'Aminah',
        'Sık Okuyanlar',
        'Sıkı Dostlar',
        'Sıkıntısızlar',
        'Bayrak Grubu',
        'Ayırarak okuyoruz',
        'Nigeria Muslims',
        'Niger',
        'Scunthorpe',
        'Assembly Hall',
        'Class of 2026',
        'Dispute Free Group',
        'Göteborg',
        'Sikke',
        'I am here',
        'We got this',
        'Hatim 30 Cüz',
        'دخول',
        'كسر',
        'زبدة',
        'Harambe',
        'Haram olmasın',
        'Randi',
        'চোদ্দ',
        'Müslüman Kardeşler',
        'Ramazan 2026'
    ]) {
        assert.equal(isNameAllowed(ad), true, ad);
    }
});

test('boş ya da harfsiz ad süzgece takılmaz (boşluğu başka kontrol yakalar)', () => {
    assert.equal(isNameAllowed(''), true);
    assert.equal(isNameAllowed('   '), true);
    assert.equal(isNameAllowed('2026'), true);
    assert.equal(isNameAllowed(null), true);
});
