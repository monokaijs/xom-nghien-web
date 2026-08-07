# Xom Nghien Launcher

Tauri 2 launcher for Steam Valheim on Windows 10/11 x64 and macOS 12+. Apple Silicon launches the modded game through Rosetta for compatibility with the current Valheim BepInEx package.

## Development

Requirements: Node 22.13+, pnpm 11, stable Rust, .NET 7, and the platform prerequisites from the Tauri 2 documentation.

```sh
pnpm install
dotnet build packages/valheim-launcher-bridge/XomNghien.ValheimBridge.csproj -c Release
pnpm --filter @xom/launcher tauri dev
```

## Standalone Windows package

Build a portable Windows x64 launcher that can be extracted and run without an installer:

```powershell
pnpm --filter @xom/launcher standalone:build
```

The ZIP and its SHA-256 checksum are written to `apps/launcher/artifacts/`. The in-game bridge and its runtime dependency are embedded in the launcher, so the portable package needs only the executable. Windows 10/11 includes the WebView2 runtime on normal installations; systems without it must install the Microsoft Edge WebView2 Runtime.

The default website API is `https://xomnghien.com`; it can be changed in Settings. Profiles and package archives live in the operating system's application-data and cache folders. Vanilla Valheim files are not modified.

## Personal profiles

The launcher keeps Xóm Nghiện server profiles managed by their server manifests and lists user-created setups separately under **My Profiles**. Personal profile mod changes are staged locally, then applied together with **Sync now** or **Sync & Play**. Launching a personal profile starts modded Valheim without adding server connection arguments.

The Servers home screen also offers one-click installation of the latest `Vietnamgang-ValheimVietnamesePack` into a selected personal profile. When no profile is selected, the launcher creates and synchronizes a new `Default` profile first.

Personal profiles can be shared as r2modman-compatible `.r2z` files or imported from `.r2z` and `.r2x` files. Sharing includes exact Thunderstore mod versions and enabled states only. Configuration files, binaries, and other archive contents are deliberately ignored during import and are never included in exports.

## Unsigned beta installation

- Windows: choose **More info → Run anyway** if SmartScreen appears.
- macOS: open the DMG, drag the app to Applications, then Control-click the app and choose **Open** if Gatekeeper blocks the unsigned beta.
- Apple Silicon: install Rosetta when prompted, or run `softwareupdate --install-rosetta` in Terminal.

## Automatic updates

On Windows, the launcher checks the repository's latest GitHub Release at startup. When a newer `launcher-v*` release exists, it downloads the `windows-x64-portable.zip` asset, replaces the running executable after shutdown, and relaunches automatically. This custom update path intentionally does not validate a Tauri signature or the published checksum.

## Publishing a release

Open **Actions → Launcher Release → Run workflow**, choose `patch`, `minor`, or `major`, and run it from `main`. The workflow synchronizes the npm, Cargo, Cargo lockfile, and Tauri versions; commits the version bump to `main`; creates the `launcher-v*` tag; builds the Windows installer, Windows portable ZIP, and universal macOS installer; publishes the GitHub Release; and uploads SHA-256 checksums. Re-running the same workflow run reuses its existing version and tag.
