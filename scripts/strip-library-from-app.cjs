const fs = require('fs');
const path = require('path');
const appPath = path.join(__dirname, '..', 'app.js');
let code = fs.readFileSync(appPath, 'utf8');
const start = code.indexOf('// category:');
const end = code.indexOf('// State');
if (start < 0 || end < 0) throw new Error('markers not found');
const replacement = `// Kütüphane: data/library/*.json — editoryal kurallar docs/I18N.md

`;
code = code.slice(0, start) + replacement + code.slice(end);
fs.writeFileSync(appPath, code, 'utf8');
console.log('Removed inline ZIKIR_LIBRARY from app.js');
