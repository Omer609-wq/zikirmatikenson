/**
 * @capacitor/assets adaptive ikonda çift katman + inset bazen logoda "eski ikon / çift yeşil" gösterir.
 * Üretimden sonra tek renk arka plan + inset'siz ön plana çevirir.
 * Arka plan rengi package.json içindeki cap:icons --iconBackgroundColor ile aynı olmalı.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { BG_HEX, SHARPEN, SHARPEN_ENABLED, applySharpen } = require('./icon-colors.cjs');

const ROOT = path.join(__dirname, '..');
const COLOR_HEX = BG_HEX;
/** Adaptive ön plan inset; kaynakta kenar boşluğu varsa 0%, yoksa ~18–20% */
const FOREGROUND_INSET = '0%';
const PWA_SIZES = [48, 72, 96, 128, 192, 256, 512];
const RESIZE = { kernel: sharp.kernel.lanczos3 };

const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground_shifted" />
</adaptive-icon>
`;

const foregroundShiftedXml = `<?xml version="1.0" encoding="utf-8"?>
<inset xmlns:android="http://schemas.android.com/apk/res/android"
    android:drawable="@mipmap/ic_launcher_foreground"
    android:insetLeft="${FOREGROUND_INSET}"
    android:insetTop="${FOREGROUND_INSET}"
    android:insetRight="${FOREGROUND_INSET}"
    android:insetBottom="${FOREGROUND_INSET}" />
`;

const valuesXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${COLOR_HEX}</color>
</resources>
`;

const v26 = path.join(ROOT, 'android', 'app', 'src', 'main', 'res', 'mipmap-anydpi-v26');
const valuesPath = path.join(ROOT, 'android', 'app', 'src', 'main', 'res', 'values', 'ic_launcher_background.xml');
const shiftedPath = path.join(ROOT, 'android', 'app', 'src', 'main', 'res', 'drawable', 'ic_launcher_foreground_shifted.xml');
const resRoot = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');
const appIcon = path.join(ROOT, 'resources', 'app-icon.png');
const pwaDir = path.join(ROOT, 'public', 'assets', 'icons');

function sharpenSigmaForPx(px) {
    if (px <= 72) return { sigma: 0.38, m1: 0.42, m2: 1.9 };
    if (px <= 192) return { sigma: 0.44, m1: 0.45, m2: 2.05 };
    return SHARPEN.light512;
}

async function sharpenMipmapTree() {
    if (!fs.existsSync(resRoot)) return;
    const names = fs.readdirSync(resRoot);
    for (const dir of names) {
        if (!dir.startsWith('mipmap-')) continue;
        const folder = path.join(resRoot, dir);
        const fg = path.join(folder, 'ic_launcher_foreground.png');
        if (!fs.existsSync(fg)) continue;
        const out = await applySharpen(sharp(fg), SHARPEN.light512)
            .png({ compressionLevel: 6 })
            .toBuffer();
        if (SHARPEN_ENABLED) {
            fs.writeFileSync(fg, out);
            console.log('sharpened', path.relative(ROOT, fg));
        }
    }
}

async function regeneratePwaIcons() {
    if (!fs.existsSync(appIcon)) return;
    fs.mkdirSync(pwaDir, { recursive: true });
    for (const size of PWA_SIZES) {
        const dest = path.join(pwaDir, `icon-${size}.webp`);
        const out = await applySharpen(sharp(appIcon).resize(size, size, RESIZE), sharpenSigmaForPx(size))
            .webp({ quality: 95, effort: 6, smartSubsample: false })
            .toBuffer();
        fs.writeFileSync(dest, out);
        console.log('pwa', path.relative(ROOT, dest), `@${size}`);
    }
}

(async () => {
    fs.writeFileSync(shiftedPath, foregroundShiftedXml, 'utf8');
    console.log('patched', path.relative(ROOT, shiftedPath), `(inset ${FOREGROUND_INSET})`);

    for (const name of ['ic_launcher.xml', 'ic_launcher_round.xml']) {
        const p = path.join(v26, name);
        if (fs.existsSync(p)) {
            fs.writeFileSync(p, adaptiveXml, 'utf8');
            console.log('patched', path.relative(ROOT, p));
        }
    }
    fs.writeFileSync(valuesPath, valuesXml, 'utf8');
    console.log('patched', path.relative(ROOT, valuesPath));

    await sharpenMipmapTree();
    await regeneratePwaIcons();

    const manifestPath = path.join(ROOT, 'public', 'manifest.json');
    if (fs.existsSync(manifestPath)) {
        let m = fs.readFileSync(manifestPath, 'utf8');
        m = m.replace(/"type": "image\/png"/g, '"type": "image/webp"');
        fs.writeFileSync(manifestPath, m, 'utf8');
        console.log('patched', path.relative(ROOT, manifestPath), '(webp types)');
    }

    const notifPath = path.join(resRoot, 'drawable', 'ic_notification_large.xml');
    if (fs.existsSync(notifPath)) {
        let xml = fs.readFileSync(notifPath, 'utf8');
        const next = xml.replace(/android:color="#[0-9a-fA-F]{6}"/, `android:color="${COLOR_HEX}"`);
        if (next !== xml) {
            fs.writeFileSync(notifPath, next, 'utf8');
            console.log('patched', path.relative(ROOT, notifPath));
        }
    }
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
