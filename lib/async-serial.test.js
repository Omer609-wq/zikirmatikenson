import test from 'node:test';
import assert from 'node:assert/strict';
import { createAsyncSerial } from './async-serial.js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test('görevler kesin sırayla çalışır, yavaş olan öne geçilmez', async () => {
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

test('hata veren görev sırayı koparmaz, hata yalnızca çağırana gider', async () => {
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

test('eşzamanlı olmayan (senkron) hata da zinciri koparmaz', async () => {
    const enqueue = createAsyncSerial();
    const p1 = enqueue(() => {
        throw new Error('sync boom');
    });
    const p2 = enqueue(() => 'sonra');
    await assert.rejects(p1, /sync boom/);
    assert.equal(await p2, 'sonra');
});

/*
 * Asıl hata senaryosu: "aç" çağrısı izin beklerken "kapat" gelir.
 * Sırasız sürümde "aç" en son kurar ve kapalı hatırlatıcının alarmı kalır.
 */
function makeReminderSim(enqueue) {
    const scheduled = [];
    const sync = (enabled, time) => {
        const body = async () => {
            scheduled.length = 0; // iptal
            if (!enabled) return;
            await delay(20); // izin / kanal bekleniyor
            scheduled.push(time); // kur
        };
        return enqueue ? enqueue(body) : body();
    };
    return { scheduled, sync };
}

test('sırasız sürümde yarış gerçekten oluşuyor (testin kendisi doğru mu?)', async () => {
    const sim = makeReminderSim(null);
    const a = sim.sync(true, '21:00');
    const b = sim.sync(false, '21:00');
    await Promise.all([a, b]);
    assert.deepEqual(sim.scheduled, ['21:00'], 'yarış yeniden üretilemedi; test bir şey kanıtlamıyor');
});

test('sıraya dizince "aç"tan sonra gelen "kapat" kazanır', async () => {
    const sim = makeReminderSim(createAsyncSerial());
    const a = sim.sync(true, '21:00');
    const b = sim.sync(false, '21:00');
    await Promise.all([a, b]);
    assert.deepEqual(sim.scheduled, []);
});

test('sıraya dizince art arda saat değişikliğinde son saat kalır', async () => {
    const sim = makeReminderSim(createAsyncSerial());
    await Promise.all([sim.sync(true, '20:00'), sim.sync(true, '21:00'), sim.sync(true, '22:00')]);
    assert.deepEqual(sim.scheduled, ['22:00']);
});
