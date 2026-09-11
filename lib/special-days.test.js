import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
    SPECIAL_DAY_KINDS,
    normalizeSpecialDays,
    mergeSpecialDays,
    activeSpecialDay,
    formatHijriTr,
    specialDayName,
    specialDayPartLabel,
    specialDayYears,
    specialDaysForYear,
    specialDayStatus,
    specialDayStatusLabel,
    defaultSpecialDaysYear
} from './special-days.js';

const data = JSON.parse(readFileSync(new URL('../data/special-days.json', import.meta.url), 'utf8'));
const days = normalizeSpecialDays(data.days);
const at = (y, m, d, h = 12, min = 0) => new Date(y, m - 1, d, h, min);
const activeId = (now) => {
    const e = activeSpecialDay(days, now);
    return e ? `${e.id}${e.part ? e.part : ''}` : null;
};

test('gomulu liste: her girdi gecerli ve tarih sirali', () => {
    assert.equal(days.length, data.days.length, 'normalize hicbir girdiyi atmamali');
    assert.deepEqual(days.map((e) => e.date), [...days.map((e) => e.date)].sort());
});

test('gomulu liste: her yilda Diyanet listesindeki gunler eksiksiz', () => {
    const count = (year) => {
        const out = {};
        for (const e of specialDaysForYear(days, year)) out[e.id] = (out[e.id] || 0) + 1;
        return out;
    };
    const everyYear = {
        berat: 1, ramazanBaslangici: 1, kadir: 1, arefe: 2, ramazanBayrami: 3, kurbanBayrami: 4,
        hicriYilbasi: 1, asure: 1, mevlid: 1, ucAylar: 1, regaib: 1
    };
    assert.deepEqual(count(2026), { ...everyYear, mirac: 1 });
    // 2027'de Miraç iki kez: Ocak (1448) ve Aralık (1449).
    assert.deepEqual(count(2027), { ...everyYear, mirac: 2 });
});

test('gomulu liste: hicri tarih takvimle en fazla 1 gun farkli (yazim hatasi yakalar)', () => {
    // Diyanet ile Suudi (Ummulkura) takvimi bir gun ayrisabiliyor; daha fazlasi veri hatasi.
    const fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'numeric', year: 'numeric' });
    const hijriOf = (date) => {
        const p = Object.fromEntries(fmt.formatToParts(date).map((x) => [x.type, x.value]));
        return [Number(p.day), Number(p.month), Number.parseInt(p.year, 10)].join('/');
    };
    for (const e of days) {
        const [y, m, d] = e.date.split('-').map(Number);
        const near = [-1, 0, 1].map((k) => hijriOf(new Date(y, m - 1, d + k)));
        assert.ok(near.includes(e.hijri.join('/')), `${e.date} ${e.id}: Diyanet ${e.hijri.join('/')}, takvim ${near.join(' | ')}`);
    }
});

test('kandil gunu boyunca ve gece sabaha kadar etkin', () => {
    assert.equal(activeId(at(2026, 8, 23, 23, 59)), null);
    assert.equal(activeId(at(2026, 8, 24, 0, 0)), 'mevlid');
    assert.equal(activeId(at(2026, 8, 24, 21)), 'mevlid');
    assert.equal(activeId(at(2026, 8, 25, 5, 59)), 'mevlid');
    assert.equal(activeId(at(2026, 8, 25, 6, 0)), null);
});

test('gunduz gunleri yalnizca o gun; bayram gunleri sirayla', () => {
    assert.equal(activeId(at(2026, 5, 26, 23, 59)), 'arefe');
    assert.equal(activeId(at(2026, 5, 27, 0, 30)), 'kurbanBayrami1');
    assert.equal(activeId(at(2026, 5, 30, 20)), 'kurbanBayrami4');
    assert.equal(activeId(at(2026, 5, 31, 1)), null);
});

test('ayni gunde gece olan once: Regaib, Uc Aylar ile ayni gun', () => {
    assert.equal(activeId(at(2026, 12, 10, 9)), 'regaib');
});

test('bugunun gunu dunku kandil gecesinin devamindan once gelir', () => {
    const list = normalizeSpecialDays([
        { date: '2030-01-01', hijri: [1, 1, 1452], id: 'kadir' },
        { date: '2030-01-02', hijri: [2, 1, 1452], id: 'arefe' }
    ]);
    assert.equal(activeSpecialDay(list, at(2030, 1, 2, 2)).id, 'arefe');
    assert.equal(activeSpecialDay(list, at(2030, 1, 1, 22)).id, 'kadir');
});

test('gecersiz girdiler atilir', () => {
    const list = normalizeSpecialDays([
        { date: '2026-02-30', hijri: [1, 1, 1447], id: 'asure' },
        { date: '2026-01-01', hijri: [1, 13, 1447], id: 'asure' },
        { date: '2026-01-01', hijri: [1, 1, 1447], id: 'bilinmeyen' },
        { date: '26-1-1', hijri: [1, 1, 1447], id: 'asure' },
        null,
        { date: '2026-01-01', hijri: [1, 1, 1447], id: 'asure', part: 9 }
    ]);
    assert.deepEqual(list, [{ date: '2026-01-01', hijri: [1, 1, 1447], id: 'asure' }]);
    assert.deepEqual(normalizeSpecialDays(undefined), []);
});

test('uzaktan gelen yil gomulunun o yilinin yerine gecer, digerleri kalir', () => {
    const remote = [
        { date: '2027-03-06', hijri: [27, 9, 1448], id: 'kadir' },
        { date: '2028-02-24', hijri: [26, 9, 1449], id: 'kadir' },
        { date: 'bozuk', id: 'kadir' }
    ];
    const merged = mergeSpecialDays(data.days, remote);
    assert.equal(specialDaysForYear(merged, 2026).length, specialDaysForYear(days, 2026).length);
    assert.deepEqual(specialDaysForYear(merged, 2027).map((e) => e.date), ['2027-03-06']);
    assert.deepEqual(specialDayYears(merged), [2026, 2027, 2028]);
    assert.deepEqual(mergeSpecialDays(data.days, null), days);
    assert.deepEqual(mergeSpecialDays(data.days, [{ date: 'bozuk' }]), days);
});

test('ad ve hicri tarih turkce', () => {
    assert.equal(formatHijriTr([11, 3, 1448]), '11 Rebiülevvel 1448');
    assert.equal(formatHijriTr([1, 7, 1448]), '1 Recep 1448');
    const bayram = days.find((e) => e.id === 'ramazanBayrami' && e.part === 2);
    assert.equal(specialDayName(bayram), 'Ramazan Bayramı');
    assert.equal(specialDayPartLabel(bayram), '2. Gün');
    assert.equal(specialDayPartLabel(days.find((e) => e.id === 'kadir')), '');
    for (const id of Object.keys(SPECIAL_DAY_KINDS)) assert.ok(SPECIAL_DAY_KINDS[id].name);
});

test('liste durumu: gecti / bugun / yarin / N gun sonra', () => {
    const mevlid = days.find((e) => e.date === '2026-08-24');
    const regaib = days.find((e) => e.date === '2026-12-10' && e.id === 'regaib');
    const label = (e, now) => specialDayStatusLabel(specialDayStatus(e, now));
    assert.equal(label(mevlid, at(2026, 9, 11)), 'Geçti');
    assert.equal(label(mevlid, at(2026, 8, 24, 10)), 'Bugün');
    // Gece sabaha kadar surdugu icin ertesi gun 03:00'te hala "Bugün".
    assert.equal(label(mevlid, at(2026, 8, 25, 3)), 'Bugün');
    assert.equal(label(mevlid, at(2026, 8, 23, 18)), 'Yarın');
    assert.equal(label(regaib, at(2026, 9, 11, 23)), '90 gün sonra');
});

test('liste acilinca siradaki gunun yili', () => {
    assert.equal(defaultSpecialDaysYear(days, at(2026, 9, 11)), 2026);
    assert.equal(defaultSpecialDaysYear(days, at(2026, 12, 20)), 2027);
    assert.equal(defaultSpecialDaysYear(days, at(2031, 1, 1)), 2027);
    assert.equal(defaultSpecialDaysYear([], at(2031, 1, 1)), 2031);
});
