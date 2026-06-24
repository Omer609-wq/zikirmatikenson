/**
 * Tanzil quran-uthmani.xml or quran-simple.xml → JSON (index + per-surah ar files).
 * Usage: node scripts/convert-quran-xml-to-json.cjs [path-to.xml]
 */
const fs = require('fs');
const path = require('path');

const SURAH_NAMES_TR = [
    'Fatiha', 'Bakara', 'Âl-i İmrân', 'Nisâ', 'Mâide', 'En\'âm', 'A\'râf', 'Enfâl', 'Tevbe', 'Yûnus',
    'Hûd', 'Yûsuf', 'Ra\'d', 'İbrahim', 'Hicr', 'Nahl', 'İsrâ', 'Kehf', 'Meryem', 'Tâhâ',
    'Enbiyâ', 'Hac', 'Mü\'minûn', 'Nûr', 'Furkan', 'Şuarâ', 'Neml', 'Kasas', 'Ankebût', 'Rûm',
    'Lokmân', 'Secde', 'Ahzâb', 'Sebe', 'Fâtır', 'Yâsîn', 'Sâffât', 'Sâd', 'Zümer', 'Mü\'min',
    'Fussilet', 'Şûrâ', 'Zuhruf', 'Duhân', 'Câsiye', 'Ahkâf', 'Muhammed', 'Fetih', 'Hucurât', 'Kâf',
    'Zâriyât', 'Tûr', 'Necm', 'Kamer', 'Rahmân', 'Vâkıa', 'Hadîd', 'Mücâdele', 'Haşr', 'Mümtehine',
    'Saff', 'Cum\'a', 'Münâfikûn', 'Teğâbün', 'Talâk', 'Tahrîm', 'Mülk', 'Kalem', 'Hâkka',
    'Meâric', 'Nûh', 'Cin', 'Müzzemmil', 'Müddessir', 'Kıyâmet', 'İnsan', 'Mürselât', 'Nebe', 'Nâziât',
    'Abese', 'Tekvîr', 'İnfitâr', 'Mutaffifîn', 'İnşikâk', 'Burûc', 'Târık', 'A\'lâ', 'Gâşiye', 'Fecr',
    'Beled', 'Şems', 'Leyl', 'Duha', 'İnşirâh', 'Tîn', 'Alak', 'Kadr', 'Beyyine', 'Zilzâl',
    'Âdiyât', 'Kâria', 'Tekâsür', 'Asr', 'Hümeze', 'Fîl', 'Kureyş', 'Mâûn', 'Kevser', 'Kâfirûn',
    'Nasr', 'Tebbet', 'İhlâs', 'Felak', 'Nâs'
];

const DEFAULT_XML = path.join(process.env.USERPROFILE || '', 'Downloads', 'quran-uthmani.xml');
const xmlPath = path.resolve(process.argv[2] || DEFAULT_XML);
const outDir = path.join(__dirname, '..', 'data', 'quran');
const arDir = path.join(outDir, 'ar');

if (!fs.existsSync(xmlPath)) {
    console.error('XML not found:', xmlPath);
    process.exit(1);
}

const xml = fs.readFileSync(xmlPath, 'utf8');
const isUthmani = /uthmani/i.test(xmlPath) || /Tanzil Quran Text \(Uthmani/i.test(xml);
const editionLabel = isUthmani ? 'Uthmani' : 'Simple';
const fullJsonName = isUthmani ? 'quran-uthmani.json' : 'quran-simple.json';
const obsoleteFullJson = isUthmani ? 'quran-simple.json' : 'quran-uthmani.json';

const suraRe = /<sura index="(\d+)" name="([^"]+)">([\s\S]*?)<\/sura>/g;
const ayaRe = /<aya index="(\d+)" text="([^"]*)"(?: bismillah="([^"]*)")?\s*\/>/g;

const surahs = [];
let totalAyahs = 0;

let suraMatch;
while ((suraMatch = suraRe.exec(xml)) !== null) {
    const n = Number(suraMatch[1]);
    const nameAr = suraMatch[2];
    const body = suraMatch[3];
    const ayahs = [];

    let ayaMatch;
    ayaRe.lastIndex = 0;
    const localAyaRe = new RegExp(ayaRe.source, 'g');
    while ((ayaMatch = localAyaRe.exec(body)) !== null) {
        const ayah = {
            n: Number(ayaMatch[1]),
            ar: ayaMatch[2]
        };
        if (ayaMatch[3]) ayah.bismillah = ayaMatch[3];
        ayahs.push(ayah);
        totalAyahs += 1;
    }

    surahs.push({ n, nameAr, ayahs });
}

if (surahs.length !== 114) {
    console.error('Expected 114 surahs, got', surahs.length);
    process.exit(1);
}
if (totalAyahs !== 6236) {
    console.error('Expected 6236 ayahs, got', totalAyahs);
    process.exit(1);
}

fs.mkdirSync(arDir, { recursive: true });

const index = surahs.map((s) => ({
    n: s.n,
    nameAr: s.nameAr,
    nameTr: SURAH_NAMES_TR[s.n - 1] || `Sure ${s.n}`,
    ayahCount: s.ayahs.length
}));

fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(index, null, 2) + '\n', 'utf8');

for (const s of surahs) {
    const fileName = String(s.n).padStart(3, '0') + '.json';
    const payload = {
        n: s.n,
        nameAr: s.nameAr,
        nameTr: SURAH_NAMES_TR[s.n - 1] || `Sure ${s.n}`,
        ayahCount: s.ayahs.length,
        ayahs: s.ayahs
    };
    fs.writeFileSync(path.join(arDir, fileName), JSON.stringify(payload, null, 2) + '\n', 'utf8');
}

const arMeta = {
    edition: editionLabel.toLowerCase(),
    source: `Tanzil Quran Text (${editionLabel}, Version 1.1)`,
    license: 'Creative Commons Attribution 3.0',
    tanzil: 'https://tanzil.net',
    convertedAt: new Date().toISOString().slice(0, 10)
};
fs.writeFileSync(path.join(arDir, '_meta.json'), JSON.stringify(arMeta, null, 2) + '\n', 'utf8');

const full = {
    meta: arMeta,
    surahs: surahs.map((s) => ({
        n: s.n,
        nameAr: s.nameAr,
        nameTr: SURAH_NAMES_TR[s.n - 1] || `Sure ${s.n}`,
        ayahs: s.ayahs
    }))
};
fs.writeFileSync(path.join(outDir, fullJsonName), JSON.stringify(full) + '\n', 'utf8');

const obsoletePath = path.join(outDir, obsoleteFullJson);
if (fs.existsSync(obsoletePath)) {
    fs.unlinkSync(obsoletePath);
    console.log('Removed:', obsoletePath);
}

console.log('Edition:', editionLabel);
console.log('Input:', xmlPath);
console.log('Surahs:', surahs.length);
console.log('Ayahs:', totalAyahs);
console.log('Wrote:', path.join(outDir, 'index.json'));
console.log('Wrote:', path.join(arDir, '_meta.json'));
console.log('Wrote:', path.join(arDir, '*.json'), `(${surahs.length} files)`);
console.log('Wrote:', path.join(outDir, fullJsonName));
