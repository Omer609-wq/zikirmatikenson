import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import assert from 'node:assert/strict';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const appJs = readFileSync(join(root, 'app.js'), 'utf8');

assert.match(
    appJs,
    /function getBrowserHistory\(\)\s*\{\s*return \(typeof window !== 'undefined' && window\.history\) \? window\.history : null;\s*\}/,
    'routing code should use window.history through getBrowserHistory()'
);

const unqualifiedBrowserHistoryUses = appJs
    .split('\n')
    .map((line, index) => ({ line: index + 1, text: line }))
    .filter(({ text }) => /\bhistory\.(pushState|replaceState|back|state)\b/.test(text));

assert.deepEqual(
    unqualifiedBrowserHistoryUses,
    [],
    'window.history APIs must not use the persisted zikir history variable'
);
