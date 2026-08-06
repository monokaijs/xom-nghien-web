mod api;
mod handoff;
mod launch;
mod models;
mod profiles;
mod resolver;
mod settings;
mod steam;
mod thunderstore;

use crate::{
    models::{
        BootstrapData, CatalogPackage, ConnectResponse, ProfileDetails, ProfileMetadata,
        ProfileSummary, RequestedPackage, Settings,
    },
    profiles::ProfileStore,
    steam::{GameAdapter, ValheimAdapter},
};
use anyhow::{Context, Result};
use serde::Deserialize;
use std::{
    collections::HashSet,
    fs,
    io::{Cursor, Write},
    path::PathBuf,
};
use tauri::{AppHandle, Manager, State};
use tauri_plugin_opener::OpenerExt;

struct AppState {
    data_dir: PathBuf,
    cache_dir: PathBuf,
    client: reqwest::Client,
}

const GITHUB_LATEST_RELEASE_URL: &str =
    "https://api.github.com/repos/monokaijs/xom-nghien-web/releases/latest";

#[derive(Deserialize)]
struct GithubRelease {
    tag_name: String,
    assets: Vec<GithubReleaseAsset>,
}

#[derive(Deserialize)]
struct GithubReleaseAsset {
    name: String,
    browser_download_url: String,
}

impl AppState {
    fn settings_path(&self) -> PathBuf {
        self.data_dir.join("settings.json")
    }
    fn catalog_path(&self) -> PathBuf {
        self.cache_dir.join("thunderstore-valheim.json")
    }
    fn store(&self) -> ProfileStore {
        ProfileStore::new(
            self.data_dir.join("profiles"),
            self.cache_dir.join("packages"),
        )
    }
    fn settings(&self) -> Settings {
        settings::load(&self.settings_path())
    }
    fn log(&self, level: &str, message: &str) {
        let configured = self.settings().log_level;
        let rank = |value: &str| match value {
            "error" => 0,
            "warn" => 1,
            "info" => 2,
            _ => 3,
        };
        if rank(level) > rank(&configured) {
            return;
        }
        let directory = self.data_dir.join("logs");
        let path = directory.join("launcher.log");
        let _ = fs::create_dir_all(&directory);
        if fs::metadata(&path).is_ok_and(|metadata| metadata.len() > 2 * 1024 * 1024) {
            let _ = fs::rename(&path, directory.join("launcher.previous.log"));
        }
        if let Ok(mut file) = fs::OpenOptions::new().create(true).append(true).open(path) {
            let sanitized = message.replace(['\r', '\n'], " ");
            let _ = writeln!(
                file,
                "{} [{level}] {sanitized}",
                chrono::Utc::now().to_rfc3339()
            );
        }
    }
}

#[tauri::command]
async fn bootstrap(state: State<'_, AppState>) -> Result<BootstrapData, String> {
    command_result(async {
        let settings = state.settings();
        let adapter = ValheimAdapter;
        let detected = settings
            .game_path
            .as_deref()
            .map(PathBuf::from)
            .filter(|path| adapter.validate_executable(path))
            .or_else(|| adapter.detect_executable());
        let store = state.store();
        let mut servers = api::servers(&state.client, &settings.api_base_url)
            .await
            .unwrap_or_default();
        for server in &mut servers {
            let metadata = store.ensure_server(&server.id, &server.name)?;
            let selected_identities: HashSet<_> = metadata
                .requested_packages
                .iter()
                .filter(|package| package.origin == "optional" && package.enabled)
                .filter_map(|package| coordinate_identity(&package.coordinate))
                .collect();
            server.selected_optional_packages = server
                .optional_mods
                .iter()
                .filter(|package| selected_identities.contains(&package.identity()))
                .map(|package| package.coordinate())
                .collect();
        }
        Ok(BootstrapData {
            settings,
            detected_game_path: detected.map(|path| path.to_string_lossy().into_owned()),
            servers,
            profiles: store.list(),
            app_version: env!("CARGO_PKG_VERSION").into(),
        })
    })
    .await
}

#[tauri::command]
async fn server_connection(
    state: State<'_, AppState>,
    server_id: String,
) -> Result<ConnectResponse, String> {
    command_result(async {
        let settings = state.settings();
        fetch_credentials(&state.client, &settings.api_base_url, &server_id).await
    })
    .await
}

#[tauri::command]
async fn save_settings(state: State<'_, AppState>, settings: Settings) -> Result<(), String> {
    command_result(async { settings::save(&state.settings_path(), &settings) }).await
}

#[tauri::command]
async fn create_profile(
    state: State<'_, AppState>,
    name: String,
) -> Result<ProfileSummary, String> {
    command_result(async {
        let metadata = state.store().create_personal(&name)?;
        Ok(to_summary(metadata))
    })
    .await
}

#[tauri::command]
async fn delete_profile(state: State<'_, AppState>, profile_id: String) -> Result<(), String> {
    command_result(async { state.store().delete_personal(&profile_id) }).await
}

#[tauri::command]
async fn search_mods(
    state: State<'_, AppState>,
    query: String,
) -> Result<Vec<CatalogPackage>, String> {
    command_result(async {
        let catalog = thunderstore::catalog(&state.client, &state.catalog_path(), false).await?;
        Ok(thunderstore::search(&catalog, &query))
    })
    .await
}

#[tauri::command]
async fn install_mod(
    state: State<'_, AppState>,
    profile_id: String,
    package_ref: String,
) -> Result<(), String> {
    command_result(async {
        thunderstore::split_coordinate(&package_ref)?;
        let store = state.store();
        let mut metadata = store.load_metadata(&profile_id)?;
        if metadata.kind != "personal" {
            anyhow::bail!("Managed server profiles only allow mods from the server whitelist");
        }
        metadata
            .requested_packages
            .retain(|item| item.coordinate != package_ref);
        metadata.requested_packages.push(RequestedPackage {
            coordinate: package_ref,
            origin: "extra".into(),
            enabled: true,
        });
        store.write_metadata(&metadata)?;
        sync_metadata(&state, &store, &metadata).await?;
        Ok(())
    })
    .await
}

#[tauri::command]
async fn repair_profile(state: State<'_, AppState>, profile_id: String) -> Result<(), String> {
    command_result(async {
        let store = state.store();
        let metadata = store.load_metadata(&profile_id)?;
        sync_metadata(&state, &store, &metadata).await?;
        Ok(())
    })
    .await
}

#[tauri::command]
async fn profile_details(
    state: State<'_, AppState>,
    profile_id: String,
) -> Result<ProfileDetails, String> {
    command_result(async { state.store().details(&profile_id) }).await
}

#[tauri::command]
async fn set_package_enabled(
    state: State<'_, AppState>,
    profile_id: String,
    coordinate: String,
    enabled: bool,
) -> Result<(), String> {
    command_result(async {
        let store = state.store();
        let mut metadata = store.load_metadata(&profile_id)?;
        let package = metadata
            .requested_packages
            .iter_mut()
            .find(|package| package.coordinate == coordinate)
            .context("Package is not directly installed in this profile")?;
        if matches!(package.origin.as_str(), "required" | "runtime") {
            anyhow::bail!("Required runtime packages cannot be disabled");
        }
        package.enabled = enabled;
        store.write_metadata(&metadata)?;
        sync_metadata(&state, &store, &metadata).await?;
        Ok(())
    })
    .await
}

#[tauri::command]
async fn remove_package(
    state: State<'_, AppState>,
    profile_id: String,
    coordinate: String,
) -> Result<(), String> {
    command_result(async {
        let store = state.store();
        let mut metadata = store.load_metadata(&profile_id)?;
        let package = metadata
            .requested_packages
            .iter()
            .find(|package| package.coordinate == coordinate)
            .context("Package is not directly installed in this profile")?;
        if package.origin != "extra" {
            anyhow::bail!("Only extra mods can be removed; optional mods can be disabled");
        }
        metadata
            .requested_packages
            .retain(|package| package.coordinate != coordinate);
        store.write_metadata(&metadata)?;
        sync_metadata(&state, &store, &metadata).await?;
        Ok(())
    })
    .await
}

#[tauri::command]
async fn reset_profile(state: State<'_, AppState>, profile_id: String) -> Result<(), String> {
    command_result(async {
        let store = state.store();
        let metadata = store.load_metadata(&profile_id)?;
        store.remove_installation(&profile_id)?;
        sync_metadata(&state, &store, &metadata).await?;
        Ok(())
    })
    .await
}

#[tauri::command]
async fn launch_server(
    app: AppHandle,
    state: State<'_, AppState>,
    server_id: String,
    optional_packages: Vec<String>,
) -> Result<(), String> {
    command_result(async {
        state.log(
            "info",
            &format!("Preparing Valheim server profile {server_id}"),
        );
        let settings = state.settings();
        let adapter = ValheimAdapter;
        let executable = settings
            .game_path
            .as_deref()
            .map(PathBuf::from)
            .filter(|path| adapter.validate_executable(path))
            .or_else(|| adapter.detect_executable())
            .context("Valheim was not detected. Choose its executable in Settings")?;
        let servers = api::servers(&state.client, &settings.api_base_url).await?;
        let server = servers
            .into_iter()
            .find(|server| server.id == server_id)
            .context("Server no longer exists")?;
        let store = state.store();
        let mut metadata = store.ensure_server(&server.id, &server.name)?;
        let selected_optional_identities: HashSet<_> = optional_packages
            .iter()
            .filter_map(|coordinate| coordinate_identity(coordinate))
            .collect();
        // Managed server profiles mirror the latest manifest. Replacing the
        // request set removes obsolete versions and mods no longer whitelisted.
        metadata.requested_packages.clear();
        metadata
            .requested_packages
            .extend(server.required_mods.iter().map(|package| RequestedPackage {
                coordinate: package.coordinate(),
                origin: "required".into(),
                enabled: true,
            }));
        for package in &server.optional_mods {
            let coordinate = package.coordinate();
            metadata.requested_packages.push(RequestedPackage {
                enabled: selected_optional_identities.contains(&package.identity()),
                coordinate,
                origin: "optional".into(),
            });
        }
        store.write_metadata(&metadata)?;
        sync_metadata(&state, &store, &metadata).await?;

        let credentials =
            fetch_credentials(&state.client, &settings.api_base_url, &server.id).await?;
        let current = store.profile_dir(&metadata.id)?.join("current");
        let bridge = current.join(
            "BepInEx/plugins/XomNghienLauncher/XomNghien.ValheimBridge.dll",
        );
        let bridge_json = current.join(
            "BepInEx/plugins/XomNghienLauncher/Newtonsoft.Json.dll",
        );
        if !bridge.is_file() || !bridge_json.is_file() {
            anyhow::bail!(
                "Automatic server connection is unavailable because the launcher bridge is incomplete. Rebuild or reinstall the launcher"
            );
        }
        let server_address = format!("{}:{}", credentials.host, credentials.port);
        let server_password = credentials.password.clone();
        handoff::start(&current, credentials).await?;
        launch::launch_valheim(
            &executable,
            &current,
            &server_address,
            &server_password,
            &settings.launch_arguments,
        )?;
        state.log("info", &format!("Launched Valheim for server {server_id}"));
        if settings.minimize_on_launch {
            let _ = app
                .get_webview_window("main")
                .map(|window| window.minimize());
        }
        Ok(())
    })
    .await
}

#[tauri::command]
async fn open_profile_folder(
    app: AppHandle,
    state: State<'_, AppState>,
    profile_id: String,
) -> Result<(), String> {
    command_result(async {
        let path = state.store().profile_dir(&profile_id)?;
        fs::create_dir_all(&path)?;
        app.opener()
            .open_path(path.to_string_lossy(), None::<&str>)?;
        Ok(())
    })
    .await
}

#[tauri::command]
async fn clear_cache(state: State<'_, AppState>) -> Result<(), String> {
    command_result(async {
        state.store().clear_cache()?;
        let catalog = state.catalog_path();
        if catalog.exists() {
            fs::remove_file(catalog)?;
        }
        Ok(())
    })
    .await
}

#[tauri::command]
async fn open_logs_folder(app: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    command_result(async {
        let path = state.data_dir.join("logs");
        fs::create_dir_all(&path)?;
        app.opener()
            .open_path(path.to_string_lossy(), None::<&str>)?;
        Ok(())
    })
    .await
}

#[tauri::command]
fn open_external_url(app: AppHandle, url: String) -> Result<(), String> {
    const ALLOWED_URLS: [&str; 3] = [
        "https://xomnghien.com",
        "https://discord.gg/WYaqghEaMe",
        "https://thunderstore.io/c/valheim/",
    ];
    if !ALLOWED_URLS.contains(&url.as_str()) {
        return Err("This external URL is not allowed".into());
    }
    app.opener()
        .open_url(url, None::<String>)
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn available_update(state: State<'_, AppState>) -> Result<Option<String>, String> {
    command_result(async {
        #[cfg(not(target_os = "windows"))]
        return Ok(None);

        #[cfg(target_os = "windows")]
        {
            let release = latest_launcher_release(&state.client).await?;
            let version = release
                .tag_name
                .strip_prefix("launcher-v")
                .context("Latest GitHub release is not a launcher release")?;
            Ok(
                (version_tuple(version)? > version_tuple(env!("CARGO_PKG_VERSION"))?)
                    .then(|| version.to_owned()),
            )
        }
    })
    .await
}

#[tauri::command]
async fn install_update(app: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    command_result(async {
        #[cfg(not(target_os = "windows"))]
        anyhow::bail!("Automatic launcher updates are currently available on Windows only");

        #[cfg(target_os = "windows")]
        install_unsigned_windows_update(&state).await?;

        app.exit(0);
        #[allow(unreachable_code)]
        Ok(())
    })
    .await
}

async fn latest_launcher_release(client: &reqwest::Client) -> Result<GithubRelease> {
    let response = client
        .get(GITHUB_LATEST_RELEASE_URL)
        .header("Accept", "application/vnd.github+json")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .send()
        .await?
        .error_for_status()?;
    Ok(response.json().await?)
}

fn version_tuple(version: &str) -> Result<(u64, u64, u64)> {
    let mut parts = version.split('.');
    let parsed = (
        parts.next().context("Missing major version")?.parse()?,
        parts.next().context("Missing minor version")?.parse()?,
        parts.next().context("Missing patch version")?.parse()?,
    );
    if parts.next().is_some() {
        anyhow::bail!("Invalid launcher version: {version}");
    }
    Ok(parsed)
}

#[cfg(target_os = "windows")]
async fn install_unsigned_windows_update(state: &AppState) -> Result<()> {
    use std::os::windows::process::CommandExt;

    const CREATE_NO_WINDOW: u32 = 0x0800_0000;
    let release = latest_launcher_release(&state.client).await?;
    let version = release
        .tag_name
        .strip_prefix("launcher-v")
        .context("Latest GitHub release is not a launcher release")?;
    if version_tuple(version)? <= version_tuple(env!("CARGO_PKG_VERSION"))? {
        anyhow::bail!("No launcher update is available");
    }
    let asset = release
        .assets
        .iter()
        .find(|asset| asset.name.ends_with("windows-x64-portable.zip"))
        .context("The latest launcher release has no Windows portable asset")?;
    state.log(
        "info",
        &format!("Downloading unsigned launcher update {version}"),
    );
    let archive_bytes = state
        .client
        .get(&asset.browser_download_url)
        .timeout(std::time::Duration::from_secs(300))
        .send()
        .await?
        .error_for_status()?
        .bytes()
        .await?;
    let mut archive = zip::ZipArchive::new(Cursor::new(archive_bytes))?;
    let entry_index = (0..archive.len())
        .find(|index| {
            archive
                .by_index(*index)
                .is_ok_and(|entry| entry.name().ends_with("Xom Nghien Launcher.exe"))
        })
        .context("Downloaded release does not contain the launcher executable")?;

    let update_dir = state.cache_dir.join("launcher-update");
    fs::create_dir_all(&update_dir)?;
    let staged_exe = update_dir.join(format!("Xom-Nghien-Launcher-{version}.exe"));
    let mut entry = archive.by_index(entry_index)?;
    let mut output = fs::File::create(&staged_exe)?;
    std::io::copy(&mut entry, &mut output)?;
    output.sync_all()?;

    let current_exe = std::env::current_exe()?;
    let backup_exe = current_exe.with_extension("previous.exe");
    let script_path = update_dir.join("install-update.ps1");
    let quote = |path: &std::path::Path| path.to_string_lossy().replace('\'', "''");
    let script = format!(
        "$ErrorActionPreference = 'Stop'\n\
         Wait-Process -Id {} -ErrorAction SilentlyContinue\n\
         Copy-Item -LiteralPath '{}' -Destination '{}' -Force\n\
         Move-Item -LiteralPath '{}' -Destination '{}' -Force\n\
         Start-Process -FilePath '{}'\n\
         Remove-Item -LiteralPath $PSCommandPath -Force\n",
        std::process::id(),
        quote(&current_exe),
        quote(&backup_exe),
        quote(&staged_exe),
        quote(&current_exe),
        quote(&current_exe),
    );
    fs::write(&script_path, script)?;
    std::process::Command::new("powershell.exe")
        .args([
            "-NoProfile",
            "-NonInteractive",
            "-WindowStyle",
            "Hidden",
            "-ExecutionPolicy",
            "Bypass",
            "-File",
        ])
        .arg(&script_path)
        .creation_flags(CREATE_NO_WINDOW)
        .spawn()
        .context("Could not start the launcher update installer")?;
    state.log(
        "info",
        &format!("Installing unsigned launcher update {version}"),
    );
    Ok(())
}

async fn sync_metadata(
    state: &AppState,
    store: &ProfileStore,
    metadata: &ProfileMetadata,
) -> Result<()> {
    state.log("info", &format!("Synchronizing profile {}", metadata.id));
    let catalog = thunderstore::catalog(&state.client, &state.catalog_path(), false).await?;
    let concurrency = state.settings().download_concurrency as usize;
    store
        .sync(&state.client, metadata, &catalog, concurrency)
        .await?;
    state.log("info", &format!("Synchronized profile {}", metadata.id));
    Ok(())
}

fn coordinate_identity(coordinate: &str) -> Option<String> {
    let (namespace, name, _) = thunderstore::split_coordinate(coordinate).ok()?;
    Some(format!(
        "{}-{}",
        namespace.to_ascii_lowercase(),
        name.to_ascii_lowercase()
    ))
}

async fn fetch_credentials(
    client: &reqwest::Client,
    base_url: &str,
    server_id: &str,
) -> Result<ConnectResponse> {
    let entry = keyring::Entry::new("com.xomnghien.launcher", &format!("server:{server_id}")).ok();
    match api::connect(client, base_url, server_id).await {
        Ok(credentials) => {
            if let Some(entry) = entry {
                let _ = entry.set_password(&serde_json::to_string(&credentials)?);
            }
            Ok(credentials)
        }
        Err(error) => {
            let cached = entry
                .and_then(|entry| entry.get_password().ok())
                .and_then(|value| serde_json::from_str(&value).ok());
            cached.with_context(|| format!("Could not retrieve server credentials and no Keychain/Credential Manager fallback exists: {error}"))
        }
    }
}

fn to_summary(metadata: ProfileMetadata) -> ProfileSummary {
    ProfileSummary {
        id: metadata.id,
        name: metadata.name,
        kind: metadata.kind,
        server_id: metadata.server_id,
        package_count: 0,
        updated_at: None,
    }
}

async fn command_result<T>(
    future: impl std::future::Future<Output = Result<T>>,
) -> Result<T, String> {
    future.await.map_err(|error| format!("{error:#}"))
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_window_state::Builder::default()
                .with_state_flags(tauri_plugin_window_state::StateFlags::POSITION)
                .build(),
        )
        .setup(|app| {
            let data_dir = app.path().app_data_dir()?;
            let cache_dir = app.path().app_cache_dir()?;
            fs::create_dir_all(data_dir.join("profiles"))?;
            fs::create_dir_all(&cache_dir)?;
            app.manage(AppState {
                data_dir,
                cache_dir,
                client: reqwest::Client::builder()
                    .user_agent(format!("XomNghienLauncher/{}", env!("CARGO_PKG_VERSION")))
                    .timeout(std::time::Duration::from_secs(45))
                    .build()?,
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            bootstrap,
            server_connection,
            save_settings,
            create_profile,
            delete_profile,
            profile_details,
            set_package_enabled,
            remove_package,
            reset_profile,
            search_mods,
            install_mod,
            repair_profile,
            launch_server,
            open_profile_folder,
            clear_cache,
            open_logs_folder,
            open_external_url,
            available_update,
            install_update
        ])
        .run(tauri::generate_context!())
        .expect("error while running Xom Nghien Launcher");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn optional_mod_identity_survives_version_updates() {
        assert_eq!(
            coordinate_identity("Author-Whitelisted-Mod-1.0.0"),
            coordinate_identity("Author-Whitelisted-Mod-2.0.0")
        );
    }

    #[test]
    fn compares_launcher_versions_numerically() {
        assert!(version_tuple("0.10.0").unwrap() > version_tuple("0.9.9").unwrap());
        assert!(version_tuple("1.0.0").unwrap() > version_tuple("0.99.99").unwrap());
        assert!(version_tuple("1.0").is_err());
    }
}
