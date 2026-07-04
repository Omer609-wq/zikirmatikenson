param(
    [string]$KeystorePath = "",
    [string]$Alias = "zikirmatik",
    [string]$PemPath = ""
)

$ErrorActionPreference = "Stop"

function Get-PlainText([Security.SecureString]$SecureString) {
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureString)
    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
}

function Read-ConfirmedSecret([string]$Label) {
    while ($true) {
        $first = Get-PlainText (Read-Host "$Label" -AsSecureString)
        $second = Get-PlainText (Read-Host "$Label (tekrar)" -AsSecureString)
        if ($first -ne $second) {
            Write-Host "Sifreler eslesmedi, tekrar deneyelim." -ForegroundColor Yellow
            continue
        }
        if ([string]::IsNullOrWhiteSpace($first)) {
            Write-Host "Bos sifre kullanilamaz." -ForegroundColor Yellow
            continue
        }
        return $first
    }
}

function Resolve-KeytoolPath {
    $cmd = Get-Command keytool -ErrorAction SilentlyContinue
    if ($cmd) {
        return $cmd.Source
    }

    if ($env:JAVA_HOME) {
        $javaHomeTool = Join-Path $env:JAVA_HOME "bin\keytool.exe"
        if (Test-Path $javaHomeTool) {
            return $javaHomeTool
        }
    }

    $candidates = @(
        "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe",
        "C:\Program Files\Android\Android Studio\jre\bin\keytool.exe",
        (Join-Path $env:LOCALAPPDATA "Programs\Android Studio\jbr\bin\keytool.exe"),
        (Join-Path $env:LOCALAPPDATA "Programs\Android Studio\jre\bin\keytool.exe")
    ) | Where-Object { $_ -and (Test-Path $_) }

    if ($candidates.Count -gt 0) {
        return $candidates[0]
    }

    throw "keytool bulunamadi. JDK kurulu ve PATH/JAVA_HOME ayarli olmali."
}

function Backup-IfExists([string]$Path) {
    if (-not (Test-Path $Path)) {
        return
    }

    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupPath = "$Path.$timestamp.bak"
    Move-Item -Path $Path -Destination $backupPath -Force
    Write-Host "Var olan dosya yedeklendi: $backupPath" -ForegroundColor Yellow
}

$repoRoot = Split-Path -Parent $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($KeystorePath)) {
    $KeystorePath = Join-Path $repoRoot "android\zikirmatik-upload.jks"
}
if ([string]::IsNullOrWhiteSpace($PemPath)) {
    $PemPath = Join-Path $repoRoot "android\upload_certificate.pem"
}

$keystoreDir = Split-Path -Parent $KeystorePath
$pemDir = Split-Path -Parent $PemPath
$propertiesPath = Join-Path $repoRoot "android\keystore.properties"

New-Item -ItemType Directory -Force -Path $keystoreDir | Out-Null
New-Item -ItemType Directory -Force -Path $pemDir | Out-Null

$storePassword = Read-ConfirmedSecret "storePassword"
$reusePassword = Read-Host "keyPassword storePassword ile ayni olsun mu? [E/h]"
if ([string]::IsNullOrWhiteSpace($reusePassword) -or $reusePassword.Trim().ToLowerInvariant() -eq "e") {
    $keyPassword = $storePassword
} else {
    $keyPassword = Read-ConfirmedSecret "keyPassword"
}

$defaultDName = "CN=Zikirmatik Upload, OU=Mobile, O=Zikirmatik, L=Istanbul, S=Istanbul, C=TR"
$dNameInput = Read-Host "Sertifika sahibi bilgisi (bos birak = varsayilan)"
$dName = if ([string]::IsNullOrWhiteSpace($dNameInput)) { $defaultDName } else { $dNameInput.Trim() }

$keytool = Resolve-KeytoolPath

Backup-IfExists $KeystorePath
Backup-IfExists $PemPath
Backup-IfExists $propertiesPath

$genKeyArgs = @(
    "-genkeypair",
    "-v",
    "-keystore", $KeystorePath,
    "-alias", $Alias,
    "-keyalg", "RSA",
    "-keysize", "2048",
    "-validity", "9125",
    "-storepass", $storePassword,
    "-keypass", $keyPassword,
    "-dname", $dName
)
& "$keytool" @genKeyArgs

$exportArgs = @(
    "-export",
    "-rfc",
    "-keystore", $KeystorePath,
    "-alias", $Alias,
    "-file", $PemPath,
    "-storepass", $storePassword
)
& "$keytool" @exportArgs

$normalizedKeystorePath = (Resolve-Path $KeystorePath).Path -replace "\\", "/"
@"
storeFile=$normalizedKeystorePath
storePassword=$storePassword
keyAlias=$Alias
keyPassword=$keyPassword
"@ | Set-Content -Path $propertiesPath -Encoding ASCII

Write-Host ""
Write-Host "Yeni upload key olusturuldu." -ForegroundColor Green
Write-Host "Keystore : $KeystorePath"
Write-Host "PEM      : $PemPath"
Write-Host "Properties: $propertiesPath"
Write-Host ""
Write-Host "SHA ozeti:" -ForegroundColor Cyan
$listArgs = @(
    "-list",
    "-v",
    "-keystore", $KeystorePath,
    "-alias", $Alias,
    "-storepass", $storePassword,
    "-keypass", $keyPassword
)
& "$keytool" @listArgs |
    Select-String "SHA1:|SHA-256:"

Write-Host ""
Write-Host "Sonraki adim:" -ForegroundColor Cyan
Write-Host "1) Play Console -> Uygulama imzalama sayfasinda 'Yukleme anahtari sifirlamasi iste' akisini baslat."
Write-Host "2) Istendiginde su PEM dosyasini yukle: $PemPath"
Write-Host "3) Onay geldikten sonra yeni upload key ile release imzalayabilirsin."
