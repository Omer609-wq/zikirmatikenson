/**
 * Tanzil pipe-delimited meal (surah|ayah|text) → JSON per-surah files.
 * Usage: node scripts/convert-quran-meal-tanzil.cjs <path> [mealId]
 * Meal ids: vakfi | diyanet | bn | … (auto-detected from filename when omitted)
 */
const fs = require('fs');
const path = require('path');

const MEAL_META = {
    vakfi: {
        id: 'vakfi',
        nameTr: 'Diyanet Vakfı',
        translator: 'Diyanet Vakfı',
        language: 'tr'
    },
    diyanet: {
        id: 'diyanet',
        nameTr: 'Diyanet İşleri',
        translator: 'Diyanet İşleri',
        language: 'tr'
    },
    bn: {
        id: 'bn',
        nameTr: 'Bengalce meal',
        nameBn: 'বাংলা অনুবাদ',
        translator: 'Tanzil Bengali',
        language: 'bn'
    },
    muyassar: {
        id: 'muyassar',
        nameTr: 'Muyesser (Arapça tefsir)',
        nameAr: 'التفسير الميسر',
        translator: 'King Fahd Complex (Muyassar)',
        language: 'ar'
    },
    sahih: {
        id: 'sahih',
        nameTr: 'İngilizce meal (Sahih)',
        nameEn: 'Sahih International',
        translator: 'Sahih International',
        language: 'en'
    },
    hamidullah: {
        id: 'hamidullah',
        nameTr: 'Fransızca meal (Hamidullah)',
        nameFr: 'Muhammad Hamidullah',
        translator: 'Muhammad Hamidullah',
        language: 'fr'
    },
    basmeih: {
        id: 'basmeih',
        nameTr: 'Melayu meal (Basmeih)',
        nameMs: 'Abdullah Basmeih',
        translator: 'Abdullah Basmeih',
        language: 'ms'
    },
    indonesian: {
        id: 'indonesian',
        nameTr: 'Endonezce meal',
        nameId: 'Terjemahan Indonesia',
        translator: 'Kementerian Agama RI',
        language: 'id'
    },
    ahmedali: {
        id: 'ahmedali',
        nameTr: 'Urduca meal (Ahmed Ali)',
        nameUr: 'احمد علی لاہوری',
        translator: 'Ahmed Ali Lahori',
        language: 'ur'
    },
    jalandhry: {
        id: 'jalandhry',
        nameTr: 'Urduca meal (Jalandhry)',
        nameUr: 'فتح محمد جالندھری',
        translator: 'Fateh Muhammad Jalandhry',
        language: 'ur'
    }
};

function detectMealId(filePath, argId) {
    if (argId && MEAL_META[argId]) return argId;
    const base = path.basename(filePath).toLowerCase();
    if (base.includes('muyassar')) return 'muyassar';
    if (base.includes('jalandhry')) return 'jalandhry';
    if (base.includes('ahmedali')) return 'ahmedali';
    if (/^ur[.\-_]/.test(base)) return 'ahmedali';
    if (base.includes('indonesian') || /^id[.\-_]/.test(base)) return 'indonesian';
    if (base.includes('basmeih') || /^ms[.\-_]/.test(base)) return 'basmeih';
    if (base.includes('hamidullah') || /^fr[.\-_]/.test(base)) return 'hamidullah';
    if (base.includes('sahih') || /^en[.\-_]/.test(base)) return 'sahih';
    if (base.includes('bengali') || /^bn[.\-_]/.test(base)) return 'bn';
    if (base.includes('diyanet')) return 'diyanet';
    if (base.includes('vakfi')) return 'vakfi';
    return null;
}

const inputPath = path.resolve(process.argv[2] || '');
const mealKey = detectMealId(inputPath, process.argv[3]);

if (!inputPath || !fs.existsSync(inputPath)) {
    console.error('Usage: node scripts/convert-quran-meal-tanzil.cjs <path-to-meal-file> [mealId]');
    process.exit(1);
}
if (!mealKey) {
    console.error('Could not detect meal id. Pass meal id as second argument (e.g. bn, diyanet).');
    process.exit(1);
}

const meta = {
    ...MEAL_META[mealKey],
    language: MEAL_META[mealKey].language || 'tr',
    source: 'Tanzil.net',
    license: 'See Tanzil.net translation terms'
};
const outDir = path.join(__dirname, '..', 'data', 'quran', 'meals', meta.id);
const fullDir = path.join(__dirname, '..', 'data', 'quran', 'meals-full');

const raw = fs.readFileSync(inputPath, 'utf8');
const lines = raw.split(/\r?\n/);

const bySurah = new Map();
let parsed = 0;
let skipped = 0;

for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = trimmed.split('|');
    if (parts.length < 3) {
        skipped += 1;
        continue;
    }
    const surah = Number(parts[0]);
    const ayah = Number(parts[1]);
    const text = parts.slice(2).join('|').trim();
    if (!Number.isFinite(surah) || !Number.isFinite(ayah) || !text) {
        skipped += 1;
        continue;
    }
    if (!bySurah.has(surah)) bySurah.set(surah, []);
    bySurah.get(surah).push({ n: ayah, tr: text });
    parsed += 1;
}

if (bySurah.size !== 114) {
    console.error('Expected 114 surahs, got', bySurah.size);
    process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

let totalAyahs = 0;
const surahNums = [...bySurah.keys()].sort((a, b) => a - b);

for (const n of surahNums) {
    const ayahs = bySurah.get(n).sort((a, b) => a.n - b.n);
    totalAyahs += ayahs.length;
    const fileName = String(n).padStart(3, '0') + '.json';
    const payload = {
        mealId: meta.id,
        n,
        ayahCount: ayahs.length,
        ayahs
    };
    fs.writeFileSync(path.join(outDir, fileName), JSON.stringify(payload, null, 2) + '\n', 'utf8');
}

fs.writeFileSync(path.join(outDir, '_meta.json'), JSON.stringify(meta, null, 2) + '\n', 'utf8');

const flat = {
    meta,
    surahs: surahNums.map((n) => ({
        n,
        ayahs: bySurah.get(n).sort((a, b) => a.n - b.n)
    }))
};
fs.writeFileSync(
    path.join(fullDir, `${meta.id}-full.json`),
    JSON.stringify(flat) + '\n',
    'utf8'
);

const mealsDir = path.join(__dirname, '..', 'data', 'quran', 'meals');
const indexPath = path.join(mealsDir, 'index.json');
const index = fs
    .readdirSync(mealsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(mealsDir, d.name, '_meta.json'))
    .filter((p) => fs.existsSync(p))
    .map((p) => JSON.parse(fs.readFileSync(p, 'utf8')))
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));
fs.writeFileSync(indexPath, JSON.stringify(index, null, 2) + '\n', 'utf8');

console.log('Input:', inputPath);
console.log('Meal:', meta.id, '-', meta.nameTr);
console.log('Parsed ayahs:', parsed);
console.log('Skipped lines:', skipped);
console.log('Surahs:', surahNums.length);
console.log('Total ayahs:', totalAyahs);
console.log('Wrote:', outDir);
console.log('Updated:', indexPath);
