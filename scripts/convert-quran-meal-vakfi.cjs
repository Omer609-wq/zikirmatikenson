/**
 * Tanzil tr.vakfi (pipe-delimited) → JSON per-surah meal files.
 * Format: surah|ayah|text
 * Usage: node scripts/convert-quran-meal-vakfi.cjs [path-to-tr.vakfi]
 */
const fs = require('fs');
const path = require('path');

const DEFAULT_INPUT = path.join(process.env.USERPROFILE || '', 'OneDrive', 'Desktop', 'tr.vakfi');
const inputPath = path.resolve(process.argv[2] || DEFAULT_INPUT);
const outDir = path.join(__dirname, '..', 'data', 'quran', 'meals', 'vakfi');
const fullDir = path.join(__dirname, '..', 'data', 'quran', 'meals-full');

if (!fs.existsSync(inputPath)) {
    console.error('File not found:', inputPath);
    process.exit(1);
}

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

const meta = {
    id: 'vakfi',
    nameTr: 'Diyanet Vakfı',
    language: 'tr',
    source: 'Tanzil.net',
    translator: 'Diyanet Vakfı',
    license: 'See Tanzil.net translation terms'
};

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

fs.writeFileSync(
    path.join(outDir, '_meta.json'),
    JSON.stringify(meta, null, 2) + '\n',
    'utf8'
);

const flat = {
    meta,
    surahs: surahNums.map((n) => ({
        n,
        ayahs: bySurah.get(n).sort((a, b) => a.n - b.n)
    }))
};
fs.writeFileSync(
    path.join(fullDir, 'vakfi-full.json'),
    JSON.stringify(flat) + '\n',
    'utf8'
);

console.log('Input:', inputPath);
console.log('Parsed ayahs:', parsed);
console.log('Skipped lines:', skipped);
console.log('Surahs:', surahNums.length);
console.log('Total ayahs:', totalAyahs);
console.log('Wrote:', outDir);
