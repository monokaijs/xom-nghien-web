use crate::{
    models::{
        LockedPackage, ProfileDetails, ProfileLock, ProfileMetadata, ProfileSummary,
        RequestedPackage,
    },
    resolver,
    thunderstore::ThunderstorePackage,
};
use anyhow::{Context, Result};
use chrono::Utc;
use futures_util::{stream, StreamExt};
use reqwest::Client;
use sha2::{Digest, Sha256};
use std::{
    collections::HashMap,
    fs,
    io::Write,
    path::{Path, PathBuf},
};
use uuid::Uuid;
use walkdir::WalkDir;
use zip::ZipArchive;

pub const LOADER_PACKAGE: &str = "denikson-BepInExPack_Valheim-5.4.2333";
const LOADER_IDENTITY: &str = "denikson-bepinexpack_valheim";

pub struct ProfileStore {
    root: PathBuf,
    cache: PathBuf,
}

impl ProfileStore {
    pub fn new(root: PathBuf, cache: PathBuf) -> Self {
        Self { root, cache }
    }

    pub fn list(&self) -> Vec<ProfileSummary> {
        let mut profiles = Vec::new();
        let Ok(entries) = fs::read_dir(&self.root) else {
            return profiles;
        };
        for entry in entries.flatten() {
            let profile_path = entry.path();
            let Ok(metadata) = read_json::<ProfileMetadata>(&profile_path.join("profile.json"))
            else {
                continue;
            };
            let lock =
                read_json::<ProfileLock>(&profile_path.join("current/profile.lock.json")).ok();
            profiles.push(ProfileSummary {
                id: metadata.id,
                name: metadata.name,
                kind: metadata.kind,
                server_id: metadata.server_id,
                package_count: lock.as_ref().map_or(0, |item| item.packages.len()),
                updated_at: lock.map(|item| item.generated_at),
            });
        }
        profiles.sort_by(|a, b| a.kind.cmp(&b.kind).then_with(|| a.name.cmp(&b.name)));
        profiles
    }

    pub fn create_personal(&self, name: &str) -> Result<ProfileMetadata> {
        let trimmed = name.trim();
        if trimmed.is_empty() || trimmed.chars().count() > 80 {
            anyhow::bail!("Profile name must contain 1 to 80 characters");
        }
        let metadata = ProfileMetadata {
            schema_version: 1,
            id: Uuid::new_v4().to_string(),
            name: trimmed.into(),
            kind: "personal".into(),
            server_id: None,
            requested_packages: Vec::new(),
        };
        self.write_metadata(&metadata)?;
        Ok(metadata)
    }

    pub fn ensure_server(&self, server_id: &str, name: &str) -> Result<ProfileMetadata> {
        if !server_id.chars().all(|char| char.is_ascii_digit()) {
            anyhow::bail!("Invalid server ID");
        }
        let id = format!("server-{server_id}");
        if let Ok(mut existing) = self.load_metadata(&id) {
            if existing.name != name {
                existing.name = name.into();
                self.write_metadata(&existing)?;
            }
            return Ok(existing);
        }
        let metadata = ProfileMetadata {
            schema_version: 1,
            id,
            name: name.into(),
            kind: "server".into(),
            server_id: Some(server_id.into()),
            requested_packages: Vec::new(),
        };
        self.write_metadata(&metadata)?;
        Ok(metadata)
    }

    pub fn load_metadata(&self, id: &str) -> Result<ProfileMetadata> {
        validate_profile_id(id)?;
        read_json(&self.root.join(id).join("profile.json")).context("Profile was not found")
    }

    pub fn write_metadata(&self, metadata: &ProfileMetadata) -> Result<()> {
        validate_profile_id(&metadata.id)?;
        let directory = self.root.join(&metadata.id);
        fs::create_dir_all(&directory)?;
        write_json(&directory.join("profile.json"), metadata)
    }

    pub fn delete_personal(&self, id: &str) -> Result<()> {
        let metadata = self.load_metadata(id)?;
        if metadata.kind != "personal" {
            anyhow::bail!("Managed server profiles cannot be deleted");
        }
        let path = self.root.join(id);
        if path.exists() {
            fs::remove_dir_all(path)?;
        }
        Ok(())
    }

    pub fn profile_dir(&self, id: &str) -> Result<PathBuf> {
        validate_profile_id(id)?;
        Ok(self.root.join(id))
    }

    pub fn details(&self, id: &str) -> Result<ProfileDetails> {
        let metadata = self.load_metadata(id)?;
        let lock = read_json(&self.profile_dir(id)?.join("current/profile.lock.json")).ok();
        Ok(ProfileDetails { metadata, lock })
    }

    pub fn remove_installation(&self, id: &str) -> Result<()> {
        let profile = self.profile_dir(id)?;
        for name in ["current", "backup", "staging"] {
            let target = profile.join(name);
            if target.exists() {
                fs::remove_dir_all(target)?;
            }
        }
        Ok(())
    }

    pub async fn sync(
        &self,
        client: &Client,
        metadata: &ProfileMetadata,
        catalog: &[ThunderstorePackage],
        bridge_path: Option<&Path>,
        concurrency: usize,
    ) -> Result<ProfileLock> {
        let (requested, mut locked) = resolve_with_runtime(catalog, &metadata.requested_packages)?;
        let profile_dir = self.profile_dir(&metadata.id)?;
        let staging = profile_dir.join("staging");
        let current = profile_dir.join("current");
        let backup = profile_dir.join("backup");
        if staging.exists() {
            fs::remove_dir_all(&staging)?;
        }
        fs::create_dir_all(&staging)?;

        let packages_to_download: Vec<_> = locked.values().cloned().collect();
        let mut downloads =
            stream::iter(packages_to_download.into_iter().map(|package| async move {
                let path = self.download(client, &package).await?;
                Ok::<_, anyhow::Error>((package.coordinate, path))
            }))
            .buffer_unordered(concurrency.clamp(1, 8));
        let mut archives = HashMap::new();
        while let Some(download) = downloads.next().await {
            let (coordinate, path) = download?;
            archives.insert(coordinate, path);
        }

        let mut owners: HashMap<String, String> = HashMap::new();
        for package in locked.values_mut() {
            let archive = archives
                .get(&package.coordinate)
                .context("Downloaded package disappeared")?;
            package.files = extract_package(archive, &staging, &package.coordinate, &mut owners)?;
        }
        if let Some(bridge) = bridge_path.filter(|path| path.is_file()) {
            let plugins = staging.join("BepInEx/plugins/XomNghienLauncher");
            fs::create_dir_all(&plugins)?;
            fs::copy(bridge, plugins.join("XomNghien.ValheimBridge.dll"))?;
            let json_dependency = bridge.with_file_name("Newtonsoft.Json.dll");
            if !json_dependency.is_file() {
                anyhow::bail!(
                    "Launcher bridge dependency is missing: {}",
                    json_dependency.display()
                );
            }
            fs::copy(json_dependency, plugins.join("Newtonsoft.Json.dll"))?;
        }
        preserve_mutable_config(&current, &staging)?;
        disable_bepinex_console(&staging)?;

        let lock = ProfileLock {
            schema_version: 1,
            profile_version: metadata.schema_version,
            game: "valheim".into(),
            game_version: "steam-current".into(),
            runtime_version: locked
                .get(LOADER_IDENTITY)
                .context("Resolved profile is missing the BepInEx runtime")?
                .version
                .clone(),
            generated_at: Utc::now().to_rfc3339(),
            requested_packages: requested,
            packages: locked,
        };
        write_json(&staging.join("profile.lock.json"), &lock)?;
        if backup.exists() {
            fs::remove_dir_all(&backup)?;
        }
        if current.exists() {
            fs::rename(&current, &backup)?;
        }
        if let Err(error) = fs::rename(&staging, &current) {
            if backup.exists() && !current.exists() {
                let _ = fs::rename(&backup, &current);
            }
            return Err(error.into());
        }
        Ok(lock)
    }

    async fn download(&self, client: &Client, package: &LockedPackage) -> Result<PathBuf> {
        fs::create_dir_all(&self.cache)?;
        let digest = format!("{:x}", Sha256::digest(package.coordinate.as_bytes()));
        let destination = self.cache.join(format!("{digest}.zip"));
        if destination.is_file() && validate_zip(&destination).is_ok() {
            return Ok(destination);
        }
        let temporary = destination.with_extension("download");
        let response = client
            .get(&package.download_url)
            .send()
            .await?
            .error_for_status()?;
        if response
            .content_length()
            .is_some_and(|size| size > 500 * 1024 * 1024)
        {
            anyhow::bail!("{} exceeds the 500 MB package limit", package.coordinate);
        }
        let bytes = response.bytes().await?;
        if bytes.len() > 500 * 1024 * 1024 {
            anyhow::bail!("{} exceeds the 500 MB package limit", package.coordinate);
        }
        fs::write(&temporary, &bytes)?;
        validate_zip(&temporary)
            .with_context(|| format!("{} is not a valid package archive", package.coordinate))?;
        fs::rename(&temporary, &destination)?;
        Ok(destination)
    }

    pub fn clear_cache(&self) -> Result<()> {
        if self.cache.exists() {
            fs::remove_dir_all(&self.cache)?;
        }
        fs::create_dir_all(&self.cache)?;
        Ok(())
    }
}

fn resolve_with_runtime(
    catalog: &[ThunderstorePackage],
    requested: &[RequestedPackage],
) -> Result<(
    Vec<RequestedPackage>,
    std::collections::BTreeMap<String, LockedPackage>,
)> {
    let mut effective = requested.to_vec();
    let mut locked = resolver::resolve(catalog, &effective)?;

    // Thunderstore mods commonly pin the BepInEx pack as a dependency. Respect
    // that server-selected runtime and only add our default when the dependency
    // graph does not already contain a loader.
    if !locked.contains_key(LOADER_IDENTITY) {
        effective.push(RequestedPackage {
            coordinate: LOADER_PACKAGE.into(),
            origin: "runtime".into(),
            enabled: true,
        });
        locked = resolver::resolve(catalog, &effective)?;
    }

    Ok((effective, locked))
}

fn extract_package(
    archive_path: &Path,
    destination: &Path,
    coordinate: &str,
    owners: &mut HashMap<String, String>,
) -> Result<Vec<String>> {
    let file = fs::File::open(archive_path)?;
    let mut archive = ZipArchive::new(file)?;
    if archive.len() > 20_000 {
        anyhow::bail!("Package {coordinate} contains too many files");
    }
    let mut files = Vec::new();
    let mut expanded_size = 0_u64;
    for index in 0..archive.len() {
        let mut entry = archive.by_index(index)?;
        expanded_size = expanded_size.saturating_add(entry.size());
        if expanded_size > 2 * 1024 * 1024 * 1024 {
            anyhow::bail!("Package {coordinate} exceeds the 2 GB expanded limit");
        }
        let enclosed = entry
            .enclosed_name()
            .context("Package contains an unsafe path")?;
        let relative = strip_loader_prefix(&enclosed);
        if relative.as_os_str().is_empty() {
            continue;
        }
        if is_package_metadata(&relative) {
            continue;
        }
        let normalized = relative.to_string_lossy().replace('\\', "/");
        let output = destination.join(&relative);
        if entry.is_dir() {
            fs::create_dir_all(output)?;
            continue;
        }
        if let Some(owner) = owners.insert(normalized.clone(), coordinate.into()) {
            anyhow::bail!("Packages {owner} and {coordinate} both install {normalized}");
        }
        if let Some(parent) = output.parent() {
            fs::create_dir_all(parent)?;
        }
        let mut writer = fs::File::create(&output)?;
        std::io::copy(&mut entry, &mut writer)?;
        writer.flush()?;
        files.push(normalized);
    }
    Ok(files)
}

fn is_package_metadata(path: &Path) -> bool {
    if path.components().count() != 1 {
        return false;
    }
    matches!(
        path.file_name()
            .and_then(|name| name.to_str())
            .map(str::to_ascii_lowercase)
            .as_deref(),
        Some("manifest.json" | "icon.png" | "readme.md" | "changelog.md")
    )
}

fn strip_loader_prefix(path: &Path) -> PathBuf {
    let mut components = path.components();
    if components
        .next()
        .is_some_and(|part| part.as_os_str() == "BepInExPack_Valheim")
    {
        components.as_path().to_owned()
    } else {
        path.to_owned()
    }
}

fn preserve_mutable_config(current: &Path, staging: &Path) -> Result<()> {
    let source = current.join("BepInEx/config");
    if !source.is_dir() {
        return Ok(());
    }
    let target = staging.join("BepInEx/config");
    for entry in WalkDir::new(&source)
        .into_iter()
        .filter_map(Result::ok)
        .filter(|entry| entry.file_type().is_file())
    {
        let relative = entry.path().strip_prefix(&source)?;
        let output = target.join(relative);
        if let Some(parent) = output.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::copy(entry.path(), output)?;
    }
    Ok(())
}

fn disable_bepinex_console(profile_root: &Path) -> Result<()> {
    let path = profile_root.join("BepInEx/config/BepInEx.cfg");
    let contents = fs::read_to_string(&path).unwrap_or_default();
    let mut output = Vec::new();
    let mut in_console = false;
    let mut found_section = false;
    let mut seen_enabled = false;
    let mut seen_prevent_close = false;
    let mut seen_tty = false;

    let append_missing =
        |output: &mut Vec<String>, enabled: bool, prevent_close: bool, tty: bool| {
            if !enabled {
                output.push("Enabled = false".into());
            }
            if !prevent_close {
                output.push("PreventClose = false".into());
            }
            if !tty {
                output.push("ForceBepInExTTYDriver = false".into());
            }
        };

    for line in contents.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with('[') && trimmed.ends_with(']') {
            if in_console {
                append_missing(&mut output, seen_enabled, seen_prevent_close, seen_tty);
            }
            in_console = trimmed.eq_ignore_ascii_case("[Logging.Console]");
            found_section |= in_console;
            output.push(line.into());
            continue;
        }

        if in_console {
            let key = trimmed
                .split_once('=')
                .map(|(key, _)| key.trim())
                .unwrap_or_default();
            if key.eq_ignore_ascii_case("Enabled") {
                output.push("Enabled = false".into());
                seen_enabled = true;
                continue;
            }
            if key.eq_ignore_ascii_case("PreventClose") {
                output.push("PreventClose = false".into());
                seen_prevent_close = true;
                continue;
            }
            if key.eq_ignore_ascii_case("ForceBepInExTTYDriver") {
                output.push("ForceBepInExTTYDriver = false".into());
                seen_tty = true;
                continue;
            }
        }
        output.push(line.into());
    }

    if in_console {
        append_missing(&mut output, seen_enabled, seen_prevent_close, seen_tty);
    } else if !found_section {
        if !output.is_empty() {
            output.push(String::new());
        }
        output.push("[Logging.Console]".into());
        append_missing(&mut output, false, false, false);
    }

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    fs::write(path, format!("{}\n", output.join("\n")))?;
    Ok(())
}

fn validate_zip(path: &Path) -> Result<()> {
    let mut archive = ZipArchive::new(fs::File::open(path)?)?;
    for index in 0..archive.len() {
        let entry = archive.by_index(index)?;
        entry
            .enclosed_name()
            .context("Archive contains an unsafe path")?;
    }
    Ok(())
}

fn validate_profile_id(id: &str) -> Result<()> {
    if id.is_empty()
        || id.len() > 80
        || !id
            .chars()
            .all(|char| char.is_ascii_alphanumeric() || char == '-')
    {
        anyhow::bail!("Invalid profile ID");
    }
    Ok(())
}

fn read_json<T: serde::de::DeserializeOwned>(path: &Path) -> Result<T> {
    serde_json::from_slice(&fs::read(path)?).map_err(Into::into)
}
fn write_json(path: &Path, value: &impl serde::Serialize) -> Result<()> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    fs::write(path, serde_json::to_vec_pretty(value)?)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::thunderstore::{ThunderstorePackage, ThunderstoreVersion};
    use zip::write::SimpleFileOptions;

    fn package(
        owner: &str,
        name: &str,
        version: &str,
        dependencies: &[&str],
    ) -> ThunderstorePackage {
        ThunderstorePackage {
            name: name.into(),
            full_name: format!("{owner}-{name}"),
            owner: owner.into(),
            package_url: String::new(),
            date_updated: String::new(),
            uuid4: String::new(),
            rating_score: 0,
            is_pinned: false,
            is_deprecated: false,
            has_nsfw_content: false,
            categories: vec![],
            versions: vec![ThunderstoreVersion {
                name: name.into(),
                full_name: format!("{owner}-{name}-{version}"),
                description: String::new(),
                icon: String::new(),
                version_number: version.into(),
                dependencies: dependencies.iter().map(|item| item.to_string()).collect(),
                download_url: "https://example.invalid/mod.zip".into(),
                downloads: 0,
                date_created: String::new(),
            }],
        }
    }

    #[test]
    fn uses_bepinex_version_selected_by_server_dependencies() {
        let catalog = vec![
            package(
                "ServerAuthor",
                "ServerMod",
                "1.0.0",
                &["denikson-BepInExPack_Valheim-5.4.2202"],
            ),
            package("denikson", "BepInExPack_Valheim", "5.4.2202", &[]),
        ];
        let requested = vec![RequestedPackage {
            coordinate: "ServerAuthor-ServerMod-1.0.0".into(),
            origin: "required".into(),
            enabled: true,
        }];

        let (effective, locked) = resolve_with_runtime(&catalog, &requested).unwrap();

        assert_eq!(effective, requested);
        assert_eq!(locked[LOADER_IDENTITY].version, "5.4.2202");
    }

    #[test]
    fn injects_default_bepinex_when_profile_has_no_runtime_dependency() {
        let catalog = vec![package("denikson", "BepInExPack_Valheim", "5.4.2333", &[])];

        let (effective, locked) = resolve_with_runtime(&catalog, &[]).unwrap();

        assert_eq!(effective.len(), 1);
        assert_eq!(effective[0].coordinate, LOADER_PACKAGE);
        assert_eq!(effective[0].origin, "runtime");
        assert_eq!(locked[LOADER_IDENTITY].version, "5.4.2333");
    }

    #[test]
    fn rejects_archive_path_traversal() {
        let temp = tempfile::tempdir().unwrap();
        let archive_path = temp.path().join("bad.zip");
        let file = fs::File::create(&archive_path).unwrap();
        let mut writer = zip::ZipWriter::new(file);
        writer
            .start_file("../outside.dll", SimpleFileOptions::default())
            .unwrap();
        writer.write_all(b"bad").unwrap();
        writer.finish().unwrap();
        assert!(validate_zip(&archive_path).is_err());
    }

    #[test]
    fn strips_valheim_loader_wrapper_directory() {
        assert_eq!(
            strip_loader_prefix(Path::new("BepInExPack_Valheim/BepInEx/core/a.dll")),
            PathBuf::from("BepInEx/core/a.dll")
        );
        assert_eq!(
            strip_loader_prefix(Path::new("BepInEx/plugins/a.dll")),
            PathBuf::from("BepInEx/plugins/a.dll")
        );
    }

    #[test]
    fn disables_bepinex_console_without_disabling_disk_logs() {
        let temp = tempfile::tempdir().unwrap();
        let config = temp.path().join("BepInEx/config/BepInEx.cfg");
        fs::create_dir_all(config.parent().unwrap()).unwrap();
        fs::write(
            &config,
            "[Logging.Console]\nEnabled = true\nPreventClose = true\nForceBepInExTTYDriver = true\n\n[Logging.Disk]\nEnabled = true\n",
        )
        .unwrap();

        disable_bepinex_console(temp.path()).unwrap();
        let updated = fs::read_to_string(config).unwrap();

        assert!(updated.contains("[Logging.Console]\nEnabled = false"));
        assert!(updated.contains("PreventClose = false"));
        assert!(updated.contains("ForceBepInExTTYDriver = false"));
        assert!(updated.contains("[Logging.Disk]\nEnabled = true"));
    }
}
