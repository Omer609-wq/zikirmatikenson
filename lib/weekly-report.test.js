import test from 'node:test';
import assert from 'node:assert/strict';
import {
    buildWeekReport,
    computeGoalStreak,
    countGoalDaysInRange,
    formatDateKeyFromDate,
    getDayKeysBetween,
    getFlameTier,
    getNextMondayAt,
    getReportWeekForMonday,
    normalizeDailyZikirGoal,
    percentChange
} from './weekly-report.js';

test('getReportWeekForMonday returns previous Mon–Sun', () => {
    const monday = new Date('2026-07-06T09:00:00');
    const week = getReportWeekForMonday(monday);
    assert.equal(week.startKey, '2026-06-29');
    assert.equal(week.endKey, '2026-07-05');
    assert.equal(week.dayKeys.length, 7);
});

test('getNextMondayAt schedules future Monday morning', () => {
    const next = getNextMondayAt(9, 0);
    assert.equal(next.getDay(), 1);
    assert.equal(next.getHours(), 9);
    assert.equal(next.getMinutes(), 0);
    assert.ok(next.getTime() > Date.now());
});

test('goal streak counts consecutive days with enough zikir', () => {
    const history = {
        '2026-07-01': { z_1: 50 },
        '2026-07-02': { z_1: 100 },
        '2026-07-03': { z_1: 120 }
    };
    assert.equal(computeGoalStreak(history, 100, '2026-07-03'), 2);
    assert.equal(computeGoalStreak(history, 0, '2026-07-03'), 0);
});

test('buildWeekReport aggregates usage and goal days', () => {
    const history = {
        '2026-06-30': { z_1: 120 },
        '2026-07-01': { z_1: 80 },
        '2026-07-02': { z_1: 100 }
    };
    const usageByDay = {
        '2026-06-30': 600,
        '2026-07-01': 1200,
        '2026-07-02': 900
    };
    const dayKeys = getDayKeysBetween('2026-06-30', '2026-07-06');
    const report = buildWeekReport(history, usageByDay, dayKeys, 100, '2026-07-06');
    assert.equal(report.zikir.totalZikir, 300);
    assert.equal(report.goalDays.hit, 2);
    assert.equal(report.usage.daysWithUsage, 3);
    assert.equal(getFlameTier(7).tier, 'orange');
    assert.equal(getFlameTier(8).tier, 'red');
    assert.equal(getFlameTier(15).tier, 'blue');
    assert.equal(getFlameTier(22).tier, 'purple');
    assert.equal(getFlameTier(29).tier, 'master');
});

test('percentChange handles zero baseline', () => {
    assert.deepEqual(percentChange(10, 0), { percent: 100, direction: 'up' });
    assert.deepEqual(percentChange(0, 0), { percent: 0, direction: 'same' });
});

test('normalizeDailyZikirGoal clamps invalid values', () => {
    assert.equal(normalizeDailyZikirGoal('50'), 50);
    assert.equal(normalizeDailyZikirGoal(-1), 0);
    assert.equal(normalizeDailyZikirGoal('x'), 0);
});

test('formatDateKeyFromDate is stable', () => {
    assert.equal(formatDateKeyFromDate(new Date('2026-01-05T12:00:00')), '2026-01-05');
});
