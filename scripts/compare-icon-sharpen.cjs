/**
 * Netleştirme karşılaştırması — resources/compare/ altına yazar.
 * Kullanım: node scripts/compare-icon-sharpen.cjs
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { BG_RGB, SHARPEN } = require('./icon-colors.cjs');

const ROOT = path.join(__dirname, '..');
const appIcon = path.join(ROOT, 'resources', 'app-icon.png');
const outDir = path.join(ROOT, 'resources', 'compare');
const RESIZE = { kernel: sharp.kernel.lanczos3 };

function labelSvg(w, h, leftLabel, rightLabel) {
    return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="${w}" height="36" fill="rgba(0,0,0,0.55)"/>
  <text x="${w / 4}" y="24" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="15" font-weight="600" fill="#f5f0e6">${leftLabel}</text>
  <text x="${(w * 3) / 4}" y="24" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="15" font-weight="600" fill="#f5f0e6">${rightLabel}</text>
</svg>`);
}

async function play512Variant(sharpenOpts) {
    let p = sharp(appIcon).resize(512, 512, RESIZE);
    if (sharpenOpts) p = p.sharpen(sharpenOpts);
    return p.flatten({ background: BG_RGB }).png().toBuffer();
}

async function launcher1024Variant(sharpenOpts) {
    let p = sharp(appIcon);
    if (sharpenOpts) p = p.sharpen(sharpenOpts);
    return p.png().toBuffer();
}

async function zoomEmblem(buf, size) {
    const crop = Math.round(size * 0.58);
    const left = Math.floor((size - crop) / 2);
    return sharp(buf)
        .extract({ left, top: left, width: crop, height: crop })
        .resize(640, 640, RESIZE)
        .png()
        .toBuffer();
}

async function sideBySide(leftBuf, rightBuf, width, height, leftLabel, rightLabel) {
    const panelW = Math.floor(width / 2);
    const left = await sharp(leftBuf).resize(panelW, height, RESIZE).png().toBuffer();
    const right = await sharp(rightBuf).resize(panelW, height, RESIZE).png().toBuffer();
    return sharp({
        create: {
            width,
            height,
            channels: 3,
            background: BG_RGB,
        },
    })
        .composite([
            { input: left, left: 0, top: 0 },
            { input: right, left: panelW, top: 0 },
            { input: labelSvg(width, height, leftLabel, rightLabel), left: 0, top: 0 },
        ])
        .png()
        .toBuffer();
}

(async () => {
    if (!fs.existsSync(appIcon)) {
        console.error('Önce: node scripts/prepare-app-icon.cjs');
        process.exit(1);
    }
    fs.mkdirSync(outDir, { recursive: true });

    const playOff = await play512Variant(null);
    const playLight = await play512Variant(SHARPEN.light512);
    const launcherOff = await launcher1024Variant(null);
    const launcherLight = await launcher1024Variant(SHARPEN.light1024);

    const playZoomOff = await zoomEmblem(playOff, 512);
    const playZoomLight = await zoomEmblem(playLight, 512);

    const files = [
        ['play-512-off.png', playOff],
        ['play-512-light.png', playLight],
        ['launcher-1024-off.png', launcherOff],
        ['launcher-1024-light.png', launcherLight],
        ['play-zoom-off.png', playZoomOff],
        ['play-zoom-light.png', playZoomLight],
        [
            'play-512-side-by-side.png',
            await sideBySide(playOff, playLight, 1024, 512, 'Netleştirme yok', 'Hafif netleştirme'),
        ],
        [
            'play-zoom-side-by-side.png',
            await sideBySide(playZoomOff, playZoomLight, 1280, 640, 'Netleştirme yok (yakın)', 'Hafif netleştirme (yakın)'),
        ],
        [
            'launcher-side-by-side.png',
            await sideBySide(launcherOff, launcherLight, 1024, 512, 'Launcher — yok', 'Launcher — hafif'),
        ],
    ];

    for (const [name, buf] of files) {
        const dest = path.join(outDir, name);
        await fs.promises.writeFile(dest, buf);
        console.log('saved', path.relative(ROOT, dest));
    }
    console.log('');
    console.log('Karşılaştırma klasörü:', path.relative(ROOT, outDir));
    console.log('Önce play-zoom-side-by-side.png — filigran farkı en net görünür.');
    console.log('Beğenirseniz: icon-colors.cjs içinde SHARPEN_ENABLED = true ve light* preset kullanın.');
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
