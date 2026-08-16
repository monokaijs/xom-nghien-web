use crate::models::Settings;
use anyhow::{Context, Result};
use std::{fs, path::Path};

pub fn load(path: &Path) -> Settings {
    fs::read_to_string(path)
        .ok()
        .and_then(|value| serde_json::from_str(&value).ok())
        .unwrap_or_default()
}

pub fn save(path: &Path, settings: &Settings) -> Result<()> {
    if !matches!(settings.language.as_str(), "en" | "vi") {
        anyhow::bail!("Language must be English or Vietnamese");
    }
    if !(1..=8).contains(&settings.download_concurrency) {
        anyhow::bail!("Download concurrency must be between 1 and 8");
    }
    let api = url::Url::parse(&settings.api_base_url).context("Website API URL is invalid")?;
    if api.scheme() != "https" && api.host_str() != Some("localhost") {
        anyhow::bail!("Website API URL must use HTTPS");
    }
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    fs::write(path, serde_json::to_vec_pretty(settings)?)?;
    Ok(())
}
