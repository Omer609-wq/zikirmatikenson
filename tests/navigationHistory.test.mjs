import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appSource = readFileSync(resolve(__dirname, '../app.js'), 'utf8');

assert.match(
    appSource,
    /function getBrowserHistory\(\) \{\s*return \(typeof window !== 'undefined' && window\.history\) \? window\.history : null;\s*\}/,
    'browser navigation must resolve the History API from window.history, not the app data history object'
);

const forbiddenShadowedCalls = [
    /\bhistory\.pushState\b/,
    /\bhistory\.replaceState\b/,
    /\bhistory\.back\(\)/,
    /\bhistory\.state\b/
];

for (const pattern of forbiddenShadowedCalls) {
    assert.equal(
        pattern.test(appSource),
        false,
        `browser History API access must not use the shadowed app data variable: ${pattern}`
    );
}

assert.match(appSource, /\bbrowserHistory\.pushState\b/);
assert.match(appSource, /\bbrowserHistory\.replaceState\b/);
assert.match(appSource, /\bbrowserHistory\.back\(\)/);
