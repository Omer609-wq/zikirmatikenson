/**
 * Standard Madani Mushaf (Hafs, 604 pages) → data/quran/pages.json
 *
 * Source: data/quran/madani-pages-source.json (page starts/ends per ayah)
 * Cross-check: data/quran/madani-page-endings.json (optional page → ends_with_verse)
 *
 * Usage: node scripts/build-quran-pages-json.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'data', 'quran', 'madani-pages-source.json');
const ENDINGS = path.join(ROOT, 'data', 'quran', 'madani-page-endings.json');
const INDEX = path.join(ROOT, 'data', 'quran', 'index.json');
const OUT = path.join(ROOT, 'data', 'quran', 'pages.json');

function parseVerseKey(key) {
    const [s, a] = String(key).split(':').map(Number);
    if (!Number.isFinite(s) || !Number.isFinite(a)) {
        throw new Error(`Invalid verse key: ${key}`);
    }
    return { s, a };
}

function verseKey(s, a) {
    return `${s}:${a}`;
}

function buildSurahAyahCounts(indexRows) {
    const counts = {};
    for (const row of indexRows || []) {
        counts[row.n] = row.ayahCount;
    }
    return counts;
}

function buildSegmentsForPage(startKey, endKey, surahAyahCounts) {
    const start = parseVerseKey(startKey);
    const end = parseVerseKey(endKey);
    const segs = [];
    let s = start.s;
    let a1 = start.a;

    while (s < end.s || (s === end.s && a1 <= end.a)) {
        const surahEnd = s < end.s ? surahAyahCounts[s] : end.a;
        if (!Number.isFinite(surahEnd)) {
            throw new Error(`Missing ayah count for surah ${s}`);
        }
        segs.push({ s, a1, a2: surahEnd });
        s += 1;
        a1 = 1;
    }
    return segs;
}

function main() {
    const source = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
    const index = JSON.parse(fs.readFileSync(INDEX, 'utf8'));
    const surahAyahCounts = buildSurahAyahCounts(index);
    const rows = source.pages || [];

    if (rows.length !== 604) {
        throw new Error(`Expected 604 pages in ${SOURCE}, got ${rows.length}`);
    }

    const pages = rows.map((row) => {
        const page = Number(row.page);
        const startKey = row.starts_with?.verse_key;
        const endKey = row.ends_with?.verse_key;
        if (!startKey || !endKey) {
            throw new Error(`Page ${page} missing starts_with or ends_with`);
        }
        return buildSegmentsForPage(startKey, endKey, surahAyahCounts);
    });

    if (fs.existsSync(ENDINGS)) {
        const endings = JSON.parse(fs.readFileSync(ENDINGS, 'utf8'));
        let mism = 0;
        for (const row of endings.page_endings || []) {
            const segs = pages[row.page - 1];
            const last = segs[segs.length - 1];
            const built = verseKey(last.s, last.a2);
            if (built !== row.ends_with_verse) {
                mism += 1;
                if (mism <= 3) {
                    console.warn(`Page ${row.page}: built ${built}, endings file ${row.ends_with_verse}`);
                }
            }
        }
        if (mism) {
            throw new Error(`${mism} page ending mismatches vs madani-page-endings.json`);
        }
        console.log('Validated against madani-page-endings.json');
    }

    const payload = {
        meta: {
            pageCount: 604,
            source: source.source_layout || 'Standard Madani Mushaf (Hafs \'an \'Asim), 604 pages',
            license: 'Page boundaries for standard Madinah mushaf (Hafs).'
        },
        pages
    };

    fs.writeFileSync(OUT, `${JSON.stringify(payload)}\n`, 'utf8');
    console.log('Wrote', OUT, `(${pages.length} pages)`);
}

main();
