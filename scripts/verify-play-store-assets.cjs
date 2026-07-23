/**
 * Play Console yükleme görselleri — boyut ve dosya limiti kontrolü.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const CHECKS = [
    { rel: 'resources/play-console-icon-512.png', w: 512, h: 512, maxKb: 1024 },
    { rel: 'resources/play-feature-1024x500.png', w: 1024, h: 500, maxKb: 15360 },
    { rel: 'resources/play-feature-1024x500-tr.png', w: 1024, h: 500, maxKb: 15360 },
];

(async () => {
    let ok = true;
    for (const c of CHECKS) {
        const p = path.join(ROOT, c.rel);
        if (!fs.existsSync(p)) {
            console.error('eksik:', c.rel);
            ok = false;
            continue;
        }
        const meta = await sharp(p).metadata();
        const kb = fs.statSync(p).size / 1024;
        if (meta.width !== c.w || meta.height !== c.h) {
            console.error(`boyut hatalı ${c.rel}: ${meta.width}×${meta.height} (beklenen ${c.w}×${c.h})`);
            ok = false;
            continue;
        }
        if (kb > c.maxKb) {
            console.error(`dosya büyük ${c.rel}: ${kb.toFixed(1)} KB (max ${c.maxKb} KB)`);
            ok = false;
            continue;
        }
        console.log('ok', c.rel, `${c.w}×${c.h}`, `${kb.toFixed(1)} KB`);
    }
    if (!ok) process.exit(1);
    console.log('Play Console görselleri yükleme için hazır.');
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
