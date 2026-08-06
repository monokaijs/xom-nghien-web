use crate::models::CatalogPackage;
use anyhow::{Context, Result};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::Path,
    time::{Duration, SystemTime},
};

const CATALOG_URL: &str = "https://thunderstore.io/c/valheim/api/v1/package/";
const CACHE_TTL: Duration = Duration::from_secs(60 * 60);

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct ThunderstorePackage {
    pub name: String,
    pub full_name: String,
    pub owner: String,
    pub package_url: String,
    pub date_updated: String,
    pub uuid4: String,
    pub rating_score: i64,
    pub is_pinned: bool,
    pub is_deprecated: bool,
    pub has_nsfw_content: bool,
    pub categories: Vec<String>,
    pub versions: Vec<ThunderstoreVersion>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct ThunderstoreVersion {
    pub name: String,
    pub full_name: String,
    pub description: String,
    pub icon: String,
    pub version_number: String,
    pub dependencies: Vec<String>,
    pub download_url: String,
    pub downloads: u64,
    pub date_created: String,
}

pub async fn catalog(
    client: &Client,
    cache_path: &Path,
    force: bool,
) -> Result<Vec<ThunderstorePackage>> {
    if !force && cache_is_fresh(cache_path) {
        if let Ok(cached) = read_cache(cache_path) {
            return Ok(cached);
        }
    }
    match client
        .get(CATALOG_URL)
        .send()
        .await
        .and_then(|response| response.error_for_status())
    {
        Ok(response) => {
            let packages: Vec<ThunderstorePackage> = response
                .json()
                .await
                .context("Thunderstore returned invalid package data")?;
            if let Some(parent) = cache_path.parent() {
                fs::create_dir_all(parent)?;
            }
            fs::write(cache_path, serde_json::to_vec(&packages)?)?;
            Ok(packages)
        }
        Err(error) => read_cache(cache_path).with_context(|| {
            format!("Thunderstore is unavailable and no cached catalog exists: {error}")
        }),
    }
}

pub fn search(packages: &[ThunderstorePackage], query: &str) -> Vec<CatalogPackage> {
    let terms: Vec<_> = query
        .to_ascii_lowercase()
        .split_whitespace()
        .map(str::to_owned)
        .collect();
    let mut matches: Vec<_> = packages
        .iter()
        .filter_map(|package| {
            let version = package.versions.first()?;
            let haystack = format!(
                "{} {} {} {}",
                package.owner, package.name, package.full_name, version.description
            )
            .to_ascii_lowercase();
            if !terms.iter().all(|term| haystack.contains(term)) {
                return None;
            }
            Some(CatalogPackage {
                namespace: package.owner.clone(),
                name: package.name.clone(),
                full_name: package.full_name.clone(),
                description: version.description.clone(),
                icon_url: version.icon.clone(),
                version_number: version.version_number.clone(),
                download_count: version.downloads,
                is_deprecated: package.is_deprecated,
            })
        })
        .collect();
    matches.sort_by(|a, b| {
        b.download_count
            .cmp(&a.download_count)
            .then_with(|| a.full_name.cmp(&b.full_name))
    });
    matches.truncate(100);
    matches
}

pub fn split_coordinate(coordinate: &str) -> Result<(&str, &str, &str)> {
    let mut parts = coordinate.rsplitn(2, '-');
    let version = parts
        .next()
        .context("Package coordinate is missing a version")?;
    let identity = parts
        .next()
        .context("Package coordinate is missing a package name")?;
    let (namespace, name) = identity
        .split_once('-')
        .context("Package coordinate is missing a namespace")?;
    if namespace.is_empty() || name.is_empty() || version.is_empty() {
        anyhow::bail!("Package coordinate is incomplete");
    }
    Ok((namespace, name, version))
}

fn read_cache(path: &Path) -> Result<Vec<ThunderstorePackage>> {
    serde_json::from_slice(&fs::read(path)?).context("Cached Thunderstore catalog is invalid")
}

fn cache_is_fresh(path: &Path) -> bool {
    fs::metadata(path)
        .and_then(|metadata| metadata.modified())
        .ok()
        .and_then(|modified| SystemTime::now().duration_since(modified).ok())
        .is_some_and(|age| age < CACHE_TTL)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn splits_coordinates_with_hyphens_in_package_name() {
        assert_eq!(
            split_coordinate("Team-My-Cool-Mod-1.2.3").unwrap(),
            ("Team", "My-Cool-Mod", "1.2.3")
        );
    }
}
