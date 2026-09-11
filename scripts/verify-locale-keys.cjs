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

/**
 * Sayıya göre biçim: temel anahtar + CLDR kategorisi ("home.folderZikirCount_few",
 * bkz. lib/i18n-plural.js). Bir dil yalnızca kendi dilbilgisinin gerektirdiği
 * biçimleri yazar; bu yüzden en.json ile karşılaştırmaya girmez, ayrıca doğrulanır.
 */
const PLURAL_KEY_RE = /^(.+)_(zero|one|two|few|many)$/;

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

function getPath(obj, key) {
    return key.split('.').reduce((o, k) => (o && o[k] != null ? o[k] : undefined), obj);
}

function placeholders(str) {
    return new Set([...String(str ?? '').matchAll(/\{(\w+)\}/g)].map((m) => m[1]));
}

/**
 * Çoğul biçim anahtarlarını ayırır ve doğrular: temel anahtar var mı, kategori
 * bu dilde geçerli mi ("fewer" gibi yazım hatası sessizce hiç seçilmezdi),
 * yer tutucular temel metinle uyumlu mu ({count} dışında hiçbiri düşmemeli).
 */
function checkPluralKeys(code, loc) {
    const categories = new Set(new Intl.PluralRules(code).resolvedOptions().pluralCategories);
    const errors = [];
    const variants = [];
    for (const key of loc.keys) {
        const m = PLURAL_KEY_RE.exec(key);
        if (!m) continue;
        const [, base, category] = m;
        variants.push(key);
        if (!loc.keys.has(base)) {
            errors.push(`${key}: temel anahtar yok (${base})`);
            continue;
        }
        if (!categories.has(category)) {
            errors.push(`${key}: "${category}" bu dilde çoğul kategorisi değil (${[...categories].join(', ')})`);
        }
        const vars = placeholders(getPath(loc.data, key));
        const baseVars = placeholders(getPath(loc.data, base));
        const unknown = [...vars].filter((v) => !baseVars.has(v));
        const lost = [...baseVars].filter((v) => v !== 'count' && !vars.has(v));
        if (unknown.length) errors.push(`${key}: temel metinde olmayan yer tutucu: ${unknown.join(', ')}`);
        if (lost.length) errors.push(`${key}: temel metindeki yer tutucu düşmüş: ${lost.join(', ')}`);
    }
    variants.forEach((k) => loc.keys.delete(k));
    return { errors, count: variants.length };
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
    const refPlural = checkPluralKeys('en', ref);

    const tr = loadLocale('tr');
    if (!tr.ok) {
        console.error('FAIL:', tr.error);
        process.exit(1);
    }
    // Hataları aşağıdaki dil döngüsü raporlar; burada yalnızca karşılaştırmadan ayrılır.
    checkPluralKeys('tr', tr);

    let failed = false;

    const reportPluralErrors = (code, plural) => {
        if (!plural.errors.length) return;
        console.error(`FAIL locales/${code}.json: çoğul biçim hataları:`);
        plural.errors.forEach((e) => console.error(`  - ${e}`));
        failed = true;
    };
    reportPluralErrors('en', refPlural);

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
        const plural = checkPluralKeys(code, loc);
        reportPluralErrors(code, plural);

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
        if (!missing.length && !extra.length && !plural.errors.length) {
            const note =
                (allowedOnly.length > 0 ? ` (+${allowedOnly.length} locale-özel)` : '') +
                (plural.count > 0 ? ` (+${plural.count} çoğul biçim)` : '');
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
