use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LauncherPackageRef {
    pub provider: String,
    pub community: String,
    pub namespace: String,
    pub package_name: String,
    pub display_name: String,
    pub version_number: String,
    pub description: Option<String>,
    pub icon_url: Option<String>,
    pub package_url: String,
    pub requirement: String,
}

impl LauncherPackageRef {
    pub fn coordinate(&self) -> String {
        format!(
            "{}-{}-{}",
            self.namespace, self.package_name, self.version_number
        )
    }
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LauncherServer {
    pub id: String,
    pub name: String,
    pub game: String,
    pub host: String,
    pub port: u16,
    pub description: Option<String>,
    pub status: String,
    pub required_mods: Vec<LauncherPackageRef>,
    pub optional_mods: Vec<LauncherPackageRef>,
    #[serde(default)]
    pub selected_optional_packages: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServerManifest {
    pub schema_version: u8,
    pub servers: Vec<LauncherServer>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectResponse {
    pub schema_version: u8,
    pub server_id: String,
    pub host: String,
    pub port: u16,
    pub password: String,
    pub fetched_at: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub api_base_url: String,
    pub game_path: Option<String>,
    pub language: String,
    pub download_concurrency: u8,
    pub launch_arguments: String,
    pub minimize_on_launch: bool,
    pub check_for_updates: bool,
    pub log_level: String,
}

impl Default for Settings {
    fn default() -> Self {
        let language = std::env::var("LANG")
            .ok()
            .filter(|value| value.to_ascii_lowercase().starts_with("vi"))
            .map(|_| "vi")
            .unwrap_or("en")
            .to_owned();
        Self {
            api_base_url: "https://xomnghien.com".into(),
            game_path: None,
            language,
            download_concurrency: 4,
            launch_arguments: String::new(),
            minimize_on_launch: true,
            check_for_updates: true,
            log_level: "info".into(),
        }
    }
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfileSummary {
    pub id: String,
    pub name: String,
    pub kind: String,
    pub server_id: Option<String>,
    pub package_count: usize,
    pub updated_at: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfileMetadata {
    pub schema_version: u8,
    pub id: String,
    pub name: String,
    pub kind: String,
    pub server_id: Option<String>,
    #[serde(default)]
    pub requested_packages: Vec<RequestedPackage>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct RequestedPackage {
    pub coordinate: String,
    pub origin: String,
    pub enabled: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct LockedPackage {
    pub coordinate: String,
    pub namespace: String,
    pub name: String,
    pub version: String,
    pub download_url: String,
    pub dependencies: Vec<String>,
    pub origins: Vec<String>,
    #[serde(default = "default_enabled")]
    pub enabled: bool,
    pub files: Vec<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfileLock {
    pub schema_version: u8,
    #[serde(default = "default_profile_version")]
    pub profile_version: u8,
    pub game: String,
    #[serde(default = "default_game_version")]
    pub game_version: String,
    #[serde(default = "default_runtime_version")]
    pub runtime_version: String,
    pub generated_at: String,
    #[serde(default)]
    pub requested_packages: Vec<RequestedPackage>,
    pub packages: BTreeMap<String, LockedPackage>,
}

fn default_enabled() -> bool {
    true
}

fn default_profile_version() -> u8 {
    1
}

fn default_game_version() -> String {
    "steam-current".into()
}

fn default_runtime_version() -> String {
    "5.4.2333".into()
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfileDetails {
    pub metadata: ProfileMetadata,
    pub lock: Option<ProfileLock>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CatalogPackage {
    pub namespace: String,
    pub name: String,
    pub full_name: String,
    pub description: String,
    pub icon_url: String,
    pub version_number: String,
    pub download_count: u64,
    pub is_deprecated: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BootstrapData {
    pub settings: Settings,
    pub detected_game_path: Option<String>,
    pub servers: Vec<LauncherServer>,
    pub profiles: Vec<ProfileSummary>,
    pub app_version: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct HandoffContext {
    pub port: u16,
    pub nonce: String,
    pub expires_at: String,
}
