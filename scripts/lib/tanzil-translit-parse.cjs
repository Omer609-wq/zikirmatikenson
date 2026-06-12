/**
 * Tanzil pipe transliteration: surah|ayah|text (HTML vurgu etiketleri içerebilir).
 */
const fs = require('fs');

function stripMarkup(text) {
    return String(text || '').replace(/<\/?[a-z]+>/gi, '');
}

function cleanLat(text) {
    return stripMarkup(text).replace(/\.\s*$/, '').trim();
}

/**
 * @param {string} filePath
 * @returns {{ bySurah: Map<number, Array<{ n: number, lat: string }>>, parsed: number, skipped: number }}
 */
function parseTanzilPipeFile(filePath) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const bySurah = new Map();
    let parsed = 0;
    let skipped = 0;

    for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const parts = trimmed.split('|');
        if (parts.length < 3) {
            skipped += 1;
            continue;
        }
        const surah = Number(parts[0]);
        const ayah = Number(parts[1]);
        const text = cleanLat(parts.slice(2).join('|'));
        if (!Number.isFinite(surah) || !Number.isFinite(ayah) || !text) {
            skipped += 1;
            continue;
        }
        if (!bySurah.has(surah)) bySurah.set(surah, []);
        bySurah.get(surah).push({ n: ayah, lat: text });
        parsed += 1;
    }

    return { bySurah, parsed, skipped };
}

/**
 * @param {string} outDir
 * @returns {Map<string, { surah: number, ayah: number, lat: string }>}
 */
function loadTranslitEnJsonDir(outDir) {
    const byKey = new Map();
    for (let surah = 1; surah <= 114; surah += 1) {
        const fileName = String(surah).padStart(3, '0') + '.json';
        const filePath = require('path').join(outDir, fileName);
        if (!fs.existsSync(filePath)) continue;
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        for (const ay of data.ayahs || []) {
            byKey.set(`${surah}|${ay.n}`, { surah, ayah: ay.n, lat: String(ay.lat || '') });
        }
    }
    return byKey;
}

/**
 * @param {Map<number, Array<{ n: number, lat: string }>>} bySurah
 * @param {Map<string, { surah: number, ayah: number, lat: string }>} jsonByKey
 */
function compareTranslitMaps(bySurah, jsonByKey) {
    const mismatches = [];
    const missingInJson = [];
    const extraInJson = [];

    for (const [surah, ayahs] of [...bySurah.entries()].sort((a, b) => a[0] - b[0])) {
        for (const ay of ayahs.sort((a, b) => a.n - b.n)) {
            const key = `${surah}|${ay.n}`;
            const hit = jsonByKey.get(key);
            if (!hit) {
                missingInJson.push({ surah, ayah: ay.n, txt: ay.lat });
                continue;
            }
            if (hit.lat !== ay.lat) {
                mismatches.push({ surah, ayah: ay.n, txt: ay.lat, json: hit.lat });
            }
            jsonByKey.delete(key);
        }
    }

    for (const hit of jsonByKey.values()) {
        extraInJson.push(hit);
    }

    return { mismatches, missingInJson, extraInJson };
}

module.exports = {
    stripMarkup,
    cleanLat,
    parseTanzilPipeFile,
    loadTranslitEnJsonDir,
    compareTranslitMaps
};
