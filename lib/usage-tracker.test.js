import test from 'node:test';
import assert from 'node:assert/strict';
import { createUsageTracker } from './usage-tracker.js';

test('usage tracker carries sub-second remainder across ticks', (t) => {
    t.mock.timers.enable({ apis: ['Date'], now: 1000 });
    const flushes = [];
    const tracker = createUsageTracker({
        getTodayKey: () => '2026-07-04',
        getContext: () => 'home',
        onFlush: (_day, sec) => flushes.push(sec)
    });

    tracker.resume();
    t.mock.timers.setTime(2500);
    tracker.tick();
    t.mock.timers.setTime(3100);
    tracker.tick();
    tracker.pause();

    assert.deepEqual(flushes, [2]);
    t.mock.timers.reset();
});

test('usage tracker flushes on pause', (t) => {
    t.mock.timers.enable({ apis: ['Date'], now: 1000 });
    const flushes = [];
    const tracker = createUsageTracker({
        getTodayKey: () => '2026-07-04',
        getContext: () => 'other',
        onFlush: (_day, sec, ctx) => flushes.push({ sec, ctx })
    });

    tracker.resume();
    t.mock.timers.setTime(6000);
    tracker.pause();

    assert.deepEqual(flushes, [{ sec: 5, ctx: 'other' }]);
    t.mock.timers.reset();
});

test('usage tracker ignores tick when paused', () => {
    const flushes = [];
    const tracker = createUsageTracker({
        getTodayKey: () => '2026-07-04',
        onFlush: (_day, sec) => flushes.push(sec)
    });

    tracker.tick();
    tracker.forceFlush();
    assert.deepEqual(flushes, []);
});
