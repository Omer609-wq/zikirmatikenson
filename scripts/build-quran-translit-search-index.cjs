/**
 * translit-tr → data/quran/search/translit-tr.json (Aşama C arama indeksi)
 *
 * Usage: node scripts/build-quran-translit-search-index.cjs
 */
const fs = require('fs');
const path = require('path');

const translitDir = path.join(__dirname, '..', 'data', 'quran', 'translit-tr');
const outPath = path.join(__dirname, '..', 'data', 'quran', 'search', 'translit-tr.json');

function normalizeTranslitSearchText(value) {
    return String(value || '')
        .toLocaleLowerCase('tr')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[âîûôêāīū]/g, (ch) => ({ â: 'a', î: 'i', û: 'u', ô: 'o', ê: 'e', ā: 'a', ī: 'i', ū: 'u' })[ch] || ch)
        .replace(/[ẕẔḳḲṣṢṭṬḥḤḫḪ]/g, (ch) =>
            ({ ẕ: 'z', Ẕ: 'z', ḳ: 'k', Ḳ: 'k', ṣ: 's', Ṣ: 's', ṭ: 't', Ṭ: 't', ḥ: 'h', Ḥ: 'h', ḫ: 'h', Ḫ: 'h' })[ch] || ch
        )
        .replace(/[''`´ʻʿ]/g, '')
        .replace(/[-]/g, ' ')
        .replace(/[^a-z0-9çğıöşü\s]/gi, ' ')
        .replace(/ç/g, 'c')
        .replace(/ğ/g, 'g')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ş/g, 's')
        .replace(/ü/g, 'u')
        .replace(/\s+/g, ' ')
        .trim();
}

function buildIndex() {
    const ayahs = [];

    for (let surah = 1; surah <= 114; surah += 1) {
        const filePath = path.join(translitDir, String(surah).padStart(3, '0') + '.json');
        if (!fs.existsSync(filePath)) {
            throw new Error(`Missing translit file: ${filePath}`);
        }
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        for (const ay of data.ayahs || []) {
            const text = String(ay.lat || '').trim();
            if (!text) continue;
            const norm = normalizeTranslitSearchText(text);
            if (!norm) continue;
            ayahs.push({ s: surah, a: ay.n, t: text, n: norm, c: norm.replace(/\s+/g, '') });
        }
    }

    return {
        locale: 'tr',
        translitId: 'translit-tr',
        ayahCount: ayahs.length,
        ayahs
    };
}

function main() {
    const index = buildIndex();
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(index) + '\n', 'utf8');
    console.log('Translit search index:', index.ayahCount, 'ayahs');
    console.log('Wrote:', outPath);
    console.log('Sample 1:1 norm:', index.ayahs.find((r) => r.s === 1 && r.a === 1)?.n);
    console.log('Sample 2:2 norm:', index.ayahs.find((r) => r.s === 2 && r.a === 2)?.n.slice(0, 60));
}

main();
