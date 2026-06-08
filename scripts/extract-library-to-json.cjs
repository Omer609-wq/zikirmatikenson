/**
 * Tek seferlik / güncelleme: app.js içindeki kütüphane dizilerini JSON'a yazar.
 * node scripts/extract-library-to-json.cjs
 */
const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'app.js');
const code = fs.readFileSync(appPath, 'utf8');

function extractArray(name) {
    const start = code.indexOf(`const ${name} = [`);
    if (start < 0) throw new Error(`Missing ${name}`);
    let i = start + `const ${name} = `.length;
    let depth = 0;
    let inStr = null;
    let escape = false;
    for (; i < code.length; i++) {
        const c = code[i];
        if (inStr) {
            if (escape) {
                escape = false;
                continue;
            }
            if (c === '\\') {
                escape = true;
                continue;
            }
            if (c === inStr) inStr = null;
            continue;
        }
        if (c === "'" || c === '"' || c === '`') {
            inStr = c;
            continue;
        }
        if (c === '[') depth++;
        if (c === ']') {
            depth--;
            if (depth === 0) {
                const slice = code.slice(start + `const ${name} = `.length, i + 1);
                // eslint-disable-next-line no-new-func
                return new Function(`return ${slice}`)();
            }
        }
    }
    throw new Error(`Unclosed array ${name}`);
}

const outDir = path.join(__dirname, '..', 'data', 'library');
fs.mkdirSync(outDir, { recursive: true });

const library = extractArray('ZIKIR_LIBRARY');
const premium = extractArray('PREMIUM_LIBRARY_EXTRA');

fs.writeFileSync(path.join(outDir, 'tr.json'), JSON.stringify(library, null, 2) + '\n', 'utf8');
fs.writeFileSync(path.join(outDir, 'premium-tr.json'), JSON.stringify(premium, null, 2) + '\n', 'utf8');

console.log(`Wrote ${library.length} items to data/library/tr.json`);
console.log(`Wrote ${premium.length} items to data/library/premium-tr.json`);
