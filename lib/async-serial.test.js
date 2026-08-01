import test from 'node:test';
import assert from 'node:assert/strict';
import { createAsyncSerial } from './async-serial.js';

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

test('createAsyncSerial runs tasks strictly in order', async () => {
    const enqueue = createAsyncSerial();
    const order = [];

    const p1 = enqueue(async () => {
        await delay(30);
        order.push('a');
        return 1;
    });
    const p2 = enqueue(async () => {
        order.push('b');
        return 2;
    });

    assert.deepEqual(await Promise.all([p1, p2]), [1, 2]);
    assert.deepEqual(order, ['a', 'b']);
});

test('createAsyncSerial keeps chain alive after a rejected task', async () => {
    const enqueue = createAsyncSerial();
    const order = [];

    const p1 = enqueue(async () => {
        order.push('fail');
        throw new Error('boom');
    });
    const p2 = enqueue(async () => {
        order.push('ok');
        return 'done';
    });

    await assert.rejects(p1, /boom/);
    assert.equal(await p2, 'done');
    assert.deepEqual(order, ['fail', 'ok']);
});

test('serialized reminder-style sync: disable after enable wins', async () => {
    const enqueue = createAsyncSerial();
    const scheduled = [];

    async function syncReminder(enabled, time) {
        return enqueue(async () => {
            // mimic cancel-then-maybe-schedule with async gaps
            await delay(5);
            if (!enabled) {
                scheduled.length = 0;
                return { ok: true, scheduled: [...scheduled] };
            }
            await delay(20);
            scheduled.length = 0;
            scheduled.push(time);
            return { ok: true, scheduled: [...scheduled] };
        });
    }

    const enable = syncReminder(true, '21:00');
    const disable = syncReminder(false, '21:00');

    assert.deepEqual(await enable, { ok: true, scheduled: ['21:00'] });
    assert.deepEqual(await disable, { ok: true, scheduled: [] });
    assert.deepEqual(scheduled, []);
});
