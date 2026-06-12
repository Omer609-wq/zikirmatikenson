/**
 * Tanzil tr.transliteration (Muhammet Abay / Çeviriyazı) → Türkçe latin okunuş JSON.
 *
 * Kaynak (açık veri):
 *   https://github.com/fawazahmed0/quran-api — edition: tur-muhammetabay
 *   Orijinal: https://tanzil.net/trans/tr.transliteration
 *
 * Girdi seçenekleri:
 *   1) Tanzil pipe dosyası: surah|ayah|text
 *   2) --fetch  → GitHub'dan 114 sure JSON indirir (varsayılan)
 *
 * Usage:
 *   node scripts/convert-quran-translit-tr.cjs
 *   node scripts/convert-quran-translit-tr.cjs path/to/tr.transliteration
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const outDir = path.join(__dirname, '..', 'data', 'quran', 'translit-tr');
const EDITION_BASE =
    'https://raw.githubusercontent.com/fawazahmed0/quran-api/1/editions/tur-muhammetabay';

const meta = {
    id: 'translit-tr',
    nameTr: 'Türkçe Latin Okunuş',
    language: 'tr',
    author: 'Muhammet Abay',
    edition: 'Çeviriyazı',
    source: 'Tanzil.net (tr.transliteration)',
    license: 'See Tanzil.net translation terms',
    note: 'Muhammet Abay Çeviriyazı; fawazahmed0/quran-api (tur-muhammetabay) üzerinden alındı.'
};

function stripMarkup(text) {
    return String(text || '').replace(/<\/?[a-z]+>/gi, '');
}

function cleanLat(text) {
    return stripMarkup(text).replace(/\.\s*$/, '').trim();
}

function getJson(url) {
    return new Promise((resolve, reject) => {
        https
            .get(url, (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    getJson(res.headers.location).then(resolve, reject);
                    return;
                }
                if (res.statusCode !== 200) {
                    reject(new Error(`HTTP ${res.statusCode} for ${url}`));
                    res.resume();
                    return;
                }
                const chunks = [];
                res.on('data', (c) => chunks.push(c));
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
                    } catch (err) {
                        reject(err);
                    }
                });
            })
            .on('error', reject);
    });
}

function parseTanzilFile(filePath) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const bySurah = new Map();
    let parsed = 0;
    let skipped = 0;

    for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const parts = trimmed.split('|');
        if (parts.length < 3) {
            skipped += 1;
            continue;
        }
        const surah = Number(parts[0]);
        const ayah = Number(parts[1]);
        const text = cleanLat(parts.slice(2).join('|'));
        if (!Number.isFinite(surah) || !Number.isFinite(ayah) || !text) {
            skipped += 1;
            continue;
        }
        if (!bySurah.has(surah)) bySurah.set(surah, []);
        bySurah.get(surah).push({ n: ayah, lat: text });
        parsed += 1;
    }

    return { bySurah, parsed, skipped };
}

async function fetchFromGithub() {
    const bySurah = new Map();
    let parsed = 0;

    for (let n = 1; n <= 114; n += 1) {
        const url = `${EDITION_BASE}/${n}.json`;
        const data = await getJson(url);
        const verses = data.chapter || [];
        const ayahs = verses
            .map((v) => ({
                n: Number(v.verse),
                lat: cleanLat(v.text)
            }))
            .filter((a) => Number.isFinite(a.n) && a.lat);
        bySurah.set(n, ayahs);
        parsed += ayahs.length;
        process.stdout.write(`\rFetched surah ${n}/114`);
    }
    process.stdout.write('\n');

    return { bySurah, parsed, skipped: 0 };
}

function writeOutput(bySurah) {
    if (bySurah.size !== 114) {
        throw new Error(`Expected 114 surahs, got ${bySurah.size}`);
    }

    fs.mkdirSync(outDir, { recursive: true });

    let totalAyahs = 0;
    const surahNums = [...bySurah.keys()].sort((a, b) => a - b);

    for (const n of surahNums) {
        const ayahs = bySurah.get(n).sort((a, b) => a.n - b.n);
        totalAyahs += ayahs.length;
        const fileName = String(n).padStart(3, '0') + '.json';
        const payload = {
            translitId: meta.id,
            n,
            ayahCount: ayahs.length,
            ayahs
        };
        fs.writeFileSync(path.join(outDir, fileName), JSON.stringify(payload, null, 2) + '\n', 'utf8');
    }

    fs.writeFileSync(path.join(outDir, '_meta.json'), JSON.stringify(meta, null, 2) + '\n', 'utf8');

    const full = {
        meta,
        surahs: surahNums.map((n) => ({
            n,
            ayahs: bySurah.get(n).sort((a, b) => a.n - b.n)
        }))
    };
    fs.writeFileSync(
        path.join(__dirname, '..', 'data', 'quran', 'translit-tr-full.json'),
        JSON.stringify(full) + '\n',
        'utf8'
    );

    return { surahNums, totalAyahs };
}

async function main() {
    const inputArg = process.argv[2];
    let result;

    if (inputArg && fs.existsSync(path.resolve(inputArg))) {
        const inputPath = path.resolve(inputArg);
        console.log('Input:', inputPath);
        result = parseTanzilFile(inputPath);
    } else {
        console.log('Fetching from:', EDITION_BASE);
        result = await fetchFromGithub();
    }

    const { bySurah, parsed, skipped } = result;
    const { surahNums, totalAyahs } = writeOutput(bySurah);

    console.log('Parsed ayahs:', parsed);
    console.log('Skipped lines:', skipped);
    console.log('Surahs:', surahNums.length);
    console.log('Total ayahs:', totalAyahs);
    console.log('Sample 1:1:', bySurah.get(1).find((a) => a.n === 1)?.lat);
    console.log('Wrote:', outDir);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
