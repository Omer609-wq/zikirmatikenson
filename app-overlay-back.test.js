import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const appJs = fs.readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), 'app.js'),
    'utf8'
);

/**
 * Overlays opened via openOverlay() must be closable by Android back
 * (IN_APP_BACK_OVERLAY_IDS) and by popstate (closeAllOverlays).
 * Missing either leaves a full-screen modal stuck after Back.
 */
test('reviseQuranDisplayOverlay is closed by in-app back and closeAllOverlays', () => {
    const backListMatch = appJs.match(
        /const IN_APP_BACK_OVERLAY_IDS = \[([\s\S]*?)\];/
    );
    assert.ok(backListMatch, 'IN_APP_BACK_OVERLAY_IDS list present');
    assert.match(
        backListMatch[1],
        /['"]reviseQuranDisplayOverlay['"]/,
        'IN_APP_BACK_OVERLAY_IDS must include reviseQuranDisplayOverlay'
    );

    const closeFnMatch = appJs.match(
        /function closeAllOverlays\(\) \{([\s\S]*?)\n\}/
    );
    assert.ok(closeFnMatch, 'closeAllOverlays present');
    assert.match(
        closeFnMatch[1],
        /reviseQuranDisplayOverlay/,
        'closeAllOverlays must dismiss reviseQuranDisplayOverlay'
    );
});
