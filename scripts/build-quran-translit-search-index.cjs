/**
 * translit-tr / translit-en → data/quran/search/*.json (compact: s,a,t only)
 *
 * Usage: node scripts/build-quran-translit-search-index.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'data', 'quran', 'search');

function normalizeTrTranslit(value) {
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

function normalizeEnTranslit(value) {
    return String(value || '')
        .toLocaleLowerCase('en')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[''`´ʻʿ]/g, '')
        .replace(/[-]/g, ' ')
        .replace(/[^a-z0-9\s]/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function buildPack({ translitId, translitDir, locale, normalize }) {
    const ayahs = [];

    for (let surah = 1; surah <= 114; surah += 1) {
        const filePath = path.join(translitDir, `${String(surah).padStart(3, '0')}.json`);
        if (!fs.existsSync(filePath)) {
            throw new Error(`Missing translit file: ${filePath}`);
        }
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        for (const ay of data.ayahs || []) {
            const text = String(ay.lat || '').trim();
            if (!text || !normalize(text)) continue;
            ayahs.push({ s: surah, a: ay.n, t: text });
        }
    }

    return {
        locale,
        translitId,
        ayahCount: ayahs.length,
        ayahs
    };
}

function writePack(fileName, index) {
    const outPath = path.join(OUT_DIR, fileName);
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(outPath, `${JSON.stringify(index)}\n`, 'utf8');
    const kb = (fs.statSync(outPath).size / 1024).toFixed(0);
    console.log(`Wrote ${fileName}: ${index.ayahCount} ayahs, ${kb} KB`);
}

function main() {
    const tr = buildPack({
        translitId: 'translit-tr',
        translitDir: path.join(ROOT, 'data', 'quran', 'translit-tr'),
        locale: 'tr',
        normalize: normalizeTrTranslit
    });
    const en = buildPack({
        translitId: 'translit-en',
        translitDir: path.join(ROOT, 'data', 'quran', 'translit-en'),
        locale: 'en',
        normalize: normalizeEnTranslit
    });

    writePack('translit-tr.json', tr);
    writePack('translit-en.json', en);

    const tr22 = tr.ayahs.find((r) => r.s === 2 && r.a === 2)?.t?.slice(0, 48);
    const en22 = en.ayahs.find((r) => r.s === 2 && r.a === 2)?.t?.slice(0, 48);
    console.log('Sample TR 2:2:', tr22);
    console.log('Sample EN 2:2:', en22);
}

main();
