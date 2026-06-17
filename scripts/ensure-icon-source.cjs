const fs = require('fs');
const path = require('path');

const res = path.join(__dirname, '..', 'resources');
const icon = path.join(res, 'icon.png');
const appIcon = path.join(res, 'app-icon.png');
const logo = path.join(res, 'logo.png');

// app-icon.png kaynak; eski icon.png kalırsa cap:icons yanlış görsel üretir
if (fs.existsSync(appIcon)) {
    fs.copyFileSync(appIcon, icon);
    console.log('resources/icon.png ← app-icon.png');
    process.exit(0);
}
if (fs.existsSync(icon)) process.exit(0);
if (fs.existsSync(logo)) {
    fs.copyFileSync(logo, icon);
    console.log('resources/icon.png ← logo.png');
    process.exit(0);
}
console.error(
    'resources/icon.png yok. Şunlardan birini koy: icon.png, app-icon.png veya logo.png'
);
process.exit(1);
