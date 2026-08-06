# Xom Nghien Launcher

Tauri 2 launcher for Steam Valheim on Windows 10/11 x64 and macOS 12+. Apple Silicon launches the modded game through Rosetta for compatibility with the current Valheim BepInEx package.

## Development

Requirements: Node 22.13+, pnpm 11, stable Rust, .NET 7, and the platform prerequisites from the Tauri 2 documentation.

```sh
pnpm install
dotnet build packages/valheim-launcher-bridge/XomNghien.ValheimBridge.csproj -c Release
pnpm --filter @xom/launcher tauri dev
```

The default website API is `https://xomnghien.com`; it can be changed in Settings. Profiles and package archives live in the operating system's application-data and cache folders. Vanilla Valheim files are not modified.

## Unsigned beta installation

- Windows: choose **More info → Run anyway** if SmartScreen appears.
- macOS: open the DMG, drag the app to Applications, then Control-click the app and choose **Open** if Gatekeeper blocks the unsigned beta.
- Apple Silicon: install Rosetta when prompted, or run `softwareupdate --install-rosetta` in Terminal.

## Release signing

The `launcher-v*` workflow requires an updater key generated with `pnpm --filter @xom/launcher tauri signer generate`. Configure `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`, and the matching `TAURI_UPDATER_PUBLIC_KEY` as GitHub Actions secrets. These updater signatures protect update integrity and are separate from future Apple Developer ID and Windows Authenticode signing.
