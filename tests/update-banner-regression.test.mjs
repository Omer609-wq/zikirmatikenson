import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

async function readText(path) {
    return readFile(new URL(path, root), 'utf8');
}

test('update banner config does not advertise a version newer than the packaged Android build', async () => {
    const [configText, gradleText] = await Promise.all([
        readText('public/update-banner.json'),
        readText('android/app/build.gradle')
    ]);

    const config = JSON.parse(configText);
    const versionCodeMatch = gradleText.match(/\bversionCode\s+(\d+)\b/);
    assert.ok(versionCodeMatch, 'android versionCode must be present');

    const packagedVersionCode = Number(versionCodeMatch[1]);
    assert.ok(Number.isSafeInteger(config.latestVersionCode), 'latestVersionCode must be an integer');
    assert.ok(
        config.latestVersionCode <= packagedVersionCode,
        `latestVersionCode ${config.latestVersionCode} exceeds packaged versionCode ${packagedVersionCode}`
    );
});

test('update detail overlay participates in app back and overlay dismissal', async () => {
    const [appSource, bannerSource] = await Promise.all([
        readText('app.js'),
        readText('update-banner.js')
    ]);

    assert.match(
        bannerSource,
        /export\s+function\s+closeUpdateBannerDetail\s*\(/,
        'update banner close helper must be exported for app-level back handling'
    );
    assert.match(
        appSource,
        /import\s*\{[\s\S]*closeUpdateBannerDetail[\s\S]*\}\s*from\s*['"]\.\/update-banner\.js['"]/,
        'app.js must import the update banner close helper'
    );
    assert.match(
        appSource,
        /function\s+closeAllOverlays\s*\([\s\S]*closeUpdateBannerDetail\(\);[\s\S]*\n\}/,
        'closeAllOverlays must close the update detail overlay'
    );
    assert.match(
        appSource,
        /const\s+overlayIds\s*=\s*\[[\s\S]*['"]updateBannerDetailOverlay['"][\s\S]*\]/,
        'goBackInApp must include the update detail overlay in its overlay list'
    );
    assert.match(
        appSource,
        /if\s*\(\s*oid\s*===\s*['"]updateBannerDetailOverlay['"]\s*\)\s*\{[\s\S]*closeUpdateBannerDetail\(\);[\s\S]*return;[\s\S]*\}/,
        'goBackInApp must close the update detail overlay through its close helper'
    );
});
