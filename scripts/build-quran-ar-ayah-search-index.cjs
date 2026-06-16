/**
 * Arapça mushaf metni → data/quran/search/ar-ayah.json
 *
 * Usage: node scripts/build-quran-ar-ayah-search-index.cjs
 */
const fs = require('fs');
const path = require('path');

const AR_DIR = path.join(__dirname, '..', 'data', 'quran', 'ar');
const OUT_PATH = path.join(__dirname, '..', 'data', 'quran', 'search', 'ar-ayah.json');

function normalizeArabicAyahText(value) {
    return String(value || '')
        .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '')
        .replace(/[أإآٱ]/g, 'ا')
        .replace(/ى/g, 'ي')
        .replace(/ة/g, 'ه')
        .replace(/[^\u0600-\u06FF\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function buildRows() {
    const rows = [];

    for (let surah = 1; surah <= 114; surah += 1) {
        const filePath = path.join(AR_DIR, String(surah).padStart(3, '0') + '.json');
        if (!fs.existsSync(filePath)) {
            throw new Error(`Missing Arabic surah file: ${filePath}`);
        }
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        for (const ay of data.ayahs || []) {
            let text = String(ay.ar || '').trim();
            if (ay.bismillah && Number(ay.n) === 1) {
                text = `${String(ay.bismillah).trim()} ${text}`.trim();
            }
            if (!text) continue;
            const norm = normalizeArabicAyahText(text);
            if (!norm) continue;
            rows.push({ s: surah, a: ay.n, t: text, n: norm });
        }
    }

    return rows;
}

function main() {
    const ayahs = buildRows();
    const index = {
        locale: 'ar',
        source: 'mushaf',
        ayahCount: ayahs.length,
        ayahs
    };
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    fs.writeFileSync(OUT_PATH, JSON.stringify(index) + '\n', 'utf8');
    console.log('ar-ayah.json:', index.ayahCount, 'rows');
    const sample = ayahs.find((r) => r.s === 2 && r.a === 2);
    if (sample) console.log('  sample 2:2:', sample.n.slice(0, 72));
}

main();
