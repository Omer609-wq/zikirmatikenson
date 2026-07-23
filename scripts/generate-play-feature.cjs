/**
 * Play Store özellik grafiği — 1024×500, EN + TR
 * EN: taban premium metinleri korunur (orijinal kalite). TR: yalnızca çeviri overlay.
 * Kullanım: node scripts/generate-play-feature.cjs [--locale=en|tr|all]
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { BG_RGB, SHARPEN, applySharpen } = require('./icon-colors.cjs');

const ROOT = path.join(__dirname, '..');
const basePath = path.join(ROOT, 'resources', 'play-feature-base.png');
const emblemPath = path.join(ROOT, 'resources', 'play-feature-emblem.png');

const RESIZE = { kernel: sharp.kernel.lanczos3 };
const OUT_H = 500;
const CONTENT_SHIFT_Y = 38;

const LOGO = 228;
const LOGO_LEFT = 398;
const LOGO_TOP = 178;

const LOCALES = {
    en: {
        outFile: 'play-feature-1024x500.png',
        badge: { title: 'AD-FREE', sub: 'No ads. Ever.' },
    },
    tr: {
        outFile: 'play-feature-1024x500-tr.png',
        badge: { title: 'REKLAMSIZ', sub: 'Reklam yok. Hiçbir zaman.' },
        features: ['Zikir Takibi', "Kur'an Kütüphanesi", 'İlerleme İstatistikleri', 'Ve çok daha fazlası...'],
        subtitle: "ZİKİR & KUR'AN",
        tagline: 'Manevi yol arkadaşın.',
    },
};

const FEATURE_Y = [203, 263, 324, 385];
const FEATURE_X = 122;
const RIGHT_X = 828;
const SUBTITLE_Y = 348;
const TAGLINE_Y = 376;

function esc(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function badgeSvg(locale) {
    const L = LOCALES[locale];
    const badgeTitleSize = locale === 'tr' ? 58 : 64;
    const badgeSubSize = 22;
    const subLine =
        locale === 'tr'
            ? ''
            : `<text x="54" y="124" font-family="Georgia, 'Times New Roman', serif" font-size="${badgeSubSize}" font-weight="400"
    fill="#f5f0e6" fill-opacity="0.92" letter-spacing="1">${esc(L.badge.sub)}</text>`;
    return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="500" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gold" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f0dfa0"/>
      <stop offset="40%" stop-color="#d4b04a"/>
      <stop offset="100%" stop-color="#9a7728"/>
    </linearGradient>
  </defs>
  <text x="54" y="86" font-family="Georgia, 'Times New Roman', serif" font-size="${badgeTitleSize}" font-weight="700"
    fill="#000000" fill-opacity="0.28" letter-spacing="${locale === 'tr' ? 4 : 6}">${esc(L.badge.title)}</text>
  <text x="52" y="84" font-family="Georgia, 'Times New Roman', serif" font-size="${badgeTitleSize}" font-weight="700"
    fill="url(#gold)" letter-spacing="${locale === 'tr' ? 4 : 6}">${esc(L.badge.title)}</text>
  ${subLine}
</svg>`);
}

function trTextSvg() {
    const L = LOCALES.tr;
    const featureLines = L.features
        .map(
            (text, i) => `
  <text x="${FEATURE_X}" y="${FEATURE_Y[i]}" font-family="Georgia, 'Times New Roman', serif"
    font-size="${i === 2 ? 21 : 24}" font-weight="400"
    fill="#f5f0e6" fill-opacity="0.95" letter-spacing="0.5">${esc(text)}</text>`
        )
        .join('');
    return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="500" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gold" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f0dfa0"/>
      <stop offset="40%" stop-color="#d4b04a"/>
      <stop offset="100%" stop-color="#9a7728"/>
    </linearGradient>
  </defs>
  ${featureLines}
  <text x="${RIGHT_X}" y="${SUBTITLE_Y}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif"
    font-size="24" font-weight="600" fill="url(#gold)" letter-spacing="3">${esc(L.subtitle)}</text>
  <text x="${RIGHT_X}" y="${TAGLINE_Y}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif"
    font-size="19" font-style="italic" font-weight="400" fill="#f5f0e6" fill-opacity="0.9">${esc(L.tagline)}</text>
</svg>`);
}

function shiftAllContentDown(data, w, h, ch, shiftY) {
    const bg = bgAt();
    const moves = [];
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const i = (y * w + x) * ch;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            if (!isGold(r, g, b) && !isLight(r, g, b)) continue;
            if (y + shiftY >= h) continue;
            moves.push({ x, y, r, g, b, a: ch === 4 ? data[i + 3] : 255 });
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

function eraseRegion(data, w, h, ch, x0, y0, x1, y1) {
    const bg = bgAt();
    for (let y = Math.max(0, y0); y <= Math.min(h - 1, y1); y++) {
        for (let x = Math.max(0, x0); x <= Math.min(w - 1, x1); x++) {
            const i = (y * w + x) * ch;
            data[i] = bg.r;
            data[i + 1] = bg.g;
            data[i + 2] = bg.b;
            if (ch === 4) data[i + 3] = 255;
        }
    }
}

function isGold(r, g, b) {
    return r > 88 && g > 68 && r >= g - 12 && (r + g) / 2 > b + 18;
}

function isLight(r, g, b) {
    const lum = (r + g + b) / 3;
    return lum > 145 && Math.abs(r - g) < 35 && Math.abs(g - b) < 40;
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
            if (isGold(r, g, b) || isLight(r, g, b)) continue;
            const t = bgAt();
            data[i] = t.r;
            data[i + 1] = t.g;
            data[i + 2] = t.b;
            if (ch === 4) data[i + 3] = 255;
        }
    }
}

async function emblemWithTransparentBg(buf, w, h) {
    const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const ch = info.channels;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const i = (y * w + x) * ch;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const lum = (r + g + b) / 3;
            const greenish = !isGold(r, g, b) && g >= r - 18 && g >= b - 12 && lum < 140;
            /** Eski ekran görüntüsü / UI kenarından kalan mor-pembe çerçeve */
            const purpleEdge = b > r + 18 && b > g + 10 && lum < 220;
            data[i + 3] = greenish || purpleEdge ? 0 : 255;
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

async function prepareCanvas(locale) {
    const baseMeta = await sharp(basePath).metadata();
    const W = baseMeta.width;
    const H = baseMeta.height;

    const { data, info } = await sharp(basePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const ch = info.channels;
    await unifyCanvas(data, W, H, ch);
    shiftAllContentDown(data, W, H, ch, CONTENT_SHIFT_Y);

    /** Kabe silüeti — orta logo alanı */
    eraseRegion(data, W, H, ch, 360, 128, 668, 388);

    if (locale === 'tr') {
        /** Sol madde metinleri — ikonlar x≤114 korunur */
        eraseRegion(data, W, H, ch, 118, 168, 405, 398);
        /** Sağ alt satırlar — premium ZIKIRMATIK (y≤321) korunur */
        eraseRegion(data, W, H, ch, 612, 322, 1018, 398);
    }

    return { data, W, H, ch };
}

async function generateLocale(locale) {
    const cfg = LOCALES[locale];
    const outPath = path.join(ROOT, 'resources', cfg.outFile);
    const { data, W, H, ch } = await prepareCanvas(locale);
    const padBottom = Math.max(0, OUT_H - H);

    const logoBuf = await applySharpen(sharp(emblemPath).resize(LOGO, LOGO, RESIZE), SHARPEN.featureLogo)
        .png()
        .toBuffer();
    const logoCut = await emblemWithTransparentBg(logoBuf, LOGO, LOGO);
    const patchPad = 8;
    const patchBuf = await solidRect(LOGO + patchPad * 2, LOGO + patchPad * 2, bgAt());

    const composites = [];
    if (locale === 'tr') {
        composites.push({ input: await solidRect(406, 78, bgAt()), left: 612, top: 322 });
    }
    composites.push(
        { input: patchBuf, left: LOGO_LEFT - patchPad, top: LOGO_TOP - patchPad },
        { input: logoCut, left: LOGO_LEFT, top: LOGO_TOP, blend: 'over' },
        { input: badgeSvg(locale), left: 0, top: 0, blend: 'over' }
    );
    if (locale === 'tr') {
        composites.push({ input: trTextSvg(), left: 0, top: 0, blend: 'over' });
    }

    await sharp(data, { raw: { width: W, height: H, channels: ch } })
        .extend({
            top: 0,
            bottom: padBottom,
            background: { r: BG_RGB.r, g: BG_RGB.g, b: BG_RGB.b },
        })
        .composite(composites)
        .png({ compressionLevel: 6 })
        .toFile(outPath);

    console.log('saved', path.relative(ROOT, outPath), `(${locale})`);
}

function parseLocalesArg() {
    const arg = process.argv.find((a) => a.startsWith('--locale='));
    const value = arg ? arg.split('=')[1] : 'all';
    if (value === 'all') return Object.keys(LOCALES);
    if (LOCALES[value]) return [value];
    console.error('Geçersiz locale:', value, '(en, tr, all)');
    process.exit(1);
}

(async () => {
    if (!fs.existsSync(emblemPath)) {
        console.error('eksik emblem:', emblemPath);
        process.exit(1);
    }
    for (const locale of parseLocalesArg()) {
        await generateLocale(locale);
    }
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
