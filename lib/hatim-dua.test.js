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
/** Ortak duanın Arapçası girildi mi? */
const SHARED_TEXT = Boolean(duaData.shared?.arabic);
/** Türkçe okunuş ve meal girildi mi — içerik testleri ancak o zaman anlamlı. */
const SHARED_TR = Boolean(
    duaData.shared?.arabic && duaData.shared?.translit?.tr && duaData.shared?.meaning?.tr
);
/** Kalan diller de tamamlandı mı? Metin dil dil girildiği için ayrı kapı. */
const SHARED_ALL = Boolean(
    SHARED_TR &&
        UI_LOCALES.filter((l) => l !== 'ar').every((l) => duaData.shared?.meaning?.[l])
);

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
    if (SHARED_TEXT) {
        assert.equal(dua.fallback, false);
        assert.equal(dua.arabic, duaData.shared.arabic);
    } else {
        // Geçici köprü: grup ekranı boş kalmasın diye kişisel dua gösterilir.
        assert.equal(dua.fallback, true, 'düşüş bildirilmeli');
        assert.equal(dua.arabic, duaData.personal.arabic);
    }
});

test('ortak dua girilince öznesi çoğul olmalı', { skip: !SHARED_TR }, () => {
    const dua = getHatimDua('tr', HATIM_DUA_SHARED);
    assert.notEqual(dua.arabic, duaData.personal.arabic, 'kişisel duayla aynı olamaz');
    // "bize / bizim / bizi" — ortak hatmin duası cemaat adına konuşur.
    assert.match(dua.meaning, /biz/i);
});

test('ortak duanın üç katmanı aynı paragraf sayısında', { skip: !SHARED_TR }, () => {
    // Arapça, okunuş ve meal satır satır hizalı diziliyor; biri düzenlenip
    // diğeri unutulursa ekranda paragraflar kayar.
    const say = (metin) => metin.split('\n').filter(Boolean).length;
    const arapca = say(duaData.shared.arabic);
    assert.equal(say(duaData.shared.translit.tr), arapca, 'okunuş tr paragraf sayısı tutmuyor');
    assert.equal(say(duaData.shared.translit.en), arapca, 'okunuş en paragraf sayısı tutmuyor');
    for (const locale of UI_LOCALES.filter((l) => l !== 'ar')) {
        const meal = duaData.shared.meaning[locale];
        // Meal dil dil yazılıyor; henüz yazılmamış dil "hizasız" değil, "yok"
        // demektir. Hiçbirinin boş kalmadığını SHARED_ALL testi ayrıca sınıyor.
        if (!meal) continue;
        assert.equal(say(meal), arapca, `${locale} ortak meal paragraf sayısı tutmuyor`);
    }
});

test('kişisel duanın tüm katmanları 4 satır hizalıdır', () => {
    const say = (metin) => metin.split('\n').filter(Boolean).length;
    const arapca = say(duaData.personal.arabic);
    assert.equal(arapca, 4, 'kişisel dua 4 satır olmalı');
    assert.equal(say(duaData.personal.translit.tr), 4, 'kişisel okunuş tr 4 satır olmalı');
    assert.equal(say(duaData.personal.translit.en), 4, 'kişisel okunuş en 4 satır olmalı');
    for (const locale of UI_LOCALES.filter((l) => l !== 'ar')) {
        assert.equal(
            say(duaData.personal.meaning[locale]),
            4,
            `${locale} kişisel meal 4 satır olmalı`
        );
    }
});

test('Arapça metinlerde font artefaktı (U+06EA) bulunmaz, standart kasra kullanılır', () => {
    assert.ok(!duaData.personal.arabic.includes('\u06EA'), 'personal.arabic U+06EA içeriyor');
    assert.ok(!duaData.shared.arabic.includes('\u06EA'), 'shared.arabic U+06EA içeriyor');
});

test('ortak dua tüm dillerde eksiksiz olmalı', { skip: !SHARED_ALL }, () => {
    for (const locale of UI_LOCALES.filter((l) => l !== 'ar')) {
        assert.ok(
            getHatimDua(locale, HATIM_DUA_SHARED).meaning.length > 0,
            `${locale}: ortak dua meali boş`
        );
    }
    assert.ok(duaData.shared.translit.tr.length > 0, 'tr okunuşu boş');
    assert.ok(duaData.shared.translit.en.length > 0, 'en okunuşu boş');
});

test('Bengalce mealde dua adabına uymayan emir kipi kullanılmaz', () => {
    // 'বানান' günlük emir ("yap/imal et") ve ayrıca "imla" demek; Allah'a
    // niyazda hürmet bildiren 'বানিয়ে দিন' kullanılır. İlk yazımda ortak duaya
    // kaba biçim kaçmıştı, kişisel duada ise doğrusu vardı.
    for (const [ad, metin] of [
        ['personal', duaData.personal.meaning.bn],
        ['shared', duaData.shared.meaning.bn]
    ]) {
        if (!metin) continue;
        assert.ok(
            !/বানান(?!িয়ে)/.test(metin),
            `${ad}: Bengalce mealde kaba emir 'বানান' var`
        );
    }
});

test('Urduca mealde çıplak emir kipi kullanılmaz', () => {
    // Urducada yalın 'بنا / پہنا / بچا' akrana verilen günlük emirdir. Allah'a
    // münacatta tazarru bildiren yardımcı fiil eklenir: بنا دے / پہنا دے / بچا لے.
    // Yalnızca cümle sonu aranır — 8. satırdaki 'بنا کر بھیجا' sıfat-fiildir,
    // emir değildir ve yakalanmamalı.
    for (const [ad, metin] of [
        ['personal', duaData.personal.meaning.ur],
        ['shared', duaData.shared.meaning.ur]
    ]) {
        if (!metin) continue;
        const ciplak = metin.match(/(بنا|پہنا|بچا)(?=[۔،])/g);
        assert.equal(ciplak, null, `${ad}: Urduca mealde çıplak emir -> ${ciplak}`);
    }
});

test('Arapça metinde Latin harf bulunmaz', () => {
    // Yapıştırma sırasında ن yerine n, ي yerine i gelmişti; sessizce geçerse
    // ekranda bozuk kelime çıkar ve fark edilmesi zordur.
    const bloklar = [
        ['personal', duaData.personal.arabic],
        ['shared', duaData.shared.arabic]
    ];
    for (const [ad, metin] of bloklar) {
        if (!metin) continue;
        const latin = metin.match(/[A-Za-z]/g);
        assert.equal(latin, null, `${ad}: Latin harf var -> ${latin && latin.join(',')}`);
    }
});

test('ortak dua paragraflara bölünmüş olmalı', { skip: !SHARED_TEXT }, () => {
    const satirlar = duaData.shared.arabic.split('\n').filter(Boolean);
    assert.ok(satirlar.length >= 8, `paragraf sayısı az: ${satirlar.length}`);
    // Yapıştırmada sınırlar kaybolunca paragraflar birbirine yapışıyordu.
    assert.ok(!duaData.shared.arabic.includes('اَجْمَع۪ينَرَبَّنَا'), 'paragraflar yapışık');
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
    // İki dua ayrı ayrı izlenir: ortak dua kullanıcının mushafından geldiği için
    // doğrulandı, kişisel duanın Arapçası hâlâ kaynağa bağlanmadı.
    for (const alan of ['personalReview', 'sharedReview']) {
        assert.ok(['text-unverified', 'verified'].includes(meta[alan]), `${alan}: ${meta[alan]}`);
    }
    // "verified" demek bir iddiadır; neyin doğrulandığı yazılmadan geçilemez.
    if (meta.sharedReview === 'verified') {
        assert.ok(meta.sharedReviewScope, 'sharedReview verified ise kapsamı yazılmalı');
    }
    if (meta.personalReview === 'verified') {
        assert.ok(meta.personalReviewScope, 'personalReview verified ise kapsamı yazılmalı');
    }
    if (SHARED_TEXT) {
        assert.ok(meta.sharedSource, 'ortak dua metni girildiyse kaynağı da yazılmalı');
    }
});
