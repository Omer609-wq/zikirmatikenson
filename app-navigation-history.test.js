import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('navigation uses browser history, not zikir count history data', async () => {
    const appJs = await readFile(new URL('./app.js', import.meta.url), 'utf8');
    const unqualifiedBrowserHistoryCalls = /\bhistory\.(?:pushState|replaceState|back|state|length)\b/g;

    assert.equal(appJs.match(unqualifiedBrowserHistoryCalls), null);
    assert.match(appJs, /window\.history\.pushState/);
    assert.match(appJs, /window\.history\.replaceState/);
    assert.match(appJs, /window\.history\.back/);
});
