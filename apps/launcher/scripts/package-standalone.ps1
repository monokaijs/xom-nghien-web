param(
  [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'

$launcherRoot = Split-Path -Parent $PSScriptRoot
$repoRoot = Resolve-Path (Join-Path $launcherRoot '..\..')
$packageJson = Get-Content (Join-Path $launcherRoot 'package.json') -Raw | ConvertFrom-Json
$version = $packageJson.version
$bridgeOutput = Join-Path $repoRoot 'packages\valheim-launcher-bridge\bin\Release\netstandard2.0'
$targetOutput = Join-Path $launcherRoot 'src-tauri\target\release'
$artifactsRoot = Join-Path $launcherRoot 'artifacts'
$packageName = "Xom-Nghien-Launcher-v$version-windows-x64-portable"
$stage = Join-Path $artifactsRoot $packageName
$archive = Join-Path $artifactsRoot "$packageName.zip"

Push-Location $launcherRoot
try {
  if (-not $SkipBuild) {
    & dotnet build (Join-Path $repoRoot 'packages\valheim-launcher-bridge\XomNghien.ValheimBridge.csproj') -c Release
    if ($LASTEXITCODE -ne 0) { throw 'Bridge build failed.' }

    & pnpm exec tauri build --no-bundle --config src-tauri/tauri.local.conf.json
    if ($LASTEXITCODE -ne 0) { throw 'Standalone launcher build failed.' }
  }

  $launcherExe = Join-Path $targetOutput 'xom-nghien-launcher.exe'
  $bridgeDll = Join-Path $bridgeOutput 'XomNghien.ValheimBridge.dll'
  $jsonDll = Join-Path $bridgeOutput 'Newtonsoft.Json.dll'
  foreach ($required in @($launcherExe, $bridgeDll, $jsonDll)) {
    if (-not (Test-Path -LiteralPath $required -PathType Leaf)) {
      throw "Required standalone file is missing: $required"
    }
  }

  New-Item -ItemType Directory -Path $artifactsRoot -Force | Out-Null
  if (Test-Path -LiteralPath $stage) {
    $resolvedStage = (Resolve-Path -LiteralPath $stage).Path
    $resolvedArtifacts = (Resolve-Path -LiteralPath $artifactsRoot).Path
    if (-not $resolvedStage.StartsWith($resolvedArtifacts, [System.StringComparison]::OrdinalIgnoreCase)) {
      throw "Refusing to clean package directory outside artifacts: $resolvedStage"
    }
    Remove-Item -LiteralPath $resolvedStage -Recurse -Force
  }
  if (Test-Path -LiteralPath $archive) {
    Remove-Item -LiteralPath $archive -Force
  }
  if (Test-Path -LiteralPath "$archive.sha256") {
    Remove-Item -LiteralPath "$archive.sha256" -Force
  }

  New-Item -ItemType Directory -Path $stage | Out-Null
  Copy-Item -LiteralPath $launcherExe -Destination (Join-Path $stage 'Xom Nghien Launcher.exe')
  Copy-Item -LiteralPath $bridgeDll -Destination $stage
  Copy-Item -LiteralPath $jsonDll -Destination $stage
  Copy-Item -LiteralPath (Join-Path $launcherRoot 'THIRD_PARTY_NOTICES.md') -Destination $stage

  @"
Xom Nghien Launcher v$version (Windows x64 portable)

Run "Xom Nghien Launcher.exe" directly. Keep the two DLL files beside it.
Windows 10/11 and Microsoft Edge WebView2 are required.
Launcher profiles and downloaded mods are stored in your normal Windows app-data folders.
"@ | Set-Content -LiteralPath (Join-Path $stage 'README.txt') -Encoding UTF8

  Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $archive -CompressionLevel Optimal
  $hash = (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant()
  Set-Content -LiteralPath "$archive.sha256" -Value "$hash  $([IO.Path]::GetFileName($archive))" -Encoding ASCII

  Write-Host "Standalone launcher: $archive"
  Write-Host "SHA-256: $hash"
} finally {
  Pop-Location
}
