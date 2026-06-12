import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');

function getFunctionBody(name) {
    const start = appSource.indexOf(`function ${name}(`);
    assert.notEqual(start, -1, `${name} function should exist`);

    const braceStart = appSource.indexOf('{', start);
    let depth = 0;
    for (let i = braceStart; i < appSource.length; i += 1) {
        const ch = appSource[i];
        if (ch === '{') depth += 1;
        else if (ch === '}') {
            depth -= 1;
            if (depth === 0) return appSource.slice(braceStart + 1, i);
        }
    }
    throw new Error(`${name} function body was not closed`);
}

test('loadData preserves existing storage when the saved payload is unreadable', () => {
    const loadData = getFunctionBody('loadData');
    const parseFailureBranch = loadData.match(/catch \(e\) \{(?<body>[\s\S]*?)\n\s*\}/)?.groups.body ?? '';

    assert.match(loadData, /const hasStoredData = sv !== null;/);
    assert.match(parseFailureBranch, /blockStorageWritesForSession/);
    assert.match(parseFailureBranch, /loadDefaultSessionData\(\);/);
    assert.match(parseFailureBranch, /syncSettingsUI\(\);/);
    assert.match(parseFailureBranch, /return;/);
});

test('loadData blocks startup writes for structurally invalid saved data', () => {
    const loadData = getFunctionBody('loadData');

    assert.match(loadData, /if \(!isStoredDataShapeTrusted\(d\)\) \{/);
    assert.match(loadData, /blockStorageWritesForSession\(`\$\{STORAGE_KEY\} beklenen veri yapisinda degil; mevcut kayit korunacak\.`\);/);
});

test('saveData refuses to overwrite storage after an untrusted load', () => {
    const saveData = getFunctionBody('saveData');
    const blockedCheck = saveData.indexOf('if (storageWritesBlockedForSession)');
    const writeCall = saveData.indexOf('localStorage.setItem(STORAGE_KEY');

    assert.ok(blockedCheck >= 0, 'saveData should check the session write block');
    assert.ok(writeCall > blockedCheck, 'saveData should check the write block before writing');
});

test('valid empty zikir arrays are not repopulated as first-run defaults', () => {
    const loadData = getFunctionBody('loadData');

    assert.match(loadData, /zikirs = sanitized\.zikirs;/);
    assert.doesNotMatch(loadData, /sanitized\.zikirs\.length \? sanitized\.zikirs : \[\.\.\.DEFAULT_ZIKIRS\]/);
    assert.match(loadData, /if \(zikirs\.length > 0\) \{/);
});
