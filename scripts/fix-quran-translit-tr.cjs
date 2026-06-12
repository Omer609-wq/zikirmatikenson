/**
 * Türkçe latin okunuş (translit-tr) düzeltmeleri — Tanzil / quran-api kaynak kusurları.
 *
 * Usage:
 *   node scripts/fix-quran-translit-tr.cjs [--dry-run] [--report]
 */
const fs = require('fs');
const path = require('path');

const translitDir = path.join(__dirname, '..', 'data', 'quran', 'translit-tr');
const fullPath = path.join(__dirname, '..', 'data', 'quran', 'translit-tr-full.json');

/** Çeviriyazı latin harfleri (küçük). */
const LAT_LOWER =
    'a-zâîûüöçışğ' +
    '\u1e95\u1e2b\u1e25\u1e63\u1e6d\u1e33\u015d\u017c'; // ẕ ḫ ḥ ṣ ṭ ḳ ŝ ż

const SENTENCE_START_RE = new RegExp(`(^|[.!?]\\s+)([${LAT_LOWER}])`, 'gu');

/** @type {{ name: string, re: RegExp, repl: string | ((...args: string[]) => string) }[]} */
const FIX_RULES = [
    {
        name: 'çift boşluk',
        re: / {2,}/g,
        repl: ' '
    },
    {
        name: 'entüm',
        re: /eentüm/gi,
        repl: 'entüm'
    },
    {
        name: 'gafûrun',
        re: /gafûrur raḥîm/g,
        repl: 'gafûrun raḥîm'
    },
    {
        name: 'fitneten',
        re: /fitnetel lilleẕîne/g,
        repl: 'fitneten lilleẕîne'
    },
    {
        name: 'cümle başı büyük',
        re: SENTENCE_START_RE,
        repl: (_match, boundary, ch) => boundary + ch.toLocaleUpperCase('tr')
    }
];

const SUSPICIOUS_PATTERNS = [
    { label: 'ayet başı küçük', re: new RegExp(`^[${LAT_LOWER}]`) },
    { label: 'nokta sonrası küçük', re: new RegExp(`[.!?]\\s+[${LAT_LOWER}]`) },
    { label: 'çift boşluk', re: / {2,}/ },
    { label: 'eentüm', re: /eentüm/ },
    { label: 'gafûrur raḥîm', re: /gafûrur raḥîm/ },
    { label: 'fitnetel l', re: /fitnetel lilleẕîne/ }
];

function fixTranslitText(text) {
    let out = String(text || '').trim();
    const applied = [];
    for (const rule of FIX_RULES) {
        const before = out;
        out =
            typeof rule.repl === 'function'
                ? out.replace(rule.re, (...m) => rule.repl(...m))
                : out.replace(rule.re, rule.repl);
        if (out !== before) applied.push(rule.name);
        rule.re.lastIndex = 0;
    }
    return { text: out, applied };
}

function scanTranslit() {
    const hits = [];
    for (let n = 1; n <= 114; n += 1) {
        const fp = path.join(translitDir, String(n).padStart(3, '0') + '.json');
        const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
        for (const ayah of data.ayahs || []) {
            const lat = String(ayah.lat || '');
            for (const pat of SUSPICIOUS_PATTERNS) {
                pat.re.lastIndex = 0;
                if (pat.re.test(lat)) {
                    hits.push({ ref: `${n}:${ayah.n}`, pattern: pat.label, sample: lat.slice(0, 90) });
                    break;
                }
            }
        }
    }
    return hits;
}

function rebuildFullJson() {
    const meta = JSON.parse(fs.readFileSync(path.join(translitDir, '_meta.json'), 'utf8'));
    const surahs = [];
    for (let n = 1; n <= 114; n += 1) {
        const data = JSON.parse(
            fs.readFileSync(path.join(translitDir, String(n).padStart(3, '0') + '.json'), 'utf8')
        );
        surahs.push({ n, ayahs: data.ayahs });
    }
    fs.writeFileSync(fullPath, JSON.stringify({ meta, surahs }) + '\n', 'utf8');
}

function fixTranslit({ dryRun = false } = {}) {
    const changes = [];
    let ayahTouched = 0;

    for (let n = 1; n <= 114; n += 1) {
        const fileName = String(n).padStart(3, '0') + '.json';
        const fp = path.join(translitDir, fileName);
        const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
        let fileChanged = false;

        for (const ayah of data.ayahs || []) {
            const { text, applied } = fixTranslitText(ayah.lat);
            if (text === ayah.lat) continue;
            changes.push({
                ref: `${n}:${ayah.n}`,
                rules: applied,
                before: ayah.lat,
                after: text
            });
            ayah.lat = text;
            fileChanged = true;
            ayahTouched += 1;
        }

        if (fileChanged && !dryRun) {
            fs.writeFileSync(fp, JSON.stringify(data, null, 2) + '\n', 'utf8');
        }
    }

    if (!dryRun && ayahTouched > 0) rebuildFullJson();
    return { ayahTouched, changes };
}

function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const reportOnly = args.includes('--report');

    if (reportOnly) {
        const hits = scanTranslit();
        console.log(`\n=== translit-tr: ${hits.length} suspicious ayah(s) ===`);
        hits.slice(0, 25).forEach((h) => {
            console.log(`  ${h.ref} [${h.pattern}] ${h.sample}${h.sample.length >= 90 ? '…' : ''}`);
        });
        if (hits.length > 25) console.log(`  … +${hits.length - 25} more`);
        return;
    }

    const result = fixTranslit({ dryRun });
    console.log(`${dryRun ? '[dry-run] ' : ''}translit-tr: ${result.ayahTouched} ayah(s) fixed`);
    result.changes.slice(0, 10).forEach((c) => {
        console.log(`  ${c.ref} (${c.rules.join(', ')})`);
        console.log(`    - ${c.before.slice(0, 95)}${c.before.length > 95 ? '…' : ''}`);
        console.log(`    + ${c.after.slice(0, 95)}${c.after.length > 95 ? '…' : ''}`);
    });
    if (result.changes.length > 10) {
        console.log(`  … +${result.changes.length - 10} more`);
    }
    console.log(`\nTotal: ${result.ayahTouched} ayah(s)${dryRun ? ' would be' : ''} updated.`);
}

main();
