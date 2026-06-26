/**
 * data/quran/translit-en ↔ kaynak doğrulama.
 *
 * Varsayılan: quran-api ara-quran-la (Tanzil en.transliteration)
 * Alternatif: --phonetic | yerel Tanzil pipe dosyası
 *
 * Usage:
 *   node scripts/verify-quran-translit-en.cjs
 *   node scripts/verify-quran-translit-en.cjs --fix
 *   node scripts/verify-quran-translit-en.cjs --phonetic
 *   node scripts/verify-quran-translit-en.cjs path/to/en.transliteration.txt
 */
const path = require('path');
const { spawnSync } = require('child_process');
const fs = require('fs');
const https = require('https');
const {
    cleanLat,
    parseTanzilPipeFile,
    loadTranslitEnJsonDir,
    compareTranslitMaps
} = require('./lib/tanzil-translit-parse.cjs');

const outDir = path.join(__dirname, '..', 'data', 'quran', 'translit-en');
const TANZIL_EDITION = 'ara-quran-la';
const PHONETIC_EDITION = 'ara-quranphoneticst-la';
const API_ROOT = 'https://raw.githubusercontent.com/fawazahmed0/quran-api/1/editions';

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

async function loadExpectedFromApi(editionId) {
    const bySurah = new Map();
    let parsed = 0;

    for (let surah = 1; surah <= 114; surah += 1) {
        const data = await getJson(`${API_ROOT}/${editionId}/${surah}.json`);
        const ayahs = (data.chapter || [])
            .map((v) => ({
                n: Number(v.verse),
                lat: cleanLat(v.text)
            }))
            .filter((a) => Number.isFinite(a.n) && a.lat);
        bySurah.set(surah, ayahs);
        parsed += ayahs.length;
        process.stdout.write(`\rKaynak sure ${surah}/114`);
    }
    process.stdout.write('\n');

    return { bySurah, parsed, skipped: 0 };
}

function printSamples(mismatches, limit) {
    const slice = mismatches.slice(0, limit);
    for (const row of slice) {
        console.log(`\n${row.surah}:${row.ayah}`);
        console.log('  kaynak:', row.txt);
        console.log('  json  :', row.json);
    }
    if (mismatches.length > limit) {
        console.log(`\n... ve ${mismatches.length - limit} fark daha`);
    }
}

async function main() {
    const argv = process.argv.slice(2);
    const usePhonetic = argv.includes('--phonetic');
    const shouldFix = argv.includes('--fix');
    const fileArg = argv.find((a) => !a.startsWith('--') && fs.existsSync(path.resolve(a)));
    const sampleN = (() => {
        const i = argv.indexOf('--sample');
        if (i === -1) return 8;
        const n = Number(argv[i + 1]);
        return Number.isFinite(n) && n > 0 ? n : 8;
    })();

    let bySurah;
    let parsed;
    let skipped;
    let sourceLabel;
    let fixMode = 'tanzil';

    if (fileArg) {
        const txtPath = path.resolve(fileArg);
        sourceLabel = txtPath;
        fixMode = 'file';
        ({ bySurah, parsed, skipped } = parseTanzilPipeFile(txtPath));
    } else if (usePhonetic) {
        sourceLabel = `quran-api/${PHONETIC_EDITION}`;
        fixMode = 'phonetic';
        console.log('Kaynak indiriliyor:', sourceLabel);
        ({ bySurah, parsed, skipped } = await loadExpectedFromApi(PHONETIC_EDITION));
    } else {
        sourceLabel = `quran-api/${TANZIL_EDITION}`;
        fixMode = 'tanzil';
        console.log('Kaynak indiriliyor:', sourceLabel);
        ({ bySurah, parsed, skipped } = await loadExpectedFromApi(TANZIL_EDITION));
    }

    console.log('Hedef JSON:', outDir);

    const jsonByKey = loadTranslitEnJsonDir(outDir);
    const { mismatches, missingInJson, extraInJson } = compareTranslitMaps(bySurah, jsonByKey);

    console.log('Kaynak:', sourceLabel);
    console.log('Kaynak ayet satırı:', parsed);
    console.log('Kaynak atlanan satır:', skipped);
    console.log('Sure sayısı:', bySurah.size);
    console.log('Farklı metin:', mismatches.length);
    console.log("JSON'da eksik:", missingInJson.length);
    console.log("JSON'da fazla:", extraInJson.length);

    const sample11 = bySurah.get(1)?.find((a) => a.n === 1)?.lat;
    let json11 = '';
    try {
        const j = JSON.parse(fs.readFileSync(path.join(outDir, '001.json'), 'utf8'));
        json11 = j.ayahs?.find((a) => a.n === 1)?.lat || '';
    } catch {
        json11 = '';
    }
    console.log('Örnek 1:1 kaynak:', sample11 || '(yok)');
    console.log('Örnek 1:1 json  :', json11 || '(yok)');

    if (mismatches.length) printSamples(mismatches, sampleN);

    const ok = !mismatches.length && !missingInJson.length && !extraInJson.length;
    if (ok) {
        console.log('\nOK — JSON kaynakla uyumlu.');
        return;
    }

    if (!shouldFix) {
        let fixCmd = 'node scripts/verify-quran-translit-en.cjs --fix';
        if (fixMode === 'phonetic') fixCmd = 'node scripts/verify-quran-translit-en.cjs --phonetic --fix';
        else if (fixMode === 'file') {
            fixCmd = `node scripts/verify-quran-translit-en.cjs "${sourceLabel}" --fix`;
        }
        console.log('\nDüzeltmek için:', fixCmd);
        process.exit(1);
    }

    console.log('\n--fix: JSON yeniden üretiliyor...');
    const convert = path.join(__dirname, 'convert-quran-translit-en.cjs');
    const args =
        fixMode === 'phonetic'
            ? [convert, '--phonetic']
            : fixMode === 'file'
              ? [convert, sourceLabel]
              : [convert];
    const run = spawnSync(process.execPath, args, { stdio: 'inherit' });
    if (run.status !== 0) process.exit(run.status || 1);

    let afterSource;
    if (fixMode === 'file') {
        afterSource = parseTanzilPipeFile(sourceLabel).bySurah;
    } else if (fixMode === 'phonetic') {
        afterSource = (await loadExpectedFromApi(PHONETIC_EDITION)).bySurah;
    } else {
        afterSource = (await loadExpectedFromApi(TANZIL_EDITION)).bySurah;
    }
    const after = compareTranslitMaps(afterSource, loadTranslitEnJsonDir(outDir));
    const fixed =
        !after.mismatches.length && !after.missingInJson.length && !after.extraInJson.length;
    if (fixed) {
        console.log('\nDüzeltildi — doğrulama geçti.');
        return;
    }
    console.error('\nDüzeltme sonrası hâlâ fark var.');
    process.exit(1);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
