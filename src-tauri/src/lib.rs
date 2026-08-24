//! ClippyOS desktop shell.
//!
//! Architecture: the product is its HTTP surface (MCP over OAuth, REST API,
//! hooks, cron). The Tauri window is a native chrome around that surface:
//!
//! - **Cloud mode** (default): the window navigates to the canonical app
//!   origin. Nothing server-side runs locally.
//! - **Local mode**: the packaged Node sidecar (Nitro `node-server` build of
//!   this same app) is spawned on a loopback port, health-gated on
//!   `/api/health`, and the window points at it. Data lives in the user's
//!   app-data dir via `AGENCY_DATA_DIR`.
//!
//! The shell deliberately exposes no Tauri IPC commands: capability stays
//! behind the same-origin HTTP boundary the web app already enforces.

use tauri::{Manager, Url};

/// Loopback port the local sidecar listens on. Fixed so operators can also
/// reach the MCP endpoint from external agents while the desktop app runs.
const SIDECAR_PORT_ENV: &str = "CLIPPYOS_SIDECAR_PORT";
const DEFAULT_SIDECAR_PORT: u16 = 8187;

fn cloud_origin() -> Option<String> {
    std::env::var("CLIPPYOS_CLOUD_ORIGIN")
        .ok()
        .map(|value| value.trim().trim_end_matches('/').to_string())
        .filter(|value| !value.is_empty() && value.starts_with("https://"))
}

fn sidecar_port() -> u16 {
    std::env::var(SIDECAR_PORT_ENV)
        .ok()
        .and_then(|value| value.trim().parse::<u16>().ok())
        .unwrap_or(DEFAULT_SIDECAR_PORT)
}

/// Resolve where the main window should point before anything is spawned:
/// explicit cloud origin wins, otherwise the local sidecar origin.
fn resolve_target() -> String {
    match cloud_origin() {
        Some(origin) => origin,
        None => format!("http://127.0.0.1:{}", sidecar_port()),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let target = resolve_target();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(move |app| {
            let target = target.clone();
            if let Some(window) = app.get_webview_window("main") {
                if let Ok(url) = Url::parse(&target) {
                    let _ = window.navigate(url);
                }
                let title = if cloud_origin().is_some() {
                    String::from("ClippyOS — Cloud")
                } else {
                    format!("ClippyOS — Local ({})", sidecar_port())
                };
                let _ = window.set_title(&title);
            }
            // Local mode spawns the bundled Node server as a sidecar.
            // Cloud mode never spawns anything.
            if cloud_origin().is_none() {
                sidecar::spawn_and_gate(sidecar_port());
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running ClippyOS");
}

#[cfg(desktop)]
mod sidecar {
    //! Spawn the bundled Nitro node-server and gate on its health.

    use std::process::{Child, Command, Stdio};

    static CHILD: std::sync::Mutex<Option<Child>> = std::sync::Mutex::new(None);

    /// Raw HTTP/1.1 probe of /api/health — no HTTP client dependency needed.
    fn health_ok(port: u16) -> bool {
        use std::io::{Read, Write};
        let Ok(mut stream) = std::net::TcpStream::connect(("127.0.0.1", port)) else {
            return false;
        };
        let req = format!(
            "GET /api/health HTTP/1.1\r\nHost: 127.0.0.1:{port}\r\nConnection: close\r\n\r\n"
        );
        if stream.write_all(req.as_bytes()).is_err() {
            return false;
        }
        let mut buf = [0u8; 512];
        match stream.read(&mut buf) {
            Ok(n) => String::from_utf8_lossy(&buf[..n]).contains(" 200 "),
            Err(_) => false,
        }
    }

    pub fn spawn_and_gate(port: u16) {
        let server_script = std::env::current_exe().ok().and_then(|path| {
            let dir = path.parent()?;
            let candidate = dir.join("server").join("index.mjs");
            candidate.exists().then_some(candidate)
        });
        let Some(server_script) = server_script else {
            return; // Cloud-only install (no bundled server): nothing to spawn.
        };
        let child = Command::new("node")
            .arg(&server_script)
            .env("PORT", port.to_string())
            .env("HOST", "127.0.0.1")
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn();
        if let Ok(child) = child {
            *CHILD
                .lock()
                .unwrap_or_else(|poisoned| poisoned.into_inner()) = Some(child);
        }
        // Health-gate in the background: the loading page shows until the
        // server answers /api/health with 200 (or ~60s elapses).
        std::thread::spawn(move || {
            for _ in 0..120 {
                if health_ok(port) {
                    return;
                }
                std::thread::sleep(std::time::Duration::from_millis(500));
            }
        });
    }

    pub fn shutdown() {
        if let Some(mut child) = CHILD
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner())
            .take()
        {
            let _ = child.kill();
        }
    }
}
