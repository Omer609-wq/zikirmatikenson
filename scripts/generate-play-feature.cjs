/**
 * Play Store özellik grafiği — 1024×500, EN + TR
 *
 * Tasarım kararları:
 * - Arka plan, mağaza ekran görselleriyle AYNI siyah-yeşil gradyan (marka bütünlüğü).
 *   Eski sürüm daha açık yeşildi (#122a1c) ve şeritte diğer görsellerden kopuk duruyordu.
 * - Tüm içerik "güvenli alan" içinde (kenarlardan SAFE px). Play, özellik grafiğini
 *   video kapağı ve kart olarak farklı en-boy oranlarına KIRPAR; kenara dayanan
 *   yazılar kesiliyordu.
 * - Metinler SVG ile çizilir; taban görsele (play-feature-base.png) bağımlılık yok.
 *
 * Kullanım: node scripts/generate-play-feature.cjs [--locale=en|tr|all]
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { SHARPEN, applySharpen } = require('./icon-colors.cjs');

const ROOT = path.join(__dirname, '..');
const emblemPath = path.join(ROOT, 'resources', 'play-feature-emblem.png');

const W = 1024;
const H = 500;
/** Kenar güvenli alanı — Play kırpmasında kesilmemesi gereken sınır. */
const SAFE = 102;

const LOGO = 190;
/** Logo tam merkez değil: sağdaki marka bloğu daha geniş, ona yer açmak için hafif solda. */
const LOGO_LEFT = 400;
const LOGO_TOP = 158;

/** Sol sütun (rozet + madde listesi) */
const LEFT_X = 122;
const BADGE_Y = 148;
const FEATURE_Y = [216, 264, 312, 360];

/** Sağ sütun (marka bloğu) — text-anchor: middle; SAFE sınırına göre konumlandı. */
const RIGHT_X = 768;
const BRAND_Y = 252;
const SUBTITLE_Y = 292;
const TAGLINE_Y = 330;

const LOCALES = {
    en: {
        outFile: 'play-feature-1024x500.png',
        badge: { title: 'AD-FREE', sub: 'No ads. Ever.' },
        features: ['Dhikr Tracking', 'Quran Library', 'Progress Statistics', 'And much more...'],
        subtitle: 'DHIKR & QURAN',
        tagline: 'Your spiritual companion.'
    },
    tr: {
        outFile: 'play-feature-1024x500-tr.png',
        badge: { title: 'REKLAMSIZ', sub: 'Reklam yok. Hiçbir zaman.' },
        features: ['Zikir Takibi', "Kur'an Kütüphanesi", 'İlerleme İstatistikleri', 'Ve çok daha fazlası...'],
        subtitle: "ZİKİR & KUR'AN",
        tagline: 'Manevi yol arkadaşın.'
    }
};

function esc(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** Mağaza ekran görselleriyle aynı zemin + altın metinler. */
function sceneSvg(locale) {
    const L = LOCALES[locale];
    const badgeSize = locale === 'tr' ? 52 : 58;
    const badgeSpacing = locale === 'tr' ? 3 : 5;

    const features = L.features
        .map(
            (text, i) => `
  <text x="${LEFT_X}" y="${FEATURE_Y[i]}" font-family="Georgia, 'Times New Roman', serif"
    font-size="23" font-weight="400" fill="#eef3f0" fill-opacity="0.94"
    letter-spacing="0.4">• ${esc(text)}</text>`
        )
        .join('');

    return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Mağaza görselleriyle aynı renk ailesi; yeşil uç köşeye yakın kalsın diye
         geçiş dikeye yakın (yatay olsaydı sağ yarı fazla yeşil görünüyordu). -->
    <linearGradient id="bg" x1="8%" y1="0%" x2="72%" y2="100%">
      <stop offset="0%" stop-color="#030404"/>
      <stop offset="55%" stop-color="#050807"/>
      <stop offset="100%" stop-color="#071310"/>
    </linearGradient>
    <radialGradient id="glow" cx="76%" cy="18%" r="58%">
      <stop offset="0%" stop-color="#0a6e48" stop-opacity="0.20"/>
      <stop offset="100%" stop-color="#0a6e48" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="14%" cy="92%" r="52%">
      <stop offset="0%" stop-color="#0a6e48" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#0a6e48" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f0dfa0"/>
      <stop offset="40%" stop-color="#d4b04a"/>
      <stop offset="100%" stop-color="#9a7728"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect width="${W}" height="${H}" fill="url(#glow2)"/>

  <!-- Sol: reklamsız rozeti -->
  <text x="${LEFT_X + 2}" y="${BADGE_Y + 2}" font-family="Georgia, 'Times New Roman', serif"
    font-size="${badgeSize}" font-weight="700" fill="#000000" fill-opacity="0.3"
    letter-spacing="${badgeSpacing}">${esc(L.badge.title)}</text>
  <text x="${LEFT_X}" y="${BADGE_Y}" font-family="Georgia, 'Times New Roman', serif"
    font-size="${badgeSize}" font-weight="700" fill="url(#gold)"
    letter-spacing="${badgeSpacing}">${esc(L.badge.title)}</text>
  <text x="${LEFT_X}" y="${BADGE_Y + 32}" font-family="Georgia, 'Times New Roman', serif"
    font-size="19" font-weight="400" fill="#eef3f0" fill-opacity="0.72"
    letter-spacing="0.6">${esc(L.badge.sub)}</text>
  ${features}

  <!-- Sağ: marka bloğu -->
  <text x="${RIGHT_X}" y="${BRAND_Y}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif"
    font-size="42" font-weight="700" fill="url(#gold)" letter-spacing="1.5">ZIKIRMATIK</text>
  <text x="${RIGHT_X}" y="${SUBTITLE_Y}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif"
    font-size="22" font-weight="600" fill="#eef3f0" fill-opacity="0.9"
    letter-spacing="3">${esc(L.subtitle)}</text>
  <text x="${RIGHT_X}" y="${TAGLINE_Y}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif"
    font-size="18" font-style="italic" font-weight="400" fill="#eef3f0"
    fill-opacity="0.78">${esc(L.tagline)}</text>
</svg>`);
}

/** Emblem PNG'sinin koyu yeşil zeminini şeffaflaştırır (gradyan üzerinde dursun). */
async function emblemTransparent(size) {
    const buf = await applySharpen(
        sharp(emblemPath).resize(size, size, { kernel: sharp.kernel.lanczos3 }),
        SHARPEN.featureLogo
    )
        .png()
        .toBuffer();

    const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const ch = info.channels;
    for (let i = 0; i < data.length; i += ch) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const lum = (r + g + b) / 3;
        const isGold = r > 88 && g > 68 && r >= g - 12 && (r + g) / 2 > b + 18;
        // Altın desen dışındaki koyu/yeşil zemin ve mor kenar artığı → şeffaf
        const greenish = !isGold && g >= r - 18 && g >= b - 12 && lum < 140;
        const purpleEdge = b > r + 18 && b > g + 10 && lum < 220;
        if (greenish || purpleEdge) data[i + 3] = 0;
    }
    return sharp(data, { raw: { width: size, height: size, channels: ch } }).png().toBuffer();
}

async function generateLocale(locale) {
    const cfg = LOCALES[locale];
    const outPath = path.join(ROOT, 'resources', cfg.outFile);
    const logo = await emblemTransparent(LOGO);

    await sharp(sceneSvg(locale))
        .composite([{ input: logo, left: LOGO_LEFT, top: LOGO_TOP, blend: 'over' }])
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
