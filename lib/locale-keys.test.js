import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = path.join(ROOT, 'scripts', 'verify-locale-keys.cjs');

test('UI locale JSON files share the same key set as en.json', () => {
    const result = spawnSync(process.execPath, [script], {
        cwd: ROOT,
        encoding: 'utf8'
    });
    if (result.status !== 0) {
        assert.fail(
            `verify-locale-keys failed (exit ${result.status}):\n${result.stdout}\n${result.stderr}`
        );
    }
    assert.match(result.stdout, /Tüm UI locale dosyaları en\.json ile uyumlu/);
});
