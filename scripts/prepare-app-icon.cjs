/**
 * Kaynak görselden kare app ikonu üretir: yeşil kenar kırp, zemin rengi normalize, 1920 + 1024.
 * Varsayılan kaynak: tam kompozisyon (kûfi + filigran + çerçeve). Ölçek varsayılan 0.95.
 * Kullanım: node scripts/prepare-app-icon.cjs [kaynak-dosya] [sembol-ölçeği 0–1]
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { BG_HEX, BG_RGB } = require('./icon-colors.cjs');

const ROOT = path.join(__dirname, '..');
const argv = process.argv.slice(2);
const LAUNCHER_ONLY = argv.includes('--launcher-only');
const cliArgs = argv.filter((a) => !a.startsWith('--'));
const src =
    cliArgs[0] || path.join(ROOT, 'resources', 'app-icon-source.png');
const scaleArg = parseFloat(cliArgs[1], 10);
const appIcon = path.join(ROOT, 'resources', 'app-icon.png');
const master = path.join(ROOT, 'resources', 'app-icon-1920.png');
const playIcon = path.join(ROOT, 'resources', 'play-console-icon-512.png');
const LAUNCHER_SIZE = 1024;
/** Launcher — kaynak tam ikon kompozisyonu (çerçeve + filigran dahil) */
const SYMBOL_SCALE = Number.isFinite(scaleArg) ? scaleArg : LAUNCHER_ONLY ? 1 : 0.95;
/** Play Console — maske yok, amblem daha dolu; launcher’dan ayrı ölçek (CLI arg 3) */
const playScaleArg = parseFloat(cliArgs[2], 10);
const PLAY_STORE_SCALE = Number.isFinite(playScaleArg) ? playScaleArg : 1.0;
/** Programatik çerçeve — yeni kaynakta çerçeve/filigran gömülü */
const ADD_GOLD_FRAME = false;

const RESIZE = { kernel: sharp.kernel.lanczos3 };

function bgCss() {
    return `rgb(${BG_RGB.r}, ${BG_RGB.g}, ${BG_RGB.b})`;
}

function isGoldPixel(r, g, b) {
    const { r: tr, g: tg, b: tb } = BG_RGB;
    if (Math.abs(r - tr) < 10 && Math.abs(g - tg) < 10 && Math.abs(b - tb) < 10) return false;
    return r > 95 && g > 65 && b < 135 && r >= g - 35 && r + g > b + 70;
}

/** Altın gölge / kenar pikselleri korunur; geri kalan zemin tek renge çekilir */
function isEmblemPixel(r, g, b) {
    if (isGoldPixel(r, g, b)) return true;
    const { r: tr, g: tg, b: tb } = BG_RGB;
    if (Math.abs(r - tr) < 5 && Math.abs(g - tg) < 5 && Math.abs(b - tb) < 5) return false;
    const lum = r * 0.299 + g * 0.587 + b * 0.114;
    if (lum >= 34 && lum <= 125 && r >= 36 && g >= 24 && b <= 98 && r + 8 >= b) return true;
    if (lum > 118 && r > 92 && g > 68 && b < 165 && r + g > b + 55) return true;
    return false;
}

function shouldFlattenToBg(r, g, b) {
    if (isEmblemPixel(r, g, b)) return false;
    const { r: tr, g: tg, b: tb } = BG_RGB;
    const dr = r - tr;
    const dg = g - tg;
    const db = b - tb;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    const lum = (r + g + b) / 3;
    if (dist <= 32) return true;
    if (g > r + 20 && g > b + 12 && g > 40 && lum < 100) return true;
    return false;
}

async function solidifyFlatBackground(buf, width, height) {
    const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const ch = info.channels;
    const emblem = new Uint8Array(width * height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * ch;
            if (isEmblemPixel(data[i], data[i + 1], data[i + 2])) emblem[y * width + x] = 1;
        }
    }
    const keep = new Uint8Array(width * height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            if (emblem[idx]) {
                keep[idx] = 1;
                continue;
            }
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const ny = y + dy;
                    const nx = x + dx;
                    if (ny < 0 || ny >= height || nx < 0 || nx >= width) continue;
                    if (emblem[ny * width + nx]) {
                        keep[idx] = 1;
                        break;
                    }
                }
                if (keep[idx]) break;
            }
        }
    }
    const { r: tr, g: tg, b: tb } = BG_RGB;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            if (keep[idx]) continue;
            const i = idx * ch;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            if (!shouldFlattenToBg(r, g, b)) continue;
            data[i] = tr;
            data[i + 1] = tg;
            data[i + 2] = tb;
            if (ch === 4) data[i + 3] = 255;
        }
    }
    return sharp(data, { raw: { width, height, channels: ch } }).png().toBuffer();
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
            if (ch === 4) data[i + 3] = 255;
        }
    }
    return sharp(data, { raw: { width, height, channels: ch } }).png().toBuffer();
}

function exportPngFromSquare(squareBuf, dest, size) {
    const pipeline = sharp(squareBuf);
    const sized =
        size === LAUNCHER_SIZE ? pipeline : pipeline.resize(size, size, RESIZE);
    return sized
        .flatten({ background: BG_RGB })
        .png({ compressionLevel: 0, effort: 1 })
        .toFile(dest);
}

/** 1024 kare kaynak + %100 ölçek: yeniden boyutlandırma yok, netlik korunur */
async function exportLauncherPassthrough(buf, dest) {
    await sharp(buf)
        .flatten({ background: BG_RGB })
        .png({ compressionLevel: 0, effort: 1 })
        .toFile(dest);
}

/** Play Console: tek küçültme 1024→512, ek işlem yok */
async function exportPlayStoreIcon(playBuf, dest) {
    const buf = await sharp(playBuf)
        .resize(512, 512, RESIZE)
        .flatten({ background: BG_RGB })
        .png({ compressionLevel: 2, effort: 10 })
        .toBuffer();
    const kb = buf.length / 1024;
    if (kb > 1024) {
        console.warn('uyarı: Play ikonu 1 MB üzeri:', kb.toFixed(1), 'KB');
    }
    await fs.promises.writeFile(dest, buf);
    return kb;
}

function rgbCss({ r, g, b }) {
    return `rgb(${r}, ${g}, ${b})`;
}

function measureLineGaps(data, width, ch, fixed, start, end, axis) {
    const segments = [];
    let run = 0;
    let lastGold = null;
    for (let i = start; i <= end; i++) {
        const idx = axis === 'x' ? (fixed * width + i) * ch : (i * width + fixed) * ch;
        const gold = isGoldPixel(data[idx], data[idx + 1], data[idx + 2]);
        if (lastGold === null) {
            lastGold = gold;
            run = 1;
        } else if (gold === lastGold) {
            run++;
        } else {
            segments.push({ gold: lastGold, len: run });
            lastGold = gold;
            run = 1;
        }
    }
    if (run > 0) segments.push({ gold: lastGold, len: run });
    return segments.filter((s) => !s.gold).map((s) => s.len);
}

async function analyzeGoldGeometry(buf, width, height) {
    const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const ch = info.channels;
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let rs = 0;
    let gs = 0;
    let bs = 0;
    let goldCount = 0;
    const colRuns = [];

    for (let y = 0; y < height; y++) {
        let run = 0;
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * ch;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            if (isGoldPixel(r, g, b)) {
                if (x < minX) minX = x;
                if (y < minY) minY = y;
                if (x > maxX) maxX = x;
                if (y > maxY) maxY = y;
                rs += r;
                gs += g;
                bs += b;
                goldCount++;
                run++;
            } else if (run > 0) {
                colRuns.push(run);
                run = 0;
            }
        }
        if (run > 0) colRuns.push(run);
    }

    colRuns.sort((a, b) => a - b);
    const thickRuns = colRuns.filter((n) => n >= 8);
    const strokeWidth =
        thickRuns.length > 0
            ? thickRuns[Math.floor(thickRuns.length * 0.55)]
            : Math.max(12, Math.round(width * 0.028));

    const bbox = { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
    const cx = Math.floor(bbox.left + bbox.width / 2);
    const cy = Math.floor(bbox.top + bbox.height / 2);

    const hGaps = measureLineGaps(data, width, ch, cy, bbox.left, bbox.left + bbox.width, 'x');
    const vGaps = measureLineGaps(data, width, ch, cx, bbox.top, bbox.top + bbox.height, 'y');
    const innerGaps = [...hGaps, ...vGaps].filter((g) => g >= 4 && g <= bbox.width * 0.2);
    innerGaps.sort((a, b) => a - b);
    const internalGap =
        innerGaps.length > 0
            ? innerGaps[Math.floor(innerGaps.length / 2)]
            : Math.max(8, Math.round(strokeWidth * 0.85));

    const goldPixels = [];
    for (let y = bbox.top; y <= bbox.top + bbox.height; y++) {
        for (let x = bbox.left; x <= bbox.left + bbox.width; x++) {
            const i = (y * width + x) * ch;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            if (!isGoldPixel(r, g, b)) continue;
            const lum = r * 0.299 + g * 0.587 + b * 0.114;
            goldPixels.push({ r, g, b, lum });
        }
    }
    goldPixels.sort((a, b) => a.lum - b.lum);
    const pick = (p) => {
        const idx = Math.min(goldPixels.length - 1, Math.max(0, Math.floor(goldPixels.length * p)));
        const { r, g, b } = goldPixels[idx] || { r: 194, g: 165, b: 92 };
        return { r, g, b };
    };
    const goldDark = pick(0.2);
    const goldMid = pick(0.52);
    const goldLight = pick(0.8);
    const goldShadow = pick(0.08);

    return {
        bbox,
        strokeWidth,
        internalGap,
        goldRgb: goldMid,
        goldLight,
        goldDark,
        goldShadow,
    };
}

/** Tek parça halka — kûfi ile aynı sol-üst aydınlık / sağ-alt gölge (filtresiz katman) */
function frameRingSvg(canvas, bbox, stroke, gap, gold) {
    const innerL = bbox.left - gap;
    const innerT = bbox.top - gap;
    const innerW = bbox.width + gap * 2;
    const innerH = bbox.height + gap * 2;
    const outerL = innerL - stroke;
    const outerT = innerT - stroke;
    const outerW = innerW + stroke * 2;
    const outerH = innerH + stroke * 2;
    const ringPath =
        `M ${outerL} ${outerT} h ${outerW} v ${outerH} h ${-outerW} Z ` +
        `M ${innerL} ${innerT} h ${innerW} v ${innerH} h ${-innerW} Z`;
    const light = rgbCss(gold.goldLight);
    const mid = rgbCss(gold.goldRgb);
    const dark = rgbCss(gold.goldDark);
    const shadow = rgbCss(gold.goldShadow);
    const dx = Math.max(1, stroke * 0.095).toFixed(2);
    const dy = Math.max(1.2, stroke * 0.105).toFixed(2);
    const hx = (-parseFloat(dx) * 0.82).toFixed(2);
    const hy = (-parseFloat(dy) * 0.82).toFixed(2);

    return Buffer.from(
        `<svg width="${canvas}" height="${canvas}" xmlns="http://www.w3.org/2000/svg">` +
            `<defs>` +
            `<linearGradient id="fg" x1="0%" y1="0%" x2="100%" y2="100%">` +
            `<stop offset="0%" stop-color="${light}"/>` +
            `<stop offset="34%" stop-color="${mid}"/>` +
            `<stop offset="100%" stop-color="${dark}"/>` +
            `</linearGradient>` +
            `</defs>` +
            `<path d="${ringPath}" fill="${shadow}" fill-rule="evenodd" opacity="0.56" transform="translate(${dx},${dy})"/>` +
            `<path d="${ringPath}" fill="${light}" fill-rule="evenodd" opacity="0.52" transform="translate(${hx},${hy})"/>` +
            `<path d="${ringPath}" fill="url(#fg)" fill-rule="evenodd"/>` +
            `</svg>`
    );
}

async function buildFramePng(canvas, bbox, stroke, gap, gold) {
    return sharp(frameRingSvg(canvas, bbox, stroke, gap, gold)).png().toBuffer();
}

async function buildSquareCanvas(normalizedBuf, width, height, scale, frameOpts = null, canvasSize = null) {
    const canvas = canvasSize || Math.max(width, height);
    const fit = (canvas * scale) / Math.max(width, height);
    const scaledW = Math.round(width * fit);
    const scaledH = Math.round(height * fit);
    const scaleX = scaledW / width;

    let scaledBuf = await sharp(normalizedBuf)
        .resize(scaledW, scaledH, RESIZE)
        .png()
        .toBuffer();
    let emblemBuf = scaledBuf;
    let emblemLeft = Math.floor((canvas - scaledW) / 2);
    let emblemTop = Math.floor((canvas - scaledH) / 2);

    if (scaledW > canvas || scaledH > canvas) {
        const cropW = Math.min(canvas, scaledW);
        const cropH = Math.min(canvas, scaledH);
        emblemBuf = await sharp(scaledBuf)
            .extract({
                left: Math.floor((scaledW - cropW) / 2),
                top: Math.floor((scaledH - cropH) / 2),
                width: cropW,
                height: cropH,
            })
            .png()
            .toBuffer();
        emblemLeft = Math.floor((canvas - cropW) / 2);
        emblemTop = Math.floor((canvas - cropH) / 2);
    }

    const layers = [{ input: emblemBuf, left: emblemLeft, top: emblemTop }];

    if (frameOpts) {
        const bboxOnCanvas = {
            left: emblemLeft + Math.round(frameOpts.bbox.left * scaleX),
            top: emblemTop + Math.round(frameOpts.bbox.top * scaleX),
            width: Math.round(frameOpts.bbox.width * scaleX),
            height: Math.round(frameOpts.bbox.height * scaleX),
        };
        const stroke = Math.max(2, Math.round(frameOpts.strokeWidth * scaleX));
        const gap = Math.max(2, Math.round(frameOpts.internalGap * scaleX));
        layers.push({
            input: await buildFramePng(canvas, bboxOnCanvas, stroke, gap, frameOpts),
            left: 0,
            top: 0,
        });
    }

    return sharp({
        create: {
            width: canvas,
            height: canvas,
            channels: 4,
            background: { ...BG_RGB, alpha: 255 },
        },
    })
        .composite(layers)
        .png()
        .toBuffer();
}

if (!fs.existsSync(src)) {
    console.error('Kaynak bulunamadı:', src);
    process.exit(1);
}

(async () => {
    const { width, height } = await sharp(src).metadata();
    const trimmedBuf =
        width === height
            ? await sharp(src).png().toBuffer()
            : await sharp(src).trim({ threshold: 15, background: BG_HEX }).png().toBuffer();
    const { width: w, height: h } = await sharp(trimmedBuf).metadata();
    console.log('source', w, 'x', h);
    const workBuf = trimmedBuf;
    const goldMeta = ADD_GOLD_FRAME ? await analyzeGoldGeometry(workBuf, w, h) : null;
    if (goldMeta) {
        console.log(
            'stroke',
            goldMeta.strokeWidth + 'px',
            'gap',
            goldMeta.internalGap + 'px',
            'gold',
            rgbCss(goldMeta.goldRgb)
        );
    }

    const passthrough =
        LAUNCHER_ONLY && w === h && w === LAUNCHER_SIZE && SYMBOL_SCALE === 1;

    if (passthrough) {
        await exportLauncherPassthrough(workBuf, appIcon);
        console.log('launcher: 1024 doğrudan (ölçekleme/işlem yok)', 'bg', BG_HEX);
        console.log('saved', path.relative(ROOT, appIcon));
        return;
    }

    const squareBuf = await buildSquareCanvas(
        workBuf,
        w,
        h,
        SYMBOL_SCALE,
        ADD_GOLD_FRAME ? goldMeta : null
    );
    console.log('launcher symbol scale', Math.round(SYMBOL_SCALE * 100) + '%', 'bg', BG_HEX);

    await exportPngFromSquare(squareBuf, appIcon, LAUNCHER_SIZE);
    console.log('saved', path.relative(ROOT, appIcon));

    if (LAUNCHER_ONLY) return;

    const playBuf =
        PLAY_STORE_SCALE === SYMBOL_SCALE
            ? squareBuf
            : await buildSquareCanvas(
                  workBuf,
                  w,
                  h,
                  PLAY_STORE_SCALE,
                  ADD_GOLD_FRAME ? goldMeta : null
              );
    console.log('play store symbol scale', Math.round(PLAY_STORE_SCALE * 100) + '%');

    await exportPngFromSquare(squareBuf, master, 1920);
    const playKb = await exportPlayStoreIcon(playBuf, playIcon);
    console.log('saved', path.relative(ROOT, master));
    console.log('saved', path.relative(ROOT, playIcon), `(${playKb.toFixed(1)} KB, Play Console)`);
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
