use crate::models::{ConnectResponse, LauncherServer, ServerManifest};
use anyhow::{Context, Result};
use reqwest::Client;

pub async fn servers(client: &Client, base_url: &str) -> Result<Vec<LauncherServer>> {
    let url = format!(
        "{}/api/launcher/v1/servers?game=valheim",
        base_url.trim_end_matches('/')
    );
    let response = client.get(url).send().await?.error_for_status()?;
    let manifest: ServerManifest = response
        .json()
        .await
        .context("Invalid launcher server manifest")?;
    if manifest.schema_version != 1 {
        anyhow::bail!(
            "Unsupported launcher manifest version {}",
            manifest.schema_version
        );
    }
    Ok(manifest.servers)
}

pub async fn connect(client: &Client, base_url: &str, server_id: &str) -> Result<ConnectResponse> {
    let url = format!(
        "{}/api/launcher/v1/servers/{}/connect",
        base_url.trim_end_matches('/'),
        server_id
    );
    let response = client.post(url).send().await?.error_for_status()?;
    let credentials: ConnectResponse = response
        .json()
        .await
        .context("Invalid server connection response")?;
    if credentials.schema_version != 1 || credentials.server_id != server_id {
        anyhow::bail!("Server returned an incompatible connection response");
    }
    Ok(credentials)
}
