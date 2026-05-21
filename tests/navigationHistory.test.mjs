import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../app.js', import.meta.url), 'utf8');

function fail(message) {
    throw new Error(message);
}

function functionSource(name) {
    const start = source.indexOf(`function ${name}`);
    if (start === -1) fail(`Could not find function ${name}`);
    const next = source.indexOf('\nfunction ', start + 1);
    return source.slice(start, next === -1 ? undefined : next);
}

const bareHistoryApi = /(^|[^\w$.])history\.(?:pushState|replaceState|back|state)\b/g;
const matches = [];
let match;
while ((match = bareHistoryApi.exec(source)) !== null) {
    const line = source.slice(0, match.index).split('\n').length;
    matches.push(`line ${line}: ${match[0].trim()}`);
}

if (matches.length) {
    fail(`Navigation must not use bare history.* because app data shadows it:\n${matches.join('\n')}`);
}

[
    'openOverlay',
    'closeOverlayPreferHistory',
    'ensureInitialHistoryState',
    'showView'
].forEach((name) => {
    if (!functionSource(name).includes('getBrowserHistory()')) {
        fail(`${name} must use getBrowserHistory() for platform navigation history`);
    }
});

console.log('Navigation uses browser history without shadowing.');
