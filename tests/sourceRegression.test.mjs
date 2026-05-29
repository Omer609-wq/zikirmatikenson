import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');

test('navigation uses browser history without the zikir history shadow', () => {
    assert.match(appSource, /function getBrowserHistory\(\)/);
    assert.doesNotMatch(appSource, /\bhistory\.(?:pushState|replaceState|back|state)\b/);
    assert.match(appSource, /syncInAppStackToState\(st\);\s*showView\(st\.viewId, st\.param \?\? null, \{ push: false \}\);/);
});

test('unreadable persisted data blocks default-state overwrite saves', () => {
    const loadDataStart = appSource.indexOf('function loadData()');
    const saveDataStart = appSource.indexOf('function saveData()');
    assert.notEqual(loadDataStart, -1);
    assert.notEqual(saveDataStart, -1);

    const parseFailureBlock = appSource.slice(loadDataStart, saveDataStart);
    assert.match(parseFailureBlock, /catch \(e\) \{\s*console\.error\('zikirmatik_data_v2 okunamadı, varsayılan veri:', e\);\s*storageWriteBlocked = true;/);

    const saveDataBlock = appSource.slice(saveDataStart, appSource.indexOf('function isPremium()', saveDataStart));
    const guardIndex = saveDataBlock.indexOf('if (storageWriteBlocked)');
    const payloadIndex = saveDataBlock.indexOf('const payload =');
    assert.ok(guardIndex >= 0, 'saveData should guard blocked storage writes');
    assert.ok(payloadIndex > guardIndex, 'saveData should return before preparing default payloads');
});
