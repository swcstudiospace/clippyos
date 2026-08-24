/**
 * Public origin resolution — server-only.
 * Moved out of the former Airwallex module so billing providers don't own
 * a generic concern (reset links, OAuth callbacks, checkout returns).
 */
import { getRequest } from "@tanstack/react-start/server";

export function publicAppOrigin(): string {
  const envUrl = process.env.BETTER_AUTH_URL?.trim();
  if (envUrl) return envUrl.replace(/\/$/, "");
  try {
    const request = getRequest();
    const proto =
      request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
      (request.url.startsWith("http:") ? "http" : "https");
    const host =
      request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
      request.headers.get("host") ||
      "";
    if (host) return `${proto}://${host}`;
  } catch {
    /* no request context */
  }
  return "http://127.0.0.1:8080";
}
