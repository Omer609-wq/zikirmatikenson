import test from 'node:test';
import assert from 'node:assert/strict';
import {
    chartTopFor,
    chartScaleMax,
    chartAxisLabels,
    formatChartAxisValue,
    EMPTY_CHART_TOP
} from './chart-scale.js';

test('tavan en yakin ustteki 10un kati', () => {
    assert.equal(chartTopFor(99), 100);
    assert.equal(chartTopFor(100), 100);
    assert.equal(chartTopFor(101), 110);
    assert.equal(chartTopFor(10), 10);
    assert.equal(chartTopFor(11), 20);
    assert.equal(chartTopFor(6849), 6850);
});

test('10dan kucukse tavan degerin kendisi', () => {
    for (let n = 1; n <= 9; n++) assert.equal(chartTopFor(n), n);
});

test('cekim yoksa ya da deger bozuksa bos eksen', () => {
    for (const bad of [0, -5, NaN, undefined, null, 'x']) {
        assert.equal(chartTopFor(bad), EMPTY_CHART_TOP);
    }
});

test('en yuksek cubuk tam boy ya da ona yakin: 101 artik yari boy degil', () => {
    // Eski yuvarlamada 101 -> 200, cubuk %50 kaliyordu.
    assert.ok(101 / chartTopFor(101) > 0.9);
    for (let n = 1; n <= 1000; n++) {
        const top = chartTopFor(n);
        assert.ok(top >= n, `${n} tavani asmamali`);
        assert.ok(top - n < 10, `${n} -> ${top}: 10dan fazla bosluk`);
    }
});

test('olcek dizinin en buyugunden; bos ve bozuk degerler guvenli', () => {
    assert.equal(chartScaleMax([0, 12, 101, 7]), 110);
    assert.equal(chartScaleMax([0, 0, 0]), EMPTY_CHART_TOP);
    assert.equal(chartScaleMax([]), EMPTY_CHART_TOP);
    assert.equal(chartScaleMax(null), EMPTY_CHART_TOP);
    assert.equal(chartScaleMax([3, NaN, undefined]), 3);
});

test('ortanca tavanin tam yarisi; 100de takili kalmaz', () => {
    assert.deepEqual(chartAxisLabels(100), { top: 100, mid: 50, bottom: 0 });
    assert.deepEqual(chartAxisLabels(110), { top: 110, mid: 55, bottom: 0 });
    assert.deepEqual(chartAxisLabels(300), { top: 300, mid: 150, bottom: 0 });
    assert.deepEqual(chartAxisLabels(3), { top: 3, mid: 1.5, bottom: 0 });
    assert.deepEqual(chartAxisLabels(0), { top: EMPTY_CHART_TOP, mid: EMPTY_CHART_TOP / 2, bottom: 0 });
});

test('eksen etiketi: tam sayi oldugu gibi, kesir dilin ayraciyla ve Latin rakamla', () => {
    assert.equal(formatChartAxisValue(6850, 'tr-TR'), '6850');
    assert.equal(formatChartAxisValue(55, 'ar'), '55');
    assert.equal(formatChartAxisValue(1.5, 'tr-TR'), '1,5');
    assert.equal(formatChartAxisValue(1.5, 'en-US'), '1.5');
    assert.match(formatChartAxisValue(1.5, 'ar'), /^1\D5$/);
    assert.match(formatChartAxisValue(4.5, 'bn-BD'), /^4\D5$/);
});
