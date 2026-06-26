/**
 * UI locale dosyalarında anahtar tutarlılığını doğrular.
 * Referans: locales/en.json (tüm desteklenen dillerde aynı anahtarlar olmalı).
 * tr.json ile en.json anahtar kümesi birebir aynı olmalı (i18n fallback tr).
 *
 * Usage: node scripts/verify-locale-keys.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LOCALES_DIR = path.join(ROOT, 'locales');

/** en.json'da olmayan, locale'e özel izinli ek anahtarlar */
const ALLOWED_EXTRA_KEYS = {
    ar: new Set(['quran.searchArHit'])
};

const SUPPORTED_UI_LOCALES = ['tr', 'ar', 'id', 'ms', 'en', 'fr', 'bn', 'ur'];

function flattenKeys(obj, prefix = '') {
    const out = [];
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return out;
    for (const [key, value] of Object.entries(obj)) {
        const full = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            out.push(...flattenKeys(value, full));
        } else {
            out.push(full);
        }
    }
    return out;
}

function loadLocale(code) {
    const filePath = path.join(LOCALES_DIR, `${code}.json`);
    if (!fs.existsSync(filePath)) {
        return { ok: false, error: `dosya yok: ${filePath}` };
    }
    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return { ok: true, data, keys: new Set(flattenKeys(data)) };
    } catch (err) {
        return { ok: false, error: `JSON parse hatası (${code}): ${err.message}` };
    }
}

function main() {
    const ref = loadLocale('en');
    if (!ref.ok) {
        console.error('FAIL:', ref.error);
        process.exit(1);
    }

    const tr = loadLocale('tr');
    if (!tr.ok) {
        console.error('FAIL:', tr.error);
        process.exit(1);
    }

    let failed = false;

    const enOnly = [...ref.keys].filter((k) => !tr.keys.has(k)).sort();
    const trOnly = [...tr.keys].filter((k) => !ref.keys.has(k)).sort();
    if (enOnly.length) {
        console.error('FAIL tr.json: en.json\'da olup tr\'de eksik anahtarlar:');
        enOnly.forEach((k) => console.error(`  - ${k}`));
        failed = true;
    }
    if (trOnly.length) {
        console.error('FAIL en.json: tr.json\'da olup en\'de eksik anahtarlar:');
        trOnly.forEach((k) => console.error(`  - ${k}`));
        failed = true;
    }

    for (const code of SUPPORTED_UI_LOCALES) {
        if (code === 'en') continue;
        const loc = loadLocale(code);
        if (!loc.ok) {
            console.error(`FAIL ${code}:`, loc.error);
            failed = true;
            continue;
        }

        const missing = [...ref.keys].filter((k) => !loc.keys.has(k)).sort();
        const allowedExtra = ALLOWED_EXTRA_KEYS[code] || new Set();
        const extra = [...loc.keys].filter((k) => !ref.keys.has(k) && !allowedExtra.has(k)).sort();

        if (missing.length) {
            console.error(`FAIL locales/${code}.json: eksik anahtarlar (${missing.length}):`);
            missing.forEach((k) => console.error(`  - ${k}`));
            failed = true;
        }
        if (extra.length) {
            console.error(`FAIL locales/${code}.json: izinsiz fazla anahtarlar:`);
            extra.forEach((k) => console.error(`  - ${k}`));
            failed = true;
        }

        const allowedOnly = [...loc.keys].filter((k) => allowedExtra.has(k)).sort();
        if (!missing.length && !extra.length) {
            const note =
                allowedOnly.length > 0 ? ` (+${allowedOnly.length} locale-özel)` : '';
            console.log(`OK locales/${code}.json: ${loc.keys.size} anahtar${note}`);
        }
    }

    if (failed) {
        console.error(
            '\nYeni arayüz metni eklerken: locales/en.json + locales/tr.json + diğer 6 dil.'
        );
        console.error('Doğrula: npm run i18n:verify');
        process.exit(1);
    }

    console.log(`\nTüm UI locale dosyaları en.json ile uyumlu (${ref.keys.size} anahtar).`);
}

main();
