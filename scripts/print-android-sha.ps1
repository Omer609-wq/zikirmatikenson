# Debug keystore SHA-1 / SHA-256 — Firebase Console → Android app → Add fingerprint
$keytool = Join-Path ${env:ProgramFiles} "Android\Android Studio\jbr\bin\keytool.exe"
$keystore = Join-Path $env:USERPROFILE ".android\debug.keystore"

if (-not (Test-Path $keytool)) {
    Write-Error "keytool bulunamadi. Android Studio JBR yolunu kontrol et."
    exit 1
}
if (-not (Test-Path $keystore)) {
    Write-Error "debug.keystore bulunamadi: $keystore"
    exit 1
}

Write-Host "Debug keystore SHA (Firebase Android app -> Add fingerprint):`n"
& $keytool -list -v -keystore $keystore -alias androiddebugkey -storepass android -keypass android |
    Select-String -Pattern "SHA1:|SHA256:"

Write-Host "`nRelease/upload SHA icin: cd android; .\gradlew.bat signingReport"
