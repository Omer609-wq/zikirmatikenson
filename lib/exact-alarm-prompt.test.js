import test from 'node:test';
import assert from 'node:assert/strict';
import {
    shouldPromptForExactAlarm,
    markExactAlarmPrompted,
    normalizeExactAlarmPromptState,
    MIN_DAYS_BETWEEN_PROMPTS,
    MAX_PROMPTS
} from './exact-alarm-prompt.js';

const DAY = 86400000;
const NOW = Date.parse('2026-08-03T12:00:00Z');
const FRESH = { count: 0, lastPromptedAt: null };

const ctx = (over = {}) => ({
    state: FRESH,
    reminderEnabled: true,
    exactState: 'denied',
    now: NOW,
    ...over
});

test('izin reddedilmişse ve hatırlatıcı açıksa sorulur', () => {
    assert.equal(shouldPromptForExactAlarm(ctx()), true);
});

test('hatırlatıcı kapalıyken sorulmaz', () => {
    assert.equal(shouldPromptForExactAlarm(ctx({ reminderEnabled: false })), false);
});

test('izin zaten verilmişse sorulmaz', () => {
    assert.equal(shouldPromptForExactAlarm(ctx({ exactState: 'granted' })), false);
});

test('platform desteklemiyorsa sorulmaz (Android 12 öncesi / iOS)', () => {
    assert.equal(shouldPromptForExactAlarm(ctx({ exactState: 'unsupported' })), false);
});

test('sorulduktan hemen sonra tekrar sorulmaz', () => {
    const after = markExactAlarmPrompted(FRESH, NOW);
    assert.equal(shouldPromptForExactAlarm(ctx({ state: after })), false);
});

test('bekleme süresi dolmadan sorulmaz, dolunca sorulur', () => {
    const after = markExactAlarmPrompted(FRESH, NOW);
    const justBefore = NOW + MIN_DAYS_BETWEEN_PROMPTS * DAY - 1000;
    const justAfter = NOW + MIN_DAYS_BETWEEN_PROMPTS * DAY + 1000;
    assert.equal(shouldPromptForExactAlarm(ctx({ state: after, now: justBefore })), false);
    assert.equal(shouldPromptForExactAlarm(ctx({ state: after, now: justAfter })), true);
});

test('üst sınıra gelince süre dolsa da bir daha sorulmaz', () => {
    let state = FRESH;
    let now = NOW;
    for (let i = 0; i < MAX_PROMPTS; i++) {
        assert.equal(shouldPromptForExactAlarm(ctx({ state, now })), true, `${i + 1}. soru sorulabilmeliydi`);
        state = markExactAlarmPrompted(state, now);
        now += (MIN_DAYS_BETWEEN_PROMPTS + 1) * DAY;
    }
    assert.equal(state.count, MAX_PROMPTS);
    assert.equal(shouldPromptForExactAlarm(ctx({ state, now })), false);
    // Bir yıl sonra bile ısrar edilmez.
    assert.equal(shouldPromptForExactAlarm(ctx({ state, now: now + 365 * DAY })), false);
});

test('bozuk kayıt sıfırdan başlamış sayılır', () => {
    for (const bad of [null, undefined, 'x', 42, [], { count: -3, lastPromptedAt: 'dun' }, { count: NaN }]) {
        assert.deepEqual(normalizeExactAlarmPromptState(bad), FRESH);
    }
});

test('geçerli kayıt korunur, ondalık sayaç aşağı yuvarlanır', () => {
    assert.deepEqual(normalizeExactAlarmPromptState({ count: 1.9, lastPromptedAt: NOW }), {
        count: 1,
        lastPromptedAt: NOW
    });
});
