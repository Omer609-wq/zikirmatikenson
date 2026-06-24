/**
 * Kaynak görselden kare app ikonu üretir: beyaz kenar kırp, yeşil zeminle ortala, 1920 + 1024.
 * Kullanım: node scripts/prepare-app-icon.cjs [kaynak-dosya]
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { BG_HEX, BG_RGB } = require('./icon-colors.cjs');

const ROOT = path.join(__dirname, '..');
const src =
    process.argv[2] ||
    path.join(ROOT, 'resources', 'app-icon-source.png');
const appIcon = path.join(ROOT, 'resources', 'app-icon.png');
const master = path.join(ROOT, 'resources', 'app-icon-1920.png');
const playIcon = path.join(ROOT, 'resources', 'play-console-icon-512.png');
/** Launcher / uygulama ikonu (adaptive mask için kenar boşluğu) */
const SYMBOL_SCALE = 0.68;
/** Play Store listesi — maske yok, sembol kaynağa yakın (kenar boşluğu kaynakta) */
const PLAY_STORE_SCALE = 1;

const RESIZE = { kernel: sharp.kernel.lanczos3 };

function bgCss() {
    return `rgb(${BG_RGB.r}, ${BG_RGB.g}, ${BG_RGB.b})`;
}

async function normalizeGreenBg(buf, width, height) {
    const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const ch = info.channels;
    const { r: tr, g: tg, b: tb } = BG_RGB;
    for (let i = 0; i < data.length; i += ch) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (g > r + 24 && g > b + 12 && g > 35) {
            data[i] = tr;
            data[i + 1] = tg;
            data[i + 2] = tb;
        }
    }
    return sharp(data, { raw: { width, height, channels: ch } }).png().toBuffer();
}

function exportPng(pipeline, dest, size) {
    return pipeline
        .resize(size, size, RESIZE)
        .sharpen({ sigma: size >= 1024 ? 0.55 : size >= 512 ? 0.5 : 0.45 })
        .png({ compressionLevel: 6, effort: 10 })
        .toFile(dest);
}

async function buildSquareCanvas(normalizedBuf, width, height, scale) {
    if (scale >= 1 && width === height) {
        return sharp(normalizedBuf).sharpen({ sigma: 0.4 }).png().toBuffer();
    }
    const canvas = Math.max(width, height);
    const fit = (canvas * scale) / Math.max(width, height);
    const scaledW = Math.round(width * fit);
    const scaledH = Math.round(height * fit);
    const scaledBuf = await sharp(normalizedBuf)
        .resize(scaledW, scaledH, RESIZE)
        .sharpen({ sigma: 0.5 })
        .png()
        .toBuffer();
    const left = Math.floor((canvas - scaledW) / 2);
    const top = Math.floor((canvas - scaledH) / 2);

    return sharp({
        create: {
            width: canvas,
            height: canvas,
            channels: 3,
            background: bgCss(),
        },
    })
        .composite([{ input: scaledBuf, left, top }])
        .png()
        .toBuffer();
}

if (!fs.existsSync(src)) {
    console.error('Kaynak bulunamadı:', src);
    process.exit(1);
}

(async () => {
    const trimmedBuf = await sharp(src)
        .trim({ threshold: 20, background: '#ffffff' })
        .png()
        .toBuffer();
    const { width, height } = await sharp(trimmedBuf).metadata();
    console.log('trimmed', width, 'x', height);
    const normalizedBuf = await normalizeGreenBg(trimmedBuf, width, height);

    const squareBuf = await buildSquareCanvas(normalizedBuf, width, height, SYMBOL_SCALE);
    console.log('launcher symbol scale', Math.round(SYMBOL_SCALE * 100) + '%', 'bg', BG_HEX);

    const playSquareBuf = await buildSquareCanvas(normalizedBuf, width, height, PLAY_STORE_SCALE);
    console.log('play store symbol scale', Math.round(PLAY_STORE_SCALE * 100) + '%');

    await exportPng(sharp(squareBuf), master, 1920);
    await exportPng(sharp(squareBuf), appIcon, 1024);
    await exportPng(sharp(playSquareBuf), playIcon, 512);
    console.log('saved', path.relative(ROOT, master));
    console.log('saved', path.relative(ROOT, appIcon));
    console.log('saved', path.relative(ROOT, playIcon));
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
