import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('app navigation uses window.history, not persisted zikir history', () => {
    const source = readFileSync(new URL('./app.js', import.meta.url), 'utf8');
    const bareHistoryCall = /(^|[^\w$.])history\./;

    assert.equal(
        bareHistoryCall.test(source),
        false,
        'bare history.* resolves to the persisted zikir history object inside app.js'
    );
    assert.match(source, /window\.history\.(pushState|replaceState|back)/);
});
