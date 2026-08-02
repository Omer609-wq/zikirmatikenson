/**
 * Regression: overlays opened outside openOverlay() / missing from dismissal
 * lists leave a blocking modal when Android/system Back runs goBackInApp().
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const appJs = readFileSync(new URL('./app.js', import.meta.url), 'utf8');

function extractArrayLiteral(name) {
    const re = new RegExp(`const ${name} = \\[([\\s\\S]*?)\\];`);
    const m = appJs.match(re);
    assert.ok(m, `${name} array not found`);
    return m[1];
}

describe('overlay back / close wiring', () => {
    it('includes quranSearchGuideOverlay in IN_APP_BACK_OVERLAY_IDS', () => {
        const body = extractArrayLiteral('IN_APP_BACK_OVERLAY_IDS');
        assert.match(body, /'quranSearchGuideOverlay'/);
    });

    it('closeAllOverlays dismisses quranSearchGuideOverlay', () => {
        const start = appJs.indexOf('function closeAllOverlays()');
        assert.ok(start >= 0);
        const snippet = appJs.slice(start, start + 900);
        assert.match(snippet, /quranSearchGuideOverlay/);
    });
});
