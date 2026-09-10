/**
 * How to open an IdP authorize URL. Secrets never live here.
 *
 * Mobile OS App Links send accounts.google.com to the Google app ("system
 * Google"). Operators want the browser's Google OAuth page instead. Opening a
 * blank browser tab on the click, then assigning the authorize URL into it,
 * keeps the document in Safari/Chrome.
 */

export type OAuthNavigationMode = "popup-preview" | "browser-tab" | "same-window";

export function oauthNavigationMode(input: {
  livePreview: boolean;
  standalone: boolean;
  userAgent: string;
}): OAuthNavigationMode {
  if (input.livePreview) return "popup-preview";
  if (input.standalone) return "browser-tab";
  if (/Android|iPhone|iPad|iPod/i.test(input.userAgent)) return "browser-tab";
  return "same-window";
}

export function readStandaloneDisplay(win: {
  matchMedia?: (query: string) => { matches: boolean };
  navigator: { standalone?: boolean; userAgent: string };
}): boolean {
  try {
    if (win.matchMedia?.("(display-mode: standalone)").matches) return true;
  } catch {
    /* ignore */
  }
  return Boolean(win.navigator.standalone);
}

export function assignOAuthUrl(target: Window, url: string): void {
  try {
    target.location.assign(url);
  } catch {
    target.location.href = url;
  }
}
