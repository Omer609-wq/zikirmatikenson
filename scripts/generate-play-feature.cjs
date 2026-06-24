/**
 * Play Store özellik grafiği — taban görsel, tek yeşil zemin, ortada logo
 * Kullanım: node scripts/generate-play-feature.cjs
 */
const path = require('path');
const sharp = require('sharp');
const { BG_RGB } = require('./icon-colors.cjs');

const ROOT = path.join(__dirname, '..');
const basePath = path.join(ROOT, 'resources', 'play-feature-base.png');
const logoPath = path.join(ROOT, 'resources', 'play-console-icon-512.png');
const outPath = path.join(ROOT, 'resources', 'play-feature-1024x500.png');

const RESIZE = { kernel: sharp.kernel.lanczos3 };
const LOGO = 308;
const OUT_H = 500;

/** Play özellik grafiği — global listing ile uyumlu, reklamsız vurgusu */
const AD_FREE_LABEL = 'AD-FREE';
const AD_FREE_SUB = 'No ads. Ever.';

function adFreeOverlaySvg(width, height) {
    return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gold" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f0dfa0"/>
      <stop offset="40%" stop-color="#d4b04a"/>
      <stop offset="100%" stop-color="#9a7728"/>
    </linearGradient>
  </defs>
  <text x="54" y="86" font-family="Georgia, 'Times New Roman', serif" font-size="64" font-weight="700"
    fill="#000000" fill-opacity="0.28" letter-spacing="6">${AD_FREE_LABEL}</text>
  <text x="52" y="84" font-family="Georgia, 'Times New Roman', serif" font-size="64" font-weight="700"
    fill="url(#gold)" letter-spacing="6">${AD_FREE_LABEL}</text>
  <text x="54" y="124" font-family="Georgia, 'Times New Roman', serif" font-size="22" font-weight="400"
    fill="#f5f0e6" fill-opacity="0.92" letter-spacing="1.5">${AD_FREE_SUB}</text>
</svg>`);
}

/** AD-FREE sabit; taban görseldeki tüm içerik (liste, logo alanı, sağ yazılar) birlikte aşağı */
const CONTENT_SHIFT_Y = 38;

function shiftAllContentDown(data, w, h, ch, shiftY) {
    const bg = bgAt();
    const moves = [];
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const i = (y * w + x) * ch;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            if (!isGold(r, g, b) && !isLightText(r, g, b)) continue;
            if (y + shiftY >= h) continue;
            moves.push({
                x,
                y,
                r,
                g,
                b,
                a: ch === 4 ? data[i + 3] : 255,
            });
        }
    }
    for (const m of moves) {
        const i = (m.y * w + m.x) * ch;
        data[i] = bg.r;
        data[i + 1] = bg.g;
        data[i + 2] = bg.b;
        if (ch === 4) data[i + 3] = 255;
    }
    for (const m of moves) {
        const i = ((m.y + shiftY) * w + m.x) * ch;
        data[i] = m.r;
        data[i + 1] = m.g;
        data[i + 2] = m.b;
        if (ch === 4) data[i + 3] = m.a;
    }
}

function isGold(r, g, b) {
    return r > 88 && g > 68 && r >= g - 12 && (r + g) / 2 > b + 18;
}

function isLightText(r, g, b) {
    const lum = (r + g + b) / 3;
    return lum > 145 && Math.abs(r - g) < 35 && Math.abs(g - b) < 40;
}

function isGreenish(r, g, b) {
    if (isGold(r, g, b) || isLightText(r, g, b)) return false;
    return g >= r - 8 && g >= b - 4 && g > 22;
}

function bgAt() {
    return { r: BG_RGB.r, g: BG_RGB.g, b: BG_RGB.b };
}

async function unifyCanvas(data, w, h, ch) {
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const i = (y * w + x) * ch;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            if (isGold(r, g, b) || isLightText(r, g, b)) continue;
            const t = bgAt();
            data[i] = t.r;
            data[i + 1] = t.g;
            data[i + 2] = t.b;
            if (ch === 4) data[i + 3] = 255;
        }
    }
}

async function logoWithTransparentBg(buf, w, h) {
    const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const ch = info.channels;
    const bg = bgAt();
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const i = (y * w + x) * ch;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const lum = (r + g + b) / 3;
            const greenish = !isGold(r, g, b) && g >= r - 18 && g >= b - 12 && lum < 125;
            if (greenish) {
                data[i + 3] = 0;
            } else {
                data[i + 3] = 255;
            }
        }
    }
    return sharp(data, { raw: { width: w, height: h, channels: ch } }).png().toBuffer();
}

async function solidRect(w, h, rgb) {
    return sharp({
        create: { width: w, height: h, channels: 3, background: rgb },
    })
        .png()
        .toBuffer();
}

(async () => {
    const baseMeta = await sharp(basePath).metadata();
    const W = baseMeta.width;
    const H = baseMeta.height;
    const padBottom = Math.max(0, OUT_H - H);

    const { data, info } = await sharp(basePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const ch = info.channels;
    await unifyCanvas(data, W, H, ch);
    shiftAllContentDown(data, W, H, ch, CONTENT_SHIFT_Y);

    const cx = Math.round(W / 2);
    const cy = Math.round(H / 2) + CONTENT_SHIFT_Y;
    const logoLeft = cx - Math.round(LOGO / 2);
    const logoTop = cy - Math.round(LOGO / 2);

    const logoBuf = await sharp(logoPath).resize(LOGO, LOGO, RESIZE).sharpen({ sigma: 0.5 }).png().toBuffer();
    const logoCut = await logoWithTransparentBg(logoBuf, LOGO, LOGO);
    const patchPad = 6;
    const patchBuf = await solidRect(LOGO + patchPad * 2, LOGO + patchPad * 2, bgAt());
    const outW = W;
    const outH = H + padBottom;
    const adFreeSvg = adFreeOverlaySvg(outW, outH);

    await sharp(data, { raw: { width: W, height: H, channels: ch } })
        .extend({
            top: 0,
            bottom: padBottom,
            background: { r: BG_RGB.r, g: BG_RGB.g, b: BG_RGB.b },
        })
        .composite([
            { input: patchBuf, left: logoLeft - patchPad, top: logoTop - patchPad },
            { input: logoCut, left: logoLeft, top: logoTop, blend: 'over' },
            { input: adFreeSvg, left: 0, top: 0, blend: 'over' },
        ])
        .png({ compressionLevel: 6 })
        .toFile(outPath);

    console.log(
        'saved',
        path.relative(ROOT, outPath),
        `unified #122a1c, logo ${LOGO}px, badge "${AD_FREE_LABEL}", content +${CONTENT_SHIFT_Y}px`
    );
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
