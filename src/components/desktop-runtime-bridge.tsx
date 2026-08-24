/**
 * Mount once in `__root.tsx`. Desktop-shell side: marks the document so the
 * web-install tutorial and PWA-only chrome stay out of the native window.
 * Noops in plain browsers. Rendering-only — never blocks paint.
 */

import { useEffect } from "react";
import { isTauriRuntime } from "@/lib/desktop";

export function DesktopRuntimeBridge() {
  useEffect(() => {
    if (!isTauriRuntime()) return;
    document.documentElement.dataset.desktopShell = "tauri";
    return () => {
      delete document.documentElement.dataset.desktopShell;
    };
  }, []);

  return null;
}
