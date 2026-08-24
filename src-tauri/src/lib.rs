//! ClippyOS desktop shell.
//!
//! Architecture: the product is its HTTP surface (MCP over OAuth, REST API,
//! hooks, cron). The Tauri window is a native chrome around that surface:
//!
//! - **Cloud mode** (default): the window navigates to the canonical app
//!   origin. Nothing server-side runs locally.
//! - **Local mode**: the packaged Node sidecar (Nitro `node-server` build of
//!   this same app) is spawned on a free loopback port, health-gated on
//!   `/api/health`, and the window points at it. Data lives in the user's
//!   app-data dir via `AGENCY_DATA_DIR`.
//!
//! Navigation never happens before the engine answers health checks: until
//! then the window shows the bundled loading page, and if the engine cannot
//! start it falls back to that same page with an "— Offline" title instead
//! of surfacing a raw connection error.
//!
//! The shell deliberately exposes no Tauri IPC commands: capability stays
//! behind the same-origin HTTP boundary the web app already enforces.

use tauri::{Manager, Url};

/// Strict loopback-port override for the local sidecar. When set, the shell
/// uses this port verbatim and never probes for a free one.
const SIDECAR_PORT_ENV: &str = "CLIPPYOS_SIDECAR_PORT";

fn cloud_origin() -> Option<String> {
    std::env::var("CLIPPYOS_CLOUD_ORIGIN")
        .ok()
        .map(|value| value.trim().trim_end_matches('/').to_string())
        .filter(|value| !value.is_empty() && value.starts_with("https://"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                // The bundled frontend page (frontendDist index.html) doubles
                // as the loading screen and the offline fallback target.
                let home_url = window.url().ok();
                if let Some(origin) = cloud_origin() {
                    // Cloud mode: point straight at the canonical origin,
                    // spawn nothing.
                    if let Ok(url) = Url::parse(&origin) {
                        let _ = window.navigate(url);
                    }
                    let _ = window.set_title("ClippyOS — Cloud");
                } else {
                    // Local mode: reserve a port, spawn the bundled Node
                    // sidecar, and hold navigation until /api/health answers.
                    let started = sidecar::reserve_port()
                        .and_then(|port| sidecar::start(port).then_some(port));
                    match started {
                        Some(port) => {
                            if let Ok(url) =
                                Url::parse(&format!("http://127.0.0.1:{port}"))
                            {
                                let _ = window.navigate(url);
                            }
                            let _ =
                                window.set_title(&format!("ClippyOS — Local ({port})"));
                        }
                        None => {
                            // Engine missing or unhealthy: show the bundled
                            // offline page rather than a raw connection error.
                            if let Some(url) = home_url {
                                let _ = window.navigate(url);
                            }
                            let _ = window.set_title("ClippyOS — Offline");
                        }
                    }
                }
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building ClippyOS")
        .run(|_app, event| {
            // Always reap the sidecar child, whichever way the process ends.
            #[cfg(desktop)]
            if matches!(
                event,
                tauri::RunEvent::ExitRequested { .. } | tauri::RunEvent::Exit
            ) {
                sidecar::shutdown();
            }
        });
}

#[cfg(desktop)]
mod sidecar {
    //! Spawn the bundled Nitro node-server and gate on its health.

    use std::path::PathBuf;
    use std::process::{Child, Command, Stdio};
    use std::time::{Duration, Instant};

    static CHILD: std::sync::Mutex<Option<Child>> = std::sync::Mutex::new(None);

    /// Bounded health-gate budget: the webview stays on the bundled loading
    /// page for at most this long before falling back to offline.
    const HEALTH_TIMEOUT: Duration = Duration::from_secs(15);
    const HEALTH_INTERVAL: Duration = Duration::from_millis(250);

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

    /// Poll /api/health until it answers 200 or the budget elapses.
    fn wait_healthy(port: u16) -> bool {
        let deadline = Instant::now() + HEALTH_TIMEOUT;
        while Instant::now() < deadline {
            if health_ok(port) {
                return true;
            }
            std::thread::sleep(HEALTH_INTERVAL);
        }
        false
    }

    /// Reserve the loopback port the sidecar will listen on.
    ///
    /// `CLIPPYOS_SIDECAR_PORT` is a strict override: honored verbatim with
    /// no free-port probing. Otherwise bind `127.0.0.1:0`, read the kernel-
    /// assigned port, and drop the listener so the server can take it.
    pub fn reserve_port() -> Option<u16> {
        if let Some(port) = std::env::var(super::SIDECAR_PORT_ENV)
            .ok()
            .and_then(|value| value.trim().parse::<u16>().ok())
        {
            return Some(port);
        }
        let listener = std::net::TcpListener::bind(("127.0.0.1", 0)).ok()?;
        let port = listener.local_addr().ok()?.port();
        drop(listener);
        Some(port)
    }

    /// Resolve the Node runtime. Order: the packaged externalBin sidecar
    /// sitting next to the app binary, then a bare `node` from PATH as a dev
    /// convenience. Returns `None` when neither exists.
    fn resolve_node() -> Option<PathBuf> {
        let name = if cfg!(windows) { "node.exe" } else { "node" };
        let bundled = std::env::current_exe()
            .ok()
            .and_then(|exe| exe.parent().map(|dir| dir.join(name)));
        if let Some(path) = bundled.filter(|path| path.exists()) {
            return Some(path);
        }
        std::env::var_os("PATH").and_then(|paths| {
            std::env::split_paths(&paths)
                .map(|dir| dir.join(name))
                .find(|path| path.is_file())
        })
    }

    /// Locate the bundled Nitro entrypoint (`server/index.mjs`) next to the
    /// app binary, as staged by `bundle.resources`.
    fn server_script() -> Option<PathBuf> {
        let script = std::env::current_exe()
            .ok()?
            .parent()?
            .join("server")
            .join("index.mjs");
        script.exists().then_some(script)
    }

    /// Spawn the sidecar on `port` and block until it is healthy (bounded).
    /// Returns `true` only when the engine answered `/api/health`; on
    /// timeout the child is reaped so nothing lingers.
    pub fn start(port: u16) -> bool {
        let (Some(node), Some(script)) = (resolve_node(), server_script()) else {
            return false; // Missing engine or server bundle: report offline.
        };
        let Ok(child) = Command::new(node)
            .arg(&script)
            .env("PORT", port.to_string())
            .env("HOST", "127.0.0.1")
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
        else {
            return false;
        };
        *CHILD
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner()) = Some(child);
        if wait_healthy(port) {
            true
        } else {
            shutdown();
            false
        }
    }

    /// Kill the sidecar child. Idempotent: the mutex `take()` guarantees a
    /// single kill even when both exit events fire.
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
