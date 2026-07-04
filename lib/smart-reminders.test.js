import test from 'node:test';
import assert from 'node:assert/strict';
import { computeDailyTimeStrings } from './smart-reminders.js';

/** @param {Partial<import('./smart-reminders.js').SmartReminderRule>} overrides */
function countRule(overrides = {}) {
    return {
        id: 'sr_test',
        enabled: true,
        name: '',
        messages: ['test'],
        scheduleMode: 'count',
        time: '09:00',
        timesPerDay: 2,
        windowStart: '08:00',
        windowEnd: '22:00',
        weekdays: [0, 1, 2, 3, 4, 5, 6],
        vibrate: true,
        tapAction: 'app',
        openZikirId: null,
        ...overrides
    };
}

test('computeDailyTimeStrings spreads times within same-day window', () => {
    const times = computeDailyTimeStrings(countRule({ timesPerDay: 3, windowStart: '08:00', windowEnd: '20:00' }));
    assert.deepEqual(times, ['08:00', '14:00', '20:00']);
});

test('computeDailyTimeStrings spans midnight window (23:00–01:00)', () => {
    const times = computeDailyTimeStrings(countRule({
        timesPerDay: 3,
        windowStart: '23:00',
        windowEnd: '01:00'
    }));
    assert.deepEqual(times, ['23:00', '00:00', '01:00']);
});

test('computeDailyTimeStrings single slot uses window start', () => {
    const times = computeDailyTimeStrings(countRule({
        timesPerDay: 1,
        windowStart: '23:30',
        windowEnd: '02:00'
    }));
    assert.deepEqual(times, ['23:30']);
});

test('computeDailyTimeStrings fixed mode ignores window', () => {
    const times = computeDailyTimeStrings(countRule({
        scheduleMode: 'fixed',
        time: '17:45',
        windowStart: '23:00',
        windowEnd: '01:00'
    }));
    assert.deepEqual(times, ['17:45']);
});
