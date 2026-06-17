/**
 * Urdu Quran meal typo / missing-space fixes (Tanzil ahmedali source quirks).
 * Usage:
 *   node scripts/fix-quran-meal-urdu-typos.cjs [mealId...] [--dry-run] [--report]
 * Default meal ids: ahmedali jalandhry
 */
const fs = require('fs');
const path = require('path');

/** Stuck «اور» + next word (Tanzil); excludes lexical «اوروں». */
const AUR_STUCK_WORDS = [
    'ان', 'اس', 'وہ', 'جب', 'جو', 'ہم', 'بے', 'نہ', 'جس', 'تم', 'بھی', 'بہت', 'اپنے', 'اگر', 'تو',
    'کچھ', 'کوئی', 'وہی', 'الله', 'یہ', 'نیک', 'لیے', 'جن', 'کافروں', 'بعض', 'بڑی', 'اسی', 'منہ',
    'لیکن', 'میں', 'نماز', 'البتہ', 'کسی', 'جنہوں', 'بائیں', 'اپنی', 'مشرک', 'انہیں', 'انہوں',
    'ایک', 'اسے', 'وہاں', 'پھر', 'ہر', 'سب', 'دوسرے', 'ان کی', 'ان پر', 'ان کو', 'تمہارے',
    'تمہاری', 'تم کو', 'وہ لوگ', 'یہی', 'یہاں', 'اس کا', 'اس کی', 'تاکہ'
];

/** @type {{ name: string, re: RegExp, repl: string }[]} */
const URDU_FIX_RULES = [
    { name: 'کہہ دو وہ', re: /کہہ دووہ/g, repl: 'کہہ دو وہ' },
    { name: 'مردوں', re: /مردووں/g, repl: 'مردوں' },
    { name: 'ہے کہ وہ', re: /ہےکہاوہ/g, repl: 'ہے کہ وہ' },
    { name: 'جانتا ہے', re: /جانتاہے/g, repl: 'جانتا ہے' },
    { name: 'دیتا ہے', re: /دیتاہے/g, repl: 'دیتا ہے' },
    { name: 'سکھاتا ہے', re: /سکھاتاہے/g, repl: 'سکھاتا ہے' },
    { name: 'کہا ہے', re: /کہاہے/g, repl: 'کہا ہے' },
    { name: 'گہرا ہے', re: /گہراہے/g, repl: 'گہرا ہے' },
    { name: 'گھر کے', re: /گھرکے/g, repl: 'گھر کے' },
    { name: 'اس کے سوا', re: /اس کےسوا/g, repl: 'اس کے سوا' },
    { name: 'جیسے سود', re: /جیسےسود/g, repl: 'جیسے سود' },
    { name: 'جو کوئی', re: /جوکوئی/g, repl: 'جو کوئی' },
    { name: 'تو چاہے', re: /توچاہے/g, repl: 'تو چاہے' },
    { name: 'ہے کہ', re: /ہےکہ/g, repl: 'ہے کہ' },
    { name: 'سے کہ', re: /سےکہ/g, repl: 'سے کہ' },
    { name: 'ہو کہ', re: /ہوکہ/g, repl: 'ہو کہ' },
    { name: 'ہیں کہ', re: /ہیںکہ/g, repl: 'ہیں کہ' },
    { name: 'تا ہے', re: /تاہے/g, repl: 'تا ہے' },
    { name: 'ا ور → اور', re: /ا\s+ور/g, repl: 'اور' },
    { name: 'لوگوں', re: /لوگو ں/g, repl: 'لوگوں' },
    { name: 'دلوں', re: /دلو ں/g, repl: 'دلوں' },
    { name: 'مال اور ان', re: /مال او ران/g, repl: 'مال اور ان' },
    { name: 'رہنے والے', re: /رہنےو الوں/g, repl: 'رہنے والوں' },
    { name: 'اوروں', re: /اور وں/g, repl: 'اوروں' },
    ...AUR_STUCK_WORDS.map((w) => {
        const compact = w.replace(/\s+/g, '');
        return {
            name: `اور ${w}`,
            re: new RegExp(`اور${compact}`, 'g'),
            repl: `اور ${w}`
        };
    })
];

const DEFAULT_MEALS = ['ahmedali', 'jalandhry'];
const SUSPICIOUS_PATTERNS = [
    { label: 'کہہ دووہ', re: /کہہ دووہ/ },
    { label: 'مردووں', re: /مردووں/ },
    { label: 'گھرکے', re: /گھرکے/ },
    { label: 'ہےکہ', re: /ہےکہ/ },
    { label: 'اوروہ', re: /اوروہ/ },
    { label: 'اوران', re: /اوران/ },
    { label: 'ا ور', re: /ا\s+ور/ },
    { label: 'اور وں', re: /اور وں/ },
    { label: 'جانتاہے', re: /جانتاہے/ },
    { label: 'لوگو ں', re: /لوگو ں/ }
];

function fixUrduMealText(text) {
    let out = String(text || '');
    const applied = [];
    for (const rule of URDU_FIX_RULES) {
        const before = out;
        out = out.replace(rule.re, rule.repl);
        if (out !== before) applied.push(rule.name);
        rule.re.lastIndex = 0;
    }
    return { text: out, applied };
}

function scanMeal(mealId, mealsDir) {
    const dir = path.join(mealsDir, mealId);
    const hits = [];
    for (let n = 1; n <= 114; n += 1) {
        const fp = path.join(dir, String(n).padStart(3, '0') + '.json');
        const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
        for (const ayah of data.ayahs || []) {
            const tr = String(ayah.tr || '');
            for (const pat of SUSPICIOUS_PATTERNS) {
                if (pat.re.test(tr)) {
                    hits.push({ ref: `${n}:${ayah.n}`, pattern: pat.label, sample: tr.slice(0, 80) });
                    break;
                }
            }
        }
    }
    return hits;
}

function fixMeal(mealId, mealsDir, { dryRun = false } = {}) {
    const dir = path.join(mealsDir, mealId);
    const changes = [];
    let ayahTouched = 0;

    for (let n = 1; n <= 114; n += 1) {
        const fileName = String(n).padStart(3, '0') + '.json';
        const fp = path.join(dir, fileName);
        const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
        let fileChanged = false;

        for (const ayah of data.ayahs || []) {
            const { text, applied } = fixUrduMealText(ayah.tr);
            if (text === ayah.tr) continue;
            changes.push({
                ref: `${n}:${ayah.n}`,
                rules: applied,
                before: ayah.tr,
                after: text
            });
            ayah.tr = text;
            fileChanged = true;
            ayahTouched += 1;
        }

        if (fileChanged && !dryRun) {
            fs.writeFileSync(fp, JSON.stringify(data, null, 2) + '\n', 'utf8');
        }
    }

    if (!dryRun) {
        const meta = JSON.parse(fs.readFileSync(path.join(dir, '_meta.json'), 'utf8'));
        const flat = {
            meta,
            surahs: []
        };
        for (let n = 1; n <= 114; n += 1) {
            const data = JSON.parse(
                fs.readFileSync(path.join(dir, String(n).padStart(3, '0') + '.json'), 'utf8')
            );
            flat.surahs.push({ n, ayahs: data.ayahs });
        }
        const fullDir = path.join(__dirname, '..', 'data', 'quran', 'meals-full');
        fs.mkdirSync(fullDir, { recursive: true });
        fs.writeFileSync(
            path.join(fullDir, `${mealId}-full.json`),
            JSON.stringify(flat) + '\n',
            'utf8'
        );
    }

    return { mealId, ayahTouched, changes };
}

function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const reportOnly = args.includes('--report');
    const mealIds = args.filter((a) => !a.startsWith('--'));
    const targets = mealIds.length ? mealIds : DEFAULT_MEALS;
    const mealsDir = path.join(__dirname, '..', 'data', 'quran', 'meals');

    if (reportOnly) {
        for (const mealId of targets) {
            const hits = scanMeal(mealId, mealsDir);
            console.log(`\n=== ${mealId}: ${hits.length} suspicious ayah(s) ===`);
            hits.slice(0, 25).forEach((h) => {
                console.log(`  ${h.ref} [${h.pattern}] ${h.sample}${h.sample.length >= 80 ? '…' : ''}`);
            });
            if (hits.length > 25) console.log(`  … +${hits.length - 25} more`);
        }
        return;
    }

    let total = 0;
    for (const mealId of targets) {
        const result = fixMeal(mealId, mealsDir, { dryRun });
        total += result.ayahTouched;
        console.log(
            `${dryRun ? '[dry-run] ' : ''}${mealId}: ${result.ayahTouched} ayah(s) fixed`
        );
        result.changes.slice(0, 8).forEach((c) => {
            console.log(`  ${c.ref} (${c.rules.join(', ')})`);
            console.log(`    - ${c.before.slice(0, 90)}${c.before.length > 90 ? '…' : ''}`);
            console.log(`    + ${c.after.slice(0, 90)}${c.after.length > 90 ? '…' : ''}`);
        });
        if (result.changes.length > 8) {
            console.log(`  … +${result.changes.length - 8} more`);
        }
    }
    console.log(`\nTotal: ${total} ayah(s)${dryRun ? ' would be' : ''} updated.`);
}

main();
