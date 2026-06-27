/**
 * AGP 9+ proguard-android.txt kullanımını reddeder; Capacitor 6 eklentileri hâlâ eski dosyayı referanslar.
 * npm install / cap sync sonrası node_modules içindeki build.gradle dosyalarını günceller.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'node_modules');
const OLD = "getDefaultProguardFile('proguard-android.txt')";
const NEW = "getDefaultProguardFile('proguard-android-optimize.txt')";

const SCOPES = ['@capacitor', '@capacitor-firebase', '@capacitor-community'];

function patchFile(filePath) {
    if (!fs.existsSync(filePath)) return false;
    const src = fs.readFileSync(filePath, 'utf8');
    if (!src.includes(OLD)) return false;
    fs.writeFileSync(filePath, src.split(OLD).join(NEW), 'utf8');
    return true;
}

function patchPackageScope(scopeDir) {
    let count = 0;
    if (!fs.existsSync(scopeDir)) return count;

    for (const pkg of fs.readdirSync(scopeDir)) {
        const base = path.join(scopeDir, pkg);
        for (const rel of ['android/build.gradle', 'capacitor/build.gradle']) {
            const filePath = path.join(base, rel);
            if (patchFile(filePath)) {
                console.log('patched', path.relative(path.join(__dirname, '..'), filePath));
                count += 1;
            }
        }
    }
    return count;
}

let total = 0;
for (const scope of SCOPES) {
    total += patchPackageScope(path.join(ROOT, scope));
}

if (total === 0) {
    console.log('Capacitor proguard yaması: güncellenecek dosya yok (zaten yamalı veya paket yok).');
} else {
    console.log(`Capacitor proguard yaması: ${total} dosya güncellendi.`);
}
