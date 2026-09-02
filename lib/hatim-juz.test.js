import test from 'node:test';
import assert from 'node:assert/strict';
import surahIndex from '../data/quran/index.json' with { type: 'json' };
import {
    HATIM_JUZ_COUNT,
    getJuzDetail,
    getJuzRange,
    getJuzReadStart,
    listJuzDetails
} from './hatim-juz.js';

const TOTAL_AYAHS = 6236;
const TOTAL_PAGES = 604;

test('30 cüzün tamamı üretilir', () => {
    const all = listJuzDetails();
    assert.equal(HATIM_JUZ_COUNT, 30);
    assert.equal(all.length, 30);
    assert.deepEqual(
        all.map((d) => d.juz),
        Array.from({ length: 30 }, (_, i) => i + 1)
    );
});

/**
 * Cüz sınırları bozulursa toplam ayet sayısı tutmaz. juz.json'da bir sınır kayarsa
 * veya bir cüz düşerse bu test yakalar — 30 ayrı beklenti yazmaktan daha güvenli.
 */
test('cüzlerin ayet sayıları toplamı Kuran"ın tamamını verir', () => {
    const total = listJuzDetails().reduce((sum, d) => sum + d.ayahCount, 0);
    assert.equal(total, TOTAL_AYAHS);
});

test('cüzler mushafın 604 sayfasını boşluksuz kaplar', () => {
    const all = listJuzDetails();
    assert.equal(all[0].startPage, 1);
    assert.equal(all[29].endPage, TOTAL_PAGES);
    for (let i = 1; i < all.length; i += 1) {
        const prevEnd = all[i - 1].endPage;
        const start = all[i].startPage;
        // Bir cüz, öncekinin bittiği sayfada veya hemen sonrasında başlar
        // (sayfa ortasında biten cüzlerde aynı sayfa paylaşılır).
        assert.ok(
            start === prevEnd || start === prevEnd + 1,
            `cüz ${i + 1} sayfa ${start}, önceki cüz ${prevEnd} sayfasında bitmişti`
        );
    }
});

test('her cüz bir sonrakinin başlangıcından hemen önce biter', () => {
    const all = listJuzDetails();
    const ayahCountByN = new Map(surahIndex.map((s) => [s.n, s.ayahCount]));
    for (let i = 0; i < all.length - 1; i += 1) {
        const end = all[i].end;
        const next = all[i + 1].start;
        const expected =
            end.ayah === ayahCountByN.get(end.surah)
                ? { surah: end.surah + 1, ayah: 1 }
                : { surah: end.surah, ayah: end.ayah + 1 };
        assert.deepEqual(next, expected, `cüz ${i + 1} → ${i + 2} arasında boşluk var`);
    }
});

test('1. cüz Fatiha"dan başlar, Bakara 141"de biter', () => {
    const d = getJuzDetail(1);
    assert.deepEqual(d.start, { surah: 1, ayah: 1 });
    assert.deepEqual(d.end, { surah: 2, ayah: 141 });
    assert.equal(d.startPage, 1);
    assert.equal(d.ayahCount, 7 + 141);
    assert.equal(d.surahCount, 2);
    // Fatiha tam okunur, Bakara kısmi kalır
    assert.equal(d.surahs[0].complete, true);
    assert.equal(d.surahs[1].complete, false);
    assert.deepEqual(
        { from: d.surahs[1].from, to: d.surahs[1].to },
        { from: 1, to: 141 }
    );
});

test('30. cüz Nebe"den Nas"a kadar 37 sure kapsar', () => {
    const d = getJuzDetail(30);
    assert.deepEqual(d.start, { surah: 78, ayah: 1 });
    assert.deepEqual(d.end, { surah: 114, ayah: 6 });
    assert.equal(d.endPage, TOTAL_PAGES);
    assert.equal(d.surahCount, 37);
    assert.equal(d.ayahCount, 564);
    // Baştan sona okunduğu için hepsi tam
    assert.ok(d.surahs.every((s) => s.complete));
});

test('19. cüz Furkan 21"den Neml 55"e — eksik cüz nöbeti', () => {
    // juz.json'da bir dönem 19. cüz hiç yoktu; kayıt düşerse burası kırılır.
    const d = getJuzDetail(19);
    assert.deepEqual(d.start, { surah: 25, ayah: 21 });
    assert.deepEqual(d.end, { surah: 27, ayah: 55 });
});

test('cüz ortasındaki sureler tam okunur olarak işaretlenir', () => {
    const d = getJuzDetail(21); // Ankebut 46 → Ahzab 30, arada Rum/Lokman/Secde tam
    const middle = d.surahs.slice(1, -1);
    assert.ok(middle.length > 0);
    assert.ok(middle.every((s) => s.complete), 'aradaki sureler tam olmalı');
    assert.equal(d.surahs[0].complete, false);
    assert.equal(d.surahs.at(-1).complete, false);
});

test('ayet aralıkları sure ayet sayısını aşmaz', () => {
    const ayahCountByN = new Map(surahIndex.map((s) => [s.n, s.ayahCount]));
    for (const d of listJuzDetails()) {
        for (const span of d.surahs) {
            assert.ok(span.from >= 1, `cüz ${d.juz} sure ${span.surah} başlangıcı geçersiz`);
            assert.ok(
                span.to <= ayahCountByN.get(span.surah),
                `cüz ${d.juz} sure ${span.surah} bitişi ayet sayısını aşıyor`
            );
            assert.equal(span.ayahCount, span.to - span.from + 1);
        }
    }
});

test('geçersiz cüz numarası null döner', () => {
    for (const bad of [0, 31, -1, 1.5, NaN, null, undefined, 'x']) {
        assert.equal(getJuzDetail(bad), null, `${String(bad)} için null bekleniyordu`);
        assert.equal(getJuzRange(bad), null);
        assert.equal(getJuzReadStart(bad), null);
    }
});

test('okuma başlangıcı cüzün ilk ayetini ve sayfasını verir', () => {
    assert.deepEqual(getJuzReadStart(1), { surah: 1, ayah: 1, page: 1 });
    assert.deepEqual(getJuzReadStart(30), { surah: 78, ayah: 1, page: 582 });
});

test('detay nesnesi değiştirilemez', () => {
    const d = getJuzDetail(5);
    assert.throws(() => {
        d.ayahCount = 0;
    }, TypeError);
    assert.equal(getJuzDetail(5).ayahCount, d.ayahCount);
});
