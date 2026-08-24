/** Desktop-shell helpers. Client-safe: no Tauri imports unless detected. */

/**
 * True when this renderer runs inside the Tauri WebView.
 * Tauri injects `window.__TAURI_INTERNALS__` before any app code executes;
 * the global is not on plain browsers and must never be assumed.
 */
export function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/**
 * Desktop builds should never register the PWA service worker or show the
 * web-install tutorial: the native shell already provides offline chrome,
 * updates, and an icon. The PWA stays web-only.
 */
export function shouldRegisterServiceWorker(): boolean {
  return !isTauriRuntime();
}

/** Querystring flag the desktop loading page passes through to the app. */
export function desktopLaunchFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).has("desktop");
  } catch {
    return false;
  }
}
