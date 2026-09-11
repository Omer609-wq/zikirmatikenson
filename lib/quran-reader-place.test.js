import test from 'node:test';
import assert from 'node:assert/strict';
import {
    resolveQuranReaderSurahId,
    resolveScrollPlaceRestore,
    resolveMushafTargetEnteringFromList,
    resolveScrollTargetLeavingMushaf,
    getMushafNavOptsForRerender,
    getNavOptsForSurahOpen
} from './quran-reader-place.js';

test('okunan sure: ekranda görünen, uygulama durumundakinden önce gelir', () => {
    // Oklarla 1'den 5'e atlandı; durum hâlâ 1 diyor.
    assert.equal(resolveQuranReaderSurahId(1, 5), 5);
    assert.equal(resolveQuranReaderSurahId(1, null), 1);
    assert.equal(resolveQuranReaderSurahId(null, null), 1);
    assert.equal(resolveQuranReaderSurahId(7, 0), 7, 'geçersiz görünür sure yok sayılır');
    assert.equal(resolveQuranReaderSurahId(7, 115), 7);
    assert.equal(resolveQuranReaderSurahId('abc', undefined), 1);
    assert.equal(resolveQuranReaderSurahId(2.9, null), 2);
});

test('konum geri yükleme: açık ayet isteği her şeyden önce gelir', () => {
    assert.equal(
        resolveScrollPlaceRestore({
            scrollAyah: 20,
            forceSurahStart: true,
            savedAnchor: { surah: 2, ayah: 5 },
            savedReaderScrollTop: 9000
        }),
        'ayah'
    );
});

test('konum geri yükleme: sure açılışı eski konumu geri yüklemez', () => {
    // Okuyucunun içinden başka sureye geçiş: çapa ve piksel eski sureye ait.
    assert.equal(
        resolveScrollPlaceRestore({
            forceSurahStart: true,
            savedAnchor: { surah: 2, ayah: 5 },
            savedReaderScrollTop: 9000
        }),
        'surah'
    );
});

test('konum geri yükleme: yerinde yeniden çizimde piksel değil ayet çapası', () => {
    assert.equal(
        resolveScrollPlaceRestore({ savedAnchor: { surah: '2', ayah: '19' }, savedReaderScrollTop: 6000 }),
        'anchor'
    );
});

test('konum geri yükleme: çapa yoksa piksel, o da yoksa sure başı', () => {
    assert.equal(resolveScrollPlaceRestore({ savedAnchor: null, savedReaderScrollTop: 6000 }), 'pixel');
    assert.equal(resolveScrollPlaceRestore({ savedAnchor: { surah: 0, ayah: 3 }, savedReaderScrollTop: 10 }), 'pixel');
    assert.equal(resolveScrollPlaceRestore({ savedReaderScrollTop: 0 }), 'surah');
    assert.equal(resolveScrollPlaceRestore({}), 'surah');
    assert.equal(resolveScrollPlaceRestore(), 'surah');
});

test('listeden mushafa: ekrandaki ayet hedef olur', () => {
    assert.deepEqual(resolveMushafTargetEnteringFromList({ surah: '2', ayah: '20', offset: -4 }), {
        surah: 2,
        ayah: 20
    });
    assert.equal(resolveMushafTargetEnteringFromList(null), null);
    assert.equal(resolveMushafTargetEnteringFromList({ surah: 2, ayah: 0 }), null);
    assert.equal(resolveMushafTargetEnteringFromList({ surah: 200, ayah: 1 }), null);
});

test('mushaftan listeye: açık sayfanın ilk ayeti, Fatihaya sıfırlanmaz', () => {
    assert.deepEqual(resolveScrollTargetLeavingMushaf({ s: 2, a: 25 }, 1), { surah: 2, ayah: 25 });
    assert.deepEqual(resolveScrollTargetLeavingMushaf(null, 36), { surah: 36, ayah: 1 });
    assert.deepEqual(resolveScrollTargetLeavingMushaf(undefined, 'x'), { surah: 1, ayah: 1 });
    assert.deepEqual(resolveScrollTargetLeavingMushaf({ s: 0, a: 1 }, 18), { surah: 18, ayah: 1 });
});

test('mushaf yeniden çizimi: "kaldığım sayfa" kapalıyken bayat kayıtlı sayfa tercih edilmez', () => {
    assert.deepEqual(getMushafNavOptsForRerender('mushaf', false), {});
    assert.deepEqual(getMushafNavOptsForRerender('mushaf', true), { preferSaved: true });
    assert.deepEqual(getMushafNavOptsForRerender('scroll', true), {});
});

test('sure açılışı: listede sure başına zorla, mushafta mevcut davranış', () => {
    assert.deepEqual(getNavOptsForSurahOpen({ readerLayout: 'scroll', rememberPage: false }), {
        forceSurahStart: true
    });
    assert.deepEqual(getNavOptsForSurahOpen({ readerLayout: 'scroll', rememberPage: true }), {
        forceSurahStart: true
    });
    assert.deepEqual(getNavOptsForSurahOpen({ readerLayout: 'mushaf', rememberPage: true }), { preferSaved: true });
    assert.deepEqual(getNavOptsForSurahOpen({ readerLayout: 'mushaf', rememberPage: false }), {});
    // Belirli ayet istendiyse hiçbir zorlama yok: ayete gidilir.
    assert.deepEqual(getNavOptsForSurahOpen({ scrollAyah: 12, readerLayout: 'scroll', rememberPage: false }), {});
});
