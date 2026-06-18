import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('corrupt storage recovery does not run persisting settings sync', async () => {
    const source = await readFile(new URL('./app.js', import.meta.url), 'utf8');
    const parseFailureBlock = source.match(
        /catch \(e\) \{\n\s+console\.error\('zikirmatik_data_v2 okunamadı,[\s\S]*?\n\s+return;\n\s+\}/
    );

    assert.ok(parseFailureBlock, 'loadData JSON parse failure block should be present');
    assert.match(parseFailureBlock[0], /syncSettingsUI\(\{ persistLocale: false \}\);/);
    assert.doesNotMatch(parseFailureBlock[0], /\bsaveData\(\)/);
});
