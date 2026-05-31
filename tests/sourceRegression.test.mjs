import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');

test('daily click history does not shadow the browser History API', () => {
    assert.doesNotMatch(appSource, /\blet\s+history\s*=/);
    assert.match(appSource, /\blet\s+clickHistory\s*=\s*\{\s*\}/);
    assert.match(appSource, /function\s+getBrowserHistory\s*\(\)\s*\{[\s\S]*window\.history/);
    assert.match(appSource, /history:\s*clickHistory/);

    const navigationBlock = appSource.slice(
        appSource.indexOf('function openOverlay'),
        appSource.indexOf('function dragReorder')
    );
    assert.match(navigationBlock, /getBrowserHistory\(\)/);
    assert.doesNotMatch(navigationBlock, /\bhistory\.(pushState|replaceState|back)\s*\(/);
});

test('corrupt persisted data blocks later saves from overwriting user data', () => {
    assert.match(appSource, /const\s+DATA_STORAGE_KEY\s*=\s*'zikirmatik_data_v2'/);
    assert.match(appSource, /const\s+DATA_CORRUPT_BACKUP_KEY\s*=\s*'zikirmatik_data_v2_corrupt_backup'/);
    assert.match(appSource, /dataLoadBlockedByCorruption\s*=\s*true/);
    assert.match(appSource, /localStorage\.setItem\(DATA_CORRUPT_BACKUP_KEY,\s*sv\)/);
    assert.match(appSource, /if\s*\(\s*dataLoadBlockedByCorruption\s*\)\s*\{[\s\S]*return false;/);
});
