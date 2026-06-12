/**
 * Meal paketleri → data/quran/search/meal-{locale}.json
 *
 * Usage:
 *   node scripts/build-quran-meal-search-index.cjs
 *   node scripts/build-quran-meal-search-index.cjs id
 */
const fs = require('fs');
const path = require('path');

const SEARCH_DIR = path.join(__dirname, '..', 'data', 'quran', 'search');

function normalizeTrMealText(value) {
    return String(value || '')
        .toLocaleLowerCase('tr')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[''`´]/g, '')
        .replace(/[^a-z0-9çğıöşüâîû\s]/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeLatinMealText(value, localeTag = 'en') {
    return String(value || '')
        .toLocaleLowerCase(localeTag)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[''`´]/g, '')
        .replace(/[^a-z0-9\s]/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeBnMealText(value) {
    return String(value || '')
        .replace(/[^\u0980-\u09FF\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeUrMealText(value) {
    return String(value || '')
        .normalize('NFKD')
        .replace(/[\u064B-\u065F\u0670\u0610-\u061A\u06D6-\u06ED\u0640]/g, '')
        .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\s]/g, ' ')
        .replace(/[أإآٱ]/g, 'ا')
        .replace(/ى/g, 'ي')
        .replace(/ؤ/g, 'و')
        .replace(/ئ/g, 'ي')
        .replace(/ة/g, 'ه')
        .replace(/\s+/g, ' ')
        .trim();
}

/** locale → { meals, normalize } — ar: ayrı Arapça ayet araması (ileride) */
const LOCALE_MEALS = {
    tr: { meals: ['diyanet', 'vakfi'], normalize: normalizeTrMealText },
    en: { meals: ['sahih'], normalize: (v) => normalizeLatinMealText(v, 'en') },
    id: { meals: ['indonesian'], normalize: (v) => normalizeLatinMealText(v, 'id') },
    ms: { meals: ['basmeih'], normalize: (v) => normalizeLatinMealText(v, 'ms') },
    fr: { meals: ['hamidullah'], normalize: (v) => normalizeLatinMealText(v, 'fr') },
    bn: { meals: ['bn'], normalize: normalizeBnMealText },
    ur: { meals: ['ahmedali', 'jalandhry'], normalize: normalizeUrMealText }
};

function buildMealRows(mealId, normalize) {
    const mealsDir = path.join(__dirname, '..', 'data', 'quran', 'meals', mealId);
    const rows = [];

    for (let surah = 1; surah <= 114; surah += 1) {
        const filePath = path.join(mealsDir, String(surah).padStart(3, '0') + '.json');
        if (!fs.existsSync(filePath)) {
            throw new Error(`Missing meal file: ${filePath}`);
        }
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        for (const ay of data.ayahs || []) {
            const text = String(ay.tr || '').trim();
            if (!text) continue;
            const norm = normalize(text);
            if (!norm) continue;
            rows.push({ m: mealId, s: surah, a: ay.n, t: text, n: norm });
        }
    }

    return rows;
}

function buildLocaleIndex(locale, cfg) {
    const ayahs = cfg.meals.flatMap((mealId) => buildMealRows(mealId, cfg.normalize));
    return {
        locale,
        meals: cfg.meals,
        ayahCount: ayahs.length,
        ayahs
    };
}

function main() {
    const only = process.argv[2] ? String(process.argv[2]).toLowerCase() : '';
    fs.mkdirSync(SEARCH_DIR, { recursive: true });

    for (const [locale, cfg] of Object.entries(LOCALE_MEALS)) {
        if (only && only !== locale) continue;
        const index = buildLocaleIndex(locale, cfg);
        const outPath = path.join(SEARCH_DIR, `meal-${locale}.json`);
        fs.writeFileSync(outPath, JSON.stringify(index) + '\n', 'utf8');
        console.log(`meal-${locale}.json:`, index.ayahCount, 'rows —', index.meals.join(', '));
        const sample = index.ayahs.find((r) => r.s === 2 && r.a === 2);
        if (sample) console.log('  sample 2:2:', sample.n.slice(0, 60));
    }
}

main();
