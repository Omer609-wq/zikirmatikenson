import test from 'node:test';
import assert from 'node:assert/strict';
import {
    normalizeCloudBackupMeta,
    shouldRunWeeklyBackup,
    WEEKLY_BACKUP_INTERVAL_MS
} from './cloud-backup.js';

test('normalizeCloudBackupMeta requires uid', () => {
    assert.equal(normalizeCloudBackupMeta(null), null);
    assert.equal(normalizeCloudBackupMeta({ email: 'a@b.com' }), null);
    assert.deepEqual(normalizeCloudBackupMeta({ uid: 'abc', email: 'a@b.com' }), {
        uid: 'abc',
        email: 'a@b.com',
        lastBackupAt: 0,
        linkedAt: 0
    });
});

test('shouldRunWeeklyBackup runs when never backed up', () => {
    assert.equal(shouldRunWeeklyBackup(0, 1_000_000), true);
    assert.equal(shouldRunWeeklyBackup(undefined, 1_000_000), true);
});

test('shouldRunWeeklyBackup waits seven days', () => {
    const now = Date.now();
    const last = now - WEEKLY_BACKUP_INTERVAL_MS + 60_000;
    assert.equal(shouldRunWeeklyBackup(last, now), false);

    const lastOk = now - WEEKLY_BACKUP_INTERVAL_MS;
    assert.equal(shouldRunWeeklyBackup(lastOk, now), true);
});
