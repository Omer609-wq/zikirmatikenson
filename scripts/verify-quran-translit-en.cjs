/**
 * data/quran/translit-en ↔ kaynak doğrulama.
 *
 * Varsayılan: quran-api ara-quranphoneticst-la
 * Tanzil txt: --tanzil path/to/en.transliteration.txt
 *
 * Usage:
 *   node scripts/verify-quran-translit-en.cjs
 *   node scripts/verify-quran-translit-en.cjs --fix
 *   node scripts/verify-quran-translit-en.cjs --tanzil path/to/en.transliteration.txt
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

async function loadExpectedFromPhoneticApi() {
    const bySurah = new Map();
    let parsed = 0;

    for (let surah = 1; surah <= 114; surah += 1) {
        const data = await getJson(`${API_ROOT}/${PHONETIC_EDITION}/${surah}.json`);
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
    const useTanzil = argv.includes('--tanzil');
    const shouldFix = argv.includes('--fix');
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

    if (useTanzil) {
        const fileArg = argv.find((a) => !a.startsWith('--'));
        const defaultTxt = path.join(__dirname, '..', 'data', 'raw', 'en.transliteration.txt');
        const txtPath = fileArg ? path.resolve(fileArg) : defaultTxt;
        if (!fs.existsSync(txtPath)) {
            console.error('Tanzil txt bulunamadı:', txtPath);
            process.exit(1);
        }
        sourceLabel = txtPath;
        ({ bySurah, parsed, skipped } = parseTanzilPipeFile(txtPath));
    } else {
        sourceLabel = `quran-api/${PHONETIC_EDITION}`;
        console.log('Kaynak indiriliyor:', sourceLabel);
        ({ bySurah, parsed, skipped } = await loadExpectedFromPhoneticApi());
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
        const fixCmd = useTanzil
            ? `node scripts/verify-quran-translit-en.cjs --tanzil "${sourceLabel}" --fix`
            : 'node scripts/verify-quran-translit-en.cjs --fix';
        console.log('\nDüzeltmek için:', fixCmd);
        process.exit(1);
    }

    console.log('\n--fix: JSON yeniden üretiliyor...');
    const convert = path.join(__dirname, 'convert-quran-translit-en.cjs');
    const args = useTanzil ? [convert, '--tanzil'] : [convert];
    const run = spawnSync(process.execPath, args, { stdio: 'inherit' });
    if (run.status !== 0) process.exit(run.status || 1);

    const afterSource = useTanzil
        ? parseTanzilPipeFile(sourceLabel).bySurah
        : (await loadExpectedFromPhoneticApi()).bySurah;
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
