use anyhow::{Context, Result};
use std::{
    path::Path,
    process::{Command, Stdio},
};

pub fn launch_valheim(
    executable: &Path,
    profile_current: &Path,
    extra_arguments: &str,
) -> Result<()> {
    if !executable.is_file() {
        anyhow::bail!(
            "Valheim executable does not exist: {}",
            executable.display()
        );
    }
    let args = shell_words::split(extra_arguments)
        .context("Additional launch arguments contain invalid quoting")?;
    let doorstop_args = doorstop_arguments(profile_current);
    #[cfg(target_os = "windows")]
    {
        Command::new(executable)
            .current_dir(profile_current)
            .args(&doorstop_args)
            .args(args)
            .env("DOORSTOP_ENABLE", "TRUE")
            .env("BEPINEX_ROOT_PATH", profile_current)
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .context("Could not launch Valheim")?;
    }
    #[cfg(target_os = "macos")]
    {
        let preloader = profile_current.join("BepInEx/core/BepInEx.Preloader.dll");
        let doorstop = profile_current.join("doorstop_libs/libdoorstop_x64.dylib");
        if !doorstop.is_file() {
            anyhow::bail!("The selected profile does not contain the macOS BepInEx loader");
        }
        Command::new("/usr/bin/arch")
            .arg("-x86_64").arg(executable).args(&doorstop_args).args(args)
            .current_dir(profile_current)
            .env("DOORSTOP_ENABLE", "TRUE")
            .env("DOORSTOP_INVOKE_DLL_PATH", preloader)
            .env("DYLD_INSERT_LIBRARIES", doorstop)
            .env("BEPINEX_ROOT_PATH", profile_current)
            .stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null())
            .spawn().context("Could not launch Valheim through Rosetta. Install Rosetta with `softwareupdate --install-rosetta`")?;
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    anyhow::bail!("The launcher currently supports Windows and macOS only");
    Ok(())
}

fn doorstop_arguments(profile_current: &Path) -> Vec<String> {
    let preloader = profile_current
        .join("BepInEx/core/BepInEx.Preloader.dll")
        .to_string_lossy()
        .into_owned();
    let version =
        std::fs::read_to_string(profile_current.join(".doorstop_version")).unwrap_or_default();
    if version.trim() == "4" {
        vec![
            "--doorstop-enabled".into(),
            "true".into(),
            "--doorstop-target-assembly".into(),
            preloader,
        ]
    } else {
        vec![
            "--doorstop-enable".into(),
            "true".into(),
            "--doorstop-target".into(),
            preloader,
        ]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn selects_doorstop_v4_arguments_from_profile_marker() {
        let temp = tempfile::tempdir().unwrap();
        std::fs::write(temp.path().join(".doorstop_version"), "4\n").unwrap();
        let args = doorstop_arguments(temp.path());
        assert_eq!(args[0], "--doorstop-enabled");
        assert_eq!(args[2], "--doorstop-target-assembly");
    }
}
