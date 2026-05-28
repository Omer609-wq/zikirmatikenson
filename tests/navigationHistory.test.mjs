import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appSource = await readFile(resolve(__dirname, '../app.js'), 'utf8');

assert.match(
    appSource,
    /function getBrowserHistory\(\)\s*\{[\s\S]*?window\.history[\s\S]*?\}/,
    'navigation helpers must explicitly resolve browser history from window.history'
);

const forbiddenShadowedCalls = [...appSource.matchAll(/\bhistory\.(?:state|pushState|replaceState|back)\b/g)];
assert.deepEqual(
    forbiddenShadowedCalls.map((match) => match[0]),
    [],
    'app data history must not be used for browser navigation APIs'
);
