/**
 * Gradle wrapper — Windows'ta JAVA_HOME yoksa Android Studio JBR'yi kullanır.
 *
 * Usage:
 *   node scripts/run-android-gradle.cjs clean bundleRelease
 *   node scripts/run-android-gradle.cjs assembleDebug
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const ANDROID_DIR = path.join(ROOT, 'android');
const isWin = process.platform === 'win32';
const gradlew = path.join(ANDROID_DIR, isWin ? 'gradlew.bat' : 'gradlew');
const args = process.argv.slice(2);

if (!args.length) {
    console.error('Kullanım: node scripts/run-android-gradle.cjs <gradle görevleri...>');
    process.exit(1);
}

function existsDir(p) {
    try {
        return fs.existsSync(p) && fs.statSync(p).isDirectory();
    } catch {
        return false;
    }
}

function findAndroidStudioJbr() {
    const localAppData = process.env.LOCALAPPDATA || '';
    const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
    const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

    const candidates = [
        process.env.JAVA_HOME,
        process.env.ANDROID_STUDIO_JBR,
        path.join(programFiles, 'Android', 'Android Studio', 'jbr'),
        path.join(programFilesX86, 'Android', 'Android Studio', 'jbr'),
        localAppData ? path.join(localAppData, 'Programs', 'Android', 'Android Studio', 'jbr') : null
    ].filter(Boolean);

    for (const dir of candidates) {
        const javaExe = path.join(dir, 'bin', isWin ? 'java.exe' : 'java');
        if (existsDir(dir) && fs.existsSync(javaExe)) return dir;
    }
    return null;
}

function runWithJavaHome(javaHome) {
    const env = { ...process.env, JAVA_HOME: javaHome };
    const cmd = isWin ? gradlew : gradlew;
    const spawnArgs = isWin ? args : args;

    console.log('JAVA_HOME:', javaHome);
    console.log('Gradle:', path.relative(ROOT, gradlew), args.join(' '));

    const result = spawnSync(cmd, spawnArgs, {
        cwd: ANDROID_DIR,
        env,
        stdio: 'inherit',
        shell: isWin
    });

    if (result.error) {
        console.error(result.error.message);
        process.exit(1);
    }
    process.exit(result.status ?? 1);
}

if (process.env.JAVA_HOME && existsDir(process.env.JAVA_HOME)) {
    runWithJavaHome(process.env.JAVA_HOME);
}

const jbr = findAndroidStudioJbr();
if (jbr) {
    runWithJavaHome(jbr);
}

console.error(
    'JAVA_HOME tanımlı değil ve Android Studio JBR bulunamadı.\n' +
        'Çözüm:\n' +
        '  1) Android Studio kuruluysa: setx JAVA_HOME "C:\\Program Files\\Android\\Android Studio\\jbr"\n' +
        '  2) veya JDK 17+ kurup JAVA_HOME ayarlayın\n' +
        '  3) veya Android Studio → Build → Generate Signed Bundle / APK\n' +
        '\n' +
        'İmza: android/keystore.properties yoksa release DEBUG imzalı olur (Play güncellemesi olmaz).\n' +
        'Studio Remember password terminali etkilemez — keystore.properties.example dosyasına bakın.'
);
process.exit(1);
