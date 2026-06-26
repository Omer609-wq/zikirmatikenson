/**
 * İngilizce latin okunuş → data/quran/translit-en/
 *
 * Varsayılan: Tanzil en.transliteration — fawazahmed0/quran-api ara-quran-la
 * Alternatif: --phonetic (Quran Phonetics ASCII) veya en.transliteration.txt dosya yolu
 *
 * Usage:
 *   node scripts/convert-quran-translit-en.cjs
 *   node scripts/convert-quran-translit-en.cjs --phonetic
 *   node scripts/convert-quran-translit-en.cjs path/to/en.transliteration.txt
 *
 * Doğrulama:
 *   node scripts/verify-quran-translit-en.cjs
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const { cleanLat, parseTanzilPipeFile } = require('./lib/tanzil-translit-parse.cjs');

const outDir = path.join(__dirname, '..', 'data', 'quran', 'translit-en');
const API_ROOT = 'https://raw.githubusercontent.com/fawazahmed0/quran-api/1/editions';

const EDITIONS = {
    phonetic: {
        id: 'ara-quranphoneticst-la',
        meta: {
            id: 'translit-en',
            nameTr: 'İngilizce Latin Okunuş',
            language: 'en',
            author: 'Quran Phonetics Transliteration',
            source: 'fawazahmed0/quran-api (ara-quranphoneticst-la)',
            license: 'See upstream quran-api / edition terms',
            note: 'Okunaklı ASCII okunuş (Ar-Rahman, Al-Hamdu). --phonetic ile üretilir.'
        }
    },
    tanzil: {
        id: 'ara-quran-la',
        meta: {
            id: 'translit-en',
            nameTr: 'İngilizce Latin Okunuş',
            language: 'en',
            source: 'Tanzil.net (en.transliteration) via quran-api ara-quran-la',
            license: 'See Tanzil.net translation terms',
            note: 'Tanzil resmi okunuşu (alrrahmani). Varsayılan EN paketi.'
        }
    }
};

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

async function fetchEditionFromGithub(editionId) {
    const base = `${API_ROOT}/${editionId}`;
    const bySurah = new Map();
    let parsed = 0;

    for (let n = 1; n <= 114; n += 1) {
        const data = await getJson(`${base}/${n}.json`);
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

function writeOutput(bySurah, meta) {
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

    return { surahNums, totalAyahs };
}

async function main() {
    const argv = process.argv.slice(2);
    const usePhonetic = argv.includes('--phonetic');
    const fileArg = argv.find((a) => !a.startsWith('--') && fs.existsSync(path.resolve(a)));

    let result;
    let meta;

    if (fileArg) {
        const inputPath = path.resolve(fileArg);
        console.log('Input (Tanzil pipe):', inputPath);
        result = parseTanzilPipeFile(inputPath);
        meta = EDITIONS.tanzil.meta;
    } else if (usePhonetic) {
        const editionId = EDITIONS.phonetic.id;
        console.log('Fetching phonetic edition:', editionId);
        result = await fetchEditionFromGithub(editionId);
        meta = EDITIONS.phonetic.meta;
    } else {
        const editionId = EDITIONS.tanzil.id;
        console.log('Fetching Tanzil edition:', editionId);
        result = await fetchEditionFromGithub(editionId);
        meta = EDITIONS.tanzil.meta;
    }

    const { bySurah, parsed, skipped } = result;
    const { surahNums, totalAyahs } = writeOutput(bySurah, meta);

    console.log('Parsed ayahs:', parsed);
    console.log('Skipped lines:', skipped);
    console.log('Surahs:', surahNums.length);
    console.log('Total ayahs:', totalAyahs);
    console.log('Sample 1:1:', bySurah.get(1).find((a) => a.n === 1)?.lat);
    console.log('Sample 2:2:', bySurah.get(2).find((a) => a.n === 2)?.lat);
    console.log('Wrote:', outDir);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
