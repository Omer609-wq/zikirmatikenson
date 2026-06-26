/**
 * Yüklemeden önce web bundle'da mushaf (ve ana JS) var mı kontrol et.
 * Usage: node scripts/verify-android-web-bundle.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const wwwIndex = path.join(ROOT, 'www', 'index.html');
const androidIndex = path.join(ROOT, 'android', 'app', 'src', 'main', 'assets', 'public', 'index.html');

function read(p) {
    return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

function mainIndexChunk(html, baseDir) {
    const m = html.match(/\.\/assets\/(index-[A-Za-z0-9_-]+\.js)/);
    if (!m) return { ok: false, reason: 'index.html içinde ./assets/index-*.js yok' };
    const chunkPath = path.join(baseDir, 'assets', m[1]);
    if (!fs.existsSync(chunkPath)) {
        return { ok: false, reason: `JS chunk eksik: ${m[1]}` };
    }
    const js = fs.readFileSync(chunkPath, 'utf8');
    if (!js.includes('quranMushafPager')) {
        return { ok: false, reason: `${m[1]} içinde mushaf kodu yok` };
    }
    if (!js.includes('backButton')) {
        return { ok: false, reason: `${m[1]} içinde Android geri tuşu dinleyicisi yok` };
    }
    return { ok: true, chunk: m[1], bytes: fs.statSync(chunkPath).size };
}

let failed = false;

for (const [label, indexPath, baseDir] of [
    ['www', wwwIndex, path.join(ROOT, 'www')],
    ['android assets', androidIndex, path.join(ROOT, 'android', 'app', 'src', 'main', 'assets', 'public')]
]) {
    const html = read(indexPath);
    if (!html) {
        console.error(`FAIL ${label}: dosya yok (${indexPath})`);
        failed = true;
        continue;
    }
    if (!html.includes('quranMushafPager')) {
        console.error(`FAIL ${label}: index.html mushaf HTML içermiyor`);
        failed = true;
        continue;
    }
    const chunk = mainIndexChunk(html, baseDir);
    if (!chunk.ok) {
        console.error(`FAIL ${label}: ${chunk.reason}`);
        failed = true;
        continue;
    }
    console.log(`OK ${label}: ${chunk.chunk} (${Math.round(chunk.bytes / 1024)} KB, mushaf var)`);
}

if (failed) {
    console.error('\nÖnce: npm run build && npx cap sync android');
    process.exit(1);
}

console.log('\nBundle hazır. Sonra: cd android && gradlew clean bundleRelease');
