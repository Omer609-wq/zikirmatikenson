import test from 'node:test';
import assert from 'node:assert/strict';
import {
    REMINDER_AYAH_NUM,
    REMINDER_AYAH_SURAH,
    formatReminderAyahRef,
    getReminderQuoteBody,
    getReminderQuoteNotificationPayload,
    wrapReminderNotificationLines
} from './reminder-quote.js';

const LOCALES = ['tr', 'en', 'ar', 'id', 'ms', 'fr', 'bn', 'ur'];

test('getReminderQuoteBody resolves Rad 13:28 for every supported locale', () => {
    for (const locale of LOCALES) {
        const body = getReminderQuoteBody(locale);
        assert.ok(body.length > 20, `${locale} body too short`);
        assert.ok(!body.includes('…'), `${locale} must not truncate with ellipsis`);
        assert.ok(!body.endsWith('...'), `${locale} must not truncate with ascii ellipsis`);
        if (locale === 'tr') {
            assert.match(body, /Rad Suresi 28/);
            assert.match(body, /Kalpler ancak/);
        } else if (locale === 'ar') {
            assert.match(body, /\(13:28\)/);
            assert.match(body, /اللَّهِ/);
        } else {
            assert.match(body, new RegExp(`${REMINDER_AYAH_SURAH}:${REMINDER_AYAH_NUM}`));
        }
    }
});

test('notification payload keeps full ayah in largeBody and avoids ellipsis in body', () => {
    for (const locale of LOCALES) {
        const payload = getReminderQuoteNotificationPayload(locale);
        assert.equal(payload.largeBody, payload.full);
        assert.ok(payload.body.length > 0);
        assert.ok(!payload.body.includes('…'));
        assert.ok(payload.inboxLines.length >= 2);
        assert.equal(payload.inboxLines[payload.inboxLines.length - 1], formatReminderAyahRef(locale));
        assert.ok(payload.inboxLines.join(' ').length >= payload.full.length - 5);
    }
});

test('wrapReminderNotificationLines never adds ellipsis', () => {
    const long =
        'Those who have believed and whose hearts are assured by the remembrance of Allah. Unquestionably, by the remembrance of Allah hearts are assured.';
    const lines = wrapReminderNotificationLines(long, 'en');
    assert.ok(lines.length >= 2);
    assert.ok(!lines.join(' ').includes('…'));
    assert.equal(lines.join(' ').replace(/\s+/g, ' ').trim(), long);
});
