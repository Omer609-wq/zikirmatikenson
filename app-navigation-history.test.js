import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('browser navigation uses window.history despite app history data object', async () => {
    const source = await readFile(new URL('./app.js', import.meta.url), 'utf8');

    assert.match(source, /\blet history = \{\};/);
    assert.match(source, /window\.history\.pushState/);
    assert.match(source, /window\.history\.replaceState/);
    assert.match(source, /window\.history\.back\(\)/);

    const shadowedHistoryApiCall = /(?<!window\.)\bhistory\.(?:state|pushState|replaceState|back|length)\b/;
    assert.doesNotMatch(source, shadowedHistoryApiCall);
});
