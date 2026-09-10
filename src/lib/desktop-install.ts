/** Desktop vs PWA install helpers. Client-safe: no Tauri imports. */

import { APP_NAME } from "./constants.ts";
import { isTauriRuntime } from "./desktop.ts";

export const DESKTOP_INSTALLED_LABEL = `${APP_NAME} Desktop Installed`;

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type NavigatorLike = {
  userAgent: string;
  maxTouchPoints?: number;
  userAgentData?: { platform?: string };
};

export function isIpadOs(nav: NavigatorLike): boolean {
  const ua = nav.userAgent ?? "";
  if (/iPad/.test(ua)) return true;
  return /Macintosh/.test(ua) && (nav.maxTouchPoints ?? 0) > 1;
}

export function isMacOS(nav?: NavigatorLike): boolean {
  const resolved =
    nav ??
    (typeof navigator === "undefined"
      ? { userAgent: "" }
      : {
          userAgent: navigator.userAgent,
          maxTouchPoints: navigator.maxTouchPoints,
          userAgentData: (navigator as Navigator & { userAgentData?: { platform?: string } })
            .userAgentData,
        });
  if (isIpadOs(resolved)) return false;
  if (/iPhone|iPod/.test(resolved.userAgent)) return false;
  if (resolved.userAgentData?.platform === "macOS") return true;
  return /Mac|Macintosh|Mac OS X/i.test(resolved.userAgent);
}

export function isSafariBrowser(ua: string): boolean {
  return (
    /Safari/i.test(ua) &&
    !/Chrome|Chromium|CriOS|Edg|EdgiOS|Firefox|FxiOS|OPR|Android/i.test(ua)
  );
}

/** Accept only https installer URLs. Empty / http / invalid → "". */
export function httpsInstallerUrl(raw: unknown): string {
  const value = String(raw ?? "").trim();
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

export function readDesktopDmgUrl(): string {
  const env =
    typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env.VITE_DESKTOP_DMG_URL
      : "";
  return httpsInstallerUrl(env);
}

/**
 * Capture `beforeinstallprompt`: always preventDefault and return the event
 * to stash. Never auto-call `prompt()` — the install modal fires it later.
 * After the user is shown the prompt, the spent event must be dropped (`null`).
 */
export function captureBeforeInstallPrompt<T extends { preventDefault: () => void }>(
  event: T,
): T {
  event.preventDefault();
  return event;
}

export function spentBeforeInstallPrompt(): null {
  return null;
}

export function canOfferNativeInstall(input: {
  isTauri: boolean;
  isMacOS: boolean;
  isOnline: boolean;
  nativeUrl: string;
}): boolean {
  return !input.isTauri && input.isMacOS && input.isOnline && Boolean(input.nativeUrl);
}

export function installSurface(input: {
  isTauri: boolean;
  isMacOS: boolean;
}): "tauri" | "macos-browser" | "pwa" {
  if (input.isTauri) return "tauri";
  if (input.isMacOS) return "macos-browser";
  return "pwa";
}

export function currentInstallRuntime(): {
  isTauri: boolean;
  isMacOS: boolean;
  isOnline: boolean;
  nativeUrl: string;
  ua: string;
} {
  return {
    isTauri: isTauriRuntime(),
    isMacOS: isMacOS(),
    isOnline: typeof navigator === "undefined" ? false : navigator.onLine,
    nativeUrl: readDesktopDmgUrl(),
    ua: typeof navigator === "undefined" ? "" : navigator.userAgent,
  };
}
