use crate::{models::RequestedPackage, thunderstore::split_coordinate};
use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    fs,
    io::{Read, Write},
    path::{Path, PathBuf},
};
use zip::{write::SimpleFileOptions, ZipArchive, ZipWriter};

const PROFILE_ENTRY: &str = "export.r2x";
const MAX_PROFILE_BYTES: u64 = 1024 * 1024;
const MAX_PROFILE_MODS: usize = 1_000;

#[derive(Clone, Debug)]
pub struct ImportedProfile {
    pub name: String,
    pub packages: Vec<RequestedPackage>,
    pub conflicting_identity: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct R2Profile {
    profile_name: String,
    mods: Vec<R2Mod>,
}

#[derive(Debug, Deserialize, Serialize)]
struct R2Mod {
    name: String,
    version: R2Version,
    #[serde(default = "enabled_by_default")]
    enabled: bool,
}

#[derive(Debug, Deserialize, Serialize)]
struct R2Version {
    major: u64,
    minor: u64,
    patch: u64,
}

fn enabled_by_default() -> bool {
    true
}

pub fn read_profile(path: &Path) -> Result<ImportedProfile> {
    let contents = if extension(path) == "r2x" {
        let metadata = fs::metadata(path).context("Profile file was not found")?;
        if metadata.len() > MAX_PROFILE_BYTES {
            anyhow::bail!("Profile mod list exceeds the 1 MB limit");
        }
        fs::read_to_string(path).context("Profile file is not valid UTF-8")?
    } else if extension(path) == "r2z" {
        let file = fs::File::open(path).context("Profile archive was not found")?;
        let mut archive = ZipArchive::new(file).context("Profile archive is not a valid ZIP")?;
        let mut entry = archive
            .by_name(PROFILE_ENTRY)
            .context("Profile archive does not contain export.r2x")?;
        if entry.size() > MAX_PROFILE_BYTES {
            anyhow::bail!("Profile mod list exceeds the 1 MB limit");
        }
        let mut contents = String::new();
        entry
            .read_to_string(&mut contents)
            .context("Profile mod list is not valid UTF-8")?;
        contents
    } else {
        anyhow::bail!("Choose an r2modman .r2z or .r2x profile file");
    };

    let parsed: R2Profile =
        serde_yaml_ng::from_str(&contents).context("Profile mod list contains invalid YAML")?;
    let name = parsed.profile_name.trim();
    if name.is_empty() || name.chars().count() > 80 {
        anyhow::bail!("Imported profile name must contain 1 to 80 characters");
    }
    if parsed.mods.len() > MAX_PROFILE_MODS {
        anyhow::bail!("Imported profile contains more than 1,000 mods");
    }

    let mut packages = Vec::new();
    let mut identities: HashMap<String, String> = HashMap::new();
    let mut conflicting_identity = None;
    for item in parsed.mods {
        let coordinate = format!(
            "{}-{}.{}.{}",
            item.name.trim(),
            item.version.major,
            item.version.minor,
            item.version.patch
        );
        let (namespace, package_name, _) = split_coordinate(&coordinate)
            .with_context(|| format!("Invalid imported package {coordinate}"))?;
        let identity = format!(
            "{}-{}",
            namespace.to_ascii_lowercase(),
            package_name.to_ascii_lowercase()
        );
        if let Some(existing) = identities.get(&identity) {
            if existing != &coordinate {
                conflicting_identity.get_or_insert(item.name.clone());
            }
            continue;
        }
        identities.insert(identity, coordinate.clone());
        packages.push(RequestedPackage {
            coordinate,
            origin: "extra".into(),
            enabled: item.enabled,
        });
    }

    Ok(ImportedProfile {
        name: name.into(),
        packages,
        conflicting_identity,
    })
}

pub fn export_profile(
    path: &Path,
    profile_name: &str,
    requested_packages: &[RequestedPackage],
) -> Result<PathBuf> {
    let output = if extension(path) == "r2z" {
        path.to_path_buf()
    } else {
        path.with_extension("r2z")
    };
    let mods = requested_packages
        .iter()
        .filter(|package| package.origin != "runtime")
        .map(|package| {
            let (namespace, name, version) = split_coordinate(&package.coordinate)?;
            let mut parts = version.split('.');
            let version = R2Version {
                major: parts
                    .next()
                    .context("Package version is missing its major number")?
                    .parse()?,
                minor: parts
                    .next()
                    .context("Package version is missing its minor number")?
                    .parse()?,
                patch: parts
                    .next()
                    .context("Package version is missing its patch number")?
                    .parse()?,
            };
            if parts.next().is_some() {
                anyhow::bail!("Package version must contain three numeric components");
            }
            Ok(R2Mod {
                name: format!("{namespace}-{name}"),
                version,
                enabled: package.enabled,
            })
        })
        .collect::<Result<Vec<_>>>()?;
    let profile = R2Profile {
        profile_name: profile_name.into(),
        mods,
    };
    let yaml = serde_yaml_ng::to_string(&profile)?;
    let file = fs::File::create(&output).context("Could not create the exported profile")?;
    let mut archive = ZipWriter::new(file);
    archive.start_file(PROFILE_ENTRY, SimpleFileOptions::default())?;
    archive.write_all(yaml.as_bytes())?;
    archive.finish()?;
    Ok(output)
}

fn extension(path: &Path) -> String {
    path.extension()
        .and_then(|value| value.to_str())
        .unwrap_or_default()
        .to_ascii_lowercase()
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn round_trips_enabled_mods_without_config_files() {
        let temp = tempdir().unwrap();
        let output = temp.path().join("friends.r2z");
        let requested = vec![RequestedPackage {
            coordinate: "Author-CoolMod-1.2.3".into(),
            origin: "extra".into(),
            enabled: false,
        }];

        export_profile(&output, "Friends", &requested).unwrap();
        let imported = read_profile(&output).unwrap();

        assert_eq!(imported.name, "Friends");
        assert_eq!(imported.packages, requested);
        let file = fs::File::open(output).unwrap();
        let mut archive = ZipArchive::new(file).unwrap();
        assert_eq!(archive.len(), 1);
        assert!(archive.by_name(PROFILE_ENTRY).is_ok());
    }

    #[test]
    fn detects_conflicting_versions_of_the_same_mod() {
        let temp = tempdir().unwrap();
        let path = temp.path().join("conflict.r2x");
        fs::write(
            &path,
            "profileName: Conflict\nmods:\n  - name: A-Mod\n    version: { major: 1, minor: 0, patch: 0 }\n  - name: A-Mod\n    version: { major: 2, minor: 0, patch: 0 }\n",
        )
        .unwrap();

        assert_eq!(
            read_profile(&path).unwrap().conflicting_identity.as_deref(),
            Some("A-Mod")
        );
    }

    #[test]
    fn rejects_archives_without_a_profile_manifest() {
        let temp = tempdir().unwrap();
        let path = temp.path().join("empty.r2z");
        let file = fs::File::create(&path).unwrap();
        ZipWriter::new(file).finish().unwrap();
        assert!(read_profile(&path).is_err());
    }

    #[test]
    fn ignores_all_archive_files_except_the_profile_manifest() {
        let temp = tempdir().unwrap();
        let path = temp.path().join("safe.r2z");
        let file = fs::File::create(&path).unwrap();
        let mut archive = ZipWriter::new(file);
        archive
            .start_file(PROFILE_ENTRY, SimpleFileOptions::default())
            .unwrap();
        archive.write_all(b"profileName: Safe\nmods: []\n").unwrap();
        archive
            .start_file("config/private.cfg", SimpleFileOptions::default())
            .unwrap();
        archive.write_all(b"secret=true").unwrap();
        archive
            .start_file("payload.exe", SimpleFileOptions::default())
            .unwrap();
        archive.write_all(b"not executable").unwrap();
        archive.finish().unwrap();

        let imported = read_profile(&path).unwrap();

        assert!(imported.packages.is_empty());
        assert!(!temp.path().join("config/private.cfg").exists());
        assert!(!temp.path().join("payload.exe").exists());
    }
}
