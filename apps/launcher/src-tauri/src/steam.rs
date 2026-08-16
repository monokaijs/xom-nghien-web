use std::{
    fs,
    path::{Path, PathBuf},
};

const VALHEIM_APP_ID: &str = "892970";

pub trait GameAdapter {
    fn detect_executable(&self) -> Option<PathBuf>;
    fn validate_executable(&self, path: &Path) -> bool;
}

pub struct ValheimAdapter;

impl GameAdapter for ValheimAdapter {
    fn detect_executable(&self) -> Option<PathBuf> {
        steam_roots()
            .into_iter()
            .find_map(|root| find_in_steam_root(&root))
    }

    fn validate_executable(&self, path: &Path) -> bool {
        if !path.is_file() {
            return false;
        }
        path.file_name()
            .and_then(|name| name.to_str())
            .is_some_and(|name| {
                if cfg!(target_os = "windows") {
                    name.eq_ignore_ascii_case("valheim.exe")
                } else {
                    name.eq_ignore_ascii_case("valheim")
                }
            })
    }
}

fn steam_roots() -> Vec<PathBuf> {
    let mut roots = Vec::new();
    #[cfg(target_os = "windows")]
    {
        if let Ok(program_files) = std::env::var("PROGRAMFILES(X86)") {
            roots.push(PathBuf::from(program_files).join("Steam"));
        }
        if let Ok(program_files) = std::env::var("PROGRAMFILES") {
            roots.push(PathBuf::from(program_files).join("Steam"));
        }
    }
    #[cfg(target_os = "macos")]
    if let Some(home) = dirs::home_dir() {
        roots.push(home.join("Library/Application Support/Steam"));
    }
    roots
}

fn find_in_steam_root(root: &Path) -> Option<PathBuf> {
    let steamapps = root.join("steamapps");
    let mut libraries = vec![steamapps.clone()];
    let library_file = steamapps.join("libraryfolders.vdf");
    if let Ok(contents) = fs::read_to_string(library_file) {
        libraries.extend(
            parse_library_paths(&contents)
                .into_iter()
                .map(|path| path.join("steamapps")),
        );
    }
    libraries.into_iter().find_map(|library| {
        if !library
            .join(format!("appmanifest_{VALHEIM_APP_ID}.acf"))
            .is_file()
        {
            return None;
        }
        #[cfg(target_os = "windows")]
        let executable = library.join("common/Valheim/valheim.exe");
        #[cfg(target_os = "macos")]
        let executable = library.join("common/Valheim/Valheim.app/Contents/MacOS/valheim");
        executable.is_file().then_some(executable)
    })
}

pub fn parse_library_paths(contents: &str) -> Vec<PathBuf> {
    contents
        .lines()
        .filter_map(|line| {
            let values: Vec<_> = line.split('"').skip(1).step_by(2).collect();
            let path = values
                .iter()
                .position(|value| *value == "path")
                .and_then(|index| values.get(index + 1))
                .or_else(|| {
                    (values.len() >= 2 && values[0].chars().all(|char| char.is_ascii_digit()))
                        .then(|| &values[1])
                });
            path.map(|value| PathBuf::from(value.replace("\\\\", "\\")))
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_modern_steam_library_file() {
        let data = r#""libraryfolders"
        {
          "0" { "path" "C:\\Program Files (x86)\\Steam" }
          "1" { "path" "D:\\Games\\Steam" }
        }"#;
        assert_eq!(
            parse_library_paths(data),
            vec![
                PathBuf::from("C:\\Program Files (x86)\\Steam"),
                PathBuf::from("D:\\Games\\Steam")
            ]
        );
    }
}
