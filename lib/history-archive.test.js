import test from 'node:test';
import assert from 'node:assert/strict';
import {
    archiveDaysBefore,
    monthlyArchiveTotal,
    removeZikirsFromMonthly,
    sanitizeHistoryMonthly,
    yearArchiveTotal
} from './history-archive.js';

/** app.js pruneHistory'nin özü: özete aktar, sonra kesim öncesini sil. */
function prune(history, monthly, cutoff) {
    archiveDaysBefore(history, monthly, cutoff);
    for (const day of Object.keys(history)) if (day < cutoff) delete history[day];
}

/** app.js totalClicksForYear: günlük geçmiş + özet. */
function yearTotal(history, monthly, year, zid) {
    let sum = yearArchiveTotal(monthly, year, zid);
    for (const day of Object.keys(history)) {
        if (!day.startsWith(`${year}-`)) continue;
        const block = history[day];
        sum += zid ? block[zid] || 0 : Object.values(block).reduce((a, b) => a + b, 0);
    }
    return sum;
}

test('budanan yıl beş yıllık grafikte 0 olmaz (rapor F17)', () => {
    const history = {
        '2024-03-05': { z1: 100 },
        '2025-01-10': { z1: 20, z2: 5 },
        '2025-11-02': { z1: 7 },
        '2026-10-01': { z2: 3 }
    };
    const monthly = {};
    const before = ['2024', '2025', '2026'].map((y) => yearTotal(history, monthly, y));

    prune(history, monthly, '2025-09-07');

    assert.deepEqual(Object.keys(history).sort(), ['2025-11-02', '2026-10-01']);
    const after = ['2024', '2025', '2026'].map((y) => yearTotal(history, monthly, y));
    assert.deepEqual(after, before, 'budama yıl toplamlarını değiştirmemeli');
    assert.deepEqual(after, [100, 32, 3]);
    assert.equal(yearTotal(history, monthly, '2025', 'z1'), 27);
    assert.equal(monthlyArchiveTotal(monthly, '2025-01'), 25);
    assert.equal(monthlyArchiveTotal(monthly, '2025-01', 'z2'), 5);
});

test('aynı ay iki budamada birikir, gün iki kez sayılmaz', () => {
    const monthly = {};
    const h1 = { '2025-01-03': { z1: 4 } };
    prune(h1, monthly, '2025-01-05');
    // Ertesi açılışta aynı ayın sonraki günü budanır; önceki gün artık geçmişte yok
    const h2 = { '2025-01-20': { z1: 6 } };
    prune(h2, monthly, '2025-02-01');
    assert.equal(monthlyArchiveTotal(monthly, '2025-01', 'z1'), 10);
    // Kesim sonrası gün özete girmez
    assert.equal(archiveDaysBefore({ '2025-03-01': { z1: 9 } }, monthly, '2025-02-01'), false);
    assert.equal(yearArchiveTotal(monthly, '2025'), 10);
});

test('geçersiz gün ve sıfır/negatif adet özete girmez', () => {
    const monthly = {};
    archiveDaysBefore(
        { 'bozuk': { z1: 5 }, '2024-02-01': { z1: 0, z2: -3, z3: 2 }, '2024-02-02': null },
        monthly,
        '2025-01-01'
    );
    assert.deepEqual(monthly, { '2024-02': { z3: 2 } });
});

test('kalıcı silinen zikir özetten de düşer', () => {
    const monthly = { '2024-02': { z1: 5, z2: 1 }, '2024-03': { z1: 2 } };
    assert.equal(removeZikirsFromMonthly(monthly, new Set(['z1'])), true);
    assert.deepEqual(monthly, { '2024-02': { z2: 1 } });
});

test('yedekten gelen özet temizlenir', () => {
    const out = sanitizeHistoryMonthly({
        '2024-02': { z1: 5, z2: 'x', z3: -1, z4: 2.6 },
        '2024-13-01': { z1: 1 },
        nope: { z1: 1 },
        '2024-04': [],
        '2024-05': { z1: 0 }
    });
    assert.deepEqual(out, { '2024-02': { z1: 5, z4: 3 } });
    assert.deepEqual(sanitizeHistoryMonthly(null), {});
    assert.deepEqual(sanitizeHistoryMonthly([1, 2]), {});
});
