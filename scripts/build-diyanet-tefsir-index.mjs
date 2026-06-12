import https from 'https';
import { writeFileSync } from 'fs';

function get(url) {
    return new Promise((resolve, reject) => {
        https
            .get(url, { headers: { 'User-Agent': 'zikirmaitk-build/1.0' } }, (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    resolve(get(new URL(res.headers.location, url).href));
                    return;
                }
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => resolve(data));
            })
            .on('error', reject);
    });
}

const linkRe = /\/tefsir\/([^"' >]+)\/(\d+)\/(\d+)(?:-(\d+))?-ayet-tefsiri/g;

const html = await get('https://kuran.diyanet.gov.tr/tefsir');
const match = html.match(/var allSures = (\[.*?\]);/);
if (!match) throw new Error('allSures not found');
const allSures = JSON.parse(match[1]);
const index = {};
let total = 0;

for (const s of allSures) {
    const page = await get(`https://kuran.diyanet.gov.tr/tefsir/sure/${s.Slug}`);
    const paths = {};
    linkRe.lastIndex = 0;
    let m;
    while ((m = linkRe.exec(page)) !== null) {
        const [, sureSlug, pageId, a1, a2] = m;
        const start = Number(a1);
        const end = a2 ? Number(a2) : start;
        const suffix = a2 ? `${start}-${end}` : String(start);
        const path = `/tefsir/${sureSlug}/${pageId}/${suffix}-ayet-tefsiri`;
        for (let a = start; a <= end; a += 1) paths[String(a)] = path;
    }
    index[String(s.SureId)] = paths;
    total += Object.keys(paths).length;
    console.log(s.SureId, s.Slug, Object.keys(paths).length);
}

writeFileSync('data/quran/diyanet-tefsir-index.json', JSON.stringify(index));
console.log('TOTAL AYAH MAPPINGS', total);
