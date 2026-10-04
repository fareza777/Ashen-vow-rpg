param([switch]$WithBundle)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot

$sdkPath = $env:ANDROID_HOME
if (-not $sdkPath) { $sdkPath = $env:ANDROID_SDK_ROOT }
if (-not $sdkPath) { $sdkPath = Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
if (-not (Test-Path -LiteralPath $sdkPath)) { throw 'Android SDK not found. Set ANDROID_HOME to its directory.' }
$sdkForGradle = $sdkPath.Replace('\', '/')
Set-Content -LiteralPath 'android/local.properties' -Value "sdk.dir=$sdkForGradle" -Encoding ascii

$signingDirectory = Join-Path $projectRoot '.android-signing'
$keyStore = Join-Path $signingDirectory 'ashen-vow-release.jks'
$signingProperties = Join-Path $signingDirectory 'release.properties'
if (-not (Test-Path -LiteralPath $keyStore)) {
    if (Test-Path -LiteralPath $signingProperties) { throw 'Signing properties exist but the key is missing. Restore the original key before building an update.' }
    New-Item -ItemType Directory -Path $signingDirectory -Force | Out-Null
    $passwordBytes = New-Object byte[] 32
    $randomGenerator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $randomGenerator.GetBytes($passwordBytes)
    $randomGenerator.Dispose()
    $signingPassword = [Convert]::ToBase64String($passwordBytes)
    $env:ASHEN_KEYSTORE_PASSWORD = $signingPassword
    try {
        & keytool -genkeypair -keystore $keyStore -storetype JKS -alias 'ashen-vow' -keyalg RSA -keysize 3072 -validity 10000 -storepass:env ASHEN_KEYSTORE_PASSWORD -keypass:env ASHEN_KEYSTORE_PASSWORD -dname 'CN=Ashen Vow, OU=Game Development, O=Ashen Vow, C=ID' -noprompt
        if ($LASTEXITCODE -ne 0) { throw 'Signing key creation failed.' }
        @("storeFile=ashen-vow-release.jks", "storePassword=$signingPassword", 'keyAlias=ashen-vow', "keyPassword=$signingPassword") | Set-Content -LiteralPath $signingProperties -Encoding ascii
    } finally {
        Remove-Item Env:\ASHEN_KEYSTORE_PASSWORD -ErrorAction SilentlyContinue
        $signingPassword = $null
    }
}
if (-not (Test-Path -LiteralPath $signingProperties)) { throw 'Restore release.properties alongside the signing key.' }

& npm.cmd run android:sync
if ($LASTEXITCODE -ne 0) { throw 'Android asset build failed.' }
Push-Location -LiteralPath 'android'
try {
    if ($WithBundle) { & .\gradlew.bat assembleRelease bundleRelease --console=plain }
    else { & .\gradlew.bat assembleRelease --console=plain }
    if ($LASTEXITCODE -ne 0) { throw 'Android APK build failed.' }
} finally { Pop-Location }

$releaseDirectory = Join-Path $projectRoot 'releases'
New-Item -ItemType Directory -Path $releaseDirectory -Force | Out-Null
$package = Get-Content -LiteralPath 'package.json' -Raw | ConvertFrom-Json
$apkPath = Join-Path $releaseDirectory "AshenVow-$($package.version).apk"
Copy-Item -LiteralPath 'android/app/build/outputs/apk/release/app-release.apk' -Destination $apkPath -Force
$apksigner = Join-Path $sdkPath 'build-tools\36.0.0\apksigner.bat'
& $apksigner verify --verbose $apkPath
if ($LASTEXITCODE -ne 0) { throw 'APK signature verification failed.' }
$hashStream = [System.IO.File]::OpenRead($apkPath)
$sha256 = [System.Security.Cryptography.SHA256]::Create()
try { $hash = ([BitConverter]::ToString($sha256.ComputeHash($hashStream))).Replace('-', '').ToLowerInvariant() }
finally { $hashStream.Dispose(); $sha256.Dispose() }
Set-Content -LiteralPath "$apkPath.sha256" -Value "$hash  $(Split-Path -Leaf $apkPath)" -Encoding ascii
Write-Output "APK ready: $apkPath"
Write-Output "Size: $([math]::Round((Get-Item -LiteralPath $apkPath).Length / 1MB, 2)) MiB"
if ($WithBundle) {
    $bundlePath = Join-Path $releaseDirectory "AshenVow-$($package.version).aab"
    Copy-Item -LiteralPath 'android/app/build/outputs/bundle/release/app-release.aab' -Destination $bundlePath -Force
    & jarsigner -verify $bundlePath
    if ($LASTEXITCODE -ne 0) { throw 'Android bundle signature verification failed.' }
    $bundleStream = [System.IO.File]::OpenRead($bundlePath)
    $bundleSha256 = [System.Security.Cryptography.SHA256]::Create()
    try { $bundleHash = ([BitConverter]::ToString($bundleSha256.ComputeHash($bundleStream))).Replace('-', '').ToLowerInvariant() }
    finally { $bundleStream.Dispose(); $bundleSha256.Dispose() }
    Set-Content -LiteralPath "$bundlePath.sha256" -Value "$bundleHash  $(Split-Path -Leaf $bundlePath)" -Encoding ascii
    Write-Output "Google Play bundle ready: $bundlePath"
}
