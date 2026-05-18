/**
 * @capacitor/assets adaptive ikonda çift katman + inset bazen logoda "eski ikon / çift yeşil" gösterir.
 * Üretimden sonra tek renk arka plan + inset'siz ön plana çevirir.
 * Arka plan rengi package.json içindeki cap:icons --iconBackgroundColor ile aynı olmalı.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const COLOR_HEX = '#0f2918';

const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground_shifted" />
</adaptive-icon>
`;

const valuesXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- Adaptive ikon zemini; logo yesili farkliysa patch script COLOR_HEX ile guncelle -->
    <color name="ic_launcher_background">${COLOR_HEX}</color>
</resources>
`;

const v26 = path.join(ROOT, 'android', 'app', 'src', 'main', 'res', 'mipmap-anydpi-v26');
const valuesPath = path.join(ROOT, 'android', 'app', 'src', 'main', 'res', 'values', 'ic_launcher_background.xml');

for (const name of ['ic_launcher.xml', 'ic_launcher_round.xml']) {
    const p = path.join(v26, name);
    if (fs.existsSync(p)) {
        fs.writeFileSync(p, adaptiveXml, 'utf8');
        console.log('patched', path.relative(ROOT, p));
    }
}
fs.writeFileSync(valuesPath, valuesXml, 'utf8');
console.log('patched', path.relative(ROOT, valuesPath));

const manifestPath = path.join(ROOT, 'public', 'manifest.json');
if (fs.existsSync(manifestPath)) {
    let m = fs.readFileSync(manifestPath, 'utf8');
    m = m.replace(/"type": "image\/png"/g, '"type": "image/webp"');
    fs.writeFileSync(manifestPath, m, 'utf8');
    console.log('patched', path.relative(ROOT, manifestPath), '(webp types)');
}
