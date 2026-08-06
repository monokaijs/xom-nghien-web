use crate::models::{ConnectResponse, HandoffContext};
use anyhow::{Context, Result};
use chrono::{Duration, Utc};
use rand::RngCore;
use std::{
    fs,
    path::{Path, PathBuf},
    sync::Arc,
};
use tokio::{
    io::{AsyncReadExt, AsyncWriteExt},
    net::TcpListener,
    time::{timeout, Duration as TokioDuration},
};

pub async fn start(profile_current: &Path, credentials: ConnectResponse) -> Result<HandoffContext> {
    let listener = TcpListener::bind(("127.0.0.1", 0)).await?;
    let port = listener.local_addr()?.port();
    let mut token = [0_u8; 32];
    rand::rng().fill_bytes(&mut token);
    let nonce: String = token.iter().map(|byte| format!("{byte:02x}")).collect();
    let expires_at = Utc::now() + Duration::minutes(30);
    let context = HandoffContext {
        port,
        nonce: nonce.clone(),
        expires_at: expires_at.to_rfc3339(),
    };
    let context_path = profile_current.join("BepInEx/config/xom-launcher-connection.json");
    if let Some(parent) = context_path.parent() {
        fs::create_dir_all(parent)?;
    }
    fs::write(&context_path, serde_json::to_vec(&context)?)?;
    restrict_context_permissions(&context_path)?;

    let payload = Arc::new(serde_json::to_vec(&credentials)?);
    tokio::spawn(serve_once(listener, nonce, payload, context_path));
    Ok(context)
}

async fn serve_once(
    listener: TcpListener,
    nonce: String,
    payload: Arc<Vec<u8>>,
    context_path: PathBuf,
) {
    let work = async {
        loop {
            let (mut stream, _) = listener.accept().await?;
            let mut request = vec![0_u8; 4096];
            let length = stream.read(&mut request).await?;
            let request = String::from_utf8_lossy(&request[..length]);
            let valid = request
                .lines()
                .next()
                .is_some_and(|line| line == format!("GET /connect/{nonce} HTTP/1.1"));
            if valid {
                let header = format!("HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nCache-Control: no-store\r\nContent-Length: {}\r\nConnection: close\r\n\r\n", payload.len());
                stream.write_all(header.as_bytes()).await?;
                stream.write_all(&payload).await?;
                break Ok::<(), std::io::Error>(());
            }
            stream
                .write_all(
                    b"HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\nConnection: close\r\n\r\n",
                )
                .await?;
        }
    };
    let _ = timeout(TokioDuration::from_secs(30 * 60), work).await;
    let _ = tokio::fs::remove_file(context_path).await;
}

fn restrict_context_permissions(path: &Path) -> Result<()> {
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(path, fs::Permissions::from_mode(0o600))
            .context("Could not restrict connection context permissions")?;
    }
    Ok(())
}
