/**
 * İngilizce latin okunuş → data/quran/translit-en/
 * Kaynak: fawazahmed0/quran-api — edition ara-quran-la (Tanzil en.transliteration uyumlu)
 *
 * Usage: node scripts/convert-quran-translit-en.cjs
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const outDir = path.join(__dirname, '..', 'data', 'quran', 'translit-en');
const EDITION_BASE =
    'https://raw.githubusercontent.com/fawazahmed0/quran-api/1/editions/ara-quran-la';

const meta = {
    id: 'translit-en',
    nameTr: 'İngilizce Latin Okunuş',
    language: 'en',
    source: 'Tanzil.net (en.transliteration) via quran-api ara-quran-la',
    license: 'See Tanzil.net translation terms'
};

function cleanLat(text) {
    return String(text || '').replace(/<\/?[a-z]+>/gi, '').replace(/\.\s*$/, '').trim();
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

    return { bySurah, parsed };
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

    return { surahNums, totalAyahs };
}

async function main() {
    console.log('Fetching from:', EDITION_BASE);
    const { bySurah, parsed } = await fetchFromGithub();
    const { surahNums, totalAyahs } = writeOutput(bySurah);

    console.log('Parsed ayahs:', parsed);
    console.log('Surahs:', surahNums.length);
    console.log('Total ayahs:', totalAyahs);
    console.log('Sample 1:1:', bySurah.get(1).find((a) => a.n === 1)?.lat);
    console.log('Wrote:', outDir);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
