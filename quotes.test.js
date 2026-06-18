import test from 'node:test';
import assert from 'node:assert/strict';
import { APP_QUOTES, pickRandomQuote } from './quotes.js';

test('non-TR quotes fall back to Quran-only text before remote quotes load', () => {
    for (const locale of ['en', 'fr-FR', 'ar']) {
        const quote = pickRandomQuote(locale);

        assert.match(quote, /\(\d+:\d+\)$/);
        assert.equal(APP_QUOTES.includes(quote), false);
        assert.doesNotMatch(quote, /Hadis|Buhari|Müslim|Tirmizi/);
    }
});
