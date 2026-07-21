import test from 'node:test';
import assert from 'node:assert/strict';
import {
    shouldRequestReview,
    normalizeReviewState,
    MIN_COMPLETED_ROUNDS,
    MIN_DAYS_SINCE_INSTALL,
    MIN_DAYS_BETWEEN_ASKS
} from './app-review.js';

const DAY = 86400000;
const NOW = Date.parse('2026-07-20T12:00:00');
const dayStr = (offsetDays) =>
    new Date(NOW - offsetDays * DAY).toISOString().slice(0, 10);

/** Tüm koşulları sağlayan taban senaryo. */
const ok = () => ({
    state: { rounds: MIN_COMPLETED_ROUNDS, lastAskedAt: null },
    installedAt: dayStr(MIN_DAYS_SINCE_INSTALL + 1),
    now: NOW,
    isFirstSession: false
});

test('tüm koşullar sağlanınca puanlama istenir', () => {
    assert.equal(shouldRequestReview(ok()), true);
});

test('ilk oturumda asla istenmez', () => {
    assert.equal(shouldRequestReview({ ...ok(), isFirstSession: true }), false);
});

test('yeterli tur tamamlanmadan istenmez', () => {
    const ctx = ok();
    ctx.state = { rounds: MIN_COMPLETED_ROUNDS - 1, lastAskedAt: null };
    assert.equal(shouldRequestReview(ctx), false);
});

test('kurulumun ilk günlerinde istenmez', () => {
    assert.equal(shouldRequestReview({ ...ok(), installedAt: dayStr(0) }), false);
    assert.equal(
        shouldRequestReview({ ...ok(), installedAt: dayStr(MIN_DAYS_SINCE_INSTALL - 1) }),
        false
    );
});

test('kurulum tarihi yoksa/bozuksa istenmez (güvenli taraf)', () => {
    assert.equal(shouldRequestReview({ ...ok(), installedAt: null }), false);
    assert.equal(shouldRequestReview({ ...ok(), installedAt: 'bozuk-tarih' }), false);
});

test('bekleme süresi dolmadan tekrar istenmez', () => {
    const ctx = ok();
    ctx.state = { rounds: 50, lastAskedAt: NOW - (MIN_DAYS_BETWEEN_ASKS - 1) * DAY };
    assert.equal(shouldRequestReview(ctx), false);
});

test('bekleme süresi dolunca tekrar istenebilir', () => {
    const ctx = ok();
    ctx.state = { rounds: 50, lastAskedAt: NOW - (MIN_DAYS_BETWEEN_ASKS + 1) * DAY };
    assert.equal(shouldRequestReview(ctx), true);
});

test('bozuk durum verisi çökmez, sıfır sayılır', () => {
    assert.deepEqual(normalizeReviewState(null), { rounds: 0, lastAskedAt: null });
    assert.deepEqual(normalizeReviewState('metin'), { rounds: 0, lastAskedAt: null });
    assert.deepEqual(normalizeReviewState([]), { rounds: 0, lastAskedAt: null });
    assert.deepEqual(normalizeReviewState({ rounds: -5, lastAskedAt: -1 }), {
        rounds: 0,
        lastAskedAt: null
    });
    assert.deepEqual(normalizeReviewState({ rounds: 7.9, lastAskedAt: 123 }), {
        rounds: 7,
        lastAskedAt: 123
    });
    // bozuk durumla politika da çökmemeli
    assert.equal(shouldRequestReview({ ...ok(), state: 'bozuk' }), false);
});
