use anyhow::{Context, Result};
use std::{
    path::Path,
    process::{Command, Stdio},
};

pub fn launch_valheim(
    executable: &Path,
    profile_current: &Path,
    server_connection: Option<(&str, &str)>,
    extra_arguments: &str,
) -> Result<()> {
    if !executable.is_file() {
        anyhow::bail!(
            "Valheim executable does not exist: {}",
            executable.display()
        );
    }
    let args = game_arguments(profile_current, server_connection, extra_arguments)?;
    #[cfg(target_os = "windows")]
    {
        Command::new(executable)
            .current_dir(profile_current)
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
            .arg("-x86_64").arg(executable).args(args)
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

fn game_arguments(
    profile_current: &Path,
    server_connection: Option<(&str, &str)>,
    extra_arguments: &str,
) -> Result<Vec<String>> {
    let mut args = doorstop_arguments(profile_current);
    if let Some((server_address, server_password)) = server_connection {
        if server_address.trim().is_empty() {
            anyhow::bail!("Server address is empty");
        }
        if server_password.is_empty() {
            anyhow::bail!("Server password is empty");
        }
        args.extend([
            "+connect".into(),
            server_address.into(),
            "-password".into(),
            server_password.into(),
        ]);
    }
    args.extend(
        shell_words::split(extra_arguments)
            .context("Additional launch arguments contain invalid quoting")?,
    );
    Ok(args)
}

fn doorstop_arguments(profile_current: &Path) -> Vec<String> {
    let preloader = profile_current
        .join("BepInEx/core/BepInEx.Preloader.dll")
        .to_string_lossy()
        .into_owned();
    let version =
        std::fs::read_to_string(profile_current.join(".doorstop_version")).unwrap_or_default();
    if version
        .trim()
        .split('.')
        .next()
        .is_some_and(|major| major == "4")
    {
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
        std::fs::write(temp.path().join(".doorstop_version"), "4.4.0\n").unwrap();
        let args = doorstop_arguments(temp.path());
        assert_eq!(args[0], "--doorstop-enabled");
        assert_eq!(args[2], "--doorstop-target-assembly");
    }

    #[test]
    fn selects_legacy_doorstop_arguments_without_v4_marker() {
        let temp = tempfile::tempdir().unwrap();
        let args = doorstop_arguments(temp.path());
        assert_eq!(args[0], "--doorstop-enable");
        assert_eq!(args[2], "--doorstop-target");
    }

    #[test]
    fn includes_server_connection_and_password_arguments() {
        let temp = tempfile::tempdir().unwrap();
        std::fs::write(temp.path().join(".doorstop_version"), "4.4.0\n").unwrap();

        let args = game_arguments(
            temp.path(),
            Some(("cs2.xomnghien.com:2456", "server-secret")),
            "-console",
        )
        .unwrap();

        assert!(args.windows(4).any(|values| values
            == [
                "+connect",
                "cs2.xomnghien.com:2456",
                "-password",
                "server-secret"
            ]));
        assert_eq!(args.last().map(String::as_str), Some("-console"));
    }

    #[test]
    fn personal_profile_arguments_do_not_connect_to_a_server() {
        let temp = tempfile::tempdir().unwrap();
        let args = game_arguments(temp.path(), None, "-console").unwrap();

        assert!(!args.iter().any(|argument| argument == "+connect"));
        assert!(!args.iter().any(|argument| argument == "-password"));
        assert_eq!(args.last().map(String::as_str), Some("-console"));
    }
}
